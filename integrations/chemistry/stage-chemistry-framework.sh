#!/usr/bin/env bash
set -euo pipefail

# Rebuild a private, disposable CF tree pinned to the reviewed public baseline.
# Usage: stage-chemistry-framework.sh [CF checkout] [output directory]
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FE_ROOT="$(cd "$HERE/../.." && pwd)"
CF_CHECKOUT="${1:-${CF_CHECKOUT:-$(cd "$(dirname "$FE_ROOT")/cf-review" && pwd)}}"
OUTPUT="${2:-${TMPDIR:-/tmp}/chemistry-framework-stage-$$}"
PIN="61575a45e2eac096f5b7ddcbf6c40ae2494b8ef1"
PATCH="$HERE/chemistry-framework.patch"

if ! git -C "$CF_CHECKOUT" cat-file -e "$PIN^{commit}" 2>/dev/null; then
  echo "CF checkout does not contain pinned source $PIN" >&2
  exit 2
fi
if [[ -e "$OUTPUT" ]]; then
  echo "Output already exists; choose a fresh staging directory: $OUTPUT" >&2
  exit 2
fi
mkdir -p "$OUTPUT"
git -C "$CF_CHECKOUT" archive "$PIN" | tar -x -C "$OUTPUT"
(cd "$OUTPUT" && git apply --check "$PATCH")
(cd "$OUTPUT" && git apply "$PATCH")
mkdir -p "$OUTPUT/src/fe"
cp -R "$FE_ROOT/src/." "$OUTPUT/src/fe/"
printf '{"private":true,"type":"module"}\n' > "$OUTPUT/src/fe/package.json"
printf 'Staged pinned Chemistry Framework at %s\n' "$OUTPUT"
