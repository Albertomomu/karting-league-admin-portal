'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

type LapTime = {
  id: string;
  lap_number: number;
  time: string;
  pilot: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export default function TiemposPage() {
  const router = useRouter();

  const [seasons, setSeasons] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);

  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedPilot, setSelectedPilot] = useState('');

  const [lapTimes, setLapTimes] = useState<LapTime[]>([]);

  useEffect(() => {
    supabase.from('season').select('id, name').then(({ data }) => setSeasons(data || []));
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    supabase
      .from('league')
      .select('id, name, season_id')
      .eq('season_id', selectedSeason)
      .then(({ data }) => setLeagues(data || []));
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedLeague) return;
    supabase
      .from('race')
      .select('id, name, league_id')
      .eq('league_id', selectedLeague)
      .then(({ data }) => setRaces(data || []));
  }, [selectedLeague]);

  useEffect(() => {
    if (!selectedRace) return;
    supabase
      .from('race_result')
      .select('session_id, session:session_id ( id, name )')
      .eq('race_id', selectedRace)
      .then(({ data }) => {
        const unique = Array.from(
          new Map((data || []).map((r) => [r.session.id, r.session])).values()
        );
        setSessions(unique);
      });
  }, [selectedRace]);

  useEffect(() => {
    if (!selectedSession) return;

    supabase
      .from('lap_time')
      .select(`
        id,
        lap_number,
        time,
        pilot:pilot_id ( id, name, avatar_url )
      `)
      .eq('race_id', selectedRace)
      .eq('session_id', selectedSession)
      .then(({ data }) => {
        setLapTimes(data || []);

        const uniquePilots = Array.from(
          new Map((data || []).map((l) => [l.pilot.id, l.pilot])).values()
        );
        setPilots(uniquePilots);
      });
  }, [selectedRace, selectedSession]);

  const filteredLapTimes = selectedPilot
    ? lapTimes.filter((l) => l.pilot.id === selectedPilot)
    : lapTimes;

  const handleExport = () => {
    if (filteredLapTimes.length === 0) return;

    const exportData = filteredLapTimes.map((lap) => ({
      Piloto: lap.pilot.name,
      Vuelta: lap.lap_number,
      Tiempo: lap.time,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tiempos');

    XLSX.writeFile(workbook, 'tiempos_por_vuelta.xlsx');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Tiempos por Vuelta
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedLeague('');
            setSelectedRace('');
            setSelectedSession('');
            setLapTimes([]);
            setSelectedPilot('');
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
            setLapTimes([]);
            setSelectedPilot('');
          }}
          disabled={!selectedSeason}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Liga</option>
          {leagues.map((l) => (
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
            setLapTimes([]);
            setSelectedPilot('');
          }}
          disabled={!selectedLeague}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Carrera</option>
          {races.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSession}
          onChange={(e) => {
            setSelectedSession(e.target.value);
            setSelectedPilot('');
          }}
          disabled={!selectedRace}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Sesión</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedPilot}
          onChange={(e) => setSelectedPilot(e.target.value)}
          disabled={!selectedSession}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Todos los pilotos</option>
          {pilots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {filteredLapTimes.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
        </div>
      )}

      {selectedSession && filteredLapTimes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
            <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-3">Piloto</th>
                <th className="p-3">Vuelta</th>
                <th className="p-3">Tiempo</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLapTimes.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 text-gray-800 dark:text-white flex items-center gap-2">
                    {l.pilot.avatar_url ? (
                      <img
                        src={l.pilot.avatar_url}
                        alt={l.pilot.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white font-semibold">
                        {l.pilot.name.charAt(0)}
                      </div>
                    )}
                    {l.pilot.name}
                  </td>
                  <td className="p-3 text-gray-800 dark:text-white">{l.lap_number}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{l.time}</td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/tiempos/${l.id}/editar`)}
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
      ) : selectedSession ? (
        <p className="text-gray-600 dark:text-gray-300">No hay tiempos para esta sesión.</p>
      ) : (
        <p className="text-gray-700 dark:text-white">Selecciona una sesión para ver los tiempos.</p>
      )}
    </div>
  );
}
