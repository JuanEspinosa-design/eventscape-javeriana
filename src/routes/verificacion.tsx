import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateTicketPrice,
  evaluateEventAlerts,
  validateBookingEligibility,
  type Zone,
} from "@/utils/businessLogic";

export const Route = createFileRoute("/verificacion")({
  head: () => ({
    meta: [
      { title: "Verificación de reglas | EventHub Javeriana" },
      {
        name: "description",
        content:
          "Banco de pruebas para ejecutar las funciones puras de precios, aforo y alertas con tus propios valores de entrada.",
      },
      { property: "og:title", content: "Verificación de reglas | EventHub Javeriana" },
      {
        property: "og:description",
        content: "Ejecuta y valida las reglas de negocio del sistema con entradas personalizadas.",
      },
    ],
  }),
  component: TestBench,
});

function ResultBox({ ok, data }: { ok: boolean; data: unknown }) {
  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {ok ? "Resultado válido" : "Resultado rechazado por las reglas"}
      </p>
      <pre className="overflow-x-auto rounded-md bg-background/70 p-3 text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function PriceTest() {
  const [zone, setZone] = useState<Zone>("VIP");
  const [quantity, setQuantity] = useState(6);
  const [days, setDays] = useState(20);
  const [coupon, setCoupon] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateTicketPrice> | null>(null);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="zone">Zona</Label>
          <select
            id="zone"
            value={zone}
            onChange={(event) => setZone(event.target.value as Zone)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="VIP">VIP ($100)</option>
            <option value="PREFERENCIAL">Preferencial ($75)</option>
            <option value="GENERAL">General ($50)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="qty">Cantidad de boletos</Label>
          <Input
            id="qty"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="days">Días de anticipación</Label>
          <Input
            id="days"
            type="number"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon">Cupón (opcional)</Label>
          <Input
            id="coupon"
            value={coupon}
            placeholder="JAVERIANA10"
            onChange={(event) => setCoupon(event.target.value)}
          />
        </div>
      </div>
      <Button
        className="mt-4"
        onClick={() => setResult(calculateTicketPrice({ zone, quantity, daysUntilEvent: days, couponCode: coupon }))}
      >
        Ejecutar calculateTicketPrice()
      </Button>
      {result && <ResultBox ok={result.valid} data={result} />}
    </div>
  );
}

function EligibilityTest() {
  const [age, setAge] = useState(20);
  const [minAge, setMinAge] = useState(18);
  const [tickets, setTickets] = useState(3);
  const [zoneSeats, setZoneSeats] = useState(15);
  const [capacity, setCapacity] = useState(500);
  const [occupied, setOccupied] = useState(460);
  const [result, setResult] = useState<ReturnType<typeof validateBookingEligibility> | null>(null);

  const fields = [
    { id: "age", label: "Edad del usuario", value: age, set: setAge },
    { id: "minAge", label: "Edad mínima del evento", value: minAge, set: setMinAge },
    { id: "tickets", label: "Boletos solicitados", value: tickets, set: setTickets },
    { id: "zoneSeats", label: "Cupos restantes en zona", value: zoneSeats, set: setZoneSeats },
    { id: "capacity", label: "Aforo total", value: capacity, set: setCapacity },
    { id: "occupied", label: "Ocupación actual", value: occupied, set: setOccupied },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type="number"
              value={field.value}
              onChange={(event) => field.set(Number(event.target.value))}
            />
          </div>
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={() =>
          setResult(
            validateBookingEligibility({
              userAge: age,
              minimumAge: minAge,
              requestedTickets: tickets,
              remainingZoneSeats: zoneSeats,
              totalCapacity: capacity,
              totalOccupied: occupied,
            }),
          )
        }
      >
        Ejecutar validateBookingEligibility()
      </Button>
      {result && <ResultBox ok={result.eligible} data={result} />}
    </div>
  );
}

function AlertsTest() {
  const [minutes, setMinutes] = useState(16);
  const [confirmed, setConfirmed] = useState(false);
  const [held, setHeld] = useState(4);
  const [capacity, setCapacity] = useState(500);
  const [sold, setSold] = useState(120);
  const [days, setDays] = useState(2);
  const [result, setResult] = useState<ReturnType<typeof evaluateEventAlerts> | null>(null);

  const fields = [
    { id: "minutes", label: "Minutos desde la reserva", value: minutes, set: setMinutes },
    { id: "held", label: "Cupos bloqueados", value: held, set: setHeld },
    { id: "capacity", label: "Aforo total", value: capacity, set: setCapacity },
    { id: "sold", label: "Boletos vendidos", value: sold, set: setSold },
    { id: "days", label: "Días para el evento", value: days, set: setDays },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type="number"
              value={field.value}
              onChange={(event) => field.set(Number(event.target.value))}
            />
          </div>
        ))}
        <div className="flex items-end">
          <Button variant={confirmed ? "default" : "outline"} onClick={() => setConfirmed((v) => !v)}>
            {confirmed ? "Reserva confirmada" : "Reserva sin confirmar"}
          </Button>
        </div>
      </div>
      <Button
        className="mt-4"
        onClick={() =>
          setResult(
            evaluateEventAlerts({
              minutesSinceReservation: minutes,
              reservationConfirmed: confirmed,
              ticketsHeld: held,
              totalCapacity: capacity,
              ticketsSold: sold,
              daysUntilEvent: days,
            }),
          )
        }
      >
        Ejecutar evaluateEventAlerts()
      </Button>
      {result && <ResultBox ok={result.alerts.every((a) => a.level !== "critical")} data={result} />}
    </div>
  );
}

function TestBench() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Verificación de Reglas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ejecuta directamente las tres funciones puras de <code>src/utils/businessLogic.ts</code> con los
        valores que quieras y revisa el objeto de retorno completo.
      </p>

      <Tabs defaultValue="precio" className="mt-6">
        <TabsList>
          <TabsTrigger value="precio">1. Precios</TabsTrigger>
          <TabsTrigger value="aforo">2. Aforo</TabsTrigger>
          <TabsTrigger value="alertas">3. Alertas</TabsTrigger>
        </TabsList>
        <TabsContent value="precio" className="rounded-xl border border-border bg-card p-5">
          <PriceTest />
        </TabsContent>
        <TabsContent value="aforo" className="rounded-xl border border-border bg-card p-5">
          <EligibilityTest />
        </TabsContent>
        <TabsContent value="alertas" className="rounded-xl border border-border bg-card p-5">
          <AlertsTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
