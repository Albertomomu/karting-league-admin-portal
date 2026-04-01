'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ImageUpload from '@/components/ui/ImageUpload';

export default function EditarEquipoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [team, setTeam] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from('team')
        .select('name, logo_url')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al cargar equipo', error);
      } else {
        setTeam(data);
      }
      setLoading(false);
    };

    fetchTeam();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from('team')
      .update({
        name: team.name,
        logo_url: team.logo_url,
      })
      .eq('id', id);

    if (error) {
      setError('Error al guardar los cambios');
      setSaving(false);
    } else {
      router.push('/equipos');
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando datos...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Editar Equipo
      </h1>

      <form onSubmit={handleUpdate} className="space-y-5">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre del equipo</label>
          <input
            type="text"
            value={team?.name || ''}
            onChange={e =>
              setTeam({
                name: e.target.value,
                logo_url: team?.logo_url ?? null,
              })
            }
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <ImageUpload
          bucket="team-logos"
          currentUrl={team?.logo_url ?? null}
          onUpload={(url) =>
            setTeam({
              name: team?.name ?? '',
              logo_url: url,
            })
          }
          label="Logo del equipo"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
