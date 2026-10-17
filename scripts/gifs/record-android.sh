#!/usr/bin/env bash
# Records docs/android.gif from the Expo demo on a running 1080x2280 emulator.
# Needs: the demo installed (npm run android in example-expo/), Metro running, ffmpeg.
# Coordinates are screen pixels.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
adb=${ADB:-$(command -v adb || echo "$HOME/Library/Android/sdk/platform-tools/adb")}
package=com.devmaxxx.wheelpicker.expo
tmp=$(mktemp -d)

swipe() { # x fromY toY ms pause
  "$adb" shell input swipe "$1" "$2" "$1" "$3" "$4"
  sleep "$5"
}
tap() { # x y pause
  "$adb" shell input tap "$1" "$2"
  sleep "${3:-1.8}"
}
demo() { "$adb" shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }

"$adb" shell settings put global sysui_demo_allowed 1
demo enter
demo clock -e hhmm 0941
demo notifications -e visible false
"$adb" reverse tcp:8081 tcp:8081 >/dev/null
"$adb" shell am force-stop "$package"
"$adb" shell am start -n "$package/.MainActivity" >/dev/null
# Touches are dropped until the JS bundle has loaded.
sleep 10
tap 540 200 1.5

"$adb" shell screenrecord --bit-rate 12000000 /sdcard/wheel.mp4 &
recorder=$!
sleep 1.5

swipe 304 860 480 120 2.6 # flick the hours up
swipe 776 600 930 120 2.6 # flick the minutes down
tap 540 1388              # Noon
tap 870 1388              # Random
tap 405 2120 1.2          # Strings tab
swipe 540 600 900 150 2.2 # flick the fruits
tap 540 1388              # Last
tap 675 2120 1.2          # Objects tab
swipe 540 560 820 150 2.2 # flick the cities
tap 870 1388              # Random
tap 945 2120 1.2          # Styled tab
swipe 540 840 600 150 2.2 # flick the sizes
tap 208 1388              # First
tap 135 2120 1.5          # back to Time

sleep 1.5
"$adb" shell pkill -INT screenrecord
wait "$recorder" || true
sleep 1 # screenrecord finishes writing the file after it exits
"$adb" pull /sdcard/wheel.mp4 "$tmp/android.mp4" >/dev/null
"$adb" shell rm /sdcard/wheel.mp4
demo exit

"$here/to-gif.sh" "$tmp/android.mp4" "$root/docs/android.gif" 1080:2205:0:75 1.0 300
rm -rf "$tmp"
