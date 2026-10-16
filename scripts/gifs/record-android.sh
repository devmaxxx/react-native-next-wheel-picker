#!/usr/bin/env bash
# Records docs/android.gif from the example app on a running 1080x2280 emulator.
# Needs: the example app installed (npm run android in example/), Metro running, ffmpeg.
# Coordinates are screen pixels.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
adb=${ADB:-$(command -v adb || echo "$HOME/Library/Android/sdk/platform-tools/adb")}
package=com.wheelpickerexample
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
tap 540 780 1.5

"$adb" shell screenrecord --bit-rate 12000000 /sdcard/wheel.mp4 &
recorder=$!
sleep 1.5

swipe 285 600 240 120 2.8 # flick the left wheel up
swipe 792 300 680 120 2.8 # flick the right wheel down
tap 285 1746              # Last
tap 153 1746              # First
tap 450 1746              # Random
tap 450 1746 2.2          # Random

sleep 1.5
"$adb" shell pkill -INT screenrecord
wait "$recorder" || true
sleep 1 # screenrecord finishes writing the file after it exits
"$adb" pull /sdcard/wheel.mp4 "$tmp/android.mp4" >/dev/null
"$adb" shell rm /sdcard/wheel.mp4
demo exit

"$here/to-gif.sh" "$tmp/android.mp4" "$root/docs/android.gif" 1080:1725:0:75 1.0
rm -rf "$tmp"
