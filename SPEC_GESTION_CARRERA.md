# Especificación: Módulo de Gestión de Carrera en Circuito

## Contexto

Panel de administradores conectado a Supabase (base de datos compartida con la app pública de resultados). Hasta ahora la gestión se hacía en papel en el circuito; este año se digitaliza con un PC en el circuito. Se necesita imprimir documentos en una impresora portátil.

---

## Funcionalidades a Implementar

---

### 1. Gestión de Pilotos Wildkart

**Qué son:** Pilotos sustitutos que no existen aún en la base de datos. Reemplazan a pilotos del campeonato que no han podido asistir a una carrera concreta.

**Requisitos:**
- Formulario para crear un piloto wildkart con los campos mínimos necesarios (nombre, apellidos, número de kart que ocupan, categoría).
- El wildkart se asocia a la sesión/carrera concreta (no es un piloto permanente del campeonato).
- En la sesión/carrera, el piloto original queda marcado como "ausente" y el wildkart ocupa su plaza (kart, posición de parrilla, etc.).
- Los resultados del wildkart se guardan separados de los del campeonato (no afectan al ranking general del campeonato).
- Debe poder listarse y editarse los wildkarts creados para esa jornada.

**Tablas Supabase sugeridas (consultar esquema actual y adaptar):**
```sql
-- Si no existe, crear:
wildkart_pilots (
  id uuid primary key,
  event_id uuid references events(id),
  replaced_pilot_id uuid references pilots(id),  -- piloto al que sustituye
  name text,
  surname text,
  kart_number int,
  category text,
  created_at timestamptz default now()
)
```

---

### 2. Clasificación (Qualifying)

**Flujo:**
1. Se registran los tiempos de vuelta de cada piloto durante la sesión de clasificación.
2. Se guarda la vuelta rápida de cada piloto (mejor tiempo).
3. Se ordena de menor a mayor tiempo → esa es la **parrilla de Carrera 1**.

**Requisitos UI:**
- Tabla editable con: Posición | Piloto | Kart | Tiempo (formato mm:ss.mmm)
- Poder introducir/editar tiempos manualmente (entrada desde teclado en el circuito).
- Botón "Calcular parrilla" que ordena automáticamente por tiempo.
- Indicar visualmente si algún piloto no tiene tiempo registrado (DNS / no clasificado).

**Parrilla Carrera 1:** resultado directo de la clasificación (1º sale primero).

**Parrilla Carrera 2:** igual que Carrera 1 pero los **10 primeros invierten su orden**:
- El 10º clasificado sale en el puesto 1 de parrilla.
- El 9º sale en el puesto 2.
- ...
- El 1º sale en el puesto 10.
- Del puesto 11 en adelante, el orden se mantiene igual que en clasificación.

Ejemplo con 15 pilotos:
```
Clasificación → Parrilla C2
Pos 1  → Parrilla 10
Pos 2  → Parrilla 9
Pos 3  → Parrilla 8
Pos 4  → Parrilla 7
Pos 5  → Parrilla 6
Pos 6  → Parrilla 5
Pos 7  → Parrilla 4
Pos 8  → Parrilla 3
Pos 9  → Parrilla 2
Pos 10 → Parrilla 1
Pos 11 → Parrilla 11  (sin cambio)
Pos 12 → Parrilla 12
...
```

---

### 3. Resultados de Carrera

- Para cada carrera (C1 y C2) se registra la posición final de cada piloto.
- Campos por piloto: Posición final | Piloto | Kart | Mejor vuelta | Vueltas completadas | Observaciones (DNF, DSQ, DNS...).
- Guardar en Supabase con referencia al evento y al tipo de carrera.

---

### 4. Generación de PDFs

Se necesita generar e imprimir los siguientes documentos. Deben tener un diseño limpio y legible (impresora portátil, posiblemente papel A4 o similar).

#### 4.1 PDF de Clasificación
Contenido:
- Cabecera: nombre del evento, fecha, categoría, logo del campeonato si existe.
- Tabla: Pos | Piloto | Kart | Tiempo | Diferencia con el 1º
- Pie: hora de generación del documento.

#### 4.2 PDF de Parrilla Carrera 1
Contenido:
- Cabecera: "PARRILLA CARRERA 1 – [Nombre Evento]"
- Tabla: Pos. Parrilla | Piloto | Kart
- Representación visual de la parrilla si es posible (filas de 2 en 2, lado izquierdo/derecho del circuito).

#### 4.3 PDF de Parrilla Carrera 2
- Igual que C1 pero con el orden invertido de los 10 primeros.
- Indicar visualmente que los 10 primeros tienen orden invertido.

#### 4.4 PDF de Resultados
- Un PDF por carrera O un PDF conjunto con ambas carreras.
- Tabla: Pos. Final | Piloto | Kart | Mejor vuelta | Vueltas | Estado (DNF, etc.)
- Puntos obtenidos si el sistema de puntuación ya está implementado.

**Librería recomendada para PDF:** `@react-pdf/renderer` (si el front es React) o `pdfkit` / `puppeteer` en el backend. Consultar qué stack usa el proyecto actual y elegir la más compatible.

---

## Consideraciones Técnicas

### Modo Offline / Conectividad en Circuito
- Los circuitos pueden tener mala cobertura. Valorar si se necesita modo offline con sincronización posterior, o si se garantiza WiFi en el circuito.
- Si se requiere offline: usar IndexedDB o localStorage para persistir datos localmente y sincronizar con Supabase cuando haya conexión.

### Permisos en Supabase
- Las operaciones de escritura de este módulo (wildkarts, clasificación, resultados) deben hacerse con el rol de administrador, no con el rol público.
- Verificar que las RLS (Row Level Security) policies de Supabase permiten escritura desde el panel admin.

### Impresión
- El PDF se genera en el navegador y se envía a la impresora portátil vía:
  - `window.print()` con CSS de impresión, o
  - descarga de PDF y apertura manual.
- Asegurarse de que el diseño del PDF funciona bien en papel A4 (o el formato que use la impresora portátil elegida).

---

## Flujo de Trabajo en el Circuito (UX sugerida)

```
1. Abrir panel admin en PC del circuito
2. Seleccionar evento del día
3. [Opcional] Registrar pilotos wildkart
4. Durante qualifying: ir introduciendo tiempos
5. Al terminar qualifying:
   → Calcular parrilla C1 y C2
   → Imprimir PDF clasificación + parrillas
6. Durante C1: registrar posiciones finales
   → Imprimir PDF resultados C1
7. Durante C2: ídem
   → Imprimir PDF resultados C2
8. Los datos quedan en Supabase y la app pública los muestra automáticamente
```

---

## Preguntas para Claude Code antes de implementar

1. ¿Cuál es el esquema actual de tablas en Supabase? (eventos, pilotos, resultados, categorías)
2. ¿El panel admin es React/Next.js u otro framework?
3. ¿Ya existe algún módulo de resultados parcialmente implementado?
4. ¿Hay un sistema de puntuación definido que deba reflejarse en los PDFs?
5. ¿Se necesita autenticación específica para este módulo o ya está cubierta?
