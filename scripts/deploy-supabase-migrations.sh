#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN in the environment}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in the environment}"
PROJECT_REF="syeivjiceluygqvjeblw"
supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
supabase db push --password "$SUPABASE_DB_PASSWORD"
