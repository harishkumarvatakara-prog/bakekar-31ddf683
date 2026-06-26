import { createServerFn } from "@tanstack/react-start";

export type RecipeCard = {
  id: number;
  name: string;
  book: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
};

export type RecipeDetail = RecipeCard & {
  full_text: string | null;
  ingredients: string | null;
  directions: string | null;
};

export type BooksResult = {
  books: string[];
  error: string | null;
};

function formatSupabaseError(error: {
  message?: string;
  hint?: string | null;
  code?: string | null;
  details?: string | null;
}, status?: number, statusText?: string) {
  const statusLabel = status ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}` : null;
  const parts = [statusLabel, error.message, error.hint, error.details, error.code]
    .filter((part): part is string => Boolean(part));
  return parts.join(" — ");
}

export const listBooks = async (): Promise<BooksResult> => {
  const { createClient } = await import("@supabase/supabase-js");
  
  // Read variables exactly how recipes.server.ts accesses them
  const supabaseUrl = process.env.EXTERNAL_SUPABASE_URL?.trim();
  const supabaseKey = process.env.EXTERNAL_SUPABASE_ANON_KEY?.trim();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing in this context.");
    return { books: [] };
  }

  // Strip trailing slashes or /rest/v1 appends if present
  const url = supabaseUrl.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const supabase = createClient(url, supabaseKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .rpc("get_distinct_books");

  if (error) {
    console.error("Error fetching books:", error);
    return { books: [] };
  }

  const books = (data ?? []).map(
    (row: { book_name: string; recipe_count: number }) => row.book_name
  );

  return { books };
};
export const listRecipes = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      book?: string | null;
      letter?: string | null;
      offset?: number;
      limit?: number;
    }) => ({
      book: input.book ?? null,
      letter: input.letter ?? null,
      offset: Math.max(0, Number(input.offset ?? 0)),
      limit: Math.min(50, Math.max(1, Number(input.limit ?? 18))),
    }),
  )
  .handler(async ({ data }) => {
    const { getRecipesClient } = await import("./recipes.server");
    const supabase = getRecipesClient();
    let q = supabase
      .from("recipes")
      .select("id,name,book,prep_time,cook_time,total_time", { count: "exact" })
      .order("name", { ascending: true });

    if (data.book) q = q.eq("book", data.book);
    if (data.letter) {
      const l = data.letter.toUpperCase();
      // Case-insensitive starts-with
      q = q.ilike("name", `${l}%`);
    }
    q = q.range(data.offset, data.offset + data.limit - 1);

    const { data: rows, error, count, status, statusText } = await q;
    if (error) {
      const message = formatSupabaseError(error, status, statusText);
      console.error("recipes.listRecipes Supabase error", message);
      return {
        recipes: [] as RecipeCard[],
        total: 0,
        offset: data.offset,
        limit: data.limit,
        error: message,
      };
    }
    return {
      recipes: (rows ?? []) as RecipeCard[],
      total: count ?? 0,
      offset: data.offset,
      limit: data.limit,
      error: null,
    };
  });

export const getRecipe = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ data }) => {
    const { getRecipesClient } = await import("./recipes.server");
    const supabase = getRecipesClient();
    const { data: row, error } = await supabase
      .from("recipes")
      .select(
        "id,name,book,prep_time,cook_time,total_time,full_text,ingredients,directions",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as RecipeDetail | null;
  });
