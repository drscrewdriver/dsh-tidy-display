#!/usr/bin/env bash
# Deny subagent starts that pin Claude / Sonnet / Opus, GPT, Gemini,
# computerUse, or browser. Parent-model inherit (Grok / Composer) is allowed.
set -euo pipefail

payload="$(cat || true)"

deny() {
  local reason="$1"
  python3 -c 'import json,sys; print(json.dumps({"permission":"deny","decision":"deny","user_message":sys.argv[1]}))' "$reason"
  exit 2
}

if [[ -z "$payload" ]]; then
  exit 0
fi

set +e
verdict="$(MODEL_HOOK_PAYLOAD="$payload" python3 - <<'PY'
import json, os, re, sys

raw = os.environ.get("MODEL_HOOK_PAYLOAD", "")
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    data = {}

subagent = str(
    data.get("subagent_type")
    or data.get("subagentType")
    or data.get("agent")
    or data.get("type")
    or ""
).lower()
model = str(
    data.get("model")
    or data.get("model_slug")
    or data.get("requested_model")
    or ""
).lower()
normalized_type = re.sub(r"[-_]", "", subagent)

if "computeruse" in normalized_type or normalized_type == "browser" or "browser" in normalized_type:
    print("deny")
    sys.exit(0)

blocked = re.compile(r"\b(claude|sonnet|opus|gpt|gemini)\b")
if blocked.search(model) or blocked.search(subagent):
    print("deny")
    sys.exit(0)

print("allow")
PY
)"
status=$?
set -e

if [[ "$status" -ne 0 ]]; then
  deny "Hook payload could not be checked."
fi
if [[ "$verdict" == "deny" ]]; then
  deny "This repo blocks Claude/Sonnet/Opus/GPT/Gemini and computerUse/browser subagents. Use inherit (Grok 4.6 or Composer) only."
fi
exit 0
