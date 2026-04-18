'use client';

type GridEntry = {
  grid_position: number;
  pilot_name: string;
};

interface GridVisualizerProps {
  entries: GridEntry[];
  title: string;
  invertedTopN?: number; // Indica cuántas posiciones están invertidas (ej: 10 para C2)
}

export default function GridVisualizer({ entries, title, invertedTopN = 0 }: GridVisualizerProps) {
  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No hay parrilla disponible. Primero completa la clasificación.
      </div>
    );
  }

  // Agrupar en filas de 2 (posiciones impares izquierda, pares derecha)
  const rows: { left: GridEntry | null; right: GridEntry | null }[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push({
      left: entries[i] || null,
      right: entries[i + 1] || null,
    });
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      {/* Vista visual de parrilla 2x2 */}
      <div className="max-w-md mx-auto mb-6">
        <div className="border-l-4 border-r-4 border-gray-300 dark:border-gray-600 px-2">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-3 mb-2">
              {/* Lado izquierdo */}
              <div className="flex-1">
                {row.left && (
                  <GridCell
                    entry={row.left}
                    isInverted={invertedTopN > 0 && row.left.grid_position <= invertedTopN}
                  />
                )}
              </div>
              {/* Lado derecho */}
              <div className="flex-1">
                {row.right && (
                  <GridCell
                    entry={row.right}
                    isInverted={invertedTopN > 0 && row.right.grid_position <= invertedTopN}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla resumen */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-3 w-20">Pos.</th>
              <th className="p-3">Piloto</th>
              {invertedTopN > 0 && <th className="p-3 w-24">Invertido</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isInverted = invertedTopN > 0 && entry.grid_position <= invertedTopN;
              return (
                <tr
                  key={entry.grid_position}
                  className={`border-t border-gray-100 dark:border-gray-700 ${
                    isInverted ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-gray-800 dark:text-white">
                    {entry.grid_position}
                  </td>
                  <td className="p-3 text-gray-800 dark:text-white">{entry.pilot_name}</td>
                  {invertedTopN > 0 && (
                    <td className="p-3">
                      {isInverted && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          Invertido
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridCell({ entry, isInverted }: { entry: GridEntry; isInverted: boolean }) {
  return (
    <div
      className={`p-2 rounded border text-center text-sm ${
        isInverted
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600'
          : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'
      }`}
    >
      <span className="font-bold text-gray-800 dark:text-white">P{entry.grid_position}</span>
      <span className="mx-1 text-gray-400">|</span>
      <span className="text-gray-700 dark:text-gray-300">{entry.pilot_name}</span>
    </div>
  );
}
