#!/usr/bin/env sh

set -u

printf "\nShapeDraw Doctor Checkup\n"
printf "==========================\n\n"

check_cmd() {
  cmd="$1"
  label="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    version="$($cmd --version 2>/dev/null | head -n 1)"
    printf "[OK] %s: %s\n" "$label" "${version:-installed}"
  else
    printf "[MISSING] %s is not installed.\n" "$label"
  fi
}

check_cmd node "Node.js"
check_cmd npm "npm"
check_cmd git "Git"

printf "\nProject checks\n"
printf "--------------\n"

if [ -f "package.json" ]; then
  printf "[OK] package.json found\n"
else
  printf "[MISSING] package.json missing\n"
fi

if [ -d "node_modules" ]; then
  printf "[OK] node_modules found\n"
else
  printf "[WARN] node_modules missing (run: npm install)\n"
fi

if [ -f "public/manifest.webmanifest" ]; then
  printf "[OK] PWA manifest found\n"
else
  printf "[MISSING] PWA manifest missing\n"
fi

if [ -f "public/sw.js" ]; then
  printf "[OK] Service worker file found\n"
else
  printf "[MISSING] Service worker file missing\n"
fi

printf "\nDone. If everything looks good, run: npm run dev\n\n"
