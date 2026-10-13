package com.reactnativenextwheelpicker;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.shawnlin.numberpicker.NumberPicker;

public class WheelPickerView extends NumberPicker {
    private static final String TAG = "WheelPickerView";

    // React applies props one at a time in no fixed order. The wheel throws or
    // shows stale rows when the range, the labels and the value disagree, so each
    // prop is staged here and applied once the three line up again.
    private int stagedMin = 0;
    private int stagedMax = 0;
    private int stagedValue = 0;
    private String[] stagedLabels = null;
    private boolean rangeOrLabelsDirty = false;
    private boolean valueDirty = false;

    public WheelPickerView(Context context) {
        super(context);
        super.setTextSize(21f);
        super.setTextColor(Color.BLACK);
        setOnValueChangedListener((picker, oldVal, newVal) -> {
            if (!(getContext() instanceof ReactContext)) return;
            WritableMap event = Arguments.createMap();
            event.putInt("value", newVal);
            event.putInt("index", newVal - getMinValue());
            ((ReactContext) getContext()).getJSModule(RCTEventEmitter.class)
                .receiveEvent(getId(), "onValueChange", event);
        });
    }

    public void stageMinValue(int minValue) {
        stagedMin = minValue;
        rangeOrLabelsDirty = true;
        applyStaged();
    }

    public void stageMaxValue(int maxValue) {
        stagedMax = maxValue;
        rangeOrLabelsDirty = true;
        applyStaged();
    }

    public void stageValue(int value) {
        stagedValue = value;
        valueDirty = true;
        applyStaged();
    }

    public void stageLabels(String[] labels) {
        stagedLabels = labels != null && labels.length > 0 ? labels : null;
        rangeOrLabelsDirty = true;
        applyStaged();
    }

    private void applyStaged() {
        if (stagedLabels != null && stagedLabels.length != stagedMax - stagedMin + 1) return;
        if (rangeOrLabelsDirty) {
            // Labels first out and last in, so neither range change sees a
            // label array of the wrong length.
            setDisplayedValues(null);
            super.setMinValue(stagedMin);
            super.setMaxValue(stagedMax);
            setDisplayedValues(stagedLabels);
            rangeOrLabelsDirty = false;
            valueDirty = true;
        }
        if (valueDirty) {
            setValue(stagedValue);
            valueDirty = false;
        }
    }

    @Override
    public void setValue(int value) {
        super.setValue(Math.max(getMinValue(), Math.min(value, getMaxValue())));
    }

    @Override
    public void setDisplayedValues(String[] displayedValues) {
        try {
            super.setDisplayedValues(
                displayedValues != null && displayedValues.length > 0 ? displayedValues : null);
        } catch (Exception e) {
            Log.e(TAG, "Error setting displayedValues", e);
        }
    }

    @Override
    public void setTextSize(float textSize) {
        super.setTextSize(textSize);
        super.setSelectedTextSize(textSize);
    }

    @Override
    public void setTextColor(int textColor) {
        super.setTextColor(textColor);
        super.setSelectedTextColor(textColor);
    }

    public void setFontFamily(String fontFamily) {
        if (fontFamily == null || fontFamily.isEmpty()) return;
        Typeface typeface;
        try {
            typeface = Typeface.createFromAsset(getContext().getAssets(), "fonts/" + fontFamily + ".otf");
        } catch (Exception e) {
            typeface = Typeface.create(fontFamily, Typeface.NORMAL);
        }
        super.setTypeface(typeface);
        super.setSelectedTypeface(typeface);
    }
}
