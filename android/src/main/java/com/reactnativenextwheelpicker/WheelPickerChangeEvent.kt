package com.reactnativenextwheelpicker

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class WheelPickerChangeEvent(
  surfaceId: Int,
  viewTag: Int,
  private val index: Int,
  private val eventCount: Int,
) : Event<WheelPickerChangeEvent>(surfaceId, viewTag) {

  override fun getEventName(): String = NAME

  // Each settle is a distinct selection; coalescing could drop one.
  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putInt("index", index)
    putInt("eventCount", eventCount)
  }

  companion object {
    const val NAME = "topValueChange"
  }
}
