"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaPaperPlane, FaExclamationTriangle, FaSpinner, FaInfoCircle } from "react-icons/fa";
import Link from "next/link";
import { API_BASE_URL } from "../../../../lib/api";

export default function NuevoTicketPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "media",
    categoria: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.titulo.trim()) {
      setError("El título es requerido");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el ticket");
      }

      router.push(`/dashboard/soporte/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/soporte"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a mis tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Crear Nuevo Ticket</h1>
          <p className="text-gray-600 mt-1">
            Describe tu problema y nuestro equipo de soporte te ayudará
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Breve descripción del problema"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="5"
                placeholder="Describe detalladamente el problema que estás experimentando..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="baja">Baja - Problema menor</option>
                <option value="media">Media - Afecta parcialmente mi trabajo</option>
                <option value="alta">Alta - Afecta significativamente mi trabajo</option>
                <option value="urgente">Urgente - Sistema no funciona</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar categoría</option>
                <option value="facturacion">Facturación</option>
                <option value="dte">DTE / Hacienda</option>
                <option value="reportes">Reportes</option>
                <option value="productos">Productos / Inventario</option>
                <option value="clientes">Clientes</option>
                <option value="usuarios">Usuarios / Empleados</option>
                <option value="tecnico">Problema Técnico</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creando ticket...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Crear Ticket
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FaInfoCircle className="text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-800">
                <strong>Consejo:</strong> Proporciona la mayor cantidad de detalles posible,
                incluye capturas de pantalla si es necesario. Esto ayudará a resolver tu problema más rápido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}