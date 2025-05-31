'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

type Pilot = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Season = {
  id: string;
  name: string;
};

type League = {
  id: string;
  name: string;
};

type Entry = {
  id: string;
  pilot: Pilot;
  season: Season;
  league: League;
};

export default function PilotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [filtered, setFiltered] = useState<Entry[]>([]);
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
        .from('pilot_team_season')
        .select(`
          id,
          pilot:pilot_id ( id, name, avatar_url ),
          season:season_id ( id, name ),
          league:league_id ( id, name )
        `);

      if (error) {
        console.error('Error fetching pilots:', error);
        return;
      }

      setEntries(data);

      const tempSeasons = Array.from(
        new Map(data.map((d) => [d.season.id, d.season])).values()
      );
      setSeasons(tempSeasons);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...entries];

    if (selectedSeason) {
      result = result.filter((e) => e.season.id === selectedSeason);
    }

    const validLeagues = Array.from(
      new Map(result.map((d) => [d.league.id, d.league])).values()
    );
    setLeagues(validLeagues);

    if (selectedLeague && !validLeagues.find((l) => l.id === selectedLeague)) {
      setSelectedLeague('');
    }

    if (selectedLeague) {
      result = result.filter((e) => e.league.id === selectedLeague);
    }

    setFiltered(result);

    const params = new URLSearchParams();
    if (selectedSeason) params.set('season', selectedSeason);
    if (selectedLeague) params.set('league', selectedLeague);
    router.replace(`/pilotos?${params.toString()}`);
  }, [selectedSeason, selectedLeague, entries, router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Listado de Pilotos
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
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              <th className="p-3">Avatar</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Temporada</th>
              <th className="p-3">Liga</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={entry.id}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3">
                  {entry.pilot.avatar_url ? (
                    <img
                      src={entry.pilot.avatar_url}
                      alt={entry.pilot.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white font-semibold">
                      {entry.pilot.name.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="p-3 text-gray-800 dark:text-white">{entry.pilot.name}</td>
                <td className="p-3 text-gray-800 dark:text-white">{entry.season.name}</td>
                <td className="p-3 text-gray-800 dark:text-white">{entry.league.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
