import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Settings"
      description="Bakery profile, team members, ovens, units and integrations."
    />
  ),
});
