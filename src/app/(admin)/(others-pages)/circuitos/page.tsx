'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Circuit = {
  id: string;
  name: string;
  location: string;
  length: number;
  turns: number;
  image_url: string | null;
};

export default function CircuitosPage() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCircuits = async () => {
      const { data, error } = await supabase
        .from('circuit')
        .select('id, name, location, length, turns, image_url');

      if (!error && data) setCircuits(data);
      else console.error(error);
    };

    fetchCircuits();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Circuitos
      </h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-3">Imagen</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Ubicación</th>
              <th className="p-3">Longitud (m)</th>
              <th className="p-3">Curvas</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {circuits.map((circuit) => (
              <tr
                key={circuit.id}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3">
                  {circuit.image_url ? (
                    <img
                      src={circuit.image_url}
                      alt={circuit.name}
                      className="w-14 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-14 h-10 bg-gray-300 dark:bg-gray-700 rounded" />
                  )}
                </td>
                <td className="p-3 text-gray-900 dark:text-white">{circuit.name}</td>
                <td className="p-3 text-gray-700 dark:text-white">{circuit.location}</td>
                <td className="p-3 text-gray-700 dark:text-white">{circuit.length}</td>
                <td className="p-3 text-gray-700 dark:text-white">{circuit.turns}</td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/circuitos/${circuit.id}/editar`)}
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
