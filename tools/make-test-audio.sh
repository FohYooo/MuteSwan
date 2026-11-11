#!/bin/sh
# Generates speech clips with macOS `say` for the voice lab (tests/voice-lab.html).
set -e
cd "$(dirname "$0")/.."
mkdir -p tests/audio
TMP=$(mktemp -d)
say -v Samantha -o "$TMP/run3.aiff" "Run! [[slnc 350]] Run! [[slnc 350]] Run!"
say -v Samantha -r 70 -o "$TMP/no.aiff" "Nooooo"
say -v Samantha -o "$TMP/other.aiff" "Hello there, swan."
for n in run3 no other; do afconvert -f WAVE -d LEI16@16000 "$TMP/$n.aiff" "tests/audio/$n.wav"; done
rm -rf "$TMP"
ls -la tests/audio
