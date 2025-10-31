// components/MensajeModal.js (versión actualizada)
import { FaCheckCircle, FaExclamationTriangle, FaTimes, FaDownload, FaEnvelope } from "react-icons/fa";

export default function MensajeModal({ 
  isOpen, 
  onClose, 
  tipo = "exito", 
  titulo, 
  mensaje, 
  detalles,
  onDescargarTicket,
  onEnviarDteCorreo,
  idFactura,
  descargando = false,
  enviandoCorreo = false,
  mostrarEnvioCorreo = false
}) {
  if (!isOpen) return null;

  const config = {
    exito: {
      icono: <FaCheckCircle className="text-4xl text-green-500" />,
      colorBorde: "border-green-500",
      colorFondo: "bg-green-50",
    },
    error: {
      icono: <FaExclamationTriangle className="text-4xl text-red-500" />,
      colorBorde: "border-red-500",
      colorFondo: "bg-red-50",
    },
    advertencia: {
      icono: <FaExclamationTriangle className="text-4xl text-yellow-500" />,
      colorBorde: "border-yellow-500",
      colorFondo: "bg-yellow-50",
    }
  };

  const { icono, colorBorde, colorFondo } = config[tipo] || config.error;

  const handleDescargarTicket = () => {
    if (onDescargarTicket && idFactura) {
      onDescargarTicket(idFactura);
    }
  };

  const handleEnviarDteCorreo = () => {
    if (onEnviarDteCorreo && idFactura) {
      onEnviarDteCorreo(idFactura);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md ${colorBorde} border-t-4`}>
        {/* Header */}
        <div className={`px-6 py-4 ${colorFondo} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icono}
              <h3 className="text-xl font-semibold text-gray-800">{titulo}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{mensaje}</p>
          
          {detalles && (
            <div className="bg-gray-100 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{detalles}</p>
            </div>
          )}

          {/* Botones para éxito */}
          {tipo === "exito" && idFactura && (
            <div className="space-y-3 mb-4">
              {/* Botón de descarga */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 mb-2">
                  ¿Desea descargar el comprobante de la factura?
                </p>
                <button
                  onClick={handleDescargarTicket}
                  disabled={descargando}
                  className={`flex items-center justify-center w-full px-4 py-2 rounded-md ${
                    descargando 
                      ? "bg-blue-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white transition-colors`}
                >
                  {descargando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Descargando...
                    </>
                  ) : (
                    <>
                      <FaDownload className="mr-2" />
                      Generar Ticket de Factura
                    </>
                  )}
                </button>
              </div>

              {/* Botón de envío por correo - Solo mostrar cuando se transmitió exitosamente */}
              {mostrarEnvioCorreo && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 mb-2">
                    ¿Desea enviar el DTE por correo electrónico al cliente?
                  </p>
                  <button
                    onClick={handleEnviarDteCorreo}
                    disabled={enviandoCorreo}
                    className={`flex items-center justify-center w-full px-4 py-2 rounded-md ${
                      enviandoCorreo 
                        ? "bg-green-400 cursor-not-allowed" 
                        : "bg-green-600 hover:bg-green-700"
                    } text-white transition-colors`}
                  >
                    {enviandoCorreo ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaEnvelope className="mr-2" />
                        Enviar DTE por Correo
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}