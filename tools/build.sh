#!/bin/sh
# Builds MUTE SWAN as a desktop app with Electron.
#   tools/build.sh win    -> dist/MuteSwan-windows.zip   (MuteSwan.exe inside)
#   tools/build.sh mac    -> dist/MUTE SWAN-darwin-arm64  (for local smoke tests only)
set -e
cd "$(dirname "$0")/.."
TARGET=${1:-win}
ELECTRON=45.3.0
./tools/fetch-model.sh
rm -rf build/app
mkdir -p build/app/game dist
cp electron/main.js electron/preload.js electron/package.json build/app/
cp -R index.html src vendor build/app/game/
cp README.md build/app/game/README.md
COMMON="--electron-version=$ELECTRON --out=dist --overwrite --asar=false --app-version=1.0.0 --app-copyright=Foh"
if [ "$TARGET" = "mac" ]; then
  npx --yes @electron/packager@20.3.0 build/app "MUTE SWAN" --platform=darwin --arch=arm64 $COMMON \
    --extend-info=tools/mac-extend.plist
else
  npx --yes @electron/packager@20.3.0 build/app MuteSwan --platform=win32 --arch=x64 $COMMON \
    --win32metadata.CompanyName=Foh --win32metadata.FileDescription="MUTE SWAN" --win32metadata.ProductName="MUTE SWAN"
  cp README.md dist/MuteSwan-win32-x64/README.txt
  rm -f dist/MuteSwan-windows.zip
  (cd dist && zip -qr MuteSwan-windows.zip MuteSwan-win32-x64)
  ls -la dist/MuteSwan-windows.zip
fi
