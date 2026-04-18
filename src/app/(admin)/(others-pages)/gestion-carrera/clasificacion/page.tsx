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

export default function ClasificacionPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');

  const [rows, setRows] = useState<QualifyingRow[]>([]);
  const [qualifyingSessionId, setQualifyingSessionId] = useState('');
  const [race1SessionId, setRace1SessionId] = useState('');
  const [race2SessionId, setRace2SessionId] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gridsGenerated, setGridsGenerated] = useState(false);

  // Cargar datos base
  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));

    // Cargar session IDs por nombre
    supabase.from('session').select('id, name').then(({ data }) => {
      if (data) {
        const clasificacion = data.find((s) => s.name === 'Clasificación');
        const carrera1 = data.find((s) => s.name === 'Carrera I');
        const carrera2 = data.find((s) => s.name === 'Carrera II');
        if (clasificacion) setQualifyingSessionId(clasificacion.id);
        if (carrera1) setRace1SessionId(carrera1.id);
        if (carrera2) setRace2SessionId(carrera2.id);
      }
    });
  }, []);

  // Cargar pilotos y resultados existentes cuando se selecciona carrera
  useEffect(() => {
    if (!selectedRace || !selectedLeague || !qualifyingSessionId) {
      setRows([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setSuccess(false);
      setGridsGenerated(false);

      // Cargar pilotos de la liga
      const { data: pilotsData } = await supabase
        .from('pilot_team_season')
        .select('pilot:pilot_id (id, name, number, avatar_url)')
        .eq('league_id', selectedLeague)
        .overrideTypes<PilotTeamSeasonEntry[]>();

      const pilots = (pilotsData || []).map((pts) => pts.pilot);

      // Cargar resultados de clasificación existentes
      const { data: existingResults } = await supabase
        .from('race_result')
        .select('pilot_id, best_lap, race_position')
        .eq('race_id', selectedRace)
        .eq('session_id', qualifyingSessionId)
        .overrideTypes<RaceResult[]>();

      const resultsMap = new Map<string, { best_lap: string; position: number | null }>();
      (existingResults || []).forEach((r) => {
        resultsMap.set(r.pilot_id!, {
          best_lap: r.best_lap || '',
          position: r.race_position,
        });
      });

      const qualifyingRows: QualifyingRow[] = pilots.map((pilot) => {
        const existing = resultsMap.get(pilot.id);
        return {
          pilot,
          best_lap: existing?.best_lap || '',
          position: existing?.position || null,
        };
      });

      // Ordenar: los que tienen tiempo primero (por tiempo), los que no al final
      sortRows(qualifyingRows);
      setRows(qualifyingRows);
      setLoading(false);
    };

    fetchData();
  }, [selectedRace, selectedLeague, qualifyingSessionId]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  const isValidTime = (time: string) => {
    if (!time) return true; // Vacío es válido (DNS)
    return /^\d{1,2}:\d{2}\.\d{3}$/.test(time);
  };

  const sortRows = (rowsToSort: QualifyingRow[]) => {
    rowsToSort.sort((a, b) => {
      if (!a.best_lap && !b.best_lap) return 0;
      if (!a.best_lap) return 1;
      if (!b.best_lap) return -1;
      return parseTimeToMs(a.best_lap) - parseTimeToMs(b.best_lap);
    });
    // Recalcular posiciones
    rowsToSort.forEach((row, i) => {
      row.position = row.best_lap ? i + 1 : null;
    });
  };

  const handleTimeChange = (pilotId: string, value: string) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.pilot.id === pilotId ? { ...r, best_lap: value } : r
      );
      return updated;
    });
  };

  const handleSort = () => {
    setRows((prev) => {
      const copy = [...prev];
      sortRows(copy);
      return copy;
    });
  };

  const handleSave = async () => {
    // Validar tiempos
    const invalidRows = rows.filter((r) => r.best_lap && !isValidTime(r.best_lap));
    if (invalidRows.length > 0) {
      alert(`Formato de tiempo inválido para: ${invalidRows.map((r) => r.pilot.name).join(', ')}. Usa el formato mm:ss.mmm`);
      return;
    }

    setSaving(true);
    setSuccess(false);

    // Ordenar antes de guardar
    const sorted = [...rows];
    sortRows(sorted);

    try {
      // Guardar resultados de clasificación
      for (const row of sorted) {
        const { data: existing } = await supabase
          .from('race_result')
          .select('id')
          .eq('race_id', selectedRace)
          .eq('session_id', qualifyingSessionId)
          .eq('pilot_id', row.pilot.id)
          .maybeSingle();

        const resultData = {
          race_position: row.position,
          best_lap: row.best_lap || null,
          points: null as number | null,
        };

        if (existing) {
          await supabase
            .from('race_result')
            .update(resultData)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('race_result')
            .insert({
              race_id: selectedRace,
              session_id: qualifyingSessionId,
              pilot_id: row.pilot.id,
              ...resultData,
            });
        }
      }

      // Generar parrillas
      if (race1SessionId && race2SessionId) {
        // Solo pilotos con tiempo entran en la parrilla
        const qualifyingData = sorted
          .filter((r) => r.best_lap)
          .map((r) => ({
            pilot_id: r.pilot.id,
            pilot_name: r.pilot.name,
            pilot_number: r.pilot.number,
            best_lap: r.best_lap,
          }));

        const grid1 = computeRace1Grid(qualifyingData);
        const grid2 = computeRace2Grid(grid1);

        // Eliminar parrillas existentes para esta carrera
        await supabase.from('race_grid').delete().eq('race_id', selectedRace).eq('session_id', race1SessionId);
        await supabase.from('race_grid').delete().eq('race_id', selectedRace).eq('session_id', race2SessionId);

        // Insertar parrilla C1
        const grid1Rows = grid1.map((g) => ({
          race_id: selectedRace,
          session_id: race1SessionId,
          pilot_id: g.pilot_id,
          grid_position: g.grid_position,
        }));
        if (grid1Rows.length > 0) {
          await supabase.from('race_grid').insert(grid1Rows);
        }

        // Insertar parrilla C2
        const grid2Rows = grid2.map((g) => ({
          race_id: selectedRace,
          session_id: race2SessionId,
          pilot_id: g.pilot_id,
          grid_position: g.grid_position,
        }));
        if (grid2Rows.length > 0) {
          await supabase.from('race_grid').insert(grid2Rows);
        }

        setGridsGenerated(true);
      }

      setRows(sorted);
      setSuccess(true);
    } catch (err) {
      console.error('Error al guardar clasificación:', err);
      alert('Error al guardar. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  // Calcular referencia para gaps
  const firstTime = rows.find((r) => r.best_lap)?.best_lap;
  const firstTimeMs = firstTime ? parseTimeToMs(firstTime) : 0;

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
            setRows([]);
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
            setRows([]);
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
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSort}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Ordenar por Tiempo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
              <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 w-16">Pos</th>
                  <th className="p-3">Piloto</th>
                  <th className="p-3 w-36">Tiempo</th>
                  <th className="p-3 w-28">Diferencia</th>
                  <th className="p-3 w-20">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const timeMs = row.best_lap ? parseTimeToMs(row.best_lap) : 0;
                  const gap = row.best_lap && firstTimeMs ? formatGap(timeMs, firstTimeMs) : '';
                  const isInvalid = row.best_lap && !isValidTime(row.best_lap);

                  return (
                    <tr
                      key={row.pilot.id}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="p-3 text-gray-800 dark:text-white font-semibold">
                        {row.position || '-'}
                      </td>
                      <td className="p-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        {row.pilot.avatar_url ? (
                          <Image
                            src={row.pilot.avatar_url}
                            alt={row.pilot.name}
                            className="w-8 h-8 rounded-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                            {row.pilot.name.charAt(0)}
                          </div>
                        )}
                        {row.pilot.name}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.best_lap}
                          onChange={(e) => handleTimeChange(row.pilot.id, e.target.value)}
                          placeholder="00:00.000"
                          className={`w-28 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white ${
                            isInvalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                        {gap}
                      </td>
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

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Clasificación y Generar Parrillas'}
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
