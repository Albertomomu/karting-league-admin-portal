'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type Result = {
  id: string;
  race_id: string;
  race_name: string;
  session_id: string;
  session_name: string;
  pilot_id: string;
  pilot_name: string;
  avatar_url: string;
  race_position: number | null;
  best_lap: string | null;
  points: number | null;
};

function single<T>(rel: T | T[] | null | undefined): T {
  if (Array.isArray(rel)) return rel[0];
  return rel as T;
}

export default function EditarResultadoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<Result | null>(null);

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
        .single()
        .overrideTypes<Result>();

      if (!data || error) {
        console.error('Error cargando resultado:', error);
        return;
      }

      setResultData({
        race_id: single(data.race)?.id ?? '',
        race_name: single(data.race)?.name ?? '',
        session_id: single(data.session)?.id ?? '',
        session_name: single(data.session)?.name ?? '',
        pilot_id: single(data.pilot)?.id ?? '',
        pilot_name: single(data.pilot)?.name ?? '',
        avatar_url: single(data.pilot)?.avatar_url ?? '',
        race_position: data.race_position ?? null,
        best_lap: data.best_lap ?? null,
        points: data.points ?? null,
        id: data.id,
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
        race_position: resultData?.race_position === null ? null : Number(resultData?.race_position),
        best_lap: resultData?.best_lap || null,
        points: resultData?.points === null ? null : Number(resultData?.points),
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
          {resultData?.avatar_url ? (
            <Image
              src={resultData?.avatar_url}
              alt={resultData?.pilot_name}
              className="w-10 h-10 rounded-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-700 text-white flex items-center justify-center">
              {resultData?.pilot_name.charAt(0)}
            </div>
          )}
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {resultData?.pilot_name}
          </span>
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Carrera</label>
          <input
            disabled
            value={resultData?.race_name}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded border"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Sesión</label>
          <input
            disabled
            value={resultData?.session_name}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded border"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Posición</label>
          <input
            type="number"
            value={resultData?.race_position ?? ''}
            onChange={(e) =>
              setResultData({
                id: resultData?.id ?? '',
                race_id: resultData?.race_id ?? '',
                race_name: resultData?.race_name ?? '',
                session_id: resultData?.session_id ?? '',
                session_name: resultData?.session_name ?? '',
                pilot_id: resultData?.pilot_id ?? '',
                pilot_name: resultData?.pilot_name ?? '',
                avatar_url: resultData?.avatar_url ?? '',
                race_position: Number(e.target.value),
                best_lap: resultData?.best_lap ?? null,
                points: resultData?.points ?? null,
              })
            }
            className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Mejor Vuelta</label>
          <input
            type="text"
            value={resultData?.best_lap ?? ''}
            onChange={(e) =>
              setResultData({
                id: resultData?.id ?? '',
                race_id: resultData?.race_id ?? '',
                race_name: resultData?.race_name ?? '',
                session_id: resultData?.session_id ?? '',
                session_name: resultData?.session_name ?? '',
                pilot_id: resultData?.pilot_id ?? '',
                pilot_name: resultData?.pilot_name ?? '',
                avatar_url: resultData?.avatar_url ?? '',
                race_position: resultData?.race_position ?? null,
                best_lap: e.target.value,
                points: resultData?.points ?? null,
              })
            }
            placeholder="ej. 00:58.124"
            className="w-full px-4 py-2 rounded border bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Puntos</label>
          <input
            type="number"
            value={resultData?.points ?? ''}
            onChange={(e) =>
              setResultData({
                id: resultData?.id ?? '',
                race_id: resultData?.race_id ?? '',
                race_name: resultData?.race_name ?? '',
                session_id: resultData?.session_id ?? '',
                session_name: resultData?.session_name ?? '',
                pilot_id: resultData?.pilot_id ?? '',
                pilot_name: resultData?.pilot_name ?? '',
                avatar_url: resultData?.avatar_url ?? '',
                race_position: resultData?.race_position ?? null,
                best_lap: resultData?.best_lap ?? null,
                points: Number(e.target.value),
              })
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
