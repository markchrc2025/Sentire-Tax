#!/bin/sh
# Render /env.js from the container's environment on every start, so runtime
# env vars (set in the Sliplane service settings) reach the SPA without a
# rebuild. Runs via nginx's stock /docker-entrypoint.d hook.
set -eu

OUT=/usr/share/nginx/html/env.js

{
  echo "// generated at container start — do not edit"
  echo "window.__ENV = {"
  for key in VITE_API_URL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
    eval "val=\${$key:-}"
    if [ -n "$val" ]; then
      printf '  %s: "%s",\n' "$key" "$val"
    fi
  done
  echo "};"
} > "$OUT"

echo "rendered $OUT:"
cat "$OUT"
