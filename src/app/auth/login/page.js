// src/app/auth/login/page.js
"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Image from 'next/image';
import img from '../../images/factura.jpg';
import logo from '../../images/logoo.png';
import { useRouter } from "next/navigation";
import { login } from '../../services/auth';
import { API_BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const routeAttempt = `${API_BASE_URL}/login`;
    console.log("Intentando conectar al backend. Ruta:", routeAttempt);

    try {
      const result = await login(email, password);
      console.log("Conexión exitosa al backend. Ruta:", routeAttempt);
      
      // Guardar información del empleado en localStorage
      if (result.empleado) {
        localStorage.setItem('empleado', JSON.stringify(result.empleado));
      }
      
      router.push("/dashboard");
    } catch (error) {
      console.error("No se pudo conectar al backend. Ruta:", routeAttempt, error);
      setError(error.message || "Error al iniciar sesión. Verifica tus credenciales y conexión con Hacienda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4 md:p-8">
      <div className="animate-fadeIn flex w-full max-w-5xl flex-col-reverse overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl md:flex-row">
        {/* Columna Izquierda */}
        <div className="w-full p-6 md:w-1/2 md:p-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 text-center md:mb-6">
              <div className="relative mx-auto h-20 w-20 md:h-24 md:w-24 animate-fadeInDown rounded-full overflow-hidden">
                <Image
                  src={logo}
                  alt="Byte Fusion Soluciones"
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  priority
                />
              </div>

              <h1 className="animate-fadeInDown mt-4 text-lg font-bold text-blue-900 md:text-xl">
                Facturador Electrónico
              </h1>
            </div>

            <div className="animate-fadeInUp">
              <h2 className="text-center mb-2 text-lg font-semibold text-gray-900 md:text-xl">
                Iniciar Sesión
              </h2>
              <p className="text-center mb-6 text-sm text-gray-600">
                Accede a tu sistema de facturación electrónica
              </p>

              {error && (
                <div className="mb-4 text-center text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black text-sm transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:px-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="relative transform transition-all duration-200 hover:translate-y-[-2px]">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black text-sm transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:px-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 transition-colors duration-200 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full transform rounded-md bg-blue-900 py-2 text-sm text-white transition-all duration-200 hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    "Ingresar al Facturador"
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center md:mt-6">
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                Sistema de Facturación Electrónica de Byte Fusion Soluciones
                <br />
                Versión 1.0 2025
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="h-48 w-full overflow-hidden md:h-auto md:w-1/2">
          <Image
            src={img}
            alt="Ilustración del Sistema de Facturación Electrónica"
            className="h-full w-full scale-100 object-cover transition-transform duration-700 hover:scale-110"
            priority
          />
        </div>
      </div>
    </div>
  );
}