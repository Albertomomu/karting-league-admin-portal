'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Season = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export default function TemporadasPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    supabase
      .from('season')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setSeasons(data);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Temporadas
      </h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Inicio</th>
              <th className="p-3">Fin</th>
              <th className="p-3">Activa</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr
                key={s.id}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3 text-gray-800 dark:text-white">{s.name}</td>
                <td className="p-3 text-gray-800 dark:text-white">
                  {new Date(s.start_date).toLocaleDateString()}
                </td>
                <td className="p-3 text-gray-800 dark:text-white">
                  {new Date(s.end_date).toLocaleDateString()}
                </td>
                <td className="p-3 text-gray-800 dark:text-white">
                  {s.is_active ? '✅' : '—'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/temporadas/${s.id}/editar`)}
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
