'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarLigaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [league, setLeague] = useState({ name: '', description: '', season_id: '' });
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: leagueData }, { data: seasonData }] = await Promise.all([
        supabase.from('league').select('name, description, season_id').eq('id', id).single(),
        supabase.from('season').select('id, name'),
      ]);

      if (leagueData) {
        setLeague({
          name: leagueData.name,
          description: leagueData.description || '',
          season_id: leagueData.season_id || '',
        });
      }

      setSeasons(seasonData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('league')
      .update({
        name: league.name,
        description: league.description || null,
        season_id: league.season_id || null,
      })
      .eq('id', id);

    if (!error) {
      router.push('/ligas');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando liga...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Liga
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={league.name}
            onChange={(e) => setLeague({ ...league, name: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Descripción</label>
          <textarea
            value={league.description}
            onChange={(e) => setLeague({ ...league, description: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Temporada</label>
          <select
            value={league.season_id}
            onChange={(e) => setLeague({ ...league, season_id: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">Sin temporada asignada</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
