'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Race, RaceResult, RaceGrid, Pilot, Circuit } from '@/lib/supabase';
import { generateClassificationPDF } from '@/lib/pdf/generateClassificationPDF';
import { generateGridPDF } from '@/lib/pdf/generateGridPDF';
import { generateResultsPDF, generateCombinedResultsPDF } from '@/lib/pdf/generateResultsPDF';

type RaceWithCircuit = Race & { circuit: Circuit };

type GridWithPilot = RaceGrid & { pilot: Pilot };

type ResultWithPilot = RaceResult & { pilot: Pilot };

export default function PDFsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');

  const [raceDetail, setRaceDetail] = useState<RaceWithCircuit | null>(null);
  const [leagueDetail, setLeagueDetail] = useState<League | null>(null);

  const [sessionIds, setSessionIds] = useState<{ clasificacion: string; carrera1: string; carrera2: string }>({
    clasificacion: '', carrera1: '', carrera2: '',
  });

  const [generating, setGenerating] = useState('');

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id, date').then(({ data }) => setRaces(data as Race[] || []));

    supabase.from('session').select('id, name').then(({ data }) => {
      if (data) {
        setSessionIds({
          clasificacion: data.find((s) => s.name === 'Clasificación')?.id || '',
          carrera1: data.find((s) => s.name === 'Carrera I')?.id || '',
          carrera2: data.find((s) => s.name === 'Carrera II')?.id || '',
        });
      }
    });
  }, []);

  // Cargar detalles de la carrera seleccionada
  useEffect(() => {
    if (!selectedRace) {
      setRaceDetail(null);
      return;
    }

    supabase
      .from('race')
      .select('*, circuit:circuit_id (id, name, location)')
      .eq('id', selectedRace)
      .single()
      .then(({ data }) => {
        setRaceDetail(data as unknown as RaceWithCircuit);
      });
  }, [selectedRace]);

  useEffect(() => {
    if (!selectedLeague) {
      setLeagueDetail(null);
      return;
    }
    const league = leagues.find((l) => l.id === selectedLeague);
    setLeagueDetail(league || null);
  }, [selectedLeague, leagues]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  const getRaceInfo = () => ({
    raceName: raceDetail?.name || '',
    date: raceDetail?.date || '',
    circuitName: raceDetail?.circuit?.name || '',
    leagueName: leagueDetail?.name || '',
  });

  const handleClassificationPDF = async () => {
    if (!selectedRace || !sessionIds.clasificacion) return;
    setGenerating('clasificacion');

    const { data } = await supabase
      .from('race_result')
      .select('race_position, best_lap, pilot:pilot_id (id, name, number)')
      .eq('race_id', selectedRace)
      .eq('session_id', sessionIds.clasificacion)
      .order('race_position', { ascending: true })
      .overrideTypes<ResultWithPilot[]>();

    const entries = (data || []).map((r) => ({
      position: r.race_position,
      pilot_name: r.pilot?.name || '',
      pilot_number: r.pilot?.number || 0,
      best_lap: r.best_lap || '',
    }));

    generateClassificationPDF({ ...getRaceInfo(), entries });
    setGenerating('');
  };

  const handleGridPDF = async (session: 'carrera1' | 'carrera2') => {
    const sessionId = sessionIds[session];
    if (!selectedRace || !sessionId) return;
    setGenerating(session);

    const { data } = await supabase
      .from('race_grid')
      .select('grid_position, pilot:pilot_id (id, name, number)')
      .eq('race_id', selectedRace)
      .eq('session_id', sessionId)
      .order('grid_position', { ascending: true })
      .overrideTypes<GridWithPilot[]>();

    const entries = (data || []).map((g) => ({
      grid_position: g.grid_position,
      pilot_name: g.pilot?.name || '',
      pilot_number: g.pilot?.number || 0,
    }));

    if (entries.length === 0) {
      alert('No hay parrilla generada. Ve a Clasificación primero.');
      setGenerating('');
      return;
    }

    const sessionName = session === 'carrera1' ? 'CARRERA I' : 'CARRERA II';
    generateGridPDF({
      ...getRaceInfo(),
      sessionName,
      entries,
      invertedTopN: session === 'carrera2' ? 10 : 0,
    });
    setGenerating('');
  };

  const handleResultsPDF = async (session: 'carrera1' | 'carrera2') => {
    const sessionId = sessionIds[session];
    if (!selectedRace || !sessionId) return;
    setGenerating(`results_${session}`);

    const { data } = await supabase
      .from('race_result')
      .select('race_position, best_lap, points, laps_completed, status, observations, pilot:pilot_id (id, name, number)')
      .eq('race_id', selectedRace)
      .eq('session_id', sessionId)
      .order('race_position', { ascending: true })
      .overrideTypes<ResultWithPilot[]>();

    const entries = (data || []).map((r) => ({
      position: r.race_position,
      pilot_name: r.pilot?.name || '',
      pilot_number: r.pilot?.number || 0,
      best_lap: r.best_lap,
      laps_completed: r.laps_completed,
      status: r.status,
      points: r.points,
    }));

    if (entries.length === 0) {
      alert('No hay resultados. Introduce los resultados primero.');
      setGenerating('');
      return;
    }

    const sessionName = session === 'carrera1' ? 'Carrera I' : 'Carrera II';
    generateResultsPDF({
      ...getRaceInfo(),
      sessionName,
      entries,
    });
    setGenerating('');
  };

  const handleCombinedResultsPDF = async () => {
    if (!selectedRace || !sessionIds.carrera1 || !sessionIds.carrera2) return;
    setGenerating('combined');

    const fetchResults = async (sessionId: string) => {
      const { data } = await supabase
        .from('race_result')
        .select('race_position, best_lap, points, laps_completed, status, observations, pilot:pilot_id (id, name, number)')
        .eq('race_id', selectedRace)
        .eq('session_id', sessionId)
        .order('race_position', { ascending: true })
        .overrideTypes<ResultWithPilot[]>();

      return (data || []).map((r) => ({
        position: r.race_position,
        pilot_name: r.pilot?.name || '',
        pilot_number: r.pilot?.number || 0,
        best_lap: r.best_lap,
        laps_completed: r.laps_completed,
        status: r.status,
        points: r.points,
      }));
    };

    const [entries1, entries2] = await Promise.all([
      fetchResults(sessionIds.carrera1),
      fetchResults(sessionIds.carrera2),
    ]);

    if (entries1.length === 0 && entries2.length === 0) {
      alert('No hay resultados para ninguna carrera.');
      setGenerating('');
      return;
    }

    const info = getRaceInfo();
    generateCombinedResultsPDF(
      { ...info, sessionName: 'Carrera I', entries: entries1 },
      { ...info, sessionName: 'Carrera II', entries: entries2 }
    );
    setGenerating('');
  };

  const isDisabled = !selectedRace;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Documentos PDF
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
          Selecciona una carrera para generar documentos PDF.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clasificación */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Clasificación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tabla con posiciones, tiempos y diferencias.
            </p>
            <button
              onClick={handleClassificationPDF}
              disabled={isDisabled || generating === 'clasificacion'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generating === 'clasificacion' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          {/* Parrilla C1 */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Parrilla Carrera I
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Parrilla de salida con layout visual 2x2.
            </p>
            <button
              onClick={() => handleGridPDF('carrera1')}
              disabled={isDisabled || generating === 'carrera1'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generating === 'carrera1' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          {/* Parrilla C2 */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Parrilla Carrera II
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Parrilla con top 10 invertido.
            </p>
            <button
              onClick={() => handleGridPDF('carrera2')}
              disabled={isDisabled || generating === 'carrera2'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generating === 'carrera2' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          {/* Resultados C1 */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Resultados Carrera I
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Posiciones finales, tiempos y puntos.
            </p>
            <button
              onClick={() => handleResultsPDF('carrera1')}
              disabled={isDisabled || generating === 'results_carrera1'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generating === 'results_carrera1' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          {/* Resultados C2 */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Resultados Carrera II
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Posiciones finales, tiempos y puntos.
            </p>
            <button
              onClick={() => handleResultsPDF('carrera2')}
              disabled={isDisabled || generating === 'results_carrera2'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generating === 'results_carrera2' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>

          {/* Resultados Combinados */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Resultados Combinados
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Carrera I + Carrera II en un solo documento.
            </p>
            <button
              onClick={handleCombinedResultsPDF}
              disabled={isDisabled || generating === 'combined'}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {generating === 'combined' ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
