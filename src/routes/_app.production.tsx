import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/workspace-layout";

export const Route = createFileRoute("/_app/production")({
  head: () => ({ meta: [{ title: "Production — Bakekar" }] }),
  component: () => (
    <PagePlaceholder
      title="Production schedule"
      description="Mixing, shaping, proofing and bake-off times mapped across your ovens."
    />
  ),
});
