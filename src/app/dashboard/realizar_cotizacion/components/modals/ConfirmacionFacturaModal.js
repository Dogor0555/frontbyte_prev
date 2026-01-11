"use client";
import { FaTimes, FaCheck, FaEdit } from "react-icons/fa";

export default function ConfirmacionFacturaModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  datosFactura 
}) {
  if (!isOpen) return null;

const formatMoney = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "$0.00";
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  
  return `$${numericValue.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Confirmar Factura</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Información General</h3>
              <p><span className="font-medium">Número:</span> {datosFactura.numeroFactura}</p>
              <p><span className="font-medium">Fecha:</span> {datosFactura.fechaHoraEmision?.fechaEmision?.split('T')[0]}</p>
              <p><span className="font-medium">Hora:</span> {datosFactura.fechaHoraEmision?.horaEmision}</p>
              <p><span className="font-medium">Condición de pago:</span> {datosFactura.condicionPago}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Totales</h3>
              <p><span className="font-medium">Subtotal:</span> {formatMoney(datosFactura.sumaopesinimpues)}</p>
              <p><span className="font-medium">Descuentos:</span> {formatMoney(datosFactura.totaldescuento)}</p>
              <p><span className="font-medium">IVA:</span> {formatMoney(datosFactura.valoriva)}</p>
              <p className="font-bold text-lg"><span className="font-medium">Total:</span> {formatMoney(datosFactura.total)}</p>
            </div>
          </div>

          {/* Datos del Emisor */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Datos del Emisor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Actividad económica:</span> {datosFactura.actividadEconomica}</p>
                <p><span className="font-medium">Dirección:</span> {datosFactura.direccionEmisor}</p>
              </div>
              <div>
                <p><span className="font-medium">Teléfono:</span> {datosFactura.telefonoEmisor}</p>
                <p><span className="font-medium">Correo:</span> {datosFactura.correoVendedor}</p>
              </div>
            </div>
          </div>

          {/* Datos del Receptor */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Datos del Receptor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Nombre:</span> {datosFactura.nombreReceptor}</p>
                <p><span className="font-medium">Documento:</span> {datosFactura.numeroDocumentoReceptor} ({datosFactura.tipoDocumentoReceptor})</p>
                <p><span className="font-medium">Dirección:</span> {datosFactura.direccionReceptor}</p>
              </div>
              <div>
                <p><span className="font-medium">Teléfono:</span> {datosFactura.telefonoReceptor}</p>
                <p><span className="font-medium">Correo:</span> {datosFactura.correoReceptor}</p>
                <p><span className="font-medium">Complemento:</span> {datosFactura.complementoReceptor}</p>
              </div>
            </div>
          </div>

          {/* Items de la factura */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Detalles de la Factura</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Descripción</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Cantidad</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Precio Unitario</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFactura.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border">{item.descripcion}</td>
                      <td className="px-4 py-2 border">{item.cantidad}</td>
                      <td className="px-4 py-2 border">{formatMoney(item.precioUnitario)}</td>
                      <td className="px-4 py-2 border">{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formas de pago */}
          {datosFactura.formasPago && datosFactura.formasPago.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-yellow-800 mb-3">Formas de Pago</h3>
              {datosFactura.formasPago.map((pago, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <p><span className="font-medium">{pago.metodo}:</span> {formatMoney(pago.monto)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Datos de entrega */}
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-purple-800 mb-3">Datos de Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-purple-700">Emisor del documento</h4>
                <p><span className="font-medium">Documento:</span> {datosFactura.datosEntrega?.emisorDocumento}</p>
                <p><span className="font-medium">Nombre:</span> {datosFactura.datosEntrega?.emisorNombre}</p>
              </div>
              <div>
                <h4 className="font-medium text-purple-700">Receptor del documento</h4>
                <p><span className="font-medium">Documento:</span> {datosFactura.datosEntrega?.receptorDocumento}</p>
                <p><span className="font-medium">Nombre:</span> {datosFactura.datosEntrega?.receptorNombre}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal */}
        <div className="flex justify-end space-x-4 p-6 border-t">
          <button
            onClick={onClose}
            className="flex items-center bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
          >
            <FaTimes className="mr-2" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <FaCheck className="mr-2" />
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}