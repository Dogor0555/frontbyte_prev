// src/app/dashboard/notas-debito/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { FaSpinner, FaFilePdf, FaArrowLeft, FaFileAlt, FaCalendarAlt, FaUser, FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useRouter, useParams } from "next/navigation";

export default function NotaDetallePage() {
  const params = useParams();
  const numeroNota = params?.id;
  
  const [notaData, setNotaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipoNota, setTipoNota] = useState("debito"); // 'debito' o 'credito'
  const router = useRouter();

  useEffect(() => {
    const fetchNota = async () => {
      try {
        setLoading(true);
        
        // Intentar detectar el tipo de nota primero
        let esNotaDebito = false;
        let esNotaCredito = false;
        
        // Primero intentamos obtener como nota de débito
        let response = await fetch(`http://localhost:3000/notasdebito/${numeroNota}`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotaData(data);
          setTipoNota("debito");
          return;
        }
        
        // Si falla, intentamos como nota de crédito
        response = await fetch(`http://localhost:3000/notascredito/${numeroNota}`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotaData(data);
          setTipoNota("credito");
          return;
        }

        console.log(tipoNota);
        
        // Si ambos fallan, intentamos con el endpoint genérico de facturas
        response = await fetch(`http://localhost:3000/facturas/${numeroNota}`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotaData(data);
          
          // Determinar tipo basado en los campos de la factura
          if (data.tipodocumento === 'NOTA_DEBITO' || data.esnotadebito) {
            setTipoNota("debito");
          } else if (data.tipodocumento === 'NOTA_CREDITO' || data.esnotacredito) {
            setTipoNota("credito");
          } else {
            // Por defecto, intentamos determinar por la ruta o datos
            setTipoNota("debito");
          }
          return;
        }
        
        throw new Error("No se pudo encontrar la nota");
        
      } catch (err) {
        console.error("Error al cargar nota:", err);
        setError(err.message || "Ocurrió un error al cargar la nota");
      } finally {
        setLoading(false);
      }
    };
    
    if (numeroNota) {
      fetchNota();
    }
  }, [numeroNota]);

  // Configuración de colores y textos según el tipo de nota
  const configNota = {
    debito: {
      color: "purple",
      icon: FaPlusCircle,
      titulo: "DÉBITO",
      textoCompleto: "NOTA DE DÉBITO",
      bgColor: "bg-purple-600",
      borderColor: "border-purple-400",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
      prefijo: "ND"
    },
    credito: {
      color: "green",
      icon: FaMinusCircle,
      titulo: "CRÉDITO",
      textoCompleto: "NOTA DE CRÉDITO",
      bgColor: "bg-green-600",
      borderColor: "border-green-400",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
      prefijo: "NC"
    }
  };

  const config = configNota[tipoNota] || configNota.debito;
  const IconoNota = config.icon;

  const handleGeneratePDF = async () => {
    setGenerandoPDF(true);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${numeroNota}/descargar-pdf`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Error al descargar PDF");
        }
        throw new Error(errorData.detalles || errorData.error || "Error al descargar PDF");
      }
      
      const disposition = response.headers.get("Content-Disposition");
      let filename = `nota-${tipoNota}-${numeroNota}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        filename = disposition
          .split("filename=")[1]
          .replace(/"/g, "");
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                <button 
                  onClick={() => router.push('/dashboard/nota_debito')} 
                  className="mt-2 bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver a notas
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!notaData) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p>No se encontró la nota solicitada</p>
                <button 
                  onClick={() => router.push('/dashboard/nota_debito')} 
                  className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver a notas
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Fecha no disponible" : 
        date.toLocaleDateString('es-SV', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
    } catch {
      return "Fecha no disponible";
    }
  };

  // Determinar el número de nota a mostrar
  const numeroNotaDisplay = notaData.numerofacturausuario?.toString().padStart(4, '0') || notaData.iddtefactura;

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Sidebar para desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Botón para abrir sidebar en móvil */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed left-2 top-2 z-10 p-2 rounded-md bg-white shadow-md text-gray-600"
        >
          ☰
        </button>

        {/* Contenido con scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => router.push('/dashboard/nota_debito')}
                className="flex items-center text-purple-600 hover:text-purple-800"
              >
                <FaArrowLeft className="mr-1" /> Volver a notas
              </button>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-white ${config.bgColor}`}>
                  {config.textoCompleto}
                </span>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generandoPDF || !notaData?.documentofirmado}
                  className={`flex items-center px-4 py-2 rounded ${
                    generandoPDF ? 'bg-gray-400' : 
                    !notaData?.documentofirmado ? 'bg-gray-500' : 
                    `${config.bgColor} hover:opacity-90`
                  } text-white`}
                >
                  {generandoPDF ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Generando...
                    </>
                  ) : !notaData?.documentofirmado ? (
                    <>
                      <FaFilePdf className="mr-2" /> PDF no disponible
                    </>
                  ) : (
                    <>
                      <FaFilePdf className="mr-2" /> Descargar PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Encabezado de la nota */}
              <div className={`${config.bgColor} text-white p-4`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <IconoNota className="mr-2 text-xl" />
                    <span className="font-semibold text-xl">
                      {config.prefijo}-{numeroNotaDisplay}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${config.bgColor} bg-opacity-30`}>
                    {config.textoCompleto}
                  </span>
                </div>
              </div>

              {/* Información general */}
              <div className="text-black p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Emisor</h2>
                  <p className="font-medium">{notaData.emisor?.nombre || "No disponible"}</p>
                  <p>NIT: {notaData.emisor?.nit || "No disponible"}</p>
                  {notaData.emisor?.nrc && <p>NRC: {notaData.emisor.nrc}</p>}
                  <p>Teléfono: {notaData.emisor?.telefono || "No disponible"}</p>
                  {notaData.emisor?.correo && <p>Correo: {notaData.emisor.correo}</p>}
                  {notaData.emisor?.sucursal && <p>Sucursal: {notaData.emisor.sucursal}</p>}
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Cliente</h2>
                  <p className="font-medium">{notaData.nombrecibe || "Cliente no especificado"}</p>
                  <p>Documento: {notaData.docuentrega || "No disponible"}</p>
                  <p>Teléfono: {notaData.telefono || "No disponible"}</p>
                  {notaData.correo && <p>Correo: {notaData.correo}</p>}
                </div>
              </div>

              {/* Detalles de la nota */}
              <div className="p-5 border-t">
                <div className="flex items-center mb-4 text-gray-600">
                  <FaCalendarAlt className={`mr-2 ${config.textColor}`} />
                  <span className="font-medium">Fecha: {formatDate(notaData.fechaemision)}</span>
                  {notaData.horaemision && (
                    <span className="font-medium ml-2">Hora: {notaData.horaemision}</span>
                  )}
                </div>

                {/* Conceptos de la nota */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">
                    Conceptos de la nota de {tipoNota === 'debito' ? 'débito' : 'crédito'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border">Descripción</th>
                          <th className="py-2 px-4 border">Cantidad</th>
                          <th className="py-2 px-4 border">P. Unitario</th>
                          <th className="py-2 px-4 border">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notaData.productos && notaData.productos.length > 0 ? (
                          notaData.productos.map((producto, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-2 px-4 border">
                                {producto.descripcion}
                              </td>
                              <td className="py-2 px-4 border text-center">{Number(producto.cantidad).toFixed(0)}</td>
                              <td className="py-2 px-4 border text-right">{formatCurrency(producto.precioUnitario)}</td>
                              <td className="py-2 px-4 border text-right">{formatCurrency(producto.total)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-4 px-4 border text-center text-gray-500">
                              No hay conceptos detallados para esta nota
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="flex justify-end">
                  <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(notaData.subtotal || notaData.montototaloperacion || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">IVA:</span>
                      <span className="font-medium">{formatCurrency(notaData.valoriva || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold">{formatCurrency(notaData.totalapagar || notaData.montototaloperacion || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Total en letras */}
                {notaData.valorletras && (
                  <div className="mt-6 p-4 bg-gray-50 rounded">
                    <p className="font-semibold">Total en letras:</p>
                    <p className="italic">{notaData.valorletras}</p>
                  </div>
                )}

                {/* Información adicional */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Información adicional:</p>
                  <p>Forma de pago: {notaData.formapago || "No especificado"}</p>
                  <p>Tipo de venta: {notaData.tipoventa || "No especificado"}</p>
                  <p>Estado: {notaData.estado || "No especificado"}</p>
                  <p>Número de control: {notaData.ncontrol || "No disponible"}</p>
                  {notaData.codigo && <p>Código: {notaData.codigo}</p>}
                  {notaData.transaccioncontable && <p>Transacción: {notaData.transaccioncontable}</p>}
                  {notaData.verjson && <p>Versión JSON: {notaData.verjson}</p>}
                </div>

                {/* Información de factura relacionada */}
                {notaData.iddte_relacionado && (
                  <div className={`mt-4 p-4 ${config.bgLight} rounded border-l-4 ${config.borderColor}`}>
                    <p className={`font-semibold ${config.textColor}`}>
                      Nota relacionada con factura:
                    </p>
                    <p>Esta nota de {tipoNota === 'debito' ? 'débito' : 'crédito'} está relacionada con la factura #{notaData.iddte_relacionado}</p>
                  </div>
                )}

                {/* Motivo específico para notas de crédito */}
                {tipoNota === 'credito' && notaData.motivo && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <p className="font-semibold text-yellow-800">Motivo de la nota de crédito:</p>
                    <p>{notaData.motivo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}