export type GridEntry = {
  pilot_id: string;
  pilot_name: string;
  pilot_number: number;
  grid_position: number;
  qualifying_time: string | null;
};

/**
 * Parrilla Carrera I: orden directo de clasificación (1º clasificado → 1º en parrilla).
 * Pilotos sin tiempo van al final en el orden en que aparecen.
 */
export function computeRace1Grid(
  qualifyingResults: { pilot_id: string; pilot_name: string; pilot_number: number; best_lap: string | null }[]
): GridEntry[] {
  const withTime = qualifyingResults
    .filter((r) => r.best_lap)
    .sort((a, b) => compareLapTimes(a.best_lap!, b.best_lap!));

  const withoutTime = qualifyingResults.filter((r) => !r.best_lap);

  return [...withTime, ...withoutTime].map((r, i) => ({
    pilot_id: r.pilot_id,
    pilot_name: r.pilot_name,
    pilot_number: r.pilot_number,
    grid_position: i + 1,
    qualifying_time: r.best_lap,
  }));
}

/**
 * Parrilla Carrera II: los 10 primeros de la parrilla C1 invierten su orden.
 * Del puesto 11 en adelante, el orden se mantiene igual.
 */
export function computeRace2Grid(race1Grid: GridEntry[]): GridEntry[] {
  const top10 = race1Grid.slice(0, 10).reverse();
  const rest = race1Grid.slice(10);

  return [...top10, ...rest].map((entry, i) => ({
    ...entry,
    grid_position: i + 1,
  }));
}

/**
 * Compara dos tiempos en formato mm:ss.mmm o ss.mmm.
 * Retorna negativo si a < b (a es más rápido).
 */
function compareLapTimes(a: string, b: string): number {
  return parseTimeToMs(a) - parseTimeToMs(b);
}

/**
 * Convierte un tiempo en formato "mm:ss.mmm" o "ss.mmm" a milisegundos.
 */
export function parseTimeToMs(time: string): number {
  const parts = time.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const [seconds, ms] = parts[1].split('.');
    return minutes * 60000 + parseInt(seconds, 10) * 1000 + parseInt(ms || '0', 10);
  }
  // Solo segundos (ss.mmm)
  const [seconds, ms] = time.split('.');
  return parseInt(seconds, 10) * 1000 + parseInt(ms || '0', 10);
}

/**
 * Calcula la diferencia con el tiempo del 1º clasificado, formateada como "+s.mmm".
 */
export function formatGap(timeMs: number, referenceMs: number): string {
  if (timeMs === referenceMs) return '';
  const diff = timeMs - referenceMs;
  const seconds = Math.floor(diff / 1000);
  const ms = diff % 1000;
  return `+${seconds}.${ms.toString().padStart(3, '0')}`;
}
