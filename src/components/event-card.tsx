import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { OccupancyBar } from "@/components/occupancy-bar";
import { Badge } from "@/components/ui/badge";
import {
  daysUntil,
  formatEventDate,
  occupancyPercent,
  remainingSeats,
  type CampusEvent,
} from "@/data/events";

export function EventCard({ event }: { event: CampusEvent }) {
  const percent = occupancyPercent(event);
  const remaining = remainingSeats(event);
  const days = daysUntil(event.date);

  const status =
    remaining === 0
      ? { label: "Agotado", tone: "bg-destructive text-destructive-foreground" }
      : percent > 90
        ? { label: "Últimos cupos", tone: "bg-warning text-warning-foreground" }
        : days > 15
          ? { label: "Preventa anticipada", tone: "bg-success text-success-foreground" }
          : { label: "Disponible", tone: "bg-accent text-accent-foreground" };

  return (
    <Link
      to="/eventos/$eventId"
      params={{ eventId: event.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card card-elevated transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          width={1024}
          height={640}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{event.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {event.minimumAge > 0 ? `Mayores de ${event.minimumAge}` : "Todo público"}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug">{event.title}</h3>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatEventDate(event.date)} · {event.time}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {event.venue}
        </p>

        <div className="mt-auto space-y-2">
          <OccupancyBar percent={percent} label={`Quedan ${remaining} cupos`} />
        </div>
      </div>
    </Link>
  );
}
