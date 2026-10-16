#!/usr/bin/env bash
# Usage: to-gif.sh <in.mp4> <out.gif> <crop w:h:x:y> [skip seconds] [width]
set -euo pipefail

in=$1 out=$2 crop=$3 skip=${4:-1} width=${5:-320}

# A palette built from the clip itself keeps the GIF small without banding the grey rows.
ffmpeg -v error -y -ss "$skip" -i "$in" -vf "fps=25,crop=$crop,scale=$width:-1:flags=lanczos,split[a][b];\
[a]palettegen=max_colors=96:stats_mode=diff[p];\
[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" "$out"
echo "wrote $out ($(du -h "$out" | cut -f1))"
