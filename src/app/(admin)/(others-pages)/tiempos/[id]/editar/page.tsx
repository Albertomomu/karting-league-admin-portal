'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarTiempoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lapData, setLapData] = useState<{ lap_number: number; time: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLap = async () => {
      const { data } = await supabase
        .from('lap_time')
        .select('lap_number, time')
        .eq('id', id)
        .single();

      if (data) {
        setLapData({
          lap_number: data.lap_number,
          time: data.time,
        });
      }
      setLoading(false);
    };

    fetchLap();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lapData) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from('lap_time')
      .update({
        lap_number: lapData.lap_number,
        time: lapData.time,
      })
      .eq('id', id);

    if (!error) {
      router.push('/tiempos');
    } else {
      setError('Error al guardar los cambios');
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-700 dark:text-white">Cargando tiempo...</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Editar Tiempo</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-800 dark:text-gray-200 mb-1">Vuelta</label>
          <input
            type="number"
            value={lapData?.lap_number || ''}
            onChange={(e) =>
              setLapData((prev) => ({ ...prev!, lap_number: Number(e.target.value) }))
            }
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-gray-800 dark:text-gray-200 mb-1">Tiempo</label>
          <input
            type="text"
            value={lapData?.time || ''}
            onChange={(e) => setLapData((prev) => ({ ...prev!, time: e.target.value }))}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
