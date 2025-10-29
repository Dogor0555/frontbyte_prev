"use client";
import { useState, useEffect } from "react";
import { FaSpinner, FaFilePdf, FaArrowLeft, FaFileAlt, FaCalendarAlt, FaUser, FaBox, FaTicketAlt } from "react-icons/fa";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useRouter, useParams } from "next/navigation";

export default function CreditoDetallePage() {
  const params = useParams();
  const numeroCredito = params?.id;
  
  const [creditoData, setCreditoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [generandoTicket, setGenerandoTicket] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCredito = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/creditos/${numeroCredito}/productos`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Error al cargar crédito";
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("Formato de respuesta no válido");
          }
        }
        
        setCreditoData(data);
      } catch (err) {
        console.error("Error al cargar crédito:", err);
        setError(err.message || "Ocurrió un error al cargar el crédito");
      } finally {
        setLoading(false);
      }
    };
    
    if (numeroCredito) {
      fetchCredito();
    }
  }, [numeroCredito]);

  const handleGeneratePDF = async () => {
    setGenerandoPDF(true);
    try {
      if (!creditoData?.factura?.documentofirmado) {
        throw new Error("El crédito no tiene documento firmado");
      }

      const pdfResponse = await fetch("http://localhost:3000/api/generar-pdf/credito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token: creditoData.factura.documentofirmado,
          tipo: "credito",
          creditoId: creditoData.factura.iddtefactura
        }),
        credentials: "include"
      });

      if (!pdfResponse.ok) throw new Error("Error al generar PDF");

      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `CRD-${creditoData.factura.numerofacturausuario || '0000'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleGenerateTicket = async () => {
    setGenerandoTicket(true);
    try {
      if (!creditoData?.factura?.documentofirmado) {
        throw new Error("El crédito no tiene documento firmado");
      }

      const response = await fetch(`http://localhost:3000/facturas/${numeroCredito}/descargar-compacto`, {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(errorText || "Error al descargar ticket");
        }
        throw new Error(errorData.detalles || errorData.error || "Error al descargar ticket");
      }
      
      const ticketBlob = await response.blob();
      const ticketUrl = URL.createObjectURL(ticketBlob);
      const link = document.createElement('a');
      link.href = ticketUrl;
      link.download = `TICKET-CRD-${creditoData.factura.numerofacturausuario || numeroCredito}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(ticketUrl);
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert("Error al generar el ticket: " + error.message);
    } finally {
      setGenerandoTicket(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-green-500 rounded-full border-t-transparent"></div>
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
                  onClick={() => router.push('/dashboard/creditos')} 
                  className="mt-2 bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver a créditos
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!creditoData) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p>No se encontró el crédito solicitado</p>
                <button 
                  onClick={() => router.push('/dashboard/creditos')} 
                  className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver a créditos
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
                onClick={() => router.push('/dashboard/creditos')}
                className="flex items-center text-green-600 hover:text-green-800"
              >
                <FaArrowLeft className="mr-1" /> Volver a créditos
              </button>
              
              <div className="flex gap-2">
                {/* Botón Generar Ticket */}
                <button
                  onClick={handleGenerateTicket}
                  disabled={generandoTicket || !creditoData?.factura?.documentofirmado}
                  className={`flex items-center px-4 py-2 rounded ${
                    generandoTicket ? 'bg-gray-400' : 
                    !creditoData?.factura?.documentofirmado ? 'bg-gray-500' : 
                    'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {generandoTicket ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Generando...
                    </>
                  ) : !creditoData?.factura?.documentofirmado ? (
                    <>
                      <FaTicketAlt className="mr-2" /> Ticket no disponible
                    </>
                  ) : (
                    <>
                      <FaTicketAlt className="mr-2" /> Generar Ticket
                    </>
                  )}
                </button>

                {/* Botón Descargar PDF */}
                <button
                  onClick={handleGeneratePDF}
                  disabled={generandoPDF || !creditoData?.factura?.documentofirmado}
                  className={`flex items-center px-4 py-2 rounded ${
                    generandoPDF ? 'bg-gray-400' : 
                    !creditoData?.factura?.documentofirmado ? 'bg-gray-500' : 
                    'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {generandoPDF ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Generando...
                    </>
                  ) : !creditoData?.factura?.documentofirmado ? (
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

            <div className="bg-white text-green-900 rounded-xl shadow-md overflow-hidden">
              {/* Encabezado de crédito */}
              <div className="bg-green-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FaFileAlt className="mr-2 text-xl" />
                    <span className="font-semibold text-xl">
                      CRD-{creditoData.factura.numerofacturausuario?.toString().padStart(4, '0') || '0000'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    creditoData.factura.tipoventa === 'crédito' ? 'bg-green-700' : 'bg-green-800'
                  }`}>
                    {creditoData.factura.tipoventa?.toUpperCase() || 'CRÉDITO FISCAL'}
                  </span>
                </div>
              </div>

              {/* Información general */}
              <div className="text-black p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Emisor</h2>
                  <p className="font-medium">{creditoData.emisor.nombre || "Nombre no disponible"}</p>
                  <p>NIT: {creditoData.emisor.nit || "NIT no disponible"}</p>
                  <p>NRC: {creditoData.emisor.nrc || "NRC no disponible"}</p>
                  <p>Teléfono: {creditoData.emisor.telefono || "Teléfono no disponible"}</p>
                  <p>Correo: {creditoData.emisor.correo || "Correo no disponible"}</p>
                  <p>Sucursal: {creditoData.emisor.sucursal || "Sucursal no disponible"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Cliente</h2>
                  <p className="font-medium">{creditoData.cliente.nombre || "Cliente no disponible"}</p>
                  <p>Documento: {creditoData.cliente.documento || "Documento no disponible"}</p>
                  <p>Teléfono: {creditoData.cliente.telefono || "Teléfono no disponible"}</p>
                  <p>Correo: {creditoData.cliente.correo || "Correo no disponible"}</p>
                </div>
              </div>

              {/* Detalles de crédito */}
              <div className="p-5 border-t">
                <div className="flex items-center mb-4 text-gray-600">
                  <FaCalendarAlt className="mr-2 text-green-500" />
                  <span className="font-medium">Fecha: {creditoData.factura.fechaemision?.split("T")[0] || formatDate(creditoData.factura.fechaemision)}</span>
                  {creditoData.factura.horaemision && (
                    <span className="font-medium ml-2">Hora: {creditoData.factura.horaemision}</span>
                  )}
                </div>

                {/* Tabla de productos */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Productos/Servicios</h3>
                  {creditoData.productos && creditoData.productos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-4 border-b text-left">Descripción</th>
                            <th className="py-2 px-4 border-b text-center">Cantidad</th>
                            <th className="py-2 px-4 border-b text-right">Precio Unitario</th>
                            <th className="py-2 px-4 border-b text-right">Gravado</th>
                            <th className="py-2 px-4 border-b text-right">Exento</th>
                            <th className="py-2 px-4 border-b text-right">No Sujeto</th>
                            <th className="py-2 px-4 border-b text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditoData.productos.map((producto, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="py-2 px-4 border-b">{producto.descripcion || "Producto"}</td>
                              <td className="py-2 px-4 border-b text-center">{Math.floor(producto.cantidad) || 1}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.precioUnitario || 0)}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.ventagravada || 0)}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.ventaExenta || 0)}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.ventaNoSujeta || 0)}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.total || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                      <p className="text-yellow-800 flex items-center">
                        <FaBox className="mr-2" /> No hay productos registrados para este crédito
                      </p>
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className="flex justify-end">
                  <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Venta Gravada:</span>
                      <span className="font-medium">{formatCurrency(creditoData.factura.ventagravada)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Venta Exenta:</span>
                      <span className="font-medium">{formatCurrency(creditoData.factura.ventaexenta)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Venta No Sujeta:</span>
                      <span className="font-medium">{formatCurrency(creditoData.factura.ventanosuj)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(creditoData.factura.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">IVA:</span>
                      <span className="font-medium">{formatCurrency(creditoData.factura.valoriva)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold">{formatCurrency(creditoData.factura.totalapagar)}</span>
                    </div>
                  </div>
                </div>

                {/* Total en letras */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Total en letras:</p>
                  <p className="italic">{creditoData.factura.valorletras || "No disponible"}</p>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Información adicional:</p>
                  <p>Forma de pago: {creditoData.factura.formapago || "No especificado"}</p>
                  <p>Tipo de venta: {creditoData.factura.tipoventa || "No especificado"}</p>
                  <p>Estado: {creditoData.factura.estado || "No especificado"}</p>
                  <p>N° Control: {creditoData.factura.ncontrol || "No disponible"}</p>
                </div>
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