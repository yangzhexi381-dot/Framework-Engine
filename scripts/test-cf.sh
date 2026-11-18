#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: npm run test:cf -- /path/to/Chemistry-Framework" >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP="$(mktemp -d)"
server_pid=
cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; fi
  rm -rf -- "$TEMP"
}
trap cleanup EXIT
STAGE="$TEMP/site"
bash "$ROOT/integrations/chemistry/stage-chemistry-framework.sh" "$1" "$STAGE"
CF_STAGE="$STAGE" node "$ROOT/integrations/chemistry/inquiry-store.integration.test.mjs"
cd "$STAGE"
node --test tests/*.test.cjs
for file in src/*.js src/models/*.js; do node --check "$file"; done

if [[ "${CF_BROWSER:-0}" == 1 ]]; then
  port="${CF_BROWSER_PORT:-8765}"
  python3 -m http.server "$port" --bind 127.0.0.1 > "$TEMP/server.log" 2>&1 &
  server_pid=$!
  export CF_TEST_URL="http://127.0.0.1:$port/"
  for ((attempt=0; attempt<10; attempt++)); do
    if curl --fail --silent --output /dev/null "$CF_TEST_URL"; then break; fi
    sleep 1
  done
  curl --fail --silent --show-error --output /dev/null "$CF_TEST_URL"
  node "$ROOT/integrations/chemistry/inquiry-store.browser.cjs"
  node tests/curriculum-browser.cjs
fi
