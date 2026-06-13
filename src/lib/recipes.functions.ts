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

export const listBooks = createServerFn({ method: "GET" }).handler(async () => {
  const { getRecipesClient } = await import("./recipes.server");
  const supabase = getRecipesClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("book")
    .not("book", "is", null);
  if (error) throw new Error(error.message);
  const unique = Array.from(
    new Set(
      (data ?? [])
        .map((r) => (r as { book: string | null }).book)
        .filter((b): b is string => !!b && b.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  return unique;
});

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

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return {
      recipes: (rows ?? []) as RecipeCard[],
      total: count ?? 0,
      offset: data.offset,
      limit: data.limit,
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
