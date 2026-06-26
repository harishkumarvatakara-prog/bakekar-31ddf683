import { Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CookingPot,
  ClipboardList,
  CalendarClock,
  Wheat,
  Users,
  Settings,
  Search,
  Bell,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/recipes", label: "Recipes", icon: CookingPot },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/production", label: "Production", icon: CalendarClock },
  { to: "/inventory", label: "Inventory", icon: Wheat },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-lg">
            B
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg">Bakekar</span>
            <span className="text-xs text-muted-foreground">Bakery workspace</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to as string}
              activeOptions={{ exact: !!exact }}
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/40 flex items-center justify-center font-medium text-accent-foreground">
              MK
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium">Mira Karlsen</div>
              <div className="text-xs text-muted-foreground">Head baker</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Quick filter by recipe name..."
              className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button className="rounded-md border border-input bg-card p-2 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
        </header>
        <main className="flex-1 overflow-auto px-4 md:px-8 py-6 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PagePlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
      </header>
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 md:p-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/30 text-accent-foreground font-display">
          ✦
        </div>
        <h2 className="text-xl">Nothing here yet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This workspace area is ready to be shaped. Drop in content, widgets, or
          tables and Bakekar will rise around it.
        </p>
        {children}
      </div>
    </div>
  );
}