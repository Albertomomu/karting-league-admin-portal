'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarResultadoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('race_result')
        .select(`
          id,
          race:race_id ( id, name ),
          session:session_id ( id, name ),
          pilot:pilot_id ( id, name, avatar_url ),
          race_position,
          best_lap,
          points
        `)
        .eq('id', id)
        .single();

      if (!data || error) {
        console.error('Error cargando resultado:', error);
        return;
      }

      setResultData({
        race_id: data.race.id,
        race_name: data.race.name,
        session_id: data.session.id,
        session_name: data.session.name,
        pilot_id: data.pilot.id,
        pilot_name: data.pilot.name,
        avatar_url: data.pilot.avatar_url,
        race_position: data.race_position ?? '',
        best_lap: data.best_lap ?? '',
        points: data.points ?? '',
      });

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('race_result')
      .update({
        race_position: resultData.race_position === '' ? null : Number(resultData.race_position),
        best_lap: resultData.best_lap || null,
        points: resultData.points === '' ? null : Number(resultData.points),
      })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar resultado:', error);
    } else {
      router.push('/resultados');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando resultado...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Resultado
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          {resultData.avatar_url ? (
            <img
              src={resultData.avatar_url}
              alt={resultData.pilot_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-700 text-white flex items-center justify-center">
              {resultData.pilot_name.charAt(0)}
            </div>
          )}
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {resultData.pilot_name}
          </span>
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Carrera</label>
          <input
            disabled
            value={resultData.race_name}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded border"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Sesión</label>
          <input
            disabled
            value={resultData.session_name}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded border"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Posición</label>
          <input
            type="number"
            value={resultData.race_position}
            onChange={(e) =>
              setResultData({ ...resultData, race_position: e.target.value })
            }
            className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Mejor Vuelta</label>
          <input
            type="text"
            value={resultData.best_lap}
            onChange={(e) =>
              setResultData({ ...resultData, best_lap: e.target.value })
            }
            placeholder="ej. 00:58.124"
            className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Puntos</label>
          <input
            type="number"
            value={resultData.points}
            onChange={(e) =>
              setResultData({ ...resultData, points: e.target.value })
            }
            className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white"
          />
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
