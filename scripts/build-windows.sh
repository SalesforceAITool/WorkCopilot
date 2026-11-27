#!/usr/bin/env bash
# Builds the Windows installer "Work-Copilot-Setup-<version>.exe" (Start menu + desktop shortcuts,
# plus "Work Copilot Self Test"). Runs on Linux too (needs wine, 32- and 64-bit, for the uninstaller).
#   scripts/build-windows.sh [outDir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist}"
STAGE="$(mktemp -d)/app"
VERSION="$(node -p "require('$ROOT/package.json').version")"
ELECTRON="$(node -p "require('$ROOT/node_modules/electron/package.json').version")"

echo "== staging $VERSION (Electron $ELECTRON)"
mkdir -p "$STAGE/kb/tools" "$STAGE/project-kb"
cp -r "$ROOT/src" "$ROOT/assets" "$ROOT/build" "$STAGE/"
cp "$ROOT/kb/salesforce-qa.json" "$STAGE/kb/"
cp "$ROOT/kb/tools/validate.js" "$STAGE/kb/tools/"   # used by Build Q&A
cp "$ROOT"/project-kb/*.json "$STAGE/project-kb/"
node -e "
const p = require('$ROOT/package.json');
const out = { name: p.name, productName: 'Work Copilot', version: p.version, description: p.description, main: p.main,
  author: 'Akshay Verma', dependencies: p.dependencies };
require('fs').writeFileSync('$STAGE/package.json', JSON.stringify(out, null, 2));"

echo "== installing Windows x64 packages"
(cd "$STAGE" && npm install --omit=dev --os=win32 --cpu=x64 --no-audit --no-fund --loglevel=error --onnxruntime-node-install-cuda=skip)
for m in sherpa-onnx-win-x64 onnxruntime-node/bin/napi-v3/win32/x64 @img/sharp-win32-x64; do
  [ -e "$STAGE/node_modules/$m" ] || { echo "missing Windows binary: $m"; exit 1; }
done

echo "== building installer"
cat > "$STAGE/electron-builder.json" <<JSON
{
  "appId": "com.workcopilot.app",
  "productName": "Work Copilot",
  "electronVersion": "$ELECTRON",
  "npmRebuild": false,
  "buildDependenciesFromSource": false,
  "directories": { "output": "$OUT", "buildResources": "build" },
  "files": ["src/**", "assets/**", "kb/**", "project-kb/**", "package.json", "node_modules/**",
    "!node_modules/onnxruntime-node/bin/napi-v3/linux/**", "!node_modules/onnxruntime-node/bin/napi-v3/darwin/**",
    "!node_modules/onnxruntime-node/bin/napi-v3/win32/arm64/**", "!node_modules/onnxruntime-web/dist/*.wasm"],
  "publish": [{ "provider": "generic", "url": "https://localhost/work-copilot" }],
  "asar": true,
  "asarUnpack": ["node_modules/sherpa-onnx-*/**", "node_modules/onnxruntime-node/**", "node_modules/@img/**", "node_modules/sharp/**"],
  "win": { "target": [{ "target": "nsis", "arch": ["x64"] }], "icon": "build/icon.ico" },
  "nsis": {
    "oneClick": true, "perMachine": false, "runAfterFinish": true,
    "createStartMenuShortcut": true, "createDesktopShortcut": true, "shortcutName": "Work Copilot",
    "include": "build/installer.nsh",
    "artifactName": "Work-Copilot-Setup-\${version}.exe"
  }
}
JSON
(cd "$STAGE" && "$ROOT/node_modules/.bin/electron-builder" --win --x64 --config electron-builder.json --publish never)
ls -la "$OUT"
