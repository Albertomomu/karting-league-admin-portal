'use client';

import { useEffect, useState } from 'react';
import { supabase, Race, Session, Pilot, Season, League, RaceResult } from '@/lib/supabase';
import Image from 'next/image';

type EditableResult = {
  pilot: Pilot;
  race_position: number | '';
  best_lap: string;
  laps_completed: number | '';
  status: string;
  observations: string;
  points: number | '';
};

type PilotTeamSeason = {
  pilot: Pilot;
};

const STATUS_OPTIONS = [
  { value: 'classified', label: 'Clasificado' },
  { value: 'dnf', label: 'DNF' },
  { value: 'dsq', label: 'DSQ' },
  { value: 'dns', label: 'DNS' },
];

export default function ResultadosCarreraPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);

  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const [results, setResults] = useState<EditableResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Cargar datos base
  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('race').select('id, name, league_id').then(({ data }) => setRaces(data as Race[] || []));
  }, []);

  // Cargar pilotos al seleccionar liga
  useEffect(() => {
    if (!selectedLeague) {
      setPilots([]);
      return;
    }
    supabase
      .from('pilot_team_season')
      .select('pilot:pilot_id (id, name, number, avatar_url)')
      .eq('league_id', selectedLeague)
      .overrideTypes<PilotTeamSeason[]>()
      .then(({ data }) => {
        setPilots((data as PilotTeamSeason[] || []).map((pts) => pts.pilot));
      });
  }, [selectedLeague]);

  // Cargar sesiones (solo Carrera I y Carrera II)
  useEffect(() => {
    if (!selectedRace) {
      setSessions([]);
      setSelectedSession('');
      return;
    }
    supabase
      .from('session')
      .select('id, name')
      .in('name', ['Carrera I', 'Carrera II', 'Superfinal 1', 'Superfinal 2'])
      .then(({ data }) => setSessions(data as Session[] || []));
  }, [selectedRace]);

  // Cargar resultados existentes
  useEffect(() => {
    if (!selectedRace || !selectedSession) {
      setResults([]);
      return;
    }

    const fetchExistingResults = async () => {
      const { data } = await supabase
        .from('race_result')
        .select('id, pilot:pilot_id ( id, name, number, avatar_url ), race_position, best_lap, points, laps_completed, status, observations')
        .eq('race_id', selectedRace)
        .eq('session_id', selectedSession)
        .overrideTypes<RaceResult[]>();

      const resultsMap = new Map<string, EditableResult>();
      (data || []).forEach((r) => {
        if (r.pilot) {
          resultsMap.set(r.pilot.id, {
            pilot: r.pilot,
            race_position: r.race_position ?? '',
            best_lap: r.best_lap ?? '',
            laps_completed: r.laps_completed ?? '',
            status: r.status || 'classified',
            observations: r.observations ?? '',
            points: r.points ?? '',
          });
        }
      });

      const editableResults: EditableResult[] = pilots.map((pilot) =>
        resultsMap.get(pilot.id) || {
          pilot,
          race_position: '',
          best_lap: '',
          laps_completed: '',
          status: 'classified',
          observations: '',
          points: '',
        }
      );
      setResults(editableResults);
    };

    fetchExistingResults();
  }, [selectedRace, selectedSession, pilots]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);
  const filteredRaces = races.filter((r) => r.league_id === selectedLeague);

  const handleChange = (idx: number, field: string, value: string) => {
    setResults((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      for (const res of results) {
        // Saltar filas completamente vacías
        if (
          res.race_position === '' &&
          res.best_lap === '' &&
          res.points === '' &&
          res.laps_completed === '' &&
          res.status === 'classified' &&
          res.observations === ''
        ) {
          continue;
        }

        const { data: existing, error: existingError } = await supabase
          .from('race_result')
          .select('id')
          .eq('race_id', selectedRace)
          .eq('session_id', selectedSession)
          .eq('pilot_id', res.pilot.id)
          .maybeSingle();

        if (existingError) throw existingError;

        const resultData = {
          race_position: res.race_position === '' ? null : Number(res.race_position),
          best_lap: res.best_lap || null,
          points: res.points === '' ? null : Number(res.points),
          laps_completed: res.laps_completed === '' ? null : Number(res.laps_completed),
          status: res.status || 'classified',
          observations: res.observations || null,
        };

        if (existing) {
          const { error } = await supabase
            .from('race_result')
            .update(resultData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('race_result')
            .insert({
              race_id: selectedRace,
              session_id: selectedSession,
              pilot_id: res.pilot.id,
              ...resultData,
            });
          if (error) throw error;
        }
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error al guardar resultados:', error);
      alert('Ocurrió un error al guardar resultados. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Resultados de Carrera
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(e.target.value);
              setSelectedLeague('');
              setSelectedRace('');
              setSelectedSession('');
              setResults([]);
            }}
            className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            required
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
              setSelectedSession('');
              setResults([]);
            }}
            className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            required
          >
            <option value="">Liga</option>
            {filteredLeagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
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
            required
          >
            <option value="">Carrera</option>
            {filteredRaces.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            required
          >
            <option value="">Sesión</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {(!selectedRace || !selectedSession) ? (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Selecciona carrera y sesión para introducir resultados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
              <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3">Piloto</th>
                  <th className="p-3 w-16">Pos</th>
                  <th className="p-3 w-28">Mejor Vuelta</th>
                  <th className="p-3 w-20">Vueltas</th>
                  <th className="p-3 w-32">Estado</th>
                  <th className="p-3 w-40">Observaciones</th>
                  <th className="p-3 w-16">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, idx) => (
                  <tr
                    key={res.pilot.id}
                    className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      res.status === 'dnf' ? 'bg-red-50 dark:bg-red-900/10' :
                      res.status === 'dsq' ? 'bg-gray-100 dark:bg-gray-800/50' :
                      res.status === 'dns' ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                    }`}
                  >
                    <td className="p-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      {res.pilot.avatar_url ? (
                        <Image
                          src={res.pilot.avatar_url}
                          alt={res.pilot.name}
                          className="w-8 h-8 rounded-full object-cover"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white">
                          {res.pilot.name.charAt(0)}
                        </div>
                      )}
                      <span>{res.pilot.name}</span>
                      <span className="text-gray-400 text-xs">#{res.pilot.number}</span>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="1"
                        className="w-14 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        value={res.race_position}
                        onChange={(e) => handleChange(idx, 'race_position', e.target.value)}
                        placeholder="Pos"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        className="w-24 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        value={res.best_lap}
                        onChange={(e) => handleChange(idx, 'best_lap', e.target.value)}
                        placeholder="00:00.000"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        className="w-16 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        value={res.laps_completed}
                        onChange={(e) => handleChange(idx, 'laps_completed', e.target.value)}
                        placeholder="--"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={res.status}
                        onChange={(e) => handleChange(idx, 'status', e.target.value)}
                        className="w-28 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        className="w-36 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        value={res.observations}
                        onChange={(e) => handleChange(idx, 'observations', e.target.value)}
                        placeholder="Notas..."
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        className="w-14 border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                        value={res.points}
                        onChange={(e) => handleChange(idx, 'points', e.target.value)}
                        placeholder="Pts"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || !selectedRace || !selectedSession}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Resultados'}
          </button>
          {success && (
            <span className="text-green-600 dark:text-green-400 font-semibold">
              Resultados guardados correctamente.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
