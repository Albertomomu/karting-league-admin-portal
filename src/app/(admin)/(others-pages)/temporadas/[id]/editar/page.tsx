'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarTemporadaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [season, setSeason] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('season')
      .select('name, start_date, end_date, is_active')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSeason({
            name: data.name,
            start_date: data.start_date.slice(0, 10),
            end_date: data.end_date.slice(0, 10),
            is_active: data.is_active,
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('season')
      .update({
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date,
        is_active: season.is_active,
      })
      .eq('id', id);

    if (!error) {
      router.push('/temporadas');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando temporada...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Temporada
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={season.name}
            onChange={(e) => setSeason({ ...season, name: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 text-gray-800 dark:text-gray-200">Inicio</label>
            <input
              type="date"
              value={season.start_date}
              onChange={(e) => setSeason({ ...season, start_date: e.target.value })}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-gray-800 dark:text-gray-200">Fin</label>
            <input
              type="date"
              value={season.end_date}
              onChange={(e) => setSeason({ ...season, end_date: e.target.value })}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={season.is_active}
            onChange={(e) => setSeason({ ...season, is_active: e.target.checked })}
          />
          <label className="text-gray-800 dark:text-gray-200">Temporada activa</label>
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
