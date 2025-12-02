import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";

export default function TaxModal({
  isOpen,
  onClose,
  onAddItem
}) {
  const [impuesto, setImpuesto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState(0);
  const [tipo, setTipo] = useState("gravado");

  if (!isOpen) return null;

  const handleAgregarItem = () => {
    if (!descripcion.trim() || monto <= 0 || !impuesto) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    onAddItem({
      descripcion: descripcion.trim(),
      cantidad: 1,
      precioUnitario: monto,
      descuento: 0,
      unidadMedida: "99",
      tipo: tipo
    });
  };

  return (
    <div className="text-black fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-auto">
        {/* Encabezado */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold">Item DTE</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          {/* Subtítulo */}
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Adición detalle de DTE</h3>

          {/* Impuestos/Tasas con afección al IVA */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Impuestos/Tasas con afección al IVA</h4>

            {/* Impuesto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Impuesto</label>
              <select
                value={impuesto}
                onChange={(e) => setImpuesto(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Otros impuestos casos especiales</option>
                <option value="19">19 - Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulante</option>
                <option value="20">20 - Impuesto al Valor Agregado 13%</option>
                <option value="28">28 - Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                <option value="31">31 - Detallistas o Expendedores de Bebidas Alcohólicas</option>
                <option value="32">32 - Fabricante de Cerveza</option>
                <option value="33">33 - Importador de Cerveza</option>
                <option value="34">34 - Fabricante de Productos de Tabaco</option>
                <option value="35">35 - Importador de Productos de Tabaco</option>
                <option value="36">36 - Fabricante de Armas de Fuego, Municiones y Artículos. Similares</option>
                <option value="37">37 - Importador de Arma de Fueg,Munición y Artis. Simil</option>
                <option value="38">38 - Fabricante de Explosivos</option>
                <option value="39">39 - Importador de Explosivos</option>
                <option value="42">42 - Fabricante de Productos Pirotécnicos</option>
                <option value="43">43 - Importador de Productos Pirotécnicos</option>
                <option value="44">44 - Productor de Tabaco</option>
                <option value="50">50 - Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                <option value="51">51 - Bebidas Alcohólicas</option>
                <option value="52">52 - Cerveza</option>
                <option value="53">53 - Productos del Tabaco</option>
                <option value="54">54 - Bebidas Carbonatadas o Gaseosas Simples o Endulzadas</option>
                <option value="55">55 - Otros Específicos</option>
                <option value="58">58 - Alcohol</option>
                <option value="59">59 - Turismo: por alojamiento (5%)</option>
                <option value="71">71 - Turismo: salida del país por vía aérea $7.00</option>
                <option value="77">77 - Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                <option value="78">78 - Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                <option value="79">79 - Sobre Llamadas Telefónicas Provenientes del Ext.</option>
                <option value="85">85 - Detallista de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                <option value="86">86 - Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                <option value="91">91 - Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                <option value="92">92 - Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                <option value="A1">A1 - Específicos y Ad-valorem</option>
                <option value="A5">A5 - Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes</option>
                <option value="A7">A7 - Alcohol Etílico</option>
                <option value="A9">A9 - Sacos Sintéticos</option>
                <option value="C5">C5 - Impuesto ad- valorem por diferencial de precios de Bebidas Alcohólicas (8%)</option>
                <option value="C6">C6 - Impuesto ad- valorem por diferencial de precios al tabaco cigarrillos (39%)</option>
                <option value="C7">C7 - Impuesto ad- valorem por diferencial de precios al tabaco cigarros (100%)</option>
                <option value="C8">C8 - COTRANS ($0.10 Ctvs. por galón)</option>
                <option value="D1">D1 - FOVIAL ($0.20 Ctvs. por galón)</option>
                <option value="D4">D4 - Otros impuestos casos especiales</option>
                <option value="D5">D5 - Otras tasas casos especiales</option>
              </select>
            </div>

            {/* Grid de descripción y monto */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción"
                />
              </div>
            </div>

            {/* Grid de Monto y Tipo */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Monto"
                />
                <span className="text-xs text-red-600">Requerido.</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gravado">Gravado</option>
                  <option value="exento">Exento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h5 className="font-semibold text-gray-900 mb-3">Resumen del Impuesto</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Monto:</span>
                <span className="font-medium">${monto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tipo:</span>
                <span className="font-medium capitalize">{tipo}</span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarItem}
              className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Agregar Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}