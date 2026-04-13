'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Team } from '@/lib/supabase';

export default function EditarWildkartPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [number, setNumber] = useState<number | ''>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [licensePoints, setLicensePoints] = useState<number>(10);
  const [pilotId, setPilotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('team').select('id, name').order('name').then(({ data }) => setTeams(data as Team[] || []));
  }, []);

  useEffect(() => {
    const fetchWildkart = async () => {
      // Cargar la entrada pilot_team_season
      const { data, error } = await supabase
        .from('pilot_team_season')
        .select('id, pilot_id, team_id, license_points, pilot:pilot_id (id, name, number)')
        .eq('id', id)
        .single();

      if (error || !data) {
        setError('Error al cargar los datos del wildkart.');
        console.error(error);
        setLoading(false);
        return;
      }

      const pilot = data.pilot as unknown as { id: string; name: string; number: number };
      setPilotId(pilot.id);
      setName(pilot.name);
      setNumber(pilot.number);
      setSelectedTeam(data.team_id || '');
      setLicensePoints(data.license_points ?? 10);
      setLoading(false);
    };

    if (id) fetchWildkart();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Actualizar el piloto
    const { error: pilotError } = await supabase
      .from('pilot')
      .update({ name, number: Number(number) })
      .eq('id', pilotId);

    if (pilotError) {
      setError('Error al actualizar el piloto: ' + pilotError.message);
      setSaving(false);
      return;
    }

    // Actualizar pilot_team_season
    const { error: ptsError } = await supabase
      .from('pilot_team_season')
      .update({ team_id: selectedTeam || null, license_points: licensePoints })
      .eq('id', id);

    if (ptsError) {
      setError('Error al actualizar la asignación: ' + ptsError.message);
      setSaving(false);
      return;
    }

    router.push('/gestion-carrera/wildkarts');
  };

  if (loading) return <p className="p-6 text-gray-800 dark:text-white">Cargando...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Editar Wildkart
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Número de Kart
          </label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Equipo
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Sin equipo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Puntos de Licencia
          </label>
          <input
            type="number"
            value={licensePoints}
            onChange={(e) => setLicensePoints(Number(e.target.value))}
            min={0}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/gestion-carrera/wildkarts')}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
