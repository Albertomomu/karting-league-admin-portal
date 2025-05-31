'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

type Pilot = {
  id: string;
  name: string;
  number: number;
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

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
};

type Entry = {
  id: string;
  pilot: Pilot;
  season: Season;
  league: League;
  team: Team;
};

const ITEMS_PER_PAGE = 10;

export default function PilotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [filtered, setFiltered] = useState<Entry[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginated = filtered.slice(startIdx, endIdx);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

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
          pilot:pilot_id ( id, name, number, avatar_url ),
          team:team_id ( id, name, logo_url ),
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
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (selectedSeason) params.set('season', selectedSeason);
    if (selectedLeague) params.set('league', selectedLeague);
    router.replace(`/pilotos?${params.toString()}`);
  }, [selectedSeason, selectedLeague, entries, router]);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('¿Eliminar este piloto de esta temporada?');
    if (!confirm) return;

    const { error } = await supabase.from('pilot_team_season').delete().eq('id', id);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleExport = () => {
    const dataToExport = paginated.map((entry) => ({
      Nombre: entry.pilot.name,
      Número: entry.pilot.number,
      Temporada: entry.season.name,
      Liga: entry.league.name,
      Equipo: entry.team.name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pilotos');

    XLSX.writeFile(workbook, 'pilotos.xlsx');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Listado de Pilotos
        </h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Exportar Excel
        </button>
      </div>

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

        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          {[5, 10, 25, 50, 100].map((count) => (
            <option key={count} value={count}>
              {count} por página
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
              <th className="p-3">Número</th>
              <th className="p-3">Equipo</th>
              <th className="p-3">Temporada</th>
              <th className="p-3">Liga</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry) => (
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
                <td className="p-3 text-gray-800 dark:text-white">{entry.pilot.number}</td>
                <td className="p-3 text-gray-800 dark:text-white flex items-center gap-2">
                  {entry.team.logo_url ? (
                    <img
                      src={entry.team.logo_url}
                      alt={entry.team.name}
                      className="w-6 h-6 rounded object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-400 dark:bg-gray-600" />
                  )}
                  {entry.team.name}
                </td>
                <td className="p-3 text-gray-800 dark:text-white">{entry.season.name}</td>
                <td className="p-3 text-gray-800 dark:text-white">{entry.league.name}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => router.push(`/pilotos/${entry.id}/editar`)}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
