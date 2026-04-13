'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Race, RaceGrid, Pilot } from '@/lib/supabase';
import GridVisualizer from '@/components/gestion-carrera/GridVisualizer';

type GridEntryWithPilot = RaceGrid & {
  pilot: Pilot;
};

export default function ParrillasPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');

  const [grid1, setGrid1] = useState<GridEntryWithPilot[]>([]);
  const [grid2, setGrid2] = useState<GridEntryWithPilot[]>([]);
  const [race1SessionId, setRace1SessionId] = useState('');
  const [race2SessionId, setRace2SessionId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));

    supabase.from('session').select('id, name').then(({ data }) => {
      if (data) {
        const c1 = data.find((s) => s.name === 'Carrera I');
        const c2 = data.find((s) => s.name === 'Carrera II');
        if (c1) setRace1SessionId(c1.id);
        if (c2) setRace2SessionId(c2.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedRace || !race1SessionId || !race2SessionId) {
      setGrid1([]);
      setGrid2([]);
      return;
    }

    const fetchGrids = async () => {
      setLoading(true);

      const [{ data: g1 }, { data: g2 }] = await Promise.all([
        supabase
          .from('race_grid')
          .select('*, pilot:pilot_id (id, name, number, avatar_url)')
          .eq('race_id', selectedRace)
          .eq('session_id', race1SessionId)
          .order('grid_position', { ascending: true })
          .overrideTypes<GridEntryWithPilot[]>(),
        supabase
          .from('race_grid')
          .select('*, pilot:pilot_id (id, name, number, avatar_url)')
          .eq('race_id', selectedRace)
          .eq('session_id', race2SessionId)
          .order('grid_position', { ascending: true })
          .overrideTypes<GridEntryWithPilot[]>(),
      ]);

      setGrid1(g1 || []);
      setGrid2(g2 || []);
      setLoading(false);
    };

    fetchGrids();
  }, [selectedRace, race1SessionId, race2SessionId]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  const toVisualizerEntries = (grid: GridEntryWithPilot[]) =>
    grid.map((g) => ({
      grid_position: g.grid_position,
      pilot_name: g.pilot?.name || 'Desconocido',
      pilot_number: g.pilot?.number || 0,
    }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Parrillas de Salida
      </h1>

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
          Selecciona temporada, liga y carrera para ver las parrillas.
        </p>
      ) : loading ? (
        <p className="text-gray-700 dark:text-gray-300">Cargando parrillas...</p>
      ) : grid1.length === 0 && grid2.length === 0 ? (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            No hay parrillas generadas para esta carrera.
          </p>
          <button
            onClick={() => window.location.href = '/gestion-carrera/clasificacion'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir a Clasificación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GridVisualizer
            entries={toVisualizerEntries(grid1)}
            title="Parrilla Carrera I"
          />
          <GridVisualizer
            entries={toVisualizerEntries(grid2)}
            title="Parrilla Carrera II"
            invertedTopN={10}
          />
        </div>
      )}
    </div>
  );
}
