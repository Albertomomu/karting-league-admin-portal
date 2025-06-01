'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/context/AuthContext';

export default function NuevoPilotoPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [licencia, setLicencia] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const router = useRouter();
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    if (!session) {
      setError('Debes iniciar sesión para crear un piloto.');
      setCargando(false);
      return;
    }

    const { data, error: insertError } = await supabase.from('pilot').insert([
      {
        name: nombre,
        email,
        license_number: licencia,
        user_id: session.user.id,
        role: 'pilot',
      },
    ]);

    if (insertError) {
      setError('Error al crear el piloto: ' + insertError.message);
      setCargando(false);
    } else {
      router.push('/pilotos');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Crear nuevo piloto</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>Nombre completo</Label>
          <Input
            placeholder="Nombre del piloto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Número de licencia</Label>
          <Input
            placeholder="Número de licencia"
            value={licencia}
            onChange={(e) => setLicencia(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={cargando}>
          {cargando ? 'Creando...' : 'Crear piloto'}
        </Button>
      </form>
    </div>
  );
}
