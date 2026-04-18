'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Race, Pilot, RaceResult } from '@/lib/supabase';
import { computeRace1Grid, computeRace2Grid, parseTimeToMs, formatGap } from '@/lib/grid-utils';
import Image from 'next/image';

type PilotTeamSeasonEntry = {
  pilot: Pilot;
};

type QualifyingRow = {
  pilot: Pilot;
  best_lap: string;
  position: number | null;
};

function sortRows(rowsToSort: QualifyingRow[]) {
  rowsToSort.sort((a, b) => {
    if (!a.best_lap && !b.best_lap) return 0;
    if (!a.best_lap) return 1;
    if (!b.best_lap) return -1;
    return parseTimeToMs(a.best_lap) - parseTimeToMs(b.best_lap);
  });
  rowsToSort.forEach((row, i) => {
    row.position = row.best_lap ? i + 1 : null;
  });
}

function computeCombinedBestTimes(rows1: QualifyingRow[], rows2: QualifyingRow[]): QualifyingRow[] {
  const allPilots = new Map<string, Pilot>();
  [...rows1, ...rows2].forEach((r) => allPilots.set(r.pilot.id, r.pilot));

  const combined: QualifyingRow[] = Array.from(allPilots.values()).map((pilot) => {
    const t1 = rows1.find((r) => r.pilot.id === pilot.id)?.best_lap || '';
    const t2 = rows2.find((r) => r.pilot.id === pilot.id)?.best_lap || '';
    let best = '';
    if (t1 && t2) {
      best = parseTimeToMs(t1) <= parseTimeToMs(t2) ? t1 : t2;
    } else {
      best = t1 || t2;
    }
    return { pilot, best_lap: best, position: null };
  });

  sortRows(combined);
  return combined;
}

function isValidTime(time: string) {
  if (!time) return true;
  return /^\d{1,2}:\d{2}\.\d{3}$/.test(time);
}

type QualifyingTableProps = {
  title: string;
  rows: QualifyingRow[];
  onTimeChange: (pilotId: string, value: string) => void;
  onSort: () => void;
  readonly?: boolean;
  showTandaColumn?: boolean;
  rows1?: QualifyingRow[];
};

