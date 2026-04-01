'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ui/ImageUpload';

export default function CrearEquipo() {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error } = await supabase.from('team').insert([
      {
        name,
        logo_url: logoUrl,
      },
    ]);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push('/equipos');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Crear Nuevo Equipo
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <ImageUpload
          bucket="team-logos"
          currentUrl={logoUrl}
          onUpload={setLogoUrl}
          label="Logo del equipo (opcional)"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Creando...' : 'Crear Equipo'}
        </button>
      </form>
    </div>
  );
}
