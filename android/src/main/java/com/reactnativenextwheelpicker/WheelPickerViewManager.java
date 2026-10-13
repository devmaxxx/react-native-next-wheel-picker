package com.reactnativenextwheelpicker;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ColorPropConverter;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class WheelPickerViewManager extends SimpleViewManager<WheelPickerView> {
    private static final String TAG = "WheelPickerViewManager";

    @NonNull
    @Override
    public String getName() {
        return "RNNextWheelPicker";
    }

    @NonNull
    @Override
    public WheelPickerView createViewInstance(@NonNull ThemedReactContext context) {
        return new WheelPickerView(context);
    }

    @ReactProp(name = "minValue")
    public void setMinValue(WheelPickerView view, int minValue) {
        view.stageMinValue(minValue);
    }

    @ReactProp(name = "maxValue")
    public void setMaxValue(WheelPickerView view, int maxValue) {
        view.stageMaxValue(maxValue);
    }

    @ReactProp(name = "value")
    public void setValue(WheelPickerView view, int value) {
        view.stageValue(value);
    }

    @ReactProp(name = "displayedValues")
    public void setDisplayedValues(WheelPickerView view, @Nullable ReadableArray displayedValues) {
        if (displayedValues == null || displayedValues.size() == 0) {
            view.stageLabels(null);
            return;
        }
        String[] values = new String[displayedValues.size()];
        for (int i = 0; i < values.length; i++) {
            values[i] = displayedValues.getString(i);
        }
        view.stageLabels(values);
    }

    @ReactProp(name = "wrapSelectorWheel", defaultBoolean = true)
    public void setWrapSelectorWheel(WheelPickerView view, boolean wrapSelectorWheel) {
        view.setWrapSelectorWheel(wrapSelectorWheel);
    }

    @ReactProp(name = "itemStyle")
    public void setItemStyle(WheelPickerView view, @Nullable ReadableMap itemStyle) {
        if (itemStyle == null) return;
        if (itemStyle.hasKey("fontSize")) {
            // The wheel's text size is in pixels, so convert from RN's sp.
            view.setTextSize(PixelUtil.toPixelFromSP(itemStyle.getDouble("fontSize")));
        }
        // The JS side resolves the color: an ARGB number, or a map for PlatformColor.
        ReadableType colorType =
            itemStyle.hasKey("color") ? itemStyle.getType("color") : ReadableType.Null;
        if (colorType == ReadableType.Number || colorType == ReadableType.Map) {
            try {
                Object raw = colorType == ReadableType.Number
                    ? (Object) itemStyle.getDouble("color")
                    : itemStyle.getMap("color");
                Integer color = ColorPropConverter.getColor(raw, view.getContext());
                if (color != null) view.setTextColor(color);
            } catch (Exception e) {
                Log.w(TAG, "Invalid itemStyle color", e);
            }
        }
        if (itemStyle.hasKey("fontFamily")) {
            view.setFontFamily(itemStyle.getString("fontFamily"));
        }
    }

    @ReactProp(name = "dividerColor", customType = "Color")
    public void setDividerColor(WheelPickerView view, @Nullable Integer dividerColor) {
        if (dividerColor == null) return;
        view.setDividerColor(dividerColor);
    }

    @ReactProp(name = "itemSpacing")
    public void setItemSpacing(WheelPickerView view, float itemSpacing) {
        view.setItemSpacing(Math.round(PixelUtil.toPixelFromDIP(itemSpacing)));
    }

    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.<String, Object>of(
            "onValueChange",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onValueChange")));
    }
}
