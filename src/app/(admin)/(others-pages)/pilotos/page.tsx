'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Pilot = {
  id: string;
  name: string;
  number: number;
  avatar_url: string | null;
  created_at: string;
};

export default function PilotsPage() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchPilots = async () => {
      const { data, error } = await supabase
        .from('pilot')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pilots:', error);
        return;
      }

      setPilots(data || []);
    };

    fetchPilots();
  }, []);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = pilots.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(pilots.length / itemsPerPage);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Pilotos Registrados
        </h1>
        <button
          onClick={() => router.push('/pilotos/crear')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Añadir Piloto
        </button>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">Mostrar:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border rounded px-3 py-1 dark:bg-gray-800 dark:text-white"
        >
          {[5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} por página
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
              <th className="p-3">Fecha de Registro</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((pilot) => (
              <tr
                key={pilot.id}
                className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="p-3">
                  {pilot.avatar_url ? (
                    <img
                      src={pilot.avatar_url}
                      alt={pilot.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white font-semibold">
                      {pilot.name.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="p-3 text-gray-800 dark:text-white">{pilot.name}</td>
                <td className="p-3 text-gray-800 dark:text-white">{pilot.number}</td>
                <td className="p-3 text-gray-800 dark:text-white">
                  {new Date(pilot.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/pilotos/${pilot.id}/editar`)}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
