import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OccupancyBar } from "@/components/occupancy-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  daysUntil,
  eventCapacity,
  eventSold,
  formatEventDate,
  formatMoney,
  getEvent,
  occupancyPercent,
} from "@/data/events";
import { useRole } from "@/lib/role";
import {
  MAX_TICKETS_PER_ORDER,
  RESERVATION_HOLD_MINUTES,
  ZONE_BASE_PRICE,
  calculateTicketPrice,
  validateBookingEligibility,
  type Zone,
} from "@/utils/businessLogic";

export const Route = createFileRoute("/eventos/$eventId")({
  loader: ({ params }) => {
    const event = getEvent(params.eventId);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Evento no disponible | EventHub Javeriana" }, { name: "robots", content: "noindex" }],
      };
    }
    const { event } = loaderData;
    const description = `${event.description} ${formatEventDate(event.date)} en ${event.venue}.`;
    return {
      meta: [
        { title: `${event.title} | EventHub Javeriana` },
        { name: "description", content: description },
        { property: "og:title", content: `${event.title} | EventHub Javeriana` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Reserva,
});

function HoldTimer({ active, onExpire }: { active: boolean; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(RESERVATION_HOLD_MINUTES * 60);

  useEffect(() => {
    if (!active) {
      setSeconds(RESERVATION_HOLD_MINUTES * 60);
      return;
    }
    const id = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(id);
          onExpire();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, onExpire]);

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const pct = (seconds / (RESERVATION_HOLD_MINUTES * 60)) * 100;

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" /> Tiempo para completar el pago
        </span>
        <span className="font-display font-semibold tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(rest).padStart(2, "0")}
        </span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${pct < 25 ? "bg-destructive" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Reserva() {
  const { event } = Route.useLoaderData();
  const { role, userAge, setUserAge } = useRole();

  const [zone, setZone] = useState<Zone>("GENERAL");
  const [quantity, setQuantity] = useState(2);
  const [coupon, setCoupon] = useState("");
  const [holding, setHolding] = useState(false);

  const selectedZone = event.zones.find((item) => item.zone === zone)!;
  const remainingZoneSeats = selectedZone.capacity - selectedZone.sold;
  const days = daysUntil(event.date);

  const eligibility = useMemo(
    () =>
      validateBookingEligibility({
        userAge,
        minimumAge: event.minimumAge,
        requestedTickets: quantity,
        remainingZoneSeats,
        totalCapacity: eventCapacity(event),
        totalOccupied: eventSold(event),
      }),
    [userAge, event, quantity, remainingZoneSeats],
  );

  const pricing = useMemo(
    () => calculateTicketPrice({ zone, quantity, daysUntilEvent: days, couponCode: coupon }),
    [zone, quantity, days, coupon],
  );

  const isStudent = role === "ESTUDIANTE" || role === "ADMIN";
  const canReserve = isStudent && eligibility.eligible && pricing.valid;

  const disabledReason = !isStudent
    ? "Inicia sesión como Estudiante para reservar boletos"
    : !pricing.valid
      ? pricing.errors[0]
      : !eligibility.eligible
        ? eligibility.errors[0]
        : "Confirmar la reserva";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a la cartelera
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
            <img
              src={event.image}
              alt={event.title}
              width={1024}
              height={640}
              className="h-64 w-full object-cover"
            />
            <div className="space-y-3 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{event.category}</Badge>
                <Badge variant="outline">
                  {event.minimumAge > 0 ? `Mayores de ${event.minimumAge}` : "Todo público"}
                </Badge>
                {eligibility.lastChanceMode && (
                  <Badge className="bg-warning text-warning-foreground">Últimos cupos</Badge>
                )}
              </div>
              <h1 className="text-2xl font-semibold">{event.title}</h1>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <p className="text-sm text-muted-foreground">
                {formatEventDate(event.date)} · {event.time} · {event.venue}
              </p>
              <OccupancyBar
                percent={occupancyPercent(event)}
                label={`${eventSold(event)} / ${eventCapacity(event)} boletos vendidos`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Mapa de zonas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona una zona para ver el desglose del precio en tiempo real.
            </p>
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <div className="mb-4 rounded-md bg-primary py-2 text-center text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                Escenario
              </div>
              <div className="space-y-3">
                {event.zones.map((item) => {
                  const free = item.capacity - item.sold;
                  const active = item.zone === zone;
                  return (
                    <button
                      key={item.zone}
                      type="button"
                      onClick={() => setZone(item.zone)}
                      aria-pressed={active}
                      disabled={free === 0}
                      title={free === 0 ? "Zona agotada" : `Quedan ${free} cupos`}
                      className={`w-full rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "border-accent bg-accent/15"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-display font-semibold">
                          {formatMoney(ZONE_BASE_PRICE[item.zone])}
                        </span>
                      </div>
                      <div className="mt-2">
                        <OccupancyBar
                          percent={Math.round((item.sold / item.capacity) * 100)}
                          label={free === 0 ? "Agotado" : `Quedan ${free} cupos`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Ticket className="size-5 text-accent" /> Desglose en tiempo real
            </h2>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Cantidad de boletos</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((value) => Math.max(value - 1, 1))}
                    disabled={quantity <= 1}
                    title={quantity <= 1 ? "Mínimo 1 boleto" : "Quitar un boleto"}
                    aria-label="Quitar un boleto"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-12 text-center font-display text-lg font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((value) => Math.min(value + 1, MAX_TICKETS_PER_ORDER))}
                    disabled={quantity >= eligibility.maxTicketsAllowed}
                    title={
                      quantity >= MAX_TICKETS_PER_ORDER
                        ? `Has alcanzado el límite máximo de ${MAX_TICKETS_PER_ORDER} boletos`
                        : quantity >= eligibility.maxTicketsAllowed
                          ? `Máximo permitido ahora: ${eligibility.maxTicketsAllowed} boletos`
                          : "Agregar un boleto"
                    }
                    aria-label="Agregar un boleto"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Máximo permitido: {eligibility.maxTicketsAllowed}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edad">Tu edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={userAge}
                    onChange={(e) => setUserAge(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cupon">Cupón</Label>
                  <Input
                    id="cupon"
                    value={coupon}
                    placeholder="JAVERIANA10"
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                </div>
              </div>

              <dl className="space-y-2 border-t border-border pt-4 text-sm">
                <Row label={`Precio base (${selectedZone.label})`} value={formatMoney(ZONE_BASE_PRICE[zone])} />
                <Row
                  label={`Subtotal × ${quantity}`}
                  value={pricing.breakdown ? formatMoney(pricing.breakdown.subtotal) : "—"}
                />
                {pricing.breakdown && pricing.breakdown.volumeDiscountRate > 0 && (
                  <Row
                    label={`Descuento por volumen (${Math.round(pricing.breakdown.volumeDiscountRate * 100)}%)`}
                    value={`- ${formatMoney(pricing.breakdown.volumeDiscountAmount)}`}
                    tone="text-success"
                  />
                )}
                {pricing.breakdown && pricing.breakdown.earlyBirdRate > 0 && (
                  <Row
                    label="Reserva anticipada (5%)"
                    value={`- ${formatMoney(pricing.breakdown.earlyBirdAmount)}`}
                    tone="text-success"
                  />
                )}
                {pricing.breakdown && pricing.breakdown.couponRate > 0 && (
                  <Row
                    label={`Cupón (${Math.round(pricing.breakdown.couponRate * 100)}%)`}
                    value={`- ${formatMoney(pricing.breakdown.couponAmount)}`}
                    tone="text-success"
                  />
                )}
                <Row
                  label="Tarifa de servicio"
                  value={pricing.breakdown ? formatMoney(pricing.breakdown.serviceFee) : "—"}
                />
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="font-medium">Total a pagar</dt>
                  <dd className="font-display text-xl font-semibold">
                    {pricing.breakdown ? formatMoney(pricing.breakdown.total) : "—"}
                  </dd>
                </div>
              </dl>

              {(pricing.errors.length > 0 || eligibility.errors.length > 0) && (
                <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
                  {[...pricing.errors, ...eligibility.errors].map((message) => (
                    <li key={message} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      {message}
                    </li>
                  ))}
                </ul>
              )}

              {eligibility.lastChanceMode && (
                <p className="rounded-lg border border-warning/50 bg-warning/15 p-3 text-xs">
                  {eligibility.messages[0]}
                </p>
              )}

              {holding && (
                <HoldTimer
                  active={holding}
                  onExpire={() => {
                    setHolding(false);
                    toast.error("Reserva expirada", {
                      description: `No se confirmó el pago en ${RESERVATION_HOLD_MINUTES} minutos. Los cupos fueron liberados.`,
                    });
                  }}
                />
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canReserve}
                title={disabledReason}
                onClick={() => {
                  if (!holding) {
                    setHolding(true);
                    toast.success("Reserva temporal creada", {
                      description: `Tienes ${RESERVATION_HOLD_MINUTES} minutos para completar el pago.`,
                    });
                    return;
                  }
                  setHolding(false);
                  toast.success("¡Reserva confirmada!", {
                    description: `${quantity} boleto(s) en ${selectedZone.label} por ${
                      pricing.breakdown ? formatMoney(pricing.breakdown.total) : ""
                    }.`,
                  });
                }}
              >
                {holding ? "Confirmar pago" : "Bloquear cupos y reservar"}
              </Button>

              {!isStudent && (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  Estás explorando como Visitante. Cambia el rol a Estudiante en la barra superior para
                  reservar.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={tone ?? ""}>{value}</dd>
    </div>
  );
}
