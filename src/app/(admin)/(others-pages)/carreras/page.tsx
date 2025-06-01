'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Race, League, Season } from '@/lib/supabase';

export default function CarrerasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [races, setRaces] = useState<Race[]>([]);
  const [filtered, setFiltered] = useState<Race[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');

  useEffect(() => {
    const seasonFromUrl = searchParams.get('season') || '';
    const leagueFromUrl = searchParams.get('league') || '';
    setSelectedSeason(seasonFromUrl);
    setSelectedLeague(leagueFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('race')
        .select(`
          id,
          name,
          date,
          circuit:circuit_id ( id, name ),
          league:league_id ( id, name, season_id )
        `)
        .overrideTypes<Race[]>();

      if (error) {
        console.error('Error fetching races:', error);
        return;
      }

      setRaces(data as Race[]);

      // Set seasons based on league.season_id
      const uniqueSeasons = Array.from(
        new Map(
          data
            .filter((r) => r.league?.season_id)
            .map((r) => [r.league?.season_id, { id: r.league?.season_id, name: '' }])
        ).values()
      );

      // We'll fetch names for those seasons
      const { data: seasonData } = await supabase
        .from('season')
        .select('id, name')
        .in('id', uniqueSeasons.map((s) => s.id));

      setSeasons(seasonData as Season[] || []);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...races];

    if (selectedSeason) {
      result = result.filter((r) => r.league?.season_id === selectedSeason);
    }

    const validLeagues = Array.from(
      new Map(result.map((r) => [r.league?.id, r.league])).values()
    );
    setLeagues(validLeagues as League[]);

    if (selectedLeague && !validLeagues.find((l) => l?.id === selectedLeague)) {
      setSelectedLeague('');
    }

    if (selectedLeague) {
      result = result.filter((r) => r.league?.id === selectedLeague);
    }

    setFiltered(result);
  }, [selectedSeason, selectedLeague, races]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Carreras
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Todas las temporadas</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Todas las ligas</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Circuito</th>
              <th className="p-3">Liga</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((race) => (
              <tr
                key={race.id}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3 text-gray-900 dark:text-white">{race.name}</td>
                <td className="p-3 text-gray-700 dark:text-white">{new Date(race.date).toLocaleDateString()}</td>
                <td className="p-3 text-gray-700 dark:text-white">{race.circuit?.name || '—'}</td>
                <td className="p-3 text-gray-700 dark:text-white">{race.league?.name || '—'}</td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/carreras/${race.id}/editar`)}
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
    </div>
  );
}
