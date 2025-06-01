'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    pilotos: 0,
    equipos: 0,
    carreras: 0,
    vueltas: 0,
  });

  const [pilotosPorTemporada, setPilotosPorTemporada] = useState<any[]>([]);
  const [topPilotos, setTopPilotos] = useState<any[]>([]);
  const [vueltasPorSesion, setVueltasPorSesion] = useState<any[]>([]);
  const [ultimosResultados, setUltimosResultados] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [pilotCount, teamCount, raceCount, lapCount] = await Promise.all([
        supabase.from('pilot').select('*'),
        supabase.from('team').select('*'),
        supabase.from('race').select('*'),
        supabase.from('lap_time').select('*'),
      ]);

      setStats({
        pilotos: pilotCount.data?.length || 0,
        equipos: teamCount.data?.length || 0,
        carreras: raceCount.data?.length || 0,
        vueltas: lapCount.data?.length || 0,
      });

      const pilotosPorTemp = await supabase
        .from('pilot_team_season')
        .select('season:season_id(name), id');

      const agrupado = new Map<string, number>();
      pilotosPorTemp.data?.forEach((p) => {
        const name = p.season?.name || 'Desconocida';
        agrupado.set(name, (agrupado.get(name) || 0) + 1);
      });

      setPilotosPorTemporada(
        Array.from(agrupado.entries()).map(([name, count]) => ({
          name,
          pilotos: count,
        }))
      );

      const topPilots = await supabase
        .from('race_result')
        .select('points, pilot:pilot_id(id, name)')
        .then((res) => {
          const acumulado = new Map<string, { name: string; points: number }>();
          res.data?.forEach((r) => {
            const name = r.pilot?.name || 'Desconocido';
            if (!acumulado.has(name)) {
              acumulado.set(name, { name, points: r.points || 0 });
            } else {
              acumulado.get(name)!.points += r.points || 0;
            }
          });
          return Array.from(acumulado.values()).sort((a, b) => b.points - a.points).slice(0, 5);
        });

      setTopPilotos(topPilots);

      const vueltasSesion = await supabase
        .from('lap_time')
        .select('session:session_id(name), id');

      const vueltasGrouped = new Map<string, number>();
      vueltasSesion.data?.forEach((v) => {
        const name = v.session?.name || 'Desconocida';
        vueltasGrouped.set(name, (vueltasGrouped.get(name) || 0) + 1);
      });

      setVueltasPorSesion(
        Array.from(vueltasGrouped.entries()).map(([name, vueltas]) => ({ name, vueltas }))
      );

      const ultimos = await supabase
        .from('race_result')
        .select(
          'id, points, best_lap, pilot:pilot_id(name), race:race_id(name), session:session_id(name)'
        )
        .order('created_at', { ascending: false })
        .limit(5);

      setUltimosResultados(ultimos.data || []);
    };

    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
          <h2 className="text-sm text-gray-500 dark:text-gray-300">Pilotos</h2>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.pilotos}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
          <h2 className="text-sm text-gray-500 dark:text-gray-300">Equipos</h2>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.equipos}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
          <h2 className="text-sm text-gray-500 dark:text-gray-300">Carreras</h2>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.carreras}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center">
          <h2 className="text-sm text-gray-500 dark:text-gray-300">Vueltas</h2>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.vueltas}</p>
        </div>
      </div>

      {/* Gráfica pilotos por temporada */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Pilotos por Temporada
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pilotosPorTemporada}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="pilotos" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica puntos por piloto */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Top 5 Pilotos por Puntos
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topPilotos}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="points" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica vueltas por sesión */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Vueltas por Sesión
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={vueltasPorSesion}
              dataKey="vueltas"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {vueltasPorSesion.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Últimos resultados */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Últimos Resultados
        </h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {ultimosResultados.map((r) => (
            <li key={r.id} className="py-2 text-gray-700 dark:text-gray-200">
              <strong>{r.pilot?.name}</strong> - {r.points} pts -{' '}
              <span className="italic">{r.race?.name}</span> / {r.session?.name} - Mejor vuelta:{' '}
              <code>{r.best_lap || '—'}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
