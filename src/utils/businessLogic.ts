/**
 * EventHub Javeriana — Lógica de negocio pura.
 *
 * Todas las funciones de este archivo son deterministas, no dependen de React,
 * del DOM ni de la fecha actual del sistema (el "ahora" siempre se recibe como
 * parámetro). Están pensadas para pruebas unitarias / de caja blanca.
 */

/* ------------------------------------------------------------------ */
/* Tipos y constantes                                                  */
/* ------------------------------------------------------------------ */

export type Zone = "VIP" | "PREFERENCIAL" | "GENERAL";

export const ZONE_BASE_PRICE: Record<Zone, number> = {
  VIP: 100,
  PREFERENCIAL: 75,
  GENERAL: 50,
};

export const SERVICE_FEE = 5;
export const MAX_TICKETS_PER_ORDER = 10;
export const EARLY_BIRD_MIN_DAYS = 15;
export const EARLY_BIRD_RATE = 0.05;
export const LAST_CHANCE_OCCUPANCY = 0.9;
export const LAST_CHANCE_MAX_TICKETS = 2;
export const CRITICAL_OCCUPANCY = 0.85;
export const RESERVATION_HOLD_MINUTES = 15;
export const PROMO_DAYS_BEFORE = 3;
export const PROMO_MIN_SOLD_RATE = 0.3;

/** Cupones soportados por el motor de precios (código -> porcentaje). */
export const COUPONS: Record<string, number> = {
  JAVERIANA10: 0.1,
  CULTURA15: 0.15,
  BIENESTAR20: 0.2,
};

export interface PriceInput {
  zone: Zone;
  quantity: number;
  /** Días de anticipación entre la compra y la fecha del evento. */
  daysUntilEvent: number;
  couponCode?: string | null;
}

export interface PriceBreakdown {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  volumeDiscountRate: number;
  volumeDiscountAmount: number;
  earlyBirdRate: number;
  earlyBirdAmount: number;
  couponRate: number;
  couponAmount: number;
  totalDiscount: number;
  serviceFee: number;
  total: number;
}

export interface PriceResult {
  valid: boolean;
  errors: string[];
  messages: string[];
  breakdown: PriceBreakdown | null;
}

export interface EligibilityInput {
  userAge: number;
  /** Clasificación del evento (edad mínima permitida). */
  minimumAge: number;
  requestedTickets: number;
  /** Cupos restantes en la zona seleccionada. */
  remainingZoneSeats: number;
  totalCapacity: number;
  totalOccupied: number;
}

export interface EligibilityResult {
  eligible: boolean;
  errors: string[];
  messages: string[];
  occupancyRate: number;
  lastChanceMode: boolean;
  maxTicketsAllowed: number;
}

export type AlertLevel = "info" | "warning" | "critical";

export interface EventAlert {
  code:
    | "RESERVATION_EXPIRED"
    | "RESERVATION_ACTIVE"
    | "CRITICAL_OCCUPANCY"
    | "AUTO_PROMOTION";
  level: AlertLevel;
  message: string;
}

export interface AlertsInput {
  /** Minutos transcurridos desde que se creó la reserva temporal. */
  minutesSinceReservation: number;
  reservationConfirmed: boolean;
  ticketsHeld: number;
  totalCapacity: number;
  ticketsSold: number;
  daysUntilEvent: number;
}

export interface AlertsResult {
  reservationStatus: "CONFIRMADA" | "ACTIVA" | "EXPIRADA";
  releasedSeats: number;
  occupancyRate: number;
  soldRate: number;
  specialDiscountFlag: boolean;
  alerts: EventAlert[];
}

/* ------------------------------------------------------------------ */
/* Utilidades internas                                                 */
/* ------------------------------------------------------------------ */

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getVolumeDiscountRate(quantity: number): number {
  if (quantity > 8) return 0.18;
  if (quantity >= 5) return 0.1;
  return 0;
}

function isInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

/* ------------------------------------------------------------------ */
/* Funcionalidad 1: motor dinámico de precios y descuentos             */
/* ------------------------------------------------------------------ */

