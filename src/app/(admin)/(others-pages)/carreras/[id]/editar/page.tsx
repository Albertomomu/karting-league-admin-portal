'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Tipos explícitos
type League = {
  id: string;
  name: string;
  season_id: string;
};

type RaceData = {
  id: string;
  name: string;
  date: string;
  circuit_id: string;
  league_id: string;
  league: League | null;
};

export default function EditarCarreraPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [race, setRace] = useState<{
    name: string;
    date: string;
    circuit_id: string;
    league_id: string;
    season_id: string;
  } | null>(null);

  const [circuits, setCircuits] = useState<{ id: string; name: string }[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: raceData, error } = await supabase
        .from('race')
        .select(`
          id, name, date, circuit_id, league_id,
          league:league_id ( id, name, season_id )
        `)
        .eq('id', id)
        .single<RaceData>();

      if (error || !raceData) {
        console.error('Error al cargar carrera', error);
        return;
      }

      setRace({
        name: raceData.name,
        date: raceData.date,
        circuit_id: raceData.circuit_id,
        league_id: raceData.league_id,
        season_id: raceData.league?.season_id ?? '',
      });

      const [{ data: circuitList }, { data: leagueList }, { data: seasonList }] =
        await Promise.all([
          supabase.from('circuit').select('id, name'),
          supabase.from('league').select('id, name, season_id'),
          supabase.from('season').select('id, name'),
        ]);

      setCircuits(circuitList || []);
      setLeagues(leagueList || []);
      setSeasons(seasonList || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!race) return;

    const { error } = await supabase
      .from('race')
      .update({
        name: race.name,
        date: race.date,
        circuit_id: race.circuit_id,
        league_id: race.league_id,
      })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar carrera:', error);
    } else {
      router.push('/carreras');
    }
  };

  if (loading || !race) {
    return <p className="p-6 text-gray-700 dark:text-white">Cargando datos...</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Carrera
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={race.name}
            onChange={(e) => setRace({ ...race, name: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Fecha</label>
          <input
            type="date"
            value={race.date}
            onChange={(e) => setRace({ ...race, date: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Circuito</label>
          <select
            value={race.circuit_id}
            onChange={(e) => setRace({ ...race, circuit_id: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          >
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Temporada</label>
          <select
            disabled
            value={race.season_id}
            className="w-full px-4 py-2 border rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Liga</label>
          <select
            value={race.league_id}
            onChange={(e) => setRace({ ...race, league_id: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
