'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, Season, League, Race, Pilot } from '@/lib/supabase';
import { generateReceptionPDF } from '@/lib/pdf/generateReceptionPDF';

type PilotTeamSeasonEntry = { league_id: string; is_wildkart: boolean; pilot: Pilot };

type PilotWithFlag = Pilot & { is_wildkart: boolean };

type RaceEvent = {
  key: string; // name|date
  name: string;
  date: string;
  raceIdsByLeague: Record<string, string>; // league_id → race_id
};

export default function HojaRecepcionPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedEventKey, setSelectedEventKey] = useState('');

  const [pilotsByLeague, setPilotsByLeague] = useState<Record<string, PilotWithFlag[]>>({});
  const [selectedPilotIds, setSelectedPilotIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));
  }, []);

  const seasonLeagues = useMemo(
    () => leagues.filter((l) => l.season_id === selectedSeason),
    [leagues, selectedSeason],
  );

  // Eventos = (nombre, fecha) únicos entre las carreras de las ligas de la temporada
  const events = useMemo<RaceEvent[]>(() => {
    if (!selectedSeason) return [];
    const leagueIds = new Set(seasonLeagues.map((l) => l.id));
    const map = new Map<string, RaceEvent>();
    for (const r of races) {
      if (!r.league_id || !leagueIds.has(r.league_id)) continue;
      const key = `${r.name}|${r.date}`;
      const existing = map.get(key);
      if (existing) {
        existing.raceIdsByLeague[r.league_id] = r.id;
      } else {
        map.set(key, {
          key,
          name: r.name,
          date: r.date,
          raceIdsByLeague: { [r.league_id]: r.id },
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [races, seasonLeagues, selectedSeason]);

  const selectedEvent = events.find((e) => e.key === selectedEventKey) || null;

  // Cargar pilotos cuando hay evento seleccionado
  useEffect(() => {
    if (!selectedEvent) {
      setPilotsByLeague({});
      setSelectedPilotIds(new Set());
      return;
    }
    const leagueIds = Object.keys(selectedEvent.raceIdsByLeague);
    if (leagueIds.length === 0) return;

    setLoading(true);
    supabase
      .from('pilot_team_season')
      .select('league_id, is_wildkart, pilot:pilot_id (id, name, number, avatar_url)')
      .in('league_id', leagueIds)
      .overrideTypes<PilotTeamSeasonEntry[]>()
      .then(({ data }) => {
        const grouped: Record<string, PilotWithFlag[]> = {};
        for (const pts of data || []) {
          if (!pts.pilot) continue;
          if (!grouped[pts.league_id]) grouped[pts.league_id] = [];
          grouped[pts.league_id].push({ ...pts.pilot, is_wildkart: pts.is_wildkart });
        }
        // Orden: regulares antes que wildkarts, alfabético dentro de cada grupo
        Object.values(grouped).forEach((arr) =>
          arr.sort((a, b) => {
            if (a.is_wildkart !== b.is_wildkart) return a.is_wildkart ? 1 : -1;
            return a.name.localeCompare(b.name);
          }),
        );
        setPilotsByLeague(grouped);
        // Por defecto sólo pilotos regulares
        const initial = new Set<string>();
        Object.values(grouped).flat().forEach((p) => { if (!p.is_wildkart) initial.add(p.id); });
        setSelectedPilotIds(initial);
        setLoading(false);
      });
  }, [selectedEvent]);

  const togglePilot = (id: string) => {
    setSelectedPilotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPilotIds = useMemo(
    () => Object.values(pilotsByLeague).flat().map((p) => p.id),
    [pilotsByLeague],
  );

  const selectAll = () => setSelectedPilotIds(new Set(allPilotIds));
  const deselectAll = () => setSelectedPilotIds(new Set());

  const handleGenerate = async () => {
    if (!selectedEvent) return;
    setGenerating(true);
    try {
      // Construir secciones por liga, manteniendo el orden de seasonLeagues
      const sections = seasonLeagues
        .map((l) => {
          const list = (pilotsByLeague[l.id] || []).filter((p) => selectedPilotIds.has(p.id));
          return { leagueName: l.name, pilots: list.map((p) => ({ name: p.name })) };
        })
        .filter((s) => s.pilots.length > 0);

      if (sections.length === 0) {
        alert('No has seleccionado ningún piloto.');
        return;
      }

      await generateReceptionPDF({
        raceName: selectedEvent.name,
        date: selectedEvent.date,
        sections,
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
        Hoja de Recepción
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Genera un único PDF con los pilotos de todas las ligas de una ronda, con casilla &quot;PAGADO&quot; para recepción.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedEventKey('');
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Temporada</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedEventKey}
          onChange={(e) => setSelectedEventKey(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          disabled={!selectedSeason}
        >
          <option value="">Ronda</option>
          {events.map((ev) => (
            <option key={ev.key} value={ev.key}>{ev.name} ({ev.date})</option>
          ))}
        </select>
      </div>

      {!selectedEvent ? (
        <p className="text-gray-700 dark:text-gray-300">
          Selecciona temporada y ronda.
        </p>
      ) : loading ? (
        <p className="text-gray-700 dark:text-gray-300">Cargando pilotos...</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPilotIds.size} de {allPilotIds.length} pilotos seleccionados
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {seasonLeagues.map((league) => {
              const pilots = pilotsByLeague[league.id] || [];
              if (pilots.length === 0) return null;
              return (
                <div key={league.id}>
                  <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-2">
                    {league.name}
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({pilots.length} pilotos)
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedPilotIds.size === 0 || generating}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generando...' : 'Generar Hoja Recepción'}
          </button>
        </>
      )}
    </div>
  );
}