export function calculateTicketPrice(input: PriceInput): PriceResult {
  const errors: string[] = [];
  const messages: string[] = [];
  const { zone, quantity, daysUntilEvent } = input;

  const unitPrice = ZONE_BASE_PRICE[zone];
  if (unitPrice === undefined) {
    errors.push(`Zona no reconocida: ${String(zone)}.`);
  }
  if (!isInteger(quantity) || quantity <= 0) {
    errors.push("La cantidad de boletos debe ser un número entero mayor a 0.");
  }
  if (isInteger(quantity) && quantity > MAX_TICKETS_PER_ORDER) {
    errors.push(
      `Has alcanzado el límite máximo de ${MAX_TICKETS_PER_ORDER} boletos por transacción.`,
    );
  }
  if (!Number.isFinite(daysUntilEvent) || daysUntilEvent < 0) {
    errors.push("Los días de anticipación no pueden ser negativos.");
  }

  const couponCode = (input.couponCode ?? "").trim().toUpperCase();
  let couponRate = 0;
  if (couponCode.length > 0) {
    if (COUPONS[couponCode] !== undefined) {
      couponRate = COUPONS[couponCode];
      messages.push(
        `Cupón ${couponCode} aplicado: ${Math.round(couponRate * 100)}% de descuento.`,
      );
    } else {
      errors.push(`El cupón ${couponCode} no es válido.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, messages, breakdown: null };
  }

  const subtotal = roundMoney(unitPrice * quantity);

  const volumeDiscountRate = getVolumeDiscountRate(quantity);
  const volumeDiscountAmount = roundMoney(subtotal * volumeDiscountRate);
  if (volumeDiscountRate > 0) {
    messages.push(
      `Descuento por volumen (${quantity} boletos): ${Math.round(volumeDiscountRate * 100)}%.`,
    );
  }

  const earlyBirdRate = daysUntilEvent > EARLY_BIRD_MIN_DAYS ? EARLY_BIRD_RATE : 0;
  const earlyBirdAmount = roundMoney(subtotal * earlyBirdRate);
  if (earlyBirdRate > 0) {
    messages.push("Descuento por reserva anticipada: 5% adicional.");
  }

  const couponAmount = roundMoney(subtotal * couponRate);
  const totalDiscount = roundMoney(
    volumeDiscountAmount + earlyBirdAmount + couponAmount,
  );
  const total = roundMoney(Math.max(subtotal - totalDiscount, 0) + SERVICE_FEE);

  messages.push(`Tarifa de servicio fija: $${SERVICE_FEE} por transacción.`);

  return {
    valid: true,
    errors,
    messages,
    breakdown: {
      unitPrice,
      quantity,
      subtotal,
      volumeDiscountRate,
      volumeDiscountAmount,
      earlyBirdRate,
      earlyBirdAmount,
      couponRate,
      couponAmount,
      totalDiscount,
      serviceFee: SERVICE_FEE,
      total,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Funcionalidad 2: aforo y asignación de cupos                        */
/* ------------------------------------------------------------------ */

export function validateBookingEligibility(
  input: EligibilityInput,
): EligibilityResult {
  const errors: string[] = [];
  const messages: string[] = [];
  const {
    userAge,
    minimumAge,
    requestedTickets,
    remainingZoneSeats,
    totalCapacity,
    totalOccupied,
  } = input;

  const occupancyRate =
    totalCapacity > 0
      ? Math.min(Math.max(totalOccupied / totalCapacity, 0), 1)
      : 0;
  const lastChanceMode = occupancyRate > LAST_CHANCE_OCCUPANCY;

  let maxTicketsAllowed = Math.min(MAX_TICKETS_PER_ORDER, Math.max(remainingZoneSeats, 0));
  if (lastChanceMode) {
    maxTicketsAllowed = Math.min(maxTicketsAllowed, LAST_CHANCE_MAX_TICKETS);
    messages.push(
      `Modo 'Últimos Cupos' activo (ocupación ${Math.round(occupancyRate * 100)}%): máximo ${LAST_CHANCE_MAX_TICKETS} boletos por usuario.`,
    );
  }

  if (totalCapacity <= 0) {
    errors.push("El aforo total del evento no está configurado.");
  }
  if (!isInteger(userAge) || userAge < 0) {
    errors.push("La edad del usuario no es válida.");
  } else if (userAge < minimumAge) {
    errors.push(
      `Este evento está clasificado para mayores de ${minimumAge} años.`,
    );
  }
  if (!isInteger(requestedTickets) || requestedTickets <= 0) {
    errors.push("Debes solicitar al menos 1 boleto.");
  }
  if (isInteger(requestedTickets) && requestedTickets > MAX_TICKETS_PER_ORDER) {
    errors.push(
      `Has alcanzado el límite máximo de ${MAX_TICKETS_PER_ORDER} boletos por transacción.`,
    );
  }
  if (isInteger(requestedTickets) && requestedTickets > remainingZoneSeats) {
    errors.push(
      `Solo quedan ${Math.max(remainingZoneSeats, 0)} cupos disponibles en esta zona.`,
    );
  }
  if (
    lastChanceMode &&
    isInteger(requestedTickets) &&
    requestedTickets > LAST_CHANCE_MAX_TICKETS
  ) {
    errors.push(
      `Por alta demanda solo puedes reservar ${LAST_CHANCE_MAX_TICKETS} boletos.`,
    );
  }

  if (errors.length === 0) {
    messages.push(
      `Reserva válida: ${requestedTickets} boleto(s) sobre ${remainingZoneSeats} cupos disponibles.`,
    );
  }

  return {
    eligible: errors.length === 0,
    errors,
    messages,
    occupancyRate: roundMoney(occupancyRate),
    lastChanceMode,
    maxTicketsAllowed: Math.max(maxTicketsAllowed, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Funcionalidad 3: alertas y notificaciones dinámicas                 */
/* ------------------------------------------------------------------ */

export function evaluateEventAlerts(input: AlertsInput): AlertsResult {
  const {
    minutesSinceReservation,
    reservationConfirmed,
    ticketsHeld,
    totalCapacity,
    ticketsSold,
    daysUntilEvent,
  } = input;

  const alerts: EventAlert[] = [];

  const expired =
    !reservationConfirmed && minutesSinceReservation >= RESERVATION_HOLD_MINUTES;
  const reservationStatus: AlertsResult["reservationStatus"] = reservationConfirmed
    ? "CONFIRMADA"
    : expired
      ? "EXPIRADA"
      : "ACTIVA";

  const releasedSeats = expired ? Math.max(ticketsHeld, 0) : 0;

  if (expired) {
    alerts.push({
      code: "RESERVATION_EXPIRED",
      level: "warning",
      message: `Reserva expirada tras ${RESERVATION_HOLD_MINUTES} minutos sin confirmar. Se liberaron ${releasedSeats} cupo(s).`,
    });
  } else if (!reservationConfirmed) {
    const remaining = Math.max(
      RESERVATION_HOLD_MINUTES - minutesSinceReservation,
      0,
    );
    alerts.push({
      code: "RESERVATION_ACTIVE",
      level: "info",
      message: `Reserva temporal activa: quedan ${remaining} minuto(s) para confirmar el pago.`,
    });
  }

  const occupancyRate =
    totalCapacity > 0 ? Math.min(Math.max(ticketsSold / totalCapacity, 0), 1) : 0;
  const soldRate = occupancyRate;

  if (occupancyRate >= CRITICAL_OCCUPANCY) {
    alerts.push({
      code: "CRITICAL_OCCUPANCY",
      level: "critical",
      message: `Ocupación crítica: el evento alcanzó el ${Math.round(occupancyRate * 100)}% de su capacidad.`,
    });
  }

  const specialDiscountFlag =
    daysUntilEvent <= PROMO_DAYS_BEFORE && soldRate < PROMO_MIN_SOLD_RATE;

  if (specialDiscountFlag) {
    alerts.push({
      code: "AUTO_PROMOTION",
      level: "warning",
      message: `Faltan ${daysUntilEvent} día(s) y solo se vendió el ${Math.round(soldRate * 100)}% del aforo: se activó la bandera 'Descuento Especial'.`,
    });
  }

  return {
    reservationStatus,
    releasedSeats,
    occupancyRate: roundMoney(occupancyRate),
    soldRate: roundMoney(soldRate),
    specialDiscountFlag,
    alerts,
  };
}
