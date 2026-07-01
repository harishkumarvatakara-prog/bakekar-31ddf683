import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { GlobalSearchProvider } from "@/hooks/use-global-search";

function AppLayout() {
  return (
    <GlobalSearchProvider>
      <WorkspaceLayout />
    </GlobalSearchProvider>
  );
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
