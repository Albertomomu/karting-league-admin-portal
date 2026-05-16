'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Race, Pilot } from '@/lib/supabase';
import { generatePilotsTestsPDF } from '@/lib/pdf/generatePilotsTestsPDF';

type PilotTeamSeasonEntry = { is_wildkart: boolean; pilot: Pilot };

type PilotWithFlag = Pilot & { is_wildkart: boolean };

export default function HojaPilotosPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');

  const [pilots, setPilots] = useState<PilotWithFlag[]>([]);
  const [selectedPilotIds, setSelectedPilotIds] = useState<Set<string>>(new Set());
  const [extraRows, setExtraRows] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));
  }, []);

  useEffect(() => {
    if (!selectedLeague) {
      setPilots([]);
      setSelectedPilotIds(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from('pilot_team_season')
      .select('is_wildkart, pilot:pilot_id (id, name, number, avatar_url)')
      .eq('league_id', selectedLeague)
      .overrideTypes<PilotTeamSeasonEntry[]>()
      .then(({ data }) => {
        const list: PilotWithFlag[] = (data || [])
          .filter((pts) => pts.pilot)
          .map((pts) => ({ ...pts.pilot, is_wildkart: pts.is_wildkart }));
        // Pilotos normales primero, wildkarts al final; alfabético dentro de cada grupo
        list.sort((a, b) => {
          if (a.is_wildkart !== b.is_wildkart) return a.is_wildkart ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
        setPilots(list);
        // Por defecto solo se marcan los pilotos regulares; los wildkarts el usuario los selecciona cuando corren
        setSelectedPilotIds(new Set(list.filter((p) => !p.is_wildkart).map((p) => p.id)));
        setLoading(false);
      });
  }, [selectedLeague]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);
  const raceObj = races.find((r) => r.id === selectedRace);

  const togglePilot = (id: string) => {
    setSelectedPilotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedPilotIds(new Set(pilots.map((p) => p.id)));
  const deselectAll = () => setSelectedPilotIds(new Set());

  const handleGenerate = async () => {
    if (!raceObj) return;
    setGenerating(true);
    const entries = pilots
      .filter((p) => selectedPilotIds.has(p.id))
      .map((p) => ({ name: p.name }));
    try {
      await generatePilotsTestsPDF({
        raceName: raceObj.name,
        date: raceObj.date,
        entries,
        extraEmptyRows: extraRows,
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1 text-gray-900 dark:text-white">
        Hoja de Pilotos
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Genera la hoja con los pilotos para anotar a mano asistencia, peso, lastre y números de kart.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedLeague('');
            setSelectedRace('');
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
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          disabled={!selectedSeason}
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
          disabled={!selectedLeague}
        >
          <option value="">Carrera</option>
          {filteredRaces.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {!selectedLeague ? (
        <p className="text-gray-700 dark:text-gray-300">
          Selecciona temporada y liga para ver los pilotos.
        </p>
      ) : loading ? (
        <p className="text-gray-700 dark:text-gray-300">Cargando pilotos...</p>
      ) : pilots.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">
          No hay pilotos en esta liga.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPilotIds.size} de {pilots.length} pilotos seleccionados
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {pilots.map((p) => {
              const checked = selectedPilotIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition ${
                    checked
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePilot(p.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-800 dark:text-white truncate flex-1">
                    {p.name}
                  </span>
                  {p.is_wildkart && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      WK
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              Filas vacías extra al final:
              <input
                type="number"
                min={0}
                max={20}
                value={extraRows}
                onChange={(e) => setExtraRows(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                className="w-16 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedRace || selectedPilotIds.size === 0 || generating}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generando...' : 'Generar Hoja PDF'}
          </button>
          {!selectedRace && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Selecciona una carrera para habilitar la generación.
            </p>
          )}
        </>
      )}
    </div>
  );
}
