import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing, Info, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { OccupancyBar } from "@/components/occupancy-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  EVENTS,
  daysUntil,
  eventCapacity,
  eventSold,
  formatEventDate,
  formatMoney,
  occupancyPercent,
  remainingSeats,
} from "@/data/events";
import { useRole, ROLE_LABEL } from "@/lib/role";
import { ZONE_BASE_PRICE, evaluateEventAlerts, type EventAlert } from "@/utils/businessLogic";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel administrativo | EventHub Javeriana" },
      {
        name: "description",
        content:
          "Supervisa aforo, ventas y alertas automáticas de los eventos culturales del campus en un solo panel.",
      },
      { property: "og:title", content: "Panel administrativo | EventHub Javeriana" },
      {
        property: "og:description",
        content: "Métricas de aforo, ventas estimadas y consola de alertas en vivo por evento.",
      },
    ],
  }),
  component: Panel,
});

const LEVEL_STYLE: Record<EventAlert["level"], { tone: string; icon: typeof Info }> = {
  info: { tone: "border-accent/40 bg-accent/10", icon: Info },
  warning: { tone: "border-warning/50 bg-warning/15", icon: BellRing },
  critical: { tone: "border-destructive/50 bg-destructive/10", icon: AlertTriangle },
};

function estimatedRevenue(eventId: string): number {
  const event = EVENTS.find((item) => item.id === eventId)!;
  return event.zones.reduce((total, zone) => total + zone.sold * ZONE_BASE_PRICE[zone.zone], 0);
}

function Panel() {
  const { role } = useRole();
  const [minutes, setMinutes] = useState(8);
  const [confirmed, setConfirmed] = useState(false);
  const [heldSeats, setHeldSeats] = useState(3);

  const rows = useMemo(
    () =>
      EVENTS.map((event) => {
        const result = evaluateEventAlerts({
          minutesSinceReservation: minutes,
          reservationConfirmed: confirmed,
          ticketsHeld: heldSeats,
          totalCapacity: eventCapacity(event),
          ticketsSold: eventSold(event),
          daysUntilEvent: daysUntil(event.date),
        });
        return { event, result };
      }),
    [minutes, confirmed, heldSeats],
  );

  const totalCapacity = EVENTS.reduce((sum, event) => sum + eventCapacity(event), 0);
  const totalSold = EVENTS.reduce((sum, event) => sum + eventSold(event), 0);
  const totalRevenue = EVENTS.reduce((sum, event) => sum + estimatedRevenue(event.id), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Panel de aforo y alertas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rol activo: <strong>{ROLE_LABEL[role]}</strong>.{" "}
          {role !== "ADMIN"
            ? "Estás en modo consulta: las acciones de liberación de cupos requieren rol Administrador."
            : "Tienes permisos para liberar cupos bloqueados y revisar incidentes."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Aforo total gestionado", value: totalCapacity.toLocaleString("es-CO") },
          {
            label: "Boletos vendidos",
            value: `${totalSold.toLocaleString("es-CO")} (${Math.round((totalSold / totalCapacity) * 100)}%)`,
          },
          { label: "Ingresos base estimados", value: formatMoney(totalRevenue) },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-card p-5 card-elevated">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
            <p className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold">
              <TrendingUp className="size-5 text-accent" /> {metric.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Simulador de reserva temporal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta los parámetros de la reserva en curso para ver cómo responde el motor de alertas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="minutes">Minutos desde la reserva: {minutes}</Label>
            <input
              id="minutes"
              type="range"
              min={0}
              max={30}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="held">Cupos bloqueados: {heldSeats}</Label>
            <input
              id="held"
              type="range"
              min={1}
              max={10}
              value={heldSeats}
              onChange={(event) => setHeldSeats(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant={confirmed ? "default" : "outline"}
              onClick={() => setConfirmed((value) => !value)}
              className="w-full"
            >
              {confirmed ? "Reserva confirmada" : "Marcar como confirmada"}
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Aforo y ventas por evento</h2>
          {rows.map(({ event, result }) => (
            <div key={event.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDate(event.date)} · {event.venue}
                  </p>
                </div>
                <Badge variant={result.occupancyRate >= 0.85 ? "destructive" : "secondary"}>
                  {occupancyPercent(event)}% ocupado
                </Badge>
              </div>
              <div className="mt-4">
                <OccupancyBar
                  percent={occupancyPercent(event)}
                  label={`${eventSold(event)} / ${eventCapacity(event)} boletos`}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Quedan {remainingSeats(event)} cupos</span>
                <span>Ingresos base: {formatMoney(estimatedRevenue(event.id))}</span>
                {result.specialDiscountFlag && (
                  <Badge className="bg-warning text-warning-foreground">Descuento especial</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={role !== "ADMIN" || result.releasedSeats === 0}
                title={
                  role !== "ADMIN"
                    ? "Solo el Administrador puede liberar cupos"
                    : result.releasedSeats === 0
                      ? "No hay cupos expirados por liberar"
                      : "Liberar cupos expirados"
                }
                className="mt-4"
              >
                Liberar {result.releasedSeats} cupo(s) expirado(s)
              </Button>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Consola de alertas e incidentes</h2>
          <div className="mt-4 space-y-3">
            {rows.flatMap(({ event, result }) =>
              result.alerts.map((alert) => {
                const style = LEVEL_STYLE[alert.level];
                const Icon = style.icon;
                return (
                  <div
                    key={`${event.id}-${alert.code}`}
                    className={`flex gap-3 rounded-lg border p-4 ${style.tone}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {alert.code} · Reserva {result.reservationStatus}
                      </p>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
