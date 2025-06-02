"use client";

import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Autenticación
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      setError("Credenciales incorrectas o cuenta no válida.");
      setLoading(false);
      return;
    }

    // 2. Buscar el piloto asociado a ese usuario
    const userId = signInData.session.user.id;
    const { data: pilot, error: pilotError } = await supabase
      .from("pilot")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (pilotError || !pilot) {
      setError("No tienes permisos para acceder al panel.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Verificar rol
    if (pilot.role !== "admin") {
      setError("No tienes permisos de administrador.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 4. Si todo OK, redirigir al panel
    router.push("/");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Introduce tu correo y contraseña para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-white/80">
                  Correo electrónico <span className="text-error-500">*</span>
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                  placeholder="admin@kartingleague.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-white/80">
                  Contraseña <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                    type={showPassword ? "text" : "password"}
                    placeholder="Introduce tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Mantener sesión iniciada
                  </span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  ¿Olvidaste la contraseña?
                </Link>
              </div>

              <div>
                <button
                  className="w-full px-4 py-2 rounded-md bg-brand-500 text-white font-semibold hover:bg-brand-600 transition disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Accediendo..." : "Entrar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
