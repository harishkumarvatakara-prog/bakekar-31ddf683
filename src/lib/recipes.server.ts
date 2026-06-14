import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function getRecipesClient() {
  if (cached) return cached;
  const rawUrl = process.env.EXTERNAL_SUPABASE_URL?.trim();
  const key = process.env.EXTERNAL_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !key) {
    throw new Error(
      "Missing EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_ANON_KEY env vars.",
    );
  }
  // Supabase JS appends /rest/v1 itself — strip it (and any trailing slash)
  // if the user pasted the full REST URL.
  const url = rawUrl.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
