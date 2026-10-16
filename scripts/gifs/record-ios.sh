#!/usr/bin/env bash
# Records docs/ios.gif from the example app on a booted iPhone 17 Pro simulator.
# Needs: the example app installed (npm run ios in example/), Metro running, ffmpeg and axe
# (brew install ffmpeg cameroncooke/axe/axe). Coordinates are points on a 402x874 screen.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
udid=${UDID:-$(xcrun simctl list devices booted | grep -m1 -oE '[0-9A-F-]{36}')}
bundle=org.reactjs.native.example.WheelPickerExample
tmp=$(mktemp -d)

swipe() { # x fromY toY seconds pause
  axe swipe --start-x "$1" --start-y "$2" --end-x "$1" --end-y "$3" --duration "$4" --udid "$udid" >/dev/null
  sleep "$5"
}
tap() { # x y pause
  axe tap -x "$1" -y "$2" --udid "$udid" >/dev/null
  sleep "${3:-1.8}"
}

xcrun simctl status_bar "$udid" override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3
xcrun simctl terminate "$udid" "$bundle" 2>/dev/null || true
xcrun simctl launch "$udid" "$bundle" >/dev/null
sleep 6
# The first synthetic touch after launch gets dropped, so spend it on the value caption.
tap 200 330 1.5

xcrun simctl io "$udid" recordVideo --codec=h264 --force "$tmp/ios.mp4" &
recorder=$!
sleep 1.5

swipe 107 250 120 0.12 2.8 # flick the left wheel up
swipe 296 120 250 0.12 2.8 # flick the right wheel down
tap 103 656                # Last
tap 56 656                 # First
tap 165 656                # Random
tap 165 656 2.2            # Random

sleep 1.5
# A background job ignores SIGINT in a non-interactive shell, so signal simctl by name.
pkill -INT -f "simctl io $udid recordVideo"
wait "$recorder" || true

"$here/to-gif.sh" "$tmp/ios.mp4" "$root/docs/ios.gif" 1206:1800:0:210 1.2
rm -rf "$tmp"
