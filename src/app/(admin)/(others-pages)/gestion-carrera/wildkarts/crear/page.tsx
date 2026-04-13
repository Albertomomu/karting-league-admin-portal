'use client';

import { useEffect, useState } from 'react';
import { supabase, Season, League, Team } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CrearWildkartPage() {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.from('season').select('id, name').order('start_date', { ascending: false }).then(({ data }) => setSeasons(data as Season[] || []));
    supabase.from('league').select('id, name, season_id').then(({ data }) => setLeagues(data as League[] || []));
    supabase.from('team').select('id, name').order('name').then(({ data }) => setTeams(data as Team[] || []));
  }, []);

  const filteredLeagues = leagues.filter((l) => l.season_id === selectedSeason);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // 1. Crear el piloto
    const { data: pilotData, error: pilotError } = await supabase
      .from('pilot')
      .insert([{ name, number: parseInt(number), role: 'user' }])
      .select('id')
      .single();

    if (pilotError) {
      setError(pilotError.message);
      setSaving(false);
      return;
    }

    // 2. Crear la entrada en pilot_team_season con is_wildkart=true
    const { error: ptsError } = await supabase
      .from('pilot_team_season')
      .insert([{
        pilot_id: pilotData.id,
        team_id: selectedTeam || null,
        season_id: selectedSeason,
        league_id: selectedLeague,
        is_wildkart: true,
      }]);

    if (ptsError) {
      setError(ptsError.message);
      // Rollback: eliminar el piloto creado
      await supabase.from('pilot').delete().eq('id', pilotData.id);
      setSaving(false);
      return;
    }

    router.push('/gestion-carrera/wildkarts');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Crear Piloto Wildkart
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: WILDKART JUAN"
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Número de Kart
          </label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Temporada
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(e.target.value);
              setSelectedLeague('');
            }}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar temporada</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Liga
          </label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar liga</option>
            {filteredLeagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Equipo
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar equipo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creando...' : 'Crear Wildkart'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/gestion-carrera/wildkarts')}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
