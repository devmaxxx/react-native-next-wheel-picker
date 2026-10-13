package com.reactnativenextwheelpicker

import android.util.Log
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.ReactTypefaceUtils

class WheelPickerViewManager : SimpleViewManager<WheelPickerView>() {

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext) = WheelPickerView(context)

  override fun addEventEmitters(context: ThemedReactContext, view: WheelPickerView) {
    view.onIndexSelected = { index, eventCount ->
      UIManagerHelper.getEventDispatcherForReactTag(context, view.id)?.dispatchEvent(
        WheelPickerChangeEvent(UIManagerHelper.getSurfaceId(context), view.id, index, eventCount))
    }
  }

  override fun onAfterUpdateTransaction(view: WheelPickerView) {
    super.onAfterUpdateTransaction(view)
    view.commitProps()
  }

  @ReactProp(name = "displayedValues")
  fun setDisplayedValues(view: WheelPickerView, values: ReadableArray?) {
    view.setPendingLabels(Array(values?.size() ?: 0) { values?.getString(it) ?: "" })
  }

  @ReactProp(name = "selectedIndex")
  fun setSelectedIndex(view: WheelPickerView, index: Int) {
    view.setJsIndex(index)
  }

  @ReactProp(name = "mostRecentEventCount")
  fun setMostRecentEventCount(view: WheelPickerView, count: Int) {
    view.setJsEventCount(count)
  }

  @ReactProp(name = "wrapSelectorWheel")
  fun setWrapSelectorWheel(view: WheelPickerView, wrap: Boolean) {
    view.setWrap(wrap)
  }

  @ReactProp(name = "themeVariant")
  fun setThemeVariant(view: WheelPickerView, variant: String?) {
    view.setTheme(when (variant) {
      "light" -> WheelPickerView.Theme.LIGHT
      "dark" -> WheelPickerView.Theme.DARK
      else -> WheelPickerView.Theme.SYSTEM
    })
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  fun setSelectionColor(view: WheelPickerView, color: Int?) {
    view.setSelectionColor(color)
  }

  // A key missing from a new itemStyle falls back to its default, so
  // dropping a style prop does not leave the old one on screen.
  @ReactProp(name = "itemStyle")
  fun setItemStyle(view: WheelPickerView, itemStyle: ReadableMap?) {
    view.setTextColor(itemStyle?.let { colorOf(view, it) })

    // Resolved like <Text>: assets/fonts/<family>[_<weight>|_<style>].{ttf,otf}
    // or a font resource, with fontWeight and fontStyle applied.
    val family = itemStyle?.stringOrNull("fontFamily")
    val weight = ReactTypefaceUtils.parseFontWeight(itemStyle?.stringOrNull("fontWeight"))
    val style = ReactTypefaceUtils.parseFontStyle(itemStyle?.stringOrNull("fontStyle"))
    val typeface = ReactTypefaceUtils.applyStyles(null, style, weight, family, view.context.assets)
    view.setFont(itemStyle?.doubleOrNull("fontSize")?.toFloat(), typeface)
  }

  private fun colorOf(view: WheelPickerView, itemStyle: ReadableMap): Int? {
    if (!itemStyle.hasKey("color")) return null
    // The JS side resolves the color: an ARGB number, or a map for PlatformColor.
    // An unresolvable PlatformColor throws; fall back to the default instead of crashing.
    return try {
      when (itemStyle.getType("color")) {
        ReadableType.Number -> ColorPropConverter.getColor(itemStyle.getDouble("color"), view.context)
        ReadableType.Map -> ColorPropConverter.getColor(itemStyle.getMap("color"), view.context)
        else -> null
      }
    } catch (e: Exception) {
      Log.w(NAME, "Invalid itemStyle color", e)
      null
    }
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> = mapOf(
    WheelPickerChangeEvent.NAME to mapOf(
      "phasedRegistrationNames" to mapOf("bubbled" to "onValueChange")))

  private companion object {
    const val NAME = "RNNextWheelPicker"

    fun ReadableMap.doubleOrNull(key: String) =
      if (hasKey(key) && !isNull(key)) getDouble(key) else null

    fun ReadableMap.stringOrNull(key: String) =
      if (hasKey(key) && !isNull(key)) getString(key) else null
  }
}
