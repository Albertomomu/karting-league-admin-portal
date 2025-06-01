'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditarPerfilPage() {
  const { user, pilot } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', number: '', avatar_url: '' });

  useEffect(() => {
    if (pilot) {
      setForm({
        name: pilot.name || '',
        number: pilot.number?.toString() || '',
        avatar_url: pilot.avatar_url || '',
      });
      setLoading(false);
    }
  }, [pilot]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('pilot')
      .update({
        name: form.name,
        number: Number(form.number),
        avatar_url: form.avatar_url,
      })
      .eq('user_id', user.id);

    if (!error) {
      router.push('/profile');
    } else {
      alert('Error al actualizar el perfil');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando perfil...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Editar Perfil</h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Número</label>
          <input
            type="number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Avatar URL</label>
          <input
            type="text"
            value={form.avatar_url}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
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
