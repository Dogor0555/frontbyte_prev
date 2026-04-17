"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaBoxOpen, FaPlus } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { API_BASE_URL } from "@/lib/api";

export default function InventarioMP() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  // ✅ FIX 1: modal state
  const [openModal, setOpenModal] = useState(false);

  // ✅ FIX 2: form state
  const [form, setForm] = useState({
    nombre: "",
    stock: "",
    unidad: "",
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/materias-primas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error inventario:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter((item) =>
    item.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const getStockColor = (stock) => {
    if (stock <= 10) return "text-red-500";
    if (stock <= 30) return "text-yellow-500";
    return "text-green-600";
  };

  // ✅ FIX 3: input handler
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ FIX 4: submit POST
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/materias-primas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          stock: Number(form.stock),
          unidad: form.unidad,
        }),
      });

      if (!res.ok) throw new Error("Error al crear");

      await fetchData();

      setForm({ nombre: "", stock: "", unidad: "" });
      setOpenModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-blue-100">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl text-blue-800 flex items-center gap-2">
              <FaBoxOpen /> Inventario Materia Prima
            </h1>

            {/* ✅ FIX 5: open modal */}
            <button
              onClick={() => setOpenModal(true)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <FaPlus className="text-sm" />
              Nueva Materia Prima
            </button>
          </div>

          {/* BUSCADOR */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm mb-5 px-4 py-3 flex items-center gap-3">

            <FaSearch className="text-gray-400 text-lg" />

            <input
              type="text"
              placeholder="Buscar materia prima..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          {/* TABLA */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Nombre</th>
                  <th className="px-5 py-3 text-left">Stock</th>
                  <th className="px-5 py-3 text-left">Unidad</th>
                  <th className="px-5 py-3 text-left">Última actualización</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70">

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {item.nombre}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockColor(item.stock)}`}>
                        {item.stock}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.unidad}
                    </td>

                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

        </main>

        {/* 🔥 TU FOOTER NO SE TOCÓ */}
        <Footer />
      </div>

{/* MODAL */}
{openModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

    <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 p-6 animate-fadeIn">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
          <FaBoxOpen />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Nueva Materia Prima
          </h2>
          <p className="text-sm text-gray-500">
            Agrega un nuevo insumo al inventario
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* NOMBRE */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: Harina, Azúcar..."
            className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
            required
          />
        </div>

        {/* UNIDAD */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Unidad de medida</label>

          <select
            name="unidad"
            value={form.unidad}
            onChange={handleChange}
            className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
            required
          >
            <option value="">Seleccionar unidad</option>
            <option value="KG">Kilogramos (KG)</option>
            <option value="LB">Libras (LB)</option>
            <option value="G">Gramos (G)</option>
            <option value="LT">Litros (LT)</option>
            <option value="ML">Mililitros (ML)</option>
            <option value="UND">Unidad (UND)</option>
          </select>
        </div>

        {/* INFO BOX */}
        <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl border border-blue-100">
          El stock se calculará automáticamente mediante compras y movimientos de inventario.
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3 pt-2">

          <button
            type="button"
            onClick={() => setOpenModal(false)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md transition-all"
          >
            Guardar
          </button>

        </div>

      </form>

    </div>
  </div>
)}

    </div>
  );
}