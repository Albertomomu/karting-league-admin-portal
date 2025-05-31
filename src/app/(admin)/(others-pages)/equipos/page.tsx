'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
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
  id: string; // pilot_team_season id
  team: Team;
  season: Season;
  league: League;
};

export default function EquiposPage() {
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
          team:team_id ( id, name, logo_url ),
          season:season_id ( id, name ),
          league:league_id ( id, name )
        `);

      if (error) {
        console.error('Error fetching equipos:', error);
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

    // Elimina duplicados de equipos
    const seen = new Set();
    const uniqueTeams = result.filter((entry) => {
      const key = `${entry.team.id}-${entry.season.id}-${entry.league.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setFiltered(uniqueTeams);
  }, [selectedSeason, selectedLeague, entries]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Equipos por Temporada y Liga
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
              <th className="p-3">Logo</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Temporada</th>
              <th className="p-3">Liga</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr
                key={`${entry.team.id}-${entry.season.id}-${entry.league.id}`}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3">
                  {entry.team.logo_url ? (
                    <img
                      src={entry.team.logo_url}
                      alt={entry.team.name}
                      className="w-10 h-10 object-contain rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
                  )}
                </td>
                <td className="p-3 text-gray-900 dark:text-white">{entry.team.name}</td>
                <td className="p-3 text-gray-700 dark:text-white">{entry.season.name}</td>
                <td className="p-3 text-gray-700 dark:text-white">{entry.league.name}</td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/equipos/${entry.team.id}/editar`)}
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
