"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaMoneyBill, FaCreditCard, FaExchangeAlt, FaFileInvoiceDollar, FaSyncAlt } from "react-icons/fa";

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
    
    if (formasPago.length === 0 && totalFactura > 0) {
      setMontoPago(totalFactura.toFixed(2));
    }
  }, [formasPago, totalFactura]);

  const sincronizarFormasPago = () => {
    if (formasPago.length === 0 && totalFactura > 0) {
      const nuevaFormaPago = {
        id: Date.now(),
        formaPago: formaPagoSeleccionada,
        monto: totalFactura,
        numeroDocumento: numeroDocumento || null,
        plazo: condicionPago === "Crédito" ? `${plazo} ${periodo}` : null
      };
      
      setFormasPago([nuevaFormaPago]);
      setMontoRestante(0);
      setMontoPago("");
    } else {
      const totalPagado = formasPago.reduce((sum, pago) => sum + pago.monto, 0);
      const diferencia = totalFactura - totalPagado;
      
      if (diferencia !== 0) {
        if (formasPago.length > 0) {
          const formasPagoActualizadas = [...formasPago];
          const ultimaFormaPago = formasPagoActualizadas[formasPagoActualizadas.length - 1];
          
          const nuevoMonto = Math.max(0, ultimaFormaPago.monto + diferencia);
          formasPagoActualizadas[formasPagoActualizadas.length - 1] = {
            ...ultimaFormaPago,
            monto: nuevoMonto
          };
          
          setFormasPago(formasPagoActualizadas);
        }
      }
    }
  };

  // Sincronizar automáticamente cuando cambie el total de la factura
  useEffect(() => {
    if (totalFactura > 0 && formasPago.length > 0) {
      const totalPagado = formasPago.reduce((sum, pago) => sum + pago.monto, 0);
      
      // Si hay una diferencia significativa (> 0.01), sugerir sincronización
      if (Math.abs(totalFactura - totalPagado) > 0.01) {
        // No sincronizar automáticamente, solo actualizar el monto restante
        // El usuario decidirá si quiere sincronizar
      }
    }
  }, [totalFactura, formasPago]);

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

    const monto = parseFloat(montoPago);
    
    if (monto > montoRestante) {
      alert("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    const nuevoPago = {
      id: Date.now(),
      formaPago: formaPagoSeleccionada,
      monto: monto,
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

  // Función para limpiar todas las formas de pago
  const limpiarFormasPago = () => {
    setFormasPago([]);
    setMontoPago(totalFactura > 0 ? totalFactura.toFixed(2) : "");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Forma de Pago</h2>
        
        {/* Botón para sincronizar automáticamente */}
        {formasPago.length > 0 && Math.abs(montoRestante) > 0.01 && (
          <button
            onClick={sincronizarFormasPago}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
            title="Sincronizar formas de pago con el total actual"
          >
            <FaSyncAlt className="mr-1" />
            Sincronizar
          </button>
        )}
      </div>
      
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
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Contado</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="Crédito"
              checked={condicionPago === "Crédito"}
              onChange={() => setCondicionPago("Crédito")}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Crédito</span>
          </label>
        </div>
      </div>

      {/* Información del total */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="font-medium">Total Factura:</span>
            <span className="ml-2 font-semibold">
              {totalFactura.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
          <div>
            <span className="font-medium">Total Pagado:</span>
            <span className="ml-2 font-semibold">
              {formasPago.reduce((sum, pago) => sum + pago.monto, 0)
                .toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
          <div>
            <span className="font-medium">Saldo Pendiente:</span>
            <span className={`ml-2 font-semibold ${
              montoRestante > 0 ? 'text-red-600' : 
              montoRestante < 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {montoRestante.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>
        
        {/* Mensaje de advertencia si hay desfase */}
        {Math.abs(montoRestante) > 0.01 && (
          <div className={`mt-2 text-xs ${
            montoRestante > 0 ? 'text-red-600' : 'text-orange-600'
          }`}>
            {montoRestante > 0 
              ? `Falta cubrir ${montoRestante.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}`
              : `Hay un excedente de ${(-montoRestante).toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}`
            }
          </div>
        )}
      </div>

      {/* Detalle de forma de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
          <select
            value={formaPagoSeleccionada}
            onChange={(e) => setFormaPagoSeleccionada(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            max={montoRestante > 0 ? montoRestante : totalFactura}
            value={montoPago}
            onChange={(e) => setMontoPago(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          <div className="text-xs text-gray-500 mt-1">
            Máximo: {montoRestante > 0 ? montoRestante.toLocaleString('es-SV', { style: 'currency', currency: 'USD' }) : totalFactura.toLocaleString('es-SV', { style: 'currency', currency: 'USD' })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">N° Doc.</label>
          <input
            type="text"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="días">Días</option>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Botones para agregar forma de pago y limpiar */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={agregarFormaPago}
          disabled={montoRestante <= 0 || !montoPago || parseFloat(montoPago) <= 0}
          className={`flex items-center px-4 py-2 rounded-md ${
            montoRestante <= 0 || !montoPago || parseFloat(montoPago) <= 0
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <FaPlus className="mr-2" />
          Agregar Forma de Pago
        </button>

        {formasPago.length > 0 && (
          <button
            onClick={limpiarFormasPago}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            <FaTrash className="mr-2" />
            Limpiar Todo
          </button>
        )}

        {/* Botón para agregar automáticamente el total restante */}
        {montoRestante > 0.01 && formasPago.length > 0 && (
          <button
            onClick={() => {
              setMontoPago(montoRestante.toFixed(2));
            }}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            <FaMoneyBill className="mr-2" />
            Usar Saldo Pendiente
          </button>
        )}
      </div>

      {/* Listado de formas de pago registradas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Formas de Pago Registradas</h3>
        
        {formasPago.length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
            <FaMoneyBill className="mx-auto text-gray-400 text-3xl mb-2" />
            <p className="text-gray-500 italic">No se han registrado formas de pago</p>
          </div>
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
                        title="Eliminar forma de pago"
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
                  <td className={`px-4 py-2 font-semibold ${
                    montoRestante > 0 ? 'text-red-600' : 
                    montoRestante < 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
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