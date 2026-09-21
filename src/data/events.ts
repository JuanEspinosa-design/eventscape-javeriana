import teatro from "@/assets/event-teatro.jpg";
import concierto from "@/assets/event-concierto.jpg";
import taller from "@/assets/event-taller.jpg";
import orquesta from "@/assets/event-orquesta.jpg";
import type { Zone } from "@/utils/businessLogic";

export type Category = "Teatro" | "Conciertos" | "Talleres";

export interface ZoneAvailability {
  zone: Zone;
  label: string;
  capacity: number;
  sold: number;
}

export interface CampusEvent {
  id: string;
  title: string;
  category: Category;
  venue: string;
  /** Fecha del evento en formato ISO (yyyy-mm-dd). */
  date: string;
  time: string;
  image: string;
  description: string;
  minimumAge: number;
  featured: boolean;
  zones: ZoneAvailability[];
}

/** Base de referencia usada para calcular días de anticipación de forma estable. */
export const TODAY = "2026-09-21";

export const EVENTS: CampusEvent[] = [
  {
    id: "macbeth-javeriano",
    title: "Macbeth Javeriano",
    category: "Teatro",
    venue: "Teatro Julio Mario — Bloque B",
    date: "2026-10-18",
    time: "7:00 p.m.",
    image: teatro,
    description:
      "Montaje del grupo de teatro universitario con puesta en escena contemporánea y música en vivo.",
    minimumAge: 16,
    featured: true,
    zones: [
      { zone: "VIP", label: "Platea VIP", capacity: 60, sold: 41 },
      { zone: "PREFERENCIAL", label: "Preferencial", capacity: 140, sold: 88 },
      { zone: "GENERAL", label: "General", capacity: 300, sold: 151 },
    ],
  },
  {
    id: "festival-indie",
    title: "Festival Indie Campus",
    category: "Conciertos",
    venue: "Plazoleta Central",
    date: "2026-09-26",
    time: "5:30 p.m.",
    image: concierto,
    description:
      "Seis bandas estudiantiles, food trucks y zona de descanso. Evento al aire libre con aforo controlado.",
    minimumAge: 18,
    featured: false,
    zones: [
      { zone: "VIP", label: "Zona Frontal VIP", capacity: 80, sold: 78 },
      { zone: "PREFERENCIAL", label: "Preferencial", capacity: 220, sold: 205 },
      { zone: "GENERAL", label: "General", capacity: 400, sold: 358 },
    ],
  },
  {
    id: "taller-guion",
    title: "Taller de Guion y Narrativa",
    category: "Talleres",
    venue: "Edificio Gerardo Arango — Salón 402",
    date: "2026-09-23",
    time: "10:00 a.m.",
    image: taller,
    description:
      "Sesión práctica de escritura audiovisual con retroalimentación personalizada. Cupos muy limitados.",
    minimumAge: 0,
    featured: false,
    zones: [
      { zone: "VIP", label: "Mesa Taller", capacity: 12, sold: 2 },
      { zone: "PREFERENCIAL", label: "Participante", capacity: 30, sold: 6 },
      { zone: "GENERAL", label: "Oyente", capacity: 40, sold: 8 },
    ],
  },
  {
    id: "gala-sinfonica",
    title: "Gala Sinfónica de Aniversario",
    category: "Conciertos",
    venue: "Auditorio Félix Restrepo",
    date: "2026-11-07",
    time: "8:00 p.m.",
    image: orquesta,
    description:
      "Orquesta sinfónica y coro universitario interpretando repertorio clásico latinoamericano.",
    minimumAge: 12,
    featured: false,
    zones: [
      { zone: "VIP", label: "Palco VIP", capacity: 50, sold: 12 },
      { zone: "PREFERENCIAL", label: "Preferencial", capacity: 180, sold: 44 },
      { zone: "GENERAL", label: "General", capacity: 350, sold: 70 },
    ],
  },
];

export function getEvent(id: string): CampusEvent | undefined {
  return EVENTS.find((event) => event.id === id);
}

export function eventCapacity(event: CampusEvent): number {
  return event.zones.reduce((total, zone) => total + zone.capacity, 0);
}

export function eventSold(event: CampusEvent): number {
  return event.zones.reduce((total, zone) => total + zone.sold, 0);
}

export function occupancyPercent(event: CampusEvent): number {
  const capacity = eventCapacity(event);
  return capacity === 0 ? 0 : Math.round((eventSold(event) / capacity) * 100);
}

export function remainingSeats(event: CampusEvent): number {
  return eventCapacity(event) - eventSold(event);
}

/** Días calendario entre `from` y la fecha del evento. */
export function daysUntil(dateIso: string, from: string = TODAY): number {
  const ms = new Date(`${dateIso}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.max(Math.round(ms / 86_400_000), 0);
}

export function formatEventDate(dateIso: string): string {
  return new Date(`${dateIso}T12:00:00Z`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
