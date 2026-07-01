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

export const listBooks = createServerFn({ method: "GET" }).handler(
  async () => {
    // Dynamically import the server client to prevent Lovable browser env crashes
    const { getRecipesClient } = await import("./recipes.server");
    const supabase = getRecipesClient();

    const { data, error, status, statusText } = await supabase.rpc(
      "get_distinct_books",
    );

    if (error) {
      const message = formatSupabaseError(error, status, statusText);
      console.error("Error fetching books:", error);
      return { books: [], error: message } as BooksResult;
    }

    const books = (
      (data ?? []) as Array<{ book_name: string; recipe_count: number }>
    ).map((row) => row.book_name);

    return { books, error: null } as BooksResult;
  },
);
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
