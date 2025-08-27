// src/app/dashboard/unauthorized/page.js
"use client";

import Link from "next/link";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 py-6 px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <FaExclamationTriangle className="text-red-600 text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-blue-200 text-sm">No tienes permisos para acceder a esta sección</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Esta área está limitada a usuarios con permisos de administrador.
                Si necesitas acceso, contacta al administrador del sistema.
              </p>
            </div>

            <div className="space-y-2 text-gray-600 text-sm mb-6">
              <p>• Solo personal autorizado puede acceder</p>
              <p>• Se requieren credenciales de administrador</p>
              <p>• Contacta con soporte para solicitar acceso</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FaHome className="text-sm" />
              Volver al Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              Volver atrás
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">¿Necesitas ayuda?</p>
              <div className="space-y-1 text-xs">
                <p className="text-gray-600">
                  <span className="font-medium">Soporte técnico:</span> soporte@bytefusion.com
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Teléfono:</span> +123 456 7890
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 py-4 px-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Byte Fusion Soluciones</span>
            <span className="text-xs text-gray-500">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}