import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Inventory"
      description="Flour, butter, starter, packaging — every ingredient and supply in one place."
    />
  ),
});
