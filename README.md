# EventScape Javeriana

Título del Proyecto: EventHub Javeriana - Sistema de Gestión y Reserva de Eventos Culturales

Descripción del Prompt:

"Crea una aplicación web moderna, intuitiva y responsiva para la gestión y reserva de eventos culturales y académicos en el campus. La interfaz debe tener una estética profesional, limpia y accesible, utilizando una paleta de colores moderna (azul oscuro institucional, acentos en turquesa y fondos neutros claros) con Tailwind CSS, React, Vite y TypeScript.

---

1. ARQUITECTURA DEL CÓDIGO (Requerimiento para Pruebas de Caja Blanca)

Para facilitar el análisis de código fuente y la ejecución de pruebas unitarias/de caja blanca con Vitest/Jest:

- Toda la lógica de negocio pura DEBE quedar completamente aislada en funciones independientes dentro del archivo `src/utils/businessLogic.ts`.

- Ninguna regla de negocio, cálculo numérico o validación lógica debe estar mezclada dentro de los componentes visuales de React.

- Cada función debe recibir parámetros claros, ser determinista y retornar objetos estructurados con resultados y mensajes de validación explicativos.

---

2. ROLES DE USUARIO Y ACTORES

1. Usuario Visitante: Puede explorar la cartelera de eventos, filtrar por categoría o fecha, ver detalles de la agenda y consultar disponibilidad general sin iniciar sesión.

2. Usuario Registrado / Estudiante: Puede seleccionar zonas/asientos, aplicar cupones de descuento, calcular tarifas dinámicas, procesar reservas, cancelar boletos y revisar su historial de tickets.

3. Administrador del Evento: Puede supervisar el aforo general, ajustar políticas de precios, liberar cupos bloqueados y monitorear el panel de alertas automáticas.

---

3. FUNCIONALIDADES CON LÓGICA DE NEGOCIO (Tres Funcionalidades Principales No-CRUD)

Deben crearse funciones puras dedicadas para cada una de estas 3 funcionalidades en `src/utils/businessLogic.ts`:

Funcionalidad 1: Motor de Cálculo Dinámico de Precios y Descuentos (`calculateTicketPrice`)

- Actor: Usuario Registrado.

- Lógica / Reglas de Negocio:

  - Precio base según la zona elegida (VIP: $100, Preferencial: $75, General: $50).

  - Descuento por volumen: Si el usuario compra entre 5 y 8 boletos, aplica un 10% de descuento sobre el total. Si compra más de 8 boletos, aplica un 18%.

  - Descuento por reserva anticipada: Si la compra se hace con más de 15 días de anticipación a la fecha del evento, aplica un 5% adicional.

  - Recargo por tarifa de servicio: Cargo fijo de $5 por transacción.

  - Límite estricto: Ninguna transacción puede superar los 10 boletos en una sola orden.

Funcionalidad 2: Validador de Restricciones de Aforo y Asignación de Cupos (`validateBookingEligibility`)

- Actor: Usuario Registrado / Administrador.

- Lógica / Reglas de Negocio:

  - Verificación de edad mínima según la clasificación del evento (ej. Mayores de 18 años).

  - Validar disponibilidad: Si los boletos solicitados superan los cupos restantes de la zona, la reserva debe ser rechazada.

  - Bloqueo dinámico por sobre-reserva: Si la ocupación total del evento supera el 90%, el sistema entra en modo 'Últimos Cupos' y solo permite comprar un máximo de 2 boletos por usuario.

Funcionalidad 3: Sistema de Generación de Alertas y Notificaciones Dinámicas (`evaluateEventAlerts`)

- Actor: Administrador / Sistema.

- Lógica / Reglas de Negocio:

  - Alerta de Vencimiento de Reserva: Si una reserva temporal no es confirmada dentro de 15 minutos, se marca automáticamente como 'Expirada' y los cupos se liberan.

  - Alerta de Ocupación Crítica: Notifica al Administrador cuando un evento alcanza el 85% de su capacidad total.

  - Alerta de Promoción Automática: Si a 3 días del evento se ha vendido menos del 30% del aforo, se activa automáticamente una bandera de 'Descuento Especial'.

---

4. ESTRUCTURA DE LA APLICACIÓN Y NAVEGACIÓN (UI / UX)

Navegación / Header:

- Barra superior con Logo del sistema, buscador global de eventos y selector de rol rápido (Visitante / Estudiante / Administrador) para realizar pruebas.

Pantalla Principal (Cartelera & Inicio):

- Banner destacado con el 'Evento de la Semana' (con temporizador de cuenta regresiva).

- Barra de filtros combinados: Categoría (Teatro, Conciertos, Talleres), Fecha, Precio y Clasificación de edad.

- Grid de Eventos: Cards interactivas con imagen, indicador de aforo disponible (ej: 'Quedan 12 cupos') y etiqueta de estado.

Pantalla de Reserva y Seleccionador de Boletos:

- Vista detallada del evento con un mapa/diagrama interactivo de zonas (VIP, Preferencial, General).

- Panel lateral de Desglose en Tiempo Real: Muestra el cálculo dinámico paso a paso (Precio base, Descuento aplicado, Tarifa de servicio, Total a pagar) consumiendo directamente la Funcionalidad 1.

- Temporizador visual de 15 minutos para completar el pago de la reserva.

Pantalla de Dashboard / Panel Administrativo:

- Métrica visual de aforo y ventas por evento.

- Consola de Alertas e Incidentes en vivo (muestra las notificaciones activadas por la Funcionalidad 3).

Módulo Especial de Pruebas (Test Bench UI):

- Incluye un panel inferior o pestaña dedicada llamada 'Verificación de Reglas' donde cualquier usuario o evaluador pueda ingresar valores de entrada (ej: número de boletos, edad, ocupación) y ejecutar directamente las 3 funciones puras de `businessLogic.ts` para verificar visualmente los retornos y validaciones.

---

5. HEURÍSTICAS DE UX Y USABILIDAD (Nielsen)

- Visibilidad del estado del sistema: Notificaciones flotantes (Toasts), barras de progreso de aforo y temporizador de expiración visible.

- Prevención de errores: Botones deshabilitados si las entradas no cumplen con los límites, acompañados de Tooltips descriptivos (ej: 'Has alcanzado el límite máximo de 10 boletos').

- Consistencia y estándares: Diseño uniforme en todas las pantallas con Tailwind CSS, jerarquía visual clara y retroalimentación inmediata al usuario."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5ed58d06-f0aa-441d-a540-f77ee39389ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
