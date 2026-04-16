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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">

            <h2 className="text-xl font-bold mb-4">
              Nueva Materia Prima
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="w-full border rounded-lg p-2"
              />

              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="Stock"
                className="w-full border rounded-lg p-2"
              />

              <input
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                placeholder="Unidad"
                className="w-full border rounded-lg p-2"
              />

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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