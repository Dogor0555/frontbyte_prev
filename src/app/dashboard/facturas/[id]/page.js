"use client";
import { useState, useEffect } from "react";
import { FaSpinner, FaFilePdf, FaArrowLeft, FaFileAlt, FaCalendarAlt, FaUser, FaBox } from "react-icons/fa";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import { useRouter, useParams } from "next/navigation";

export default function FacturaDetallePage() {
  const params = useParams();
  const idFactura = params?.id;
  
  const [facturaData, setFacturaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/facturas/productos/${idFactura}`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al cargar factura");
        }
        
        const data = await response.json();
        setFacturaData(data);
      } catch (err) {
        console.error("Error al cargar factura:", err);
        setError(err.message || "Ocurrió un error al cargar la factura");
      } finally {
        setLoading(false);
      }
    };
    
    if (idFactura) {
      fetchFactura();
    }
  }, [idFactura]);

  const handleGeneratePDF = async () => {
    setGenerandoPDF(true);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${idFactura}/descargar-pdf?code=VERIFICATION_CODE`, {
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
          throw new Error(errorText || "Error al descargar PDF");
        }
        throw new Error(errorData.detalles || errorData.error || "Error al descargar PDF");
      }
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `FAC-${facturaData.factura.numerofacturausuario || idFactura}.pdf`;
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
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
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
                  onClick={() => router.back()} 
                  className="mt-2 bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!facturaData) {
    return (
      <div className="flex min-h-screen bg-blue-50">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p>No se encontró la factura solicitada</p>
                <button 
                  onClick={() => router.back()} 
                  className="mt-2 bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-3 rounded"
                >
                  <FaArrowLeft className="inline mr-1" /> Volver
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
                onClick={() => router.back()}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <FaArrowLeft className="mr-1" /> Volver a facturas
              </button>
              
              <button
                onClick={handleGeneratePDF}
                disabled={generandoPDF || !facturaData?.factura?.documentofirmado}
                className={`flex items-center px-4 py-2 rounded ${
                  generandoPDF ? 'bg-gray-400' : 
                  !facturaData?.factura?.documentofirmado ? 'bg-gray-500' : 
                  'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {generandoPDF ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Generando...
                  </>
                ) : !facturaData?.factura?.documentofirmado ? (
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

            <div className="bg-white text-blue-900 rounded-xl shadow-md overflow-hidden">
              {/* Encabezado de factura */}
              <div className="bg-blue-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FaFileAlt className="mr-2 text-xl" />
                    <span className="font-semibold text-xl">
                      FAC-{facturaData.factura.numerofacturausuario?.toString().padStart(4, '0') || '0000'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    facturaData.factura.tipoventa === 'crédito' ? 'bg-blue-700' : 'bg-blue-800'
                  }`}>
                    {facturaData.factura.tipoventa?.toUpperCase() || 'FACTURA'}
                  </span>
                </div>
              </div>

              {/* Información general */}
              <div className="text-black p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Emisor</h2>
                  <p className="font-medium">{facturaData.emisor.nombre || "Nombre no disponible"}</p>
                  <p>NIT: {facturaData.emisor.nit || "NIT no disponible"}</p>
                  <p>NRC: {facturaData.emisor.nrc || "NRC no disponible"}</p>
                  <p>Teléfono: {facturaData.emisor.telefono || "Teléfono no disponible"}</p>
                  <p>Correo: {facturaData.emisor.correo || "Correo no disponible"}</p>
                  <p>Sucursal: {facturaData.emisor.sucursal || "Sucursal no disponible"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-semibold mb-3 text-lg">Cliente</h2>
                  <p className="font-medium">{facturaData.cliente.nombre || "Cliente no disponible"}</p>
                  <p>Documento: {facturaData.cliente.documento || "Documento no disponible"}</p>
                  <p>Teléfono: {facturaData.cliente.telefono || "Teléfono no disponible"}</p>
                  <p>Correo: {facturaData.cliente.correo || "Correo no disponible"}</p>
                </div>
              </div>

              {/* Detalles de factura */}
              <div className="p-5 border-t">
                <div className="flex items-center mb-4 text-gray-600">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  <span className="font-medium">Fecha: {formatDate(facturaData.factura.fechaemision)}</span>
                  {facturaData.factura.horaemision && (
                    <span className="font-medium ml-2">Hora: {facturaData.factura.horaemision}</span>
                  )}
                </div>

                {/* Tabla de productos */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Productos/Servicios</h3>
                  {facturaData.productos && facturaData.productos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-4 border-b text-left">Descripción</th>
                            <th className="py-2 px-4 border-b text-center">Cantidad</th>
                            <th className="py-2 px-4 border-b text-right">Precio Unitario</th>
                            <th className="py-2 px-4 border-b text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {facturaData.productos.map((producto, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="py-2 px-4 border-b">{producto.descripcion || "Producto"}</td>
                              <td className="py-2 px-4 border-b text-center">{Math.floor(producto.cantidad)|| 1}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.precioUnitario || 0)}</td>
                              <td className="py-2 px-4 border-b text-right">{formatCurrency(producto.total || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                      <p className="text-yellow-800 flex items-center">
                        <FaBox className="mr-2" /> No hay productos registrados para esta factura
                      </p>
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className="flex justify-end">
                  <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(facturaData.factura.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">IVA:</span>
                      <span className="font-medium">{formatCurrency(facturaData.factura.valoriva)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold">{formatCurrency(facturaData.factura.totalapagar)}</span>
                    </div>
                  </div>
                </div>

                {/* Total en letras */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Total en letras:</p>
                  <p className="italic">{facturaData.factura.valorletras || "No disponible"}</p>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Información adicional:</p>
                  <p>Forma de pago: {facturaData.factura.formapago || "No especificado"}</p>
                  <p>Tipo de venta: {facturaData.factura.tipoventa || "No especificado"}</p>
                  <p>Estado: {facturaData.factura.estado || "No especificado"}</p>
                  <p>N° Control: {facturaData.factura.ncontrol || "No disponible"}</p>
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