import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/recipes")({
  head: () => ({ meta: [{ title: "Recipes — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Recipes"
      description="Your formula book — sourdoughs, laminated doughs, pastries and seasonal specials."
    />
  ),
});
