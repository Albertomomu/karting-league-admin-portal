'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Pilot, Team } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type WildkartEntry = {
  id: string;
  pilot_id: string;
  pilot: Pilot;
  team: Team;
  league: League;
  is_wildkart: boolean;
  license_points: number;
  created_at: string;
};

export default function WildkartsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [wildkarts, setWildkarts] = useState<WildkartEntry[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
  }, []);

  useEffect(() => {
    if (!selectedLeague) {
      setWildkarts([]);
      return;
    }

    const fetchWildkarts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pilot_team_season')
        .select('id, pilot_id, pilot:pilot_id (id, name, number, avatar_url), team:team_id (id, name), league:league_id (id, name), is_wildkart, license_points, created_at')
        .eq('league_id', selectedLeague)
        .eq('is_wildkart', true)
        .overrideTypes<WildkartEntry[]>();

      if (error) {
        console.error('Error fetching wildkarts:', error);
      } else {
        setWildkarts(data || []);
      }
      setLoading(false);
    };

    fetchWildkarts();
  }, [selectedLeague]);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);

  const handleDelete = async (entry: WildkartEntry) => {
    const confirm = window.confirm(`¿Eliminar el wildkart "${entry.pilot.name}"? Se eliminará el piloto y su asignación.`);
    if (!confirm) return;

    // Eliminar la entrada en pilot_team_season
    const { error: ptsError } = await supabase.from('pilot_team_season').delete().eq('id', entry.id);
    if (ptsError) {
      console.error('Error eliminando asignación:', ptsError);
      return;
    }

    // Eliminar el piloto
    const { error: pilotError } = await supabase.from('pilot').delete().eq('id', entry.pilot_id);
    if (pilotError) {
      console.error('Error eliminando piloto:', pilotError);
    }

    setWildkarts((prev) => prev.filter((w) => w.id !== entry.id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Pilotos Wildkart
        </h1>
        <button
          onClick={() => router.push('/gestion-carrera/wildkarts/crear')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Añadir Wildkart
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            setSelectedLeague('');
            setWildkarts([]);
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
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Liga</option>
          {filteredLeagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {!selectedLeague ? (
        <p className="text-gray-700 dark:text-gray-300">
          Selecciona temporada y liga para ver los wildkarts.
        </p>
      ) : loading ? (
        <p className="text-gray-700 dark:text-gray-300">Cargando...</p>
      ) : wildkarts.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">
          No hay pilotos wildkart registrados para esta liga.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                <th className="p-3">Nombre</th>
                <th className="p-3">Número</th>
                <th className="p-3">Equipo</th>
                <th className="p-3">Puntos Licencia</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {wildkarts.map((wk) => (
                <tr
                  key={wk.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 text-gray-800 dark:text-white">{wk.pilot.name}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{wk.pilot.number}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{wk.team?.name || '-'}</td>
                  <td className="p-3 text-gray-800 dark:text-white">{wk.license_points}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/gestion-carrera/wildkarts/${wk.id}/editar`)}
                      className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(wk)}
                      className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Eliminar
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
