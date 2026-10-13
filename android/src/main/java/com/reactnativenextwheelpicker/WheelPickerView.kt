package com.reactnativenextwheelpicker

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Bundle
import android.text.TextPaint
import android.text.TextUtils
import android.util.TypedValue
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeInfo.AccessibilityAction
import android.view.animation.DecelerateInterpolator
import android.widget.Scroller
import kotlin.math.abs
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * A wheel drawn like iOS's UIPickerView: rows sit on a cylinder seen in
 * perspective, fade toward the edges, and the centre row sits in a rounded band.
 * Geometry follows @react-native-picker/picker on iOS: the row height is the
 * font's line height plus 20, and the cylinder spans the view's height.
 */
class WheelPickerView(context: Context) : View(context) {

  enum class Theme { SYSTEM, LIGHT, DARK }

  var onIndexSelected: ((index: Int, eventCount: Int) -> Unit)? = null

  private var labels: Array<String> = emptyArray()
  private var ellipsized: Array<CharSequence?> = emptyArray()
  private var selectedIndex = 0
  // Scroll position in px: row i is centred when offset == i * rowHeight.
  // With wrapping it runs past the ends; the row index is taken modulo the count.
  private var offset = 0f
  private var wrap = false

  // Props are applied one at a time; these hold them until the transaction ends
  // so the index is never checked against stale labels.
  private var pendingLabels: Array<String>? = null
  private var jsIndex = 0
  // JS echoes the count of the last event it saw. While it lags behind, its
  // selectedIndex predates the user's scroll and must not move the wheel.
  private var eventCount = 0
  private var jsEventCount = 0

  private var radius = 0f
  private var rowHeight = 0f

