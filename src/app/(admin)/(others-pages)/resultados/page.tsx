'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Season = { id: string; name: string };
type League = { id: string; name: string; season_id: string };
type Race = { id: string; name: string; league_id: string };
type Session = { id: string; name: string };
type Pilot = { id: string; name: string; avatar_url: string | null };
type Result = {
  id: string;
  race: Race;
  session: Session;
  pilot: Pilot;
  race_position: number | null;
  best_lap: string | null;
  points: number | null;
};

export default function ResultadosPage() {
  const router = useRouter();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    supabase.from('season').select('id, name').then(({ data }) => setSeasons(data || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data || []));
    supabase.from('race').select('id, name, league_id').then(({ data }) => setRaces(data || []));
  }, []);

  useEffect(() => {
    if (!selectedRace) {
      setSessions([]);
      setSelectedSession('');
      return;
    }

    // Obtener solo sesiones presentes en resultados de esta carrera
    const fetchSessionsForRace = async () => {
      const { data, error } = await supabase
        .from('race_result')
        .select('session_id, session:session_id ( id, name )')
        .eq('race_id', selectedRace);

      if (error) {
        console.error('Error fetching sessions', error);
        return;
      }

      const uniqueSessions = Array.from(
        new Map((data || []).map((r) => [r.session.id, r.session])).values()
      );

      setSessions(uniqueSessions);
    };

    fetchSessionsForRace();
  }, [selectedRace]);

  useEffect(() => {
    if (!selectedRace || !selectedSession) {
      setResults([]);
      return;
    }

    supabase
      .from('race_result')
      .select(`
        id,
        race:race_id ( id, name ),
        session:session_id ( id, name ),
        pilot:pilot_id ( id, name, avatar_url ),
        race_position,
        best_lap,
        points
      `)
      .eq('race_id', selectedRace)
      .eq('session_id', selectedSession)
      .then(({ data, error }) => {
        if (!error) setResults(data || []);
      });
  }, [selectedRace, selectedSession]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Resultados de Carrera
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedLeague('');
            setSelectedRace('');
            setSelectedSession('');
            setSessions([]);
            setResults([]);
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Temporada</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedLeague}
          onChange={(e) => {
            setSelectedLeague(e.target.value);
            setSelectedRace('');
            setSelectedSession('');
            setSessions([]);
            setResults([]);
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Liga</option>
          {filteredLeagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRace}
          onChange={(e) => {
            setSelectedRace(e.target.value);
            setSelectedSession('');
            setResults([]);
          }}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Carrera</option>
          {filteredRaces.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Sesión</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedRace || !selectedSession ? (
        <p className="text-gray-700 dark:text-gray-300">Selecciona carrera y sesión para ver resultados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
            <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-3">Piloto</th>
                <th className="p-3">Posición</th>
                <th className="p-3">Mejor Vuelta</th>
                <th className="p-3">Puntos</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res) => (
                <tr
                  key={res.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    {res.pilot.avatar_url ? (
                      <img
                        src={res.pilot.avatar_url}
                        alt={res.pilot.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                        {res.pilot.name.charAt(0)}
                      </div>
                    )}
                    {res.pilot.name}
                  </td>
                  <td className="p-3 text-gray-800 dark:text-white">{res.race_position ?? '—'}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{res.best_lap ?? '—'}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{res.points ?? 0}</td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/resultados/${res.id}/editar`)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
