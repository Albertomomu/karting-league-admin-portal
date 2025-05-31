'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function EditarCarreraPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [race, setRace] = useState<any>(null);
  const [circuits, setCircuits] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: raceData, error } = await supabase
        .from('race')
        .select(`
          id, name, date, circuit_id, league_id,
          league:league_id ( id, name, season_id )
        `)
        .eq('id', id)
        .single();

      if (error || !raceData) {
        console.error('Error al cargar carrera', error);
        return;
      }

      setRace({
        name: raceData.name,
        date: raceData.date,
        circuit_id: raceData.circuit_id,
        league_id: raceData.league_id,
        season_id: raceData.league?.season_id ?? '',
      });

      const [{ data: circuitList }, { data: leagueList }, { data: seasonList }] =
        await Promise.all([
          supabase.from('circuit').select('id, name'),
          supabase.from('league').select('id, name, season_id'),
          supabase.from('season').select('id, name'),
        ]);

      setCircuits(circuitList || []);
      setLeagues(leagueList || []);
      setSeasons(seasonList || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const filteredLeagues = race?.season_id
    ? leagues.filter((l) => l.season_id === race.season_id)
    : [];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!race) return;

    const { error } = await supabase
      .from('race')
      .update({
        name: race.name,
        date: race.date,
        circuit_id: race.circuit_id,
        league_id: race.league_id,
      })
      .eq('id', id);

    if (!error) {
      router.push('/carreras');
    } else {
      console.error('Error al actualizar carrera', error);
    }
  };

  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando datos...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Editar Carrera</h1>

      <form onSubmit={handleUpdate} className="space-y-5">
        <InputField
          label="Nombre"
          value={race.name}
          onChange={(v) => setRace({ ...race, name: v })}
        />
        <InputField
          label="Fecha"
          type="date"
          value={race.date?.slice(0, 10)}
          onChange={(v) => setRace({ ...race, date: v })}
        />
        <SelectField
          label="Temporada"
          value={race.season_id}
          options={seasons}
          onChange={(val) =>
            setRace((prev: any) => ({
              ...prev,
              season_id: val,
              league_id: '',
            }))
          }
        />
        <SelectField
          label="Liga"
          value={race.league_id}
          options={filteredLeagues}
          onChange={(val) => setRace({ ...race, league_id: val })}
        />
        <SelectField
          label="Circuito"
          value={race.circuit_id}
          options={circuits}
          onChange={(val) => setRace({ ...race, circuit_id: val })}
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
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-gray-800 dark:text-gray-200">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block mb-1 text-gray-800 dark:text-gray-200">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
      >
        <option value="">Seleccionar</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
