"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaMoneyBill, FaCreditCard, FaExchangeAlt, FaFileInvoiceDollar } from "react-icons/fa";

export default function FormaPago({ 
  condicionPago, 
  setCondicionPago, 
  formasPago, 
  setFormasPago,
  totalFactura 
}) {
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState("01");
  const [montoPago, setMontoPago] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [plazo, setPlazo] = useState("");
  const [periodo, setPeriodo] = useState("días");
  const [montoRestante, setMontoRestante] = useState(totalFactura);

  useEffect(() => {
    const totalPagado = formasPago.reduce((sum, pago) => sum + pago.monto, 0);
    setMontoRestante(totalFactura - totalPagado);
  }, [formasPago, totalFactura]);

  const tiposFormaPago = [
    { codigo: "01", nombre: "Billetes y Monedas" },
    { codigo: "02", nombre: "Tarjeta Débito" },
    { codigo: "03", nombre: "Tarjeta Crédito" },
    { codigo: "04", nombre: "Cheque" },
    { codigo: "05", nombre: "Transferencia–Depósito Bancario" },
    { codigo: "06", nombre: "Dinero electrónico" },
    { codigo: "07", nombre: "Monedero electrónico" },
    { codigo: "08", nombre: "Bitcoin" },
    { codigo: "09", nombre: "Otras Criptomonedas" },
    { codigo: "10", nombre: "Cuentas por Pagar del Receptor" },
    { codigo: "11", nombre: "Giro bancario" },
    { codigo: "99", nombre: "Otros (se debe indicar el medio de pago)" }
  ];

  const obtenerNombreFormaPago = (codigo) => {
    const formaPago = tiposFormaPago.find(fp => fp.codigo === codigo);
    return formaPago ? formaPago.nombre : "Desconocido";
  };

  const agregarFormaPago = () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      alert("Ingrese un monto válido");
      return;
    }

    if (parseFloat(montoPago) > montoRestante) {
      alert("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    const nuevoPago = {
      id: Date.now(),
      formaPago: formaPagoSeleccionada,
      monto: parseFloat(montoPago),
      numeroDocumento: numeroDocumento || null,
      plazo: condicionPago === "Crédito" ? `${plazo} ${periodo}` : null
    };

    setFormasPago([...formasPago, nuevoPago]);
    setMontoPago("");
    setNumeroDocumento("");
    setPlazo("");
  };

  const eliminarFormaPago = (id) => {
    setFormasPago(formasPago.filter(pago => pago.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Forma de Pago</h2>
      
      {/* Condición de la Operación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Condición de la Operación</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="Contado"
              checked={condicionPago === "Contado"}
              onChange={() => setCondicionPago("Contado")}
              className="form-radio h-4 w-4 text-green-600"
            />
            <span className="ml-2">Contado</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="Crédito"
              checked={condicionPago === "Crédito"}
              onChange={() => setCondicionPago("Crédito")}
              className="form-radio h-4 w-4 text-green-600"
            />
            <span className="ml-2">Crédito</span>
          </label>
        </div>
      </div>

      {/* Detalle de forma de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
          <select
            value={formaPagoSeleccionada}
            onChange={(e) => setFormaPagoSeleccionada(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            {tiposFormaPago.map((fp) => (
              <option key={fp.codigo} value={fp.codigo}>
                {fp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto:
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={montoRestante}
            value={montoPago}
            onChange={(e) => setMontoPago(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">N° Doc.</label>
          <input
            type="text"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="Número de documento"
          />
        </div>

        {condicionPago === "Crédito" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo</label>
              <input
                type="number"
                min="1"
                value={plazo}
                onChange={(e) => setPlazo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: 30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="días">Días</option>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Botón para agregar forma de pago */}
      <div className="mb-6">
        <button
          onClick={agregarFormaPago}
          disabled={montoRestante <= 0}
          className={`flex items-center px-4 py-2 rounded-md ${
            montoRestante <= 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          <FaPlus className="mr-2" />
          Agregar Forma de Pago
        </button>
      </div>

      {/* Listado de formas de pago registradas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Formas de Pago Registradas</h3>
        
        {formasPago.length === 0 ? (
          <p className="text-gray-500 italic">No se han registrado formas de pago</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Forma de Pago</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Monto</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">N° Documento</th>
                  {condicionPago === "Crédito" && (
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Plazo</th>
                  )}
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formasPago.map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-4 py-2 border-b">
                      {obtenerNombreFormaPago(pago.formaPago)}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {pago.monto.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {pago.numeroDocumento || "N/A"}
                    </td>
                    {condicionPago === "Crédito" && (
                      <td className="px-4 py-2 border-b">
                        {pago.plazo || "N/A"}
                      </td>
                    )}
                    <td className="px-4 py-2 border-b">
                      <button
                        onClick={() => eliminarFormaPago(pago.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2 font-semibold border-t">Total Pagado:</td>
                  <td className="px-4 py-2 font-semibold border-t">
                    {formasPago.reduce((sum, pago) => sum + pago.monto, 0)
                      .toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-2 border-t" colSpan={condicionPago === "Crédito" ? 2 : 1}></td>
                  <td className="px-4 py-2 border-t"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">Saldo Pendiente:</td>
                  <td className="px-4 py-2 font-semibold">
                    {montoRestante.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-2" colSpan={condicionPago === "Crédito" ? 2 : 1}></td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}