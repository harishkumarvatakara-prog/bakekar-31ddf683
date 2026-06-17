import { createServerFn } from "@tanstack/react-start";
import type { RecipeCard } from "./recipes.functions";

export type SearchResult = RecipeCard & { similarity: number };

export type SearchResponse = {
  results: SearchResult[];
  error: string | null;
};

async function embedQuery(text: string, hfKey: string): Promise<number[]> {
  const res = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hfKey}`,
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HF inference HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as number[] | number[][];
  // all-MiniLM-L6-v2 returns a flat 384-dim array (mean-pooled & normalized).
  const vec = Array.isArray(json[0])
    ? (json[0] as number[])
    : (json as number[]);
  if (!Array.isArray(vec) || vec.length !== 384) {
    throw new Error(
      `Expected 384-dim embedding, got ${Array.isArray(vec) ? vec.length : typeof vec}`,
    );
  }
  return vec;
}

export const searchRecipes = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string; book?: string | null; limit?: number }) => ({
    query: String(input.query ?? "").trim(),
    book: input.book ?? null,
    limit: Math.min(20, Math.max(1, Number(input.limit ?? 5))),
  }))
  .handler(async ({ data }): Promise<SearchResponse> => {
    if (!data.query) return { results: [], error: null };

    try {
      const hfKey = process.env.HUGGINGFACE_API_KEY?.trim();
      if (!hfKey) throw new Error("Missing HUGGINGFACE_API_KEY");

      const embedding = await embedQuery(data.query, hfKey);
      const { getRecipesClient } = await import("./recipes.server");
      const supabase = getRecipesClient();

      // Over-fetch so we can post-filter by book without re-querying.
      const fetchCount = data.book ? 40 : data.limit;
      const { data: rows, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{
        data: unknown;
        error: { message?: string; hint?: string | null } | null;
      }>)("search_recipes", { query_embedding: embedding, match_count: fetchCount });

      if (error) {
        const msg = `${error.message ?? "RPC error"}${error.hint ? ` — ${error.hint}` : ""}`;
        return { results: [], error: msg };
      }

      const all = (rows ?? []) as Array<{
        id: number;
        name: string;
        book: string | null;
        prep_time: string | null;
        cook_time: string | null;
        total_time: string | null;
        similarity: number;
      }>;

      const filtered = data.book ? all.filter((r) => r.book === data.book) : all;

      return {
        results: filtered.slice(0, data.limit),
        error: null,
      };
    } catch (e) {
      return {
        results: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