  private val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }
  private val bandPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val bandRect = RectF()
  private val rowMatrix = Matrix()
  private val src = FloatArray(8)
  private val dst = FloatArray(8)

  private var theme = Theme.SYSTEM
  private var customTextColor: Int? = null
  private var customSelectionColor: Int? = null
  private var textColor = Color.BLACK

  private val scroller = Scroller(context, DecelerateInterpolator(2f))
  private var velocityTracker: VelocityTracker? = null
  private val touchSlop: Int
  private val minFlingVelocity: Int
  private val maxFlingVelocity: Int
  private var downY = 0f
  private var lastY = 0f
  private var dragging = false
  private var lastTickRow = 0
  private var stoppedMotion = false

  init {
    val config = ViewConfiguration.get(context)
    touchSlop = config.scaledTouchSlop
    minFlingVelocity = config.scaledMinimumFlingVelocity
    maxFlingVelocity = config.scaledMaximumFlingVelocity
    isFocusable = true
    setFont(null, Typeface.DEFAULT)
    applyColors()
  }

  fun setPendingLabels(next: Array<String>) {
    // A re-render resends equal labels; resetting on those would cut a fling short.
    pendingLabels = if (next.contentEquals(labels)) null else next
  }

  fun setJsIndex(index: Int) {
    jsIndex = index
  }

  fun setJsEventCount(count: Int) {
    jsEventCount = count
  }

  fun commitProps() {
    pendingLabels?.let {
      labels = it
      pendingLabels = null
      ellipsized = arrayOfNulls(it.size)
      scroller.forceFinished(true)
      dragging = false
      selectedIndex = clampIndex(selectedIndex)
      offset = selectedIndex * rowHeight
    }
    applyJsIndex()
    invalidate()
  }

  // Like iOS's Picker, the wheel shows JS's value once JS has seen the last
  // event, so a parent that rejects a change snaps the wheel back. Also run when
  // a gesture ends, so a value set from outside mid-fling is not lost.
  private fun applyJsIndex() {
    if (isInteracting() || jsEventCount < eventCount || labels.isEmpty()) return
    val index = clampIndex(jsIndex)
    val target = nearestOffsetFor(index)
    if (index != selectedIndex || offset != target) {
      selectedIndex = index
      offset = target
    }
  }

  fun setWrap(value: Boolean) {
    wrap = value
    if (!wrap) offset = clampIndex(indexAt(offset)) * rowHeight
    invalidate()
  }

  // Re-measuring resets the scroll, so a re-render with the same font must not
  // cut a fling short.
  fun setFont(sizeSp: Float?, typeface: Typeface) {
    val size = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP, sizeSp ?: DEFAULT_TEXT_SIZE_SP, resources.displayMetrics)
    if (size == textPaint.textSize && typeface == textPaint.typeface) return
    textPaint.textSize = size
    textPaint.typeface = typeface
    measureRows()
  }

  fun setTheme(value: Theme) {
    theme = value
    applyColors()
  }

  fun setTextColor(color: Int?) {
    customTextColor = color
    applyColors()
  }

  fun setSelectionColor(color: Int?) {
    customSelectionColor = color
    applyColors()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applyColors()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    radius = h / 2f
    ellipsized.fill(null)
    scroller.forceFinished(true)
    offset = selectedIndex * rowHeight
  }

  override fun onDraw(canvas: Canvas) {
    if (rowHeight <= 0f || radius <= 0f) return
    val cx = width / 2f
    val cy = height / 2f
    val inset = dp(BAND_INSET_DP)
    val corner = dp(BAND_RADIUS_DP)

    bandRect.set(inset, cy - rowHeight / 2f, width - inset, cy + rowHeight / 2f)
    canvas.drawRoundRect(bandRect, corner, corner, bandPaint)

    val count = labels.size
    if (count == 0) return

    val fm = textPaint.fontMetrics
    val baseline = -(fm.ascent + fm.descent) / 2f
    val halfW = width / 2f
    val halfH = rowHeight / 2f
    val halfAngle = halfH / radius
    val centreRow = (offset / rowHeight).roundToInt()
    // Rows on the visible half of the cylinder, plus one either side.
    val reach = (Math.PI / 2 * radius / rowHeight).toInt() + 1

    for (row in centreRow - reach..centreRow + reach) {
      val index = if (wrap) Math.floorMod(row, count) else row
      if (index !in 0 until count) continue

      val theta = (row * rowHeight - offset) / radius
      val top = max(theta - halfAngle, -HALF_PI)
      val bottom = min(theta + halfAngle, HALF_PI)
      if (top >= bottom) continue

      // The row's flat rect is mapped onto the trapezoid its top and bottom
      // edges project to on the cylinder.
      val sTop = perspective(top)
      val sBottom = perspective(bottom)
      val yTop = cy + radius * sin(top) * sTop
      val yBottom = cy + radius * sin(bottom) * sBottom
      setRect(src, -halfW, -halfH, halfW, -halfH, halfW, halfH, -halfW, halfH)
      setRect(dst,
        cx - halfW * sTop, yTop, cx + halfW * sTop, yTop,
        cx + halfW * sBottom, yBottom, cx - halfW * sBottom, yBottom)
      rowMatrix.setPolyToPoly(src, 0, dst, 0, 4)

      // Rows outside the band read as secondary text, as on iOS.
      val rowsAway = min(abs(theta * radius / rowHeight), 1f)
      val fade = max(cos(theta), 0f).pow(1.5f) * (1f - SIDE_ROW_DIM * rowsAway)
      textPaint.color = textColor
      textPaint.alpha = (Color.alpha(textColor) * fade).roundToInt()

      val label = ellipsizedLabel(index)
      canvas.save()
      canvas.concat(rowMatrix)
      canvas.drawText(label, 0, label.length, 0f, baseline, textPaint)
      canvas.restore()
    }
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (labels.isEmpty() || rowHeight <= 0f) return false
    val tracker = velocityTracker ?: VelocityTracker.obtain().also { velocityTracker = it }
    tracker.addMovement(event)

    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        // A touch that stops a fling only stops it; it must not also pick the tapped row.
        stoppedMotion = !scroller.isFinished
        scroller.forceFinished(true)
        downY = event.y
        lastY = event.y
        dragging = false
        lastTickRow = (offset / rowHeight).roundToInt()
        // Claimed now: a vertical ScrollView parent would otherwise take the
        // drag at the same slop before the wheel sees it.
        parent?.requestDisallowInterceptTouchEvent(true)
      }
      MotionEvent.ACTION_MOVE -> {
        val y = event.y
        if (!dragging && abs(y - downY) > touchSlop) dragging = true
        if (dragging) {
          var delta = lastY - y
          if (isOverscrolled()) delta *= OVERSCROLL_RESISTANCE
          offset += delta
          tick()
          invalidate()
        }
        lastY = y
      }
      MotionEvent.ACTION_UP -> {
        val wasDragging = dragging
        // Cleared first: settle() re-applies JS's value only when no gesture is live.
        dragging = false
        if (wasDragging) {
          tracker.computeCurrentVelocity(1000, maxFlingVelocity.toFloat())
          val velocity = tracker.yVelocity
          if (!isOverscrolled() && abs(velocity) > minFlingVelocity) fling(-velocity)
          else snapTo((offset / rowHeight).roundToInt())
        } else {
          performClick()
          val tapped = if (stoppedMotion) 0 else rowsFromCentre(event.y)
          snapTo((offset / rowHeight).roundToInt() + tapped)
        }
        endTouch()
      }
      MotionEvent.ACTION_CANCEL -> {
        dragging = false
        snapTo((offset / rowHeight).roundToInt())
        endTouch()
      }
    }
    return true
  }

  override fun performClick(): Boolean = super.performClick()

  override fun computeScroll() {
    if (!scroller.computeScrollOffset()) return
    offset = scroller.currY.toFloat()
    tick()
    postInvalidateOnAnimation()
    if (scroller.isFinished) settle()
  }

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    info.className = "android.widget.NumberPicker"
    // Left to the text so an accessibilityLabel (the content description) still wins.
    selectedLabel()?.let { info.text = it }
    info.isScrollable = labels.size > 1
    if (wrap || selectedIndex > 0) info.addAction(AccessibilityAction.ACTION_SCROLL_BACKWARD)
    if (wrap || selectedIndex < labels.size - 1) info.addAction(AccessibilityAction.ACTION_SCROLL_FORWARD)
  }

  override fun onPopulateAccessibilityEvent(event: AccessibilityEvent) {
    super.onPopulateAccessibilityEvent(event)
    selectedLabel()?.let { event.text.add(it) }
  }

  override fun performAccessibilityAction(action: Int, arguments: Bundle?): Boolean {
    val row = (offset / rowHeight).roundToInt()
    return when (action) {
      AccessibilityNodeInfo.ACTION_SCROLL_FORWARD -> { snapTo(row + 1); true }
      AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD -> { snapTo(row - 1); true }
      else -> super.performAccessibilityAction(action, arguments)
    }
  }

  private fun fling(velocity: Float) {
    val minY = if (wrap) Int.MIN_VALUE / 2 else 0
    val maxY = if (wrap) Int.MAX_VALUE / 2 else maxOffset().roundToInt()
    scroller.fling(0, offset.roundToInt(), 0, velocity.roundToInt(), 0, 0, minY, maxY)
    var landingRow = (scroller.finalY / rowHeight).roundToInt()
    if (!wrap) landingRow = clampIndex(landingRow)
    scroller.finalY = (landingRow * rowHeight).roundToInt()
    postInvalidateOnAnimation()
  }

  private fun snapTo(targetRow: Int) {
    val row = if (wrap) targetRow else clampIndex(targetRow)
    val target = (row * rowHeight).roundToInt()
    val start = offset.roundToInt()
    if (start == target) {
      offset = target.toFloat()
      settle()
      return
    }
    scroller.startScroll(0, start, 0, target - start, SNAP_DURATION_MS)
    postInvalidateOnAnimation()
  }

  private fun settle() {
    if (labels.isEmpty()) return
    val index = indexAt(offset)
    offset = (if (wrap) (offset / rowHeight).roundToInt() else index) * rowHeight
    invalidate()
    if (index == selectedIndex) {
      applyJsIndex()
      return
    }
    selectedIndex = index
    eventCount++
    sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_SELECTED)
    onIndexSelected?.invoke(index, eventCount)
  }

  private fun tick() {
    val row = (offset / rowHeight).roundToInt()
    if (row == lastTickRow) return
    lastTickRow = row
    if (wrap || row in labels.indices) performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
  }

  private fun endTouch() {
    dragging = false
    velocityTracker?.recycle()
    velocityTracker = null
  }

  private fun isInteracting() = dragging || !scroller.isFinished

  private fun isOverscrolled() = !wrap && (offset < 0f || offset > maxOffset())

  private fun rowsFromCentre(y: Float): Int {
    val dy = (y - height / 2f).coerceIn(-radius, radius)
    return (asin(dy / radius) * radius / rowHeight).roundToInt()
  }

  private fun perspective(angle: Float): Float =
    CAMERA_DISTANCE / (CAMERA_DISTANCE + (1f - cos(angle)))

  private fun indexAt(position: Float): Int {
    if (labels.isEmpty() || rowHeight <= 0f) return 0
    val row = (position / rowHeight).roundToInt()
    return if (wrap) Math.floorMod(row, labels.size) else clampIndex(row)
  }

  private fun nearestOffsetFor(index: Int): Float {
    if (!wrap || labels.isEmpty() || rowHeight <= 0f) return index * rowHeight
    val row = (offset / rowHeight).roundToInt()
    var delta = Math.floorMod(index - row, labels.size)
    if (delta > labels.size / 2) delta -= labels.size
    return (row + delta) * rowHeight
  }

  private fun clampIndex(index: Int) = index.coerceIn(0, max(labels.size - 1, 0))

  private fun maxOffset() = max(labels.size - 1, 0) * rowHeight

  private fun selectedLabel(): String? = labels.getOrNull(selectedIndex)

  private fun ellipsizedLabel(index: Int): CharSequence =
    ellipsized[index] ?: TextUtils.ellipsize(
      labels[index], textPaint, width - 4 * dp(BAND_INSET_DP), TextUtils.TruncateAt.END
    ).also { ellipsized[index] = it }

  private fun measureRows() {
    rowHeight = textPaint.fontSpacing + dp(ROW_PADDING_DP)
    ellipsized.fill(null)
    scroller.forceFinished(true)
    offset = selectedIndex * rowHeight
    invalidate()
  }

  private fun applyColors() {
    val dark = when (theme) {
      Theme.LIGHT -> false
      Theme.DARK -> true
      Theme.SYSTEM -> (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
        Configuration.UI_MODE_NIGHT_YES
    }
    textColor = customTextColor ?: if (dark) Color.WHITE else Color.BLACK
    // iOS's tertiarySystemFill, which UIPickerView uses for its band.
    bandPaint.color = customSelectionColor ?: if (dark) 0x3D767680 else 0x1F767680
    invalidate()
  }

  private fun dp(value: Float) =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, resources.displayMetrics)

  private companion object {
    // Matches @react-native-picker/picker's iOS default of systemFont 21.
    const val DEFAULT_TEXT_SIZE_SP = 21f
    // @react-native-picker/picker's iOS row: line height + 20.
    const val ROW_PADDING_DP = 20f
    // Viewer distance in cylinder radii. Lower is a stronger perspective.
    const val CAMERA_DISTANCE = 4f
    const val OVERSCROLL_RESISTANCE = 0.4f
    const val SIDE_ROW_DIM = 0.4f
    const val SNAP_DURATION_MS = 250
    const val BAND_INSET_DP = 8f
    const val BAND_RADIUS_DP = 8f
    const val HALF_PI = (Math.PI / 2).toFloat()

    fun setRect(out: FloatArray, x0: Float, y0: Float, x1: Float, y1: Float,
                x2: Float, y2: Float, x3: Float, y3: Float) {
      out[0] = x0; out[1] = y0; out[2] = x1; out[3] = y1
      out[4] = x2; out[5] = y2; out[6] = x3; out[7] = y3
    }
  }
}
