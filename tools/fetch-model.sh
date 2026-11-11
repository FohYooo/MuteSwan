#!/bin/sh
# Downloads the offline speech model (41 MB, Apache-2.0) used for "run" / "no" recognition.
set -e
cd "$(dirname "$0")/.."
URL=https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz
OUT=vendor/model/vosk-model-small-en-us-0.15.tar.gz
EXPECT=41184862
mkdir -p vendor/model
if [ -f "$OUT" ] && [ "$(wc -c < "$OUT" | tr -d ' ')" = "$EXPECT" ]; then echo "model already present"; exit 0; fi
curl -fL --retry 3 -o "$OUT.part" "$URL"
SIZE=$(wc -c < "$OUT.part" | tr -d ' ')
if [ "$SIZE" != "$EXPECT" ]; then echo "unexpected size $SIZE (want $EXPECT)"; rm -f "$OUT.part"; exit 1; fi
mv "$OUT.part" "$OUT"
echo "model saved to $OUT"
