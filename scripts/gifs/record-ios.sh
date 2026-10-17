#!/usr/bin/env bash
# Records docs/ios.gif from the Expo demo on a booted iPhone 17 Pro simulator.
# Needs: the demo installed (npm run ios in example-expo/), Metro running, ffmpeg and axe
# (brew install ffmpeg cameroncooke/axe/axe). Coordinates are points on a 402x874 screen.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
udid=${UDID:-$(xcrun simctl list devices booted | grep -m1 -oE '[0-9A-F-]{36}')}
bundle=com.devmaxxx.wheelpicker.expo
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
sleep 8
# The first synthetic touch after launch gets dropped, so spend it on the title.
tap 200 110 1.5

xcrun simctl io "$udid" recordVideo --codec=h264 --force "$tmp/ios.mp4" &
recorder=$!
sleep 1.5

swipe 113 340 200 0.12 2.6 # flick the hours up
swipe 289 240 360 0.12 2.6 # flick the minutes down
tap 201 528                # Noon
tap 324 528                # Random
tap 150 815 1.2            # Strings tab
swipe 201 240 350 0.15 2.2 # flick the fruits
tap 201 528                # Last
tap 251 815 1.2            # Objects tab
swipe 201 250 340 0.15 2.2 # flick the cities
tap 324 528                # Random
tap 351 815 1.2            # Styled tab
swipe 201 330 240 0.15 2.2 # flick the sizes
tap 77 528                 # First
tap 50 815 1.5             # back to Time

sleep 1.5
# A background job ignores SIGINT in a non-interactive shell, so signal simctl by name.
pkill -INT -f "simctl io $udid recordVideo"
wait "$recorder" || true

"$here/to-gif.sh" "$tmp/ios.mp4" "$root/docs/ios.gif" 1206:2472:0:150 1.2 300
rm -rf "$tmp"
