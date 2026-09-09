#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
umask 077

echo "My Store security-aware setup"
echo "============================"

if [[ ! -f .env.example ]]; then
  echo "ERROR: .env.example is missing."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  echo "Created .env with owner-only permissions."
else
  chmod 600 .env
  echo "Using existing .env with owner-only permissions."
fi

read_env_value() {
  local name="$1"
  awk -F= -v key="$name" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' .env
}

is_configured() {
  local value="$1"
  [[ -n "$value" && "$value" != *"your_"* && "$value" != *"REPLACE_WITH"* ]]
}

missing=()
for name in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URL GOOGLE_CALENDAR_ID; do
  value="$(read_env_value "$name")"
  if is_configured "$value"; then
    echo "  $name: configured"
  else
    echo "  $name: needs configuration"
    missing+=("$name")
  fi
done

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "ERROR: .env is tracked by git. Remove it from git and rotate every credential it contained."
  exit 1
fi

matches="$(git grep -nE 'GOOGLE_(CLIENT_SECRET|ACCESS_TOKEN|REFRESH_TOKEN)=[^[:space:]#]+' -- ':!quick-setup.sh' ':!quickstart.sh' 2>/dev/null | awk '$0 !~ /your_|REPLACE_WITH/ && $0 !~ /:[[:space:]]*#/' )"
if [[ -n "$matches" ]]; then
  echo "ERROR: credential-shaped values found in tracked files:"
  echo "$matches"
  exit 1
fi

echo
if (( ${#missing[@]} > 0 )); then
  echo "Complete the missing values in .env before starting locally."
  echo "Production values belong in Cloudflare Worker secrets, never in this repository."
else
  echo "Local configuration is complete."
fi

echo
echo "Local callback:  http://localhost:8787/auth/google/callback"
echo "Production callback: https://lapapessavacanze.com/auth/google/callback"
echo "Next: npm run dev"
