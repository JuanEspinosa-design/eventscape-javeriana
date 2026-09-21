import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, Search, Sparkles, FlaskConical } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ROLE_LABEL, useRole, type Role } from "@/lib/role";

const ROLES: Role[] = ["VISITANTE", "ESTUDIANTE", "ADMIN"];

const NAV = [
  { to: "/", label: "Cartelera", icon: CalendarDays },
  { to: "/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/verificacion", label: "Verificación de Reglas", icon: FlaskConical },
] as const;

export function SiteHeader() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface text-surface-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">EventHub</span>
            <span className="block text-xs text-surface-foreground/70">Javeriana</span>
          </span>
        </Link>

        <form
          className="order-3 w-full md:order-none md:w-auto md:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ to: "/", search: { q: query } });
          }}
        >
          <div className="relative md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-foreground/60" />
            <Input
              aria-label="Buscar eventos"
              placeholder="Buscar eventos, lugares o categorías…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="border-white/15 bg-white/10 pl-9 text-surface-foreground placeholder:text-surface-foreground/60"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-surface-foreground/75 transition-colors hover:bg-white/10 hover:text-surface-foreground data-[status=active]:bg-white/15 data-[status=active]:text-surface-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div
          className="flex items-center gap-1 rounded-lg bg-white/10 p-1"
          role="group"
          aria-label="Selector de rol de prueba"
        >
          {ROLES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              aria-pressed={role === item}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                role === item
                  ? "bg-accent text-accent-foreground"
                  : "text-surface-foreground/70 hover:text-surface-foreground"
              }`}
            >
              {ROLE_LABEL[item]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
