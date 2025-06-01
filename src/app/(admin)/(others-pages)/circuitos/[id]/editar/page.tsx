'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Circuit } from '@/lib/supabase';

export default function EditarCircuitoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [circuit, setCircuit] = useState<Circuit | null>(null);

  useEffect(() => {
    const fetchCircuit = async () => {
      const { data, error } = await supabase
        .from('circuit')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setCircuit(data);
      } else {
        console.error('Error al cargar circuito', error);
      }

      setLoading(false);
    };

    fetchCircuit();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('circuit')
      .update({
        name: circuit?.name,
        location: circuit?.location,
        length: circuit?.length,
        turns: circuit?.turns,
        description: circuit?.description,
        record_lap_time: circuit?.record_lap_time,
        record_lap_pilot: circuit?.record_lap_pilot,
        image_url: circuit?.image_url,
      })
      .eq('id', id);

    if (!error) {
      router.push('/circuitos');
    } else {
      console.error('Error al actualizar circuito:', error);
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando datos...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Editar Circuito
      </h1>

      <form onSubmit={handleUpdate} className="space-y-5">
      <InputField
        label="Nombre"
        value={circuit?.name || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: v,
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Ubicación"
        value={circuit?.location || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: v,
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Longitud (m)"
        type="number"
        value={circuit?.length || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: v,
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Curvas"
        type="number"
        value={String(circuit?.turns || '')}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: Number(v),
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Descripción"
        value={circuit?.description || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: v,
            created_at: circuit?.created_at ?? null,
          })
        }
        textarea
      />
      <InputField
        label="Record Lap Time"
        value={circuit?.record_lap_time || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: v,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Piloto Record"
        value={circuit?.record_lap_pilot || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: v,
            image_url: circuit?.image_url ?? null,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />
      <InputField
        label="Imagen URL"
        value={circuit?.image_url || ''}
        onChange={v =>
          setCircuit({
            id: circuit?.id ?? '',
            name: circuit?.name ?? '',
            location: circuit?.location ?? '',
            length: circuit?.length ?? '',
            turns: circuit?.turns ?? 0,
            record_lap_time: circuit?.record_lap_time ?? null,
            record_lap_pilot: circuit?.record_lap_pilot ?? null,
            image_url: v,
            description: circuit?.description ?? null,
            created_at: circuit?.created_at ?? null,
          })
        }
      />

        <div className="pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block mb-1 text-gray-800 dark:text-gray-200">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
        />
      )}
    </div>
  );
}