function QualifyingTable({ title, rows, onTimeChange, onSort, readonly, showTandaColumn, rows1 }: QualifyingTableProps) {
  const firstTime = rows.find((r) => r.best_lap)?.best_lap;
  const firstTimeMs = firstTime ? parseTimeToMs(firstTime) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h2>
        {!readonly && (
          <button
            onClick={onSort}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Ordenar
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-3 w-12">Pos</th>
              <th className="p-3">Piloto</th>
              <th className="p-3 w-32">Tiempo</th>
              <th className="p-3 w-24">Dif</th>
              {showTandaColumn && <th className="p-3 w-20">Tanda</th>}
              <th className="p-3 w-16">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const timeMs = row.best_lap ? parseTimeToMs(row.best_lap) : 0;
              const gap = row.best_lap && firstTimeMs ? formatGap(timeMs, firstTimeMs) : '';
              const isInvalid = row.best_lap && !isValidTime(row.best_lap);

              let tandaLabel = '';
              if (showTandaColumn && row.best_lap && rows1) {
                const t1 = rows1.find((r) => r.pilot.id === row.pilot.id)?.best_lap || '';
                tandaLabel = t1 && row.best_lap === t1 ? 'T1' : 'T2';
                // if both are same value check which is actually min
                if (t1 && rows1) {
                  const t2Row = rows.find((r) => r.pilot.id === row.pilot.id);
                  const t2 = t2Row?.best_lap || '';
                  if (t1 && t2 && t1 !== t2) {
                    tandaLabel = parseTimeToMs(t1) <= parseTimeToMs(t2) ? 'T1' : 'T2';
                  } else if (t1) {
                    tandaLabel = 'T1';
                  } else {
                    tandaLabel = 'T2';
                  }
                }
              }

              return (
                <tr
                  key={row.pilot.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 text-gray-800 dark:text-white font-semibold">
                    {row.position || '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      {row.pilot.avatar_url ? (
                        <Image
                          src={row.pilot.avatar_url}
                          alt={row.pilot.name}
                          className="w-7 h-7 rounded-full object-cover"
                          width={28}
                          height={28}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white text-xs">
                          {row.pilot.name.charAt(0)}
                        </div>
                      )}
                      <span className="truncate max-w-[120px]">{row.pilot.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {readonly ? (
                      <span className="text-gray-800 dark:text-white font-mono">
                        {row.best_lap || '-'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={row.best_lap}
                        onChange={(e) => onTimeChange(row.pilot.id, e.target.value)}
                        placeholder="00:00.000"
                        className={`w-28 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-mono text-sm ${
                          isInvalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    )}
                  </td>
                  <td className="p-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {gap}
                  </td>
                  {showTandaColumn && (
                    <td className="p-3">
                      {row.best_lap && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          tandaLabel === 'T1'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {tandaLabel}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="p-3">
                    {!row.best_lap && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        DNS
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClasificacionPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');

  const [rows1, setRows1] = useState<QualifyingRow[]>([]);
  const [rows2, setRows2] = useState<QualifyingRow[]>([]);
  const [q1SessionId, setQ1SessionId] = useState('');
  const [q2SessionId, setQ2SessionId] = useState('');
  const [race1SessionId, setRace1SessionId] = useState('');
  const [race2SessionId, setRace2SessionId] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gridsGenerated, setGridsGenerated] = useState(false);

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));

    supabase.from('session').select('id, name').then(({ data }) => {
      if (data) {
        const q1 = data.find((s) => s.name === 'Clasificación 1');
        const q2 = data.find((s) => s.name === 'Clasificación 2');
        const carrera1 = data.find((s) => s.name === 'Carrera I');
        const carrera2 = data.find((s) => s.name === 'Carrera II');
        if (q1) setQ1SessionId(q1.id);
        if (q2) setQ2SessionId(q2.id);
        if (carrera1) setRace1SessionId(carrera1.id);
        if (carrera2) setRace2SessionId(carrera2.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedRace || !selectedLeague || !q1SessionId || !q2SessionId) {
      setRows1([]);
      setRows2([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setSuccess(false);
      setGridsGenerated(false);

      const { data: pilotsData } = await supabase
        .from('pilot_team_season')
        .select('pilot:pilot_id (id, name, number, avatar_url)')
        .eq('league_id', selectedLeague)
        .overrideTypes<PilotTeamSeasonEntry[]>();

      const pilots = (pilotsData || []).map((pts) => pts.pilot);

      const [{ data: results1 }, { data: results2 }] = await Promise.all([
        supabase
          .from('race_result')
          .select('pilot_id, best_lap, race_position')
          .eq('race_id', selectedRace)
          .eq('session_id', q1SessionId)
          .overrideTypes<RaceResult[]>(),
        supabase
          .from('race_result')
          .select('pilot_id, best_lap, race_position')
          .eq('race_id', selectedRace)
          .eq('session_id', q2SessionId)
          .overrideTypes<RaceResult[]>(),
      ]);

      const buildRows = (results: RaceResult[] | null): QualifyingRow[] => {
        const map = new Map<string, { best_lap: string; position: number | null }>();
        (results || []).forEach((r) => {
          map.set(r.pilot_id!, { best_lap: r.best_lap || '', position: r.race_position });
        });
        const rows: QualifyingRow[] = pilots.map((pilot) => {
          const existing = map.get(pilot.id);
          return { pilot, best_lap: existing?.best_lap || '', position: existing?.position || null };
        });
        sortRows(rows);
        return rows;
      };

      setRows1(buildRows(results1));
      setRows2(buildRows(results2));
      setLoading(false);
    };

    fetchData();
  }, [selectedRace, selectedLeague, q1SessionId, q2SessionId]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  const handleTimeChange1 = (pilotId: string, value: string) => {
    setRows1((prev) => prev.map((r) => r.pilot.id === pilotId ? { ...r, best_lap: value } : r));
  };

  const handleTimeChange2 = (pilotId: string, value: string) => {
    setRows2((prev) => prev.map((r) => r.pilot.id === pilotId ? { ...r, best_lap: value } : r));
  };

  const handleSort1 = () => {
    setRows1((prev) => { const copy = [...prev]; sortRows(copy); return copy; });
  };

  const handleSort2 = () => {
    setRows2((prev) => { const copy = [...prev]; sortRows(copy); return copy; });
  };

  const handleSave = async () => {
    const allRows = [...rows1, ...rows2];
    const invalidRows = allRows.filter((r) => r.best_lap && !isValidTime(r.best_lap));
    if (invalidRows.length > 0) {
      alert(`Formato de tiempo inválido para: ${invalidRows.map((r) => r.pilot.name).join(', ')}. Usa el formato mm:ss.mmm`);
      return;
    }

    setSaving(true);
    setSuccess(false);

    const sorted1 = [...rows1]; sortRows(sorted1);
    const sorted2 = [...rows2]; sortRows(sorted2);

    try {
      const saveRows = async (rows: QualifyingRow[], sessionId: string) => {
        for (const row of rows) {
          const { data: existing } = await supabase
            .from('race_result')
            .select('id')
            .eq('race_id', selectedRace)
            .eq('session_id', sessionId)
            .eq('pilot_id', row.pilot.id)
            .maybeSingle();

          const resultData = {
            race_position: row.position,
            best_lap: row.best_lap || null,
            points: null as number | null,
          };

          if (existing) {
            await supabase.from('race_result').update(resultData).eq('id', existing.id);
          } else {
            await supabase.from('race_result').insert({
              race_id: selectedRace,
              session_id: sessionId,
              pilot_id: row.pilot.id,
              ...resultData,
            });
          }
        }
      };

      await Promise.all([saveRows(sorted1, q1SessionId), saveRows(sorted2, q2SessionId)]);

      // Generar parrillas desde el mejor tiempo combinado
      if (race1SessionId && race2SessionId) {
        const combined = computeCombinedBestTimes(sorted1, sorted2);
        const qualifyingData = combined
          .filter((r) => r.best_lap)
          .map((r) => ({
            pilot_id: r.pilot.id,
            pilot_name: r.pilot.name,
            pilot_number: r.pilot.number,
            best_lap: r.best_lap,
          }));

        const grid1 = computeRace1Grid(qualifyingData);
        const grid2 = computeRace2Grid(grid1);

        await supabase.from('race_grid').delete().eq('race_id', selectedRace).eq('session_id', race1SessionId);
        await supabase.from('race_grid').delete().eq('race_id', selectedRace).eq('session_id', race2SessionId);

        if (grid1.length > 0) {
          await supabase.from('race_grid').insert(
            grid1.map((g) => ({ race_id: selectedRace, session_id: race1SessionId, pilot_id: g.pilot_id, grid_position: g.grid_position }))
          );
        }
        if (grid2.length > 0) {
          await supabase.from('race_grid').insert(
            grid2.map((g) => ({ race_id: selectedRace, session_id: race2SessionId, pilot_id: g.pilot_id, grid_position: g.grid_position }))
          );
        }

        setGridsGenerated(true);
      }

      setRows1(sorted1);
      setRows2(sorted2);
      setSuccess(true);
    } catch (err) {
      console.error('Error al guardar clasificación:', err);
      alert('Error al guardar. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  const combinedRows = rows1.length > 0 || rows2.length > 0
    ? computeCombinedBestTimes(rows1, rows2)
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Clasificación
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedLeague('');
            setSelectedRace('');
            setRows1([]);
            setRows2([]);
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Temporada</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedLeague}
          onChange={(e) => {
            setSelectedLeague(e.target.value);
            setSelectedRace('');
            setRows1([]);
            setRows2([]);
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Liga</option>
          {filteredLeagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <select
          value={selectedRace}
          onChange={(e) => setSelectedRace(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Carrera</option>
          {filteredRaces.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {!selectedRace ? (
        <p className="text-gray-700 dark:text-gray-300">
          Selecciona temporada, liga y carrera para introducir la clasificación.
        </p>
      ) : loading ? (
        <p className="text-gray-700 dark:text-gray-300">Cargando pilotos...</p>
      ) : (
        <>
          {/* Dos tandas en grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <QualifyingTable
              title="Tanda 1"
              rows={rows1}
              onTimeChange={handleTimeChange1}
              onSort={handleSort1}
            />
            <QualifyingTable
              title="Tanda 2"
              rows={rows2}
              onTimeChange={handleTimeChange2}
              onSort={handleSort2}
            />
          </div>

          {/* Clasificación Final */}
          {combinedRows.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-2">
                Clasificación Final
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  (mejor tiempo de cada piloto entre ambas tandas)
                </span>
              </h2>
              <QualifyingTable
                title=""
                rows={combinedRows}
                onTimeChange={() => {}}
                onSort={() => {}}
                readonly
                showTandaColumn
                rows1={rows1}
              />
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar y Generar Parrillas'}
            </button>
            {success && (
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Clasificación guardada correctamente.
              </span>
            )}
          </div>

          {gridsGenerated && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-medium mb-2">
                Parrillas generadas correctamente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/gestion-carrera/parrillas'}
                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ver Parrillas
                </button>
                <button
                  onClick={() => window.location.href = '/gestion-carrera/pdfs'}
                  className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Generar PDFs
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
