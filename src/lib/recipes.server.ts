import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function getRecipesClient() {
  if (cached) return cached;
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const key = process.env.EXTERNAL_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_ANON_KEY env vars.",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
