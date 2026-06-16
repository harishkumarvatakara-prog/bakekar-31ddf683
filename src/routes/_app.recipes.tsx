import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Sparkles, Clock, Timer, BookOpen } from "lucide-react";

import {
  listBooks,
  listRecipes,
  getRecipe,
  type RecipeCard,
  type RecipeDetail,
} from "@/lib/recipes.functions";
import { searchRecipes } from "@/lib/recipe-search.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 18;
const ALL_BOOKS = "__all__";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const Route = createFileRoute("/_app/recipes")({
  head: () => ({ meta: [{ title: "Recipes — Bakekar" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const listBooksFn = useServerFn(listBooks);
  const listRecipesFn = useServerFn(listRecipes);
  const getRecipeFn = useServerFn(getRecipe);
  const searchRecipesFn = useServerFn(searchRecipes);

  const [book, setBook] = useState<string>(ALL_BOOKS);
  const [letter, setLetter] = useState<string | null>(null);
  const [pages, setPages] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  const searchMutation = useMutation({
    mutationFn: (q: string) =>
      searchRecipesFn({
        data: {
          query: q,
          book: book === ALL_BOOKS ? null : book,
          limit: 5,
        },
      }),
  });

  const runSearch = () => {
    const q = searchText.trim();
    if (!q) return;
    searchMutation.mutate(q);
  };

  const booksQuery = useQuery({
    queryKey: ["recipes", "books"],
    queryFn: () => listBooksFn(),
    staleTime: 5 * 60_000,
  });

  const effectiveBook = book === ALL_BOOKS ? null : book;
  const limit = pages * PAGE_SIZE;

  const recipesQuery = useQuery({
    queryKey: ["recipes", "list", effectiveBook, letter, limit],
    queryFn: () =>
      listRecipesFn({
        data: { book: effectiveBook, letter, offset: 0, limit },
      }),
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ["recipes", "detail", openId],
    queryFn: () => getRecipeFn({ data: { id: openId as number } }),
    enabled: openId !== null,
  });

  const recipes = recipesQuery.data?.recipes ?? [];
  const total = recipesQuery.data?.total ?? 0;
  const hasMore = recipes.length < total;

  const resetPaging = () => setPages(1);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl">Recipes</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Browse your formula library by book, then jump straight to a letter.
        </p>
      </header>

      {/* Book dropdown */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Book
        </label>
        <Select
          value={book}
          onValueChange={(v) => {
            setBook(v);
            resetPaging();
          }}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="All books" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BOOKS}>All books</SelectItem>
            {(booksQuery.data?.books ?? []).map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {booksQuery.isLoading && (
          <span className="text-xs text-muted-foreground">Loading books…</span>
        )}
        {(booksQuery.error || booksQuery.data?.error) && (
          <span className="text-xs text-destructive">
            {booksQuery.data?.error ?? (booksQuery.error as Error).message}
          </span>
        )}
      </div>

      {/* A-Z filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/50 p-2">
        <button
          onClick={() => {
            setLetter(null);
            resetPaging();
          }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            letter === null
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          }`}
        >
          All
        </button>
        {LETTERS.map((l) => {
          const active = letter === l;
          return (
            <button
              key={l}
              onClick={() => {
                setLetter(active ? null : l);
                resetPaging();
              }}
              className={`h-7 w-7 rounded-md text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {recipesQuery.isLoading
            ? "Loading recipes…"
            : `${recipes.length} of ${total} ${total === 1 ? "recipe" : "recipes"}`}
        </div>
        {recipesQuery.error || recipesQuery.data?.error ? (
          <span className="text-destructive">
            {recipesQuery.data?.error ?? (recipesQuery.error as Error).message}
          </span>
        ) : null}
      </div>

      {/* Grid */}
      {recipes.length === 0 && !recipesQuery.isLoading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            No recipes match these filters. Try another book or letter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <RecipeCardView key={r.id} recipe={r} onOpen={() => setOpenId(r.id)} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setPages((p) => p + 1)}
            disabled={recipesQuery.isFetching}
            className="rounded-md border border-input bg-card px-5 py-2 text-sm font-medium hover:bg-accent/40 disabled:opacity-50"
          >
            {recipesQuery.isFetching ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {/* Smart Recipe Finder */}
      <section className="mt-16 rounded-2xl border border-border bg-card/60 p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display">Smart Recipe Finder</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground max-w-2xl">
          Describe what you're craving in plain English and Bakekar will find a
          match across your collection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="e.g., Show me a soft eggless vanilla sponge cake that takes under an hour"
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={searchMutation.isPending || !searchText.trim()}
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {searchMutation.isPending ? "Searching…" : "Search Recipes"}
          </button>
        </div>

        {/* Search results */}
        {(searchMutation.data?.error || searchMutation.error) && (
          <p className="mt-4 text-sm text-destructive">
            {searchMutation.data?.error ??
              (searchMutation.error as Error).message}
          </p>
        )}
        {searchMutation.data?.results &&
          searchMutation.data.results.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Top {searchMutation.data.results.length} matches
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchMutation.data.results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setOpenId(r.id)}
                    className="text-left rounded-xl border border-primary/30 bg-background p-5 transition-all hover:border-primary hover:shadow-md group"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      {r.book ? (
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground line-clamp-1">
                          {r.book}
                        </div>
                      ) : <span />}
                      <span className="text-[10px] font-semibold text-primary">
                        {Math.round(r.similarity * 100)}% match
                      </span>
                    </div>
                    <h3 className="font-display text-base leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {r.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {r.prep_time ? (
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          {r.prep_time}
                        </span>
                      ) : null}
                      {r.total_time ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {r.total_time}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        {searchMutation.data &&
          !searchMutation.data.error &&
          searchMutation.data.results.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No matches found. Try rephrasing your craving.
            </p>
          )}
      </section>

      {/* Detail Modal */}
      <Dialog
        open={openId !== null}
        onOpenChange={(o) => {
          if (!o) setOpenId(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <RecipeDetailView
            detail={detailQuery.data ?? null}
            loading={detailQuery.isLoading}
            error={detailQuery.error as Error | null}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeCardView({
  recipe,
  onOpen,
}: {
  recipe: RecipeCard;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md group"
    >
      {recipe.book ? (
        <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {recipe.book}
        </div>
      ) : null}
      <h3 className="font-display text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
        {recipe.name}
      </h3>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {recipe.prep_time ? (
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            Prep: {recipe.prep_time}
          </span>
        ) : null}
        {recipe.total_time ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Total: {recipe.total_time}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function RecipeDetailView({
  detail,
  loading,
  error,
}: {
  detail: RecipeDetail | null;
  loading: boolean;
  error: Error | null;
}) {
  const fullText = useMemo(() => detail?.full_text ?? "", [detail]);

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Loading recipe…
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-10 text-center text-sm text-destructive">
        {error.message}
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Recipe not found.
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        {detail.book ? (
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {detail.book}
          </div>
        ) : null}
        <DialogTitle className="text-2xl font-display leading-tight">
          {detail.name}
        </DialogTitle>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {detail.prep_time ? <span>Prep: {detail.prep_time}</span> : null}
          {detail.cook_time ? <span>Cook: {detail.cook_time}</span> : null}
          {detail.total_time ? <span>Total: {detail.total_time}</span> : null}
        </div>
      </DialogHeader>

      {fullText ? (
        <pre className="mt-6 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
          {fullText}
        </pre>
      ) : (
        <div className="mt-6 space-y-6">
          {detail.ingredients ? (
            <section>
              <h4 className="mb-2 font-display text-base">Ingredients</h4>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                {detail.ingredients}
              </pre>
            </section>
          ) : null}
          {detail.directions ? (
            <section>
              <h4 className="mb-2 font-display text-base">Directions</h4>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                {detail.directions}
              </pre>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
