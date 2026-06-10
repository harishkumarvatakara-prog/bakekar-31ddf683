import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Good morning, Mira"
      description="Your bakery at a glance — today's bakes, open orders, and the rhythm of the kitchen."
    />
  ),
});
