import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({ meta: [{ title: "Orders — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Orders"
      description="Wholesale, retail and custom cake orders — track them from inquiry to pickup."
    />
  ),
});
