'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarSesionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [sessionData, setSessionData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('session')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (data) setSessionData({ name: data.name });
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('session')
      .update({ name: sessionData.name })
      .eq('id', id);

    if (!error) {
      router.push('/sesiones');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando sesión...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Sesión
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={sessionData.name}
            onChange={(e) => setSessionData({ name: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
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
