import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EventCard } from "@/components/event-card";
import { OccupancyBar } from "@/components/occupancy-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EVENTS,
  daysUntil,
  formatEventDate,
  occupancyPercent,
  remainingSeats,
  type Category,
} from "@/data/events";
import { ZONE_BASE_PRICE } from "@/utils/businessLogic";

const CATEGORIES: Array<Category | "Todas"> = ["Todas", "Teatro", "Conciertos", "Talleres"];
const AGE_FILTERS = [
  { value: "todas", label: "Cualquier clasificación" },
  { value: "familiar", label: "Todo público" },
  { value: "16", label: "Mayores de 16" },
  { value: "18", label: "Mayores de 18" },
];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Cartelera cultural | EventHub Javeriana" },
      {
        name: "description",
        content:
          "Explora la cartelera de eventos culturales y académicos del campus, consulta aforo disponible y reserva tus boletos.",
      },
      { property: "og:title", content: "Cartelera cultural | EventHub Javeriana" },
      {
        property: "og:description",
        content:
          "Teatro, conciertos y talleres en el campus con aforo en tiempo real y reserva de boletos.",
      },
    ],
  }),
  component: Cartelera,
});

function Countdown({ date }: { date: string }) {
  const target = new Date(`${date}T19:00:00Z`).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const diff = Math.max(target - now, 0);
  const parts = [
    { value: Math.floor(diff / 86_400_000), label: "días" },
    { value: Math.floor(diff / 3_600_000) % 24, label: "horas" },
    { value: Math.floor(diff / 60_000) % 60, label: "min" },
    { value: Math.floor(diff / 1000) % 60, label: "seg" },
  ];

  return (
    <div className="flex gap-2">
      {parts.map((part) => (
        <div
          key={part.label}
          className="min-w-16 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center"
        >
          <div className="font-display text-xl font-semibold tabular-nums">
            {String(part.value).padStart(2, "0")}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-surface-foreground/70">
            {part.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Cartelera() {
  const { q } = Route.useSearch();
  const [category, setCategory] = useState<Category | "Todas">("Todas");
  const [maxPrice, setMaxPrice] = useState(100);
  const [fromDate, setFromDate] = useState("");
  const [ageFilter, setAgeFilter] = useState("todas");

  const featured = EVENTS.find((event) => event.featured) ?? EVENTS[0];

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return EVENTS.filter((event) => {
      if (category !== "Todas" && event.category !== category) return false;
      if (fromDate && event.date < fromDate) return false;
      const cheapest = Math.min(...event.zones.map((zone) => ZONE_BASE_PRICE[zone.zone]));
      if (cheapest > maxPrice) return false;
      if (ageFilter === "familiar" && event.minimumAge > 0) return false;
      if (ageFilter === "16" && event.minimumAge !== 16) return false;
      if (ageFilter === "18" && event.minimumAge !== 18) return false;
      if (term) {
        const haystack = `${event.title} ${event.venue} ${event.category} ${event.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [q, category, fromDate, maxPrice, ageFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-2xl surface-hero text-surface-foreground">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-center gap-5 p-8">
            <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Evento de la semana
            </span>
            <h1 className="text-3xl font-semibold sm:text-4xl">{featured.title}</h1>
            <p className="max-w-xl text-sm text-surface-foreground/80">{featured.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-surface-foreground/80">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formatEventDate(featured.date)} · {featured.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {featured.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Ticket className="size-4" /> Quedan {remainingSeats(featured)} cupos
              </span>
            </div>
            <Countdown date={featured.date} />
            <Button asChild size="lg" className="w-fit bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/eventos/$eventId" params={{ eventId: featured.id }}>
                Reservar boletos
              </Link>
            </Button>
          </div>
          <div className="relative min-h-60">
            <img
              src={featured.image}
              alt={featured.title}
              width={1024}
              height={640}
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-4 card-elevated">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromDate">Desde la fecha</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Precio base máximo: ${maxPrice}</Label>
            <input
              id="maxPrice"
              type="range"
              min={50}
              max={100}
              step={25}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Clasificación de edad</Label>
            <select
              id="age"
              value={ageFilter}
              onChange={(event) => setAgeFilter(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {AGE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Cartelera</h2>
          <p className="text-sm text-muted-foreground">
            {results.length} evento(s){q ? ` para “${q}”` : ""}
          </p>
        </div>

        {results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No hay eventos que cumplan los filtros seleccionados.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {EVENTS.slice(0, 3).map((event) => (
          <div key={event.id} className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-sm font-medium">{event.title}</p>
            <OccupancyBar percent={occupancyPercent(event)} label={`Faltan ${daysUntil(event.date)} días`} />
          </div>
        ))}
      </section>
    </div>
  );
}
