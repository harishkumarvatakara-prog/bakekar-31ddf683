import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Customers"
      description="Cafés, restaurants and regulars who count on your bakes."
    />
  ),
});
