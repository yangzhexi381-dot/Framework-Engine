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
mkdir -p -- "$(dirname -- "$OUTPUT")"
if ! mkdir -- "$OUTPUT"; then
  echo "Choose a new, writable staging directory: $OUTPUT" >&2
  exit 2
fi
git -C "$CF_CHECKOUT" archive "$PIN" | tar -x -C "$OUTPUT"
(
  cd -- "$OUTPUT"
  # The preview is an archive, so git apply must not discover a parent worktree.
  export GIT_CEILING_DIRECTORIES="$(dirname -- "$(pwd -P)")"
  git apply "$PATCH"
)
# The pinned CF scripts use CommonJS under Node. Keep any parent ESM scope out.
printf '{"private":true,"type":"commonjs"}\n' > "$OUTPUT/package.json"
mkdir -p "$OUTPUT/src/fe"
cp -R "$FE_ROOT/src/." "$OUTPUT/src/fe/"
printf '{"private":true,"type":"module"}\n' > "$OUTPUT/src/fe/package.json"
printf 'Staged pinned Chemistry Framework at %s\n' "$OUTPUT"
