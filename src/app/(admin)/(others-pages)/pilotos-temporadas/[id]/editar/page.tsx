'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EditarPilotoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pilotData, setPilotData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('pilot_team_season')
        .select(`
          id,
          pilot:pilot_id ( id, name, number, avatar_url ),
          team:team_id ( id, name ),
          season:season_id ( id, name ),
          league:league_id ( id, name, season_id )
        `)
        .eq('id', id)
        .single();

      if (!data || error) {
        console.error('Error al cargar datos del piloto', error);
        setLoading(false);
        return;
      }

      setPilotData({
        pilot_id: data.pilot.id,
        name: data.pilot.name,
        number: data.pilot.number,
        avatar_url: data.pilot.avatar_url,
        team_id: data.team.id,
        season_id: data.season.id,
        league_id: data.league.id,
      });

      const [teamRes, seasonRes, leagueRes] = await Promise.all([
        supabase.from('team').select('id, name'),
        supabase.from('season').select('id, name'),
        supabase.from('league').select('id, name, season_id'),
      ]);

      setTeams(teamRes.data || []);
      setSeasons(seasonRes.data || []);
      setLeagues(leagueRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Filtra ligas por temporada seleccionada
  const filteredLeagues = pilotData?.season_id
    ? leagues.filter((l) => l.season_id === pilotData.season_id)
    : [];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotData) return;

    const [{ error: ptsError }, { error: pilotError }] = await Promise.all([
      supabase
        .from('pilot_team_season')
        .update({
          team_id: pilotData.team_id,
          season_id: pilotData.season_id,
          league_id: pilotData.league_id,
        })
        .eq('id', id),

      supabase
        .from('pilot')
        .update({
          name: pilotData.name,
          number: pilotData.number,
        })
        .eq('id', pilotData.pilot_id),
    ]);

    if (ptsError || pilotError) {
      console.error('Error al actualizar:', ptsError || pilotError);
    } else {
      router.push('/pilotos-temporadas');
    }
  };


  if (loading) return <p className="p-6 text-gray-700 dark:text-white">Cargando datos...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Editar Piloto
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Nombre</label>
          <input
            type="text"
            value={pilotData.name}
            onChange={(e) =>
              setPilotData({ ...pilotData, name: e.target.value })
            }
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Número</label>
          <input
            type="number"
            value={pilotData.number}
            onChange={(e) =>
              setPilotData({ ...pilotData, number: Number(e.target.value) })
            }
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Temporada</label>
          <select
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            value={pilotData.season_id}
            onChange={(e) =>
              setPilotData({ ...pilotData, season_id: e.target.value, league_id: '' })
            }
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Liga</label>
          <select
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            value={pilotData.league_id}
            onChange={(e) =>
              setPilotData({ ...pilotData, league_id: e.target.value })
            }
          >
            {filteredLeagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-800 dark:text-gray-200">Equipo</label>
          <select
            className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
            value={pilotData.team_id}
            onChange={(e) =>
              setPilotData({ ...pilotData, team_id: e.target.value })
            }
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

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
