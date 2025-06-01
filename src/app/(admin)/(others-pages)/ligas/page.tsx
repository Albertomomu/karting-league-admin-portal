'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type League = {
  id: string;
  name: string;
  description: string | null;
  season_id: string;
};

type Season = {
  id: string;
  name: string;
};

export default function LigasPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: leaguesData }, { data: seasonsData }] = await Promise.all([
        supabase.from('league').select('*'),
        supabase.from('season').select('id, name'),
      ]);

      setLeagues(leaguesData || []);
      setSeasons(seasonsData || []);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedSeason) {
      setFilteredLeagues([]);
      return;
    }
    setFilteredLeagues(leagues.filter((l) => l.season_id === selectedSeason));
  }, [selectedSeason, leagues]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Ligas</h1>

      <div className="mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Selecciona una temporada</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason === '' ? (
        <p className="text-gray-700 dark:text-white">Selecciona una temporada para ver las ligas.</p>
      ) : filteredLeagues.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay ligas para esta temporada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
            <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeagues.map((league) => (
                <tr
                  key={league.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 text-gray-800 dark:text-white">{league.name}</td>
                  <td className="p-3 text-gray-800 dark:text-white">
                    {league.description || '—'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/ligas/${league.id}/editar`)}
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
