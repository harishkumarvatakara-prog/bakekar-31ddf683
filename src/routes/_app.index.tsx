import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Recipes — Bakekar" }] }),
  component: () => <Navigate to="/recipes" />,
});
