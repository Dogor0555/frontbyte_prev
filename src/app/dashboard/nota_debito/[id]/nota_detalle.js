// src/app/dashboard/notas-debito/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { FaSpinner, FaFilePdf, FaArrowLeft, FaFileAlt, FaCalendarAlt, FaUser, FaPlusCircle, FaMinusCircle, FaExchangeAlt, FaInfoCircle } from "react-icons/fa";
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
  const [tipoNota, setTipoNota] = useState("");
  const [documentoFirmadoData, setDocumentoFirmadoData] = useState(null);
  const router = useRouter();

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
      borderLight: "border-purple-200",
      prefijo: "ND",
      descripcion: "Documento que incrementa el monto de una factura",
      significado: "Aumenta la deuda del cliente"
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
      borderLight: "border-green-200",
      prefijo: "NC",
      descripcion: "Documento que reduce el monto de una factura",
      significado: "Reduce la deuda del cliente"
    }
  };

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando JWT:', error);
      return null;
    }
  };

  const extractDocumentoFirmadoInfo = (data) => {
    if (!data.documentofirmado || data.documentofirmado === "null") {
      return null;
    }

    try {
      const decoded = decodeJWT(data.documentofirmado);
      return decoded;
    } catch (error) {
      console.error("Error extrayendo documento firmado:", error);
      return null;
    }
  };

  const getEmisorInfo = (data, docFirmado) => {
    if (docFirmado?.emisor) {
      return {
        nombre: docFirmado.emisor.nombre || docFirmado.emisor.nombreComercial,
        nit: docFirmado.emisor.nit,
        nrc: docFirmado.emisor.nrc,
        telefono: docFirmado.emisor.telefono,
        correo: docFirmado.emisor.correo,
        direccion: docFirmado.emisor.direccion
      };
    }
    
    return {
      nombre: "Emisor no disponible",
      nit: "No disponible",
      nrc: "No disponible",
      telefono: "No disponible",
      correo: "No disponible"
    };
  };

  const getClienteInfo = (data, docFirmado) => {
    if (docFirmado?.receptor) {
      return {
        nombre: docFirmado.receptor.nombre || docFirmado.receptor.nombreComercial,
        documento: docFirmado.receptor.nit,
        nrc: docFirmado.receptor.nrc,
        telefono: docFirmado.receptor.telefono,
        correo: docFirmado.receptor.correo,
        direccion: docFirmado.receptor.direccion
      };
    }
    
    if (docFirmado?.extension) {
      return {
        nombre: docFirmado.extension.nombrerecibe || data.nombrentrega,
        documento: docFirmado.extension.docurecibe || data.docuentrega,
        telefono: "No disponible",
        correo: "No disponible"
      };
    }
    
    return {
      nombre: data.nombrentrega || "Cliente no especificado",
      documento: data.docuentrega || "No disponible",
      telefono: "No disponible",
      correo: "No disponible"
    };
  };

  const getProductos = (data, docFirmado) => {
    if (docFirmado?.ventaTercero && docFirmado.ventaTercero.length > 0) {
      return docFirmado.ventaTercero.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUni,
        total: item.ventaGravada || item.precioUni * item.cantidad
      }));
    }
    
    return [{
      descripcion: `Nota de ${data.tipo_dte === '05' ? 'crédito' : 'débito'} - Ajuste`,
      cantidad: 1,
      precioUnitario: data.subtotal || data.montototaloperacion || 0,
      total: data.totalapagar || data.montototaloperacion || 0
    }];
  };

  useEffect(() => {
    const fetchNota = async () => {
      try {
        setLoading(true);

        let response = await fetch(`http://localhost:3000/notascredito/${numeroNota}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setTipoNota("credito");
          setNotaData(data);
          const docFirmado = extractDocumentoFirmadoInfo(data);
          setDocumentoFirmadoData(docFirmado);
          return;
        }
        
        response = await fetch(`http://localhost:3000/notasdebito/${numeroNota}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setTipoNota("debito");
          setNotaData(data);
          const docFirmado = extractDocumentoFirmadoInfo(data);
          setDocumentoFirmadoData(docFirmado);
          return;
        }
        
        response = await fetch(`http://localhost:3000/facturas/${numeroNota}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.tipo_dte === "06") {
            setTipoNota("debito");
          } else if (data.tipo_dte === "05") {
            setTipoNota("credito");
          } else {
            if (data.tipodocumento === 'NOTA_DEBITO' || data.esnotadebito) {
              setTipoNota("debito");
            } else if (data.tipodocumento === 'NOTA_CREDITO' || data.esnotacredito) {
              setTipoNota("credito");
            } else {
              setTipoNota("debito");
            }
          }
          
          setNotaData(data);
          const docFirmado = extractDocumentoFirmadoInfo(data);
          setDocumentoFirmadoData(docFirmado);
          return;
        }
        
        throw new Error("No se pudo encontrar la nota en ningún endpoint");
        
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

  const config = configNota[tipoNota] || configNota.debito;
  const IconoNota = config.icon;

  const emisorInfo = getEmisorInfo(notaData || {}, documentoFirmadoData);
  const clienteInfo = getClienteInfo(notaData || {}, documentoFirmadoData);
  const productos = getProductos(notaData || {}, documentoFirmadoData);

  const handleGeneratePDF = async () => {
    setGenerandoPDF(true);
    try {
      const response = await fetch(`http://localhost:3000/facturas/${numeroNota}/descargar-pdf`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Error al descargar PDF");
      }
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `nota-${tipoNota}-${numeroNota}.pdf`;
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
      <div className="flex min-h-screen bg-gray-50">
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
      <div className="flex min-h-screen bg-gray-50">
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
          month: 'long', 
          day: 'numeric' 
        });
    } catch {
      return "Fecha no disponible";
    }
  };

  const numeroNotaDisplay = notaData.numerofacturausuario?.toString().padStart(4, '0') || notaData.iddtefactura;

  return (
    <div className="text-black flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed left-2 top-2 z-10 p-2 rounded-md bg-white shadow-md text-gray-600"
        >
          ☰
        </button>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <button 
                onClick={() => router.push('/dashboard/nota_debito')}
                className="flex items-center text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm border"
              >
                <FaArrowLeft className="mr-2" /> Volver a notas
              </button>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className={`flex items-center px-4 py-2 rounded-full text-white ${config.bgColor}`}>
                  <IconoNota className="mr-2" />
                  <span className="font-semibold">{config.textoCompleto}</span>
                </div>
                
                <button
                  onClick={handleGeneratePDF}
                  disabled={generandoPDF || !notaData?.documentofirmado}
                  className={`flex items-center px-4 py-2 rounded text-white ${
                    generandoPDF ? 'bg-gray-400 cursor-not-allowed' : 
                    !notaData?.documentofirmado ? 'bg-gray-500 cursor-not-allowed' : 
                    `${config.bgColor} hover:opacity-90`
                  }`}
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

            <div className={`mb-6 p-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgLight}`}>
              <div className="flex items-start">
                <FaInfoCircle className={`mt-1 mr-3 ${config.textColor}`} />
                <div>
                  <h3 className={`font-semibold text-lg mb-1 ${config.textColor}`}>
                    {config.textoCompleto}
                  </h3>
                  <p className="text-gray-700">
                    <strong>Significado:</strong> {config.significado}. {config.descripcion}.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {tipoNota === 'debito' 
                      ? 'Se utiliza para corregir omisiones o aumentar el valor de la factura original.'
                      : 'Se utiliza para corregir errores o disminuir el valor de la factura original.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              <div className={`${config.bgColor} text-white p-6`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div className="flex items-center mb-4 lg:mb-0">
                    <IconoNota className="mr-3 text-3xl" />
                    <div>
                      <h1 className="font-bold text-2xl lg:text-3xl">
                        {config.prefijo}-{numeroNotaDisplay}
                      </h1>
                      <p className="text-white/90 text-sm">
                        {config.textoCompleto} • Emitida el {formatDate(notaData.fechaemision)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      Estado: {notaData.estado || "No especificado"}
                    </span>
                    {notaData.documentofirmado && notaData.documentofirmado !== "null" && (
                      <span className="bg-green-500/80 px-3 py-1 rounded text-sm">
                        DOCUMENTO FIRMADO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg border-2 ${config.borderLight}`}>
                  <h2 className={`font-bold text-lg mb-3 ${config.textColor}`}>
                    <FaUser className="inline mr-2" />
                    Emisor
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Nombre:</strong> {emisorInfo.nombre}</p>
                    <p><strong>NIT:</strong> {emisorInfo.nit}</p>
                    {emisorInfo.nrc && <p><strong>NRC:</strong> {emisorInfo.nrc}</p>}
                    <p><strong>Teléfono:</strong> {emisorInfo.telefono}</p>
                    {emisorInfo.correo && <p><strong>Correo:</strong> {emisorInfo.correo}</p>}
                    {emisorInfo.direccion && (
                      <p><strong>Dirección:</strong> {emisorInfo.direccion.complemento || `${emisorInfo.direccion.departamento}, ${emisorInfo.direccion.municipio}`}</p>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${config.borderLight}`}>
                  <h2 className={`font-bold text-lg mb-3 ${config.textColor}`}>
                    <FaUser className="inline mr-2" />
                    Cliente
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Nombre:</strong> {clienteInfo.nombre}</p>
                    <p><strong>Documento:</strong> {clienteInfo.documento}</p>
                    {clienteInfo.nrc && <p><strong>NRC:</strong> {clienteInfo.nrc}</p>}
                    <p><strong>Teléfono:</strong> {clienteInfo.telefono}</p>
                    {clienteInfo.correo && <p><strong>Correo:</strong> {clienteInfo.correo}</p>}
                    {clienteInfo.direccion && (
                      <p><strong>Dirección:</strong> {clienteInfo.direccion.complemento || `${clienteInfo.direccion.departamento}, ${clienteInfo.direccion.municipio}`}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t">
                <div className={`flex items-center mb-6 p-4 rounded-lg ${config.bgLight}`}>
                  <FaCalendarAlt className={`mr-3 text-xl ${config.textColor}`} />
                  <div>
                    <p className="font-semibold text-gray-700">
                      Fecha de emisión: {formatDate(notaData.fechaemision)}
                    </p>
                    {notaData.horaemision && (
                      <p className="text-gray-600">
                        Hora: {notaData.horaemision}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className={`font-bold text-xl mb-4 ${config.textColor}`}>
                    <FaFileAlt className="inline mr-2" />
                    Conceptos de la {config.textoCompleto.toLowerCase()}
                  </h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full bg-white">
                      <thead className={config.bgLight}>
                        <tr>
                          <th className="py-3 px-4 border text-left font-semibold">Descripción</th>
                          <th className="py-3 px-4 border text-center font-semibold">Cantidad</th>
                          <th className="py-3 px-4 border text-right font-semibold">P. Unitario</th>
                          <th className="py-3 px-4 border text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map((producto, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-3 px-4 border border-gray-200">
                              {producto.descripcion}
                            </td>
                            <td className="py-3 px-4 border border-gray-200 text-center">
                              {Number(producto.cantidad).toFixed(0)}
                            </td>
                            <td className="py-3 px-4 border border-gray-200 text-right">
                              {formatCurrency(producto.precioUnitario)}
                            </td>
                            <td className="py-3 px-4 border border-gray-200 text-right font-semibold">
                              {formatCurrency(producto.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end mb-6">
                  <div className={`w-full lg:w-1/3 p-6 rounded-lg border-2 ${config.borderLight} bg-white`}>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="font-semibold text-gray-700">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(notaData.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="font-semibold text-gray-700">IVA:</span>
                      <span className="font-semibold">{formatCurrency(notaData.valoriva || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="font-bold text-lg text-gray-800">Total:</span>
                      <span className={`font-bold text-2xl ${config.textColor}`}>
                        {formatCurrency(notaData.totalapagar || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {notaData.valorletras && (
                  <div className={`mb-6 p-4 rounded-lg border ${config.borderLight}`}>
                    <p className={`font-semibold mb-2 ${config.textColor}`}>Total en letras:</p>
                    <p className="italic text-gray-700 text-lg">"{notaData.valorletras}"</p>
                  </div>
                )}

                <div className={`mb-6 p-4 rounded-lg border ${config.borderLight}`}>
                  <h4 className={`font-bold text-lg mb-3 ${config.textColor}`}>Información Adicional</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div className="space-y-2">
                      <p><strong>Forma de pago:</strong> {notaData.formapago || "No especificado"}</p>
                      <p><strong>Tipo de venta:</strong> {notaData.tipoventa || "No especificado"}</p>
                      <p><strong>Tipo DTE:</strong> {notaData.tipo_dte || "No especificado"}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Número de control:</strong> {notaData.ncontrol || "No disponible"}</p>
                      <p><strong>Modelo factura:</strong> {notaData.modelofac || "No disponible"}</p>
                      {notaData.codigo && <p><strong>Código:</strong> {notaData.codigo}</p>}
                    </div>
                  </div>
                </div>

                {notaData.iddte_relacionado && (
                  <div className={`p-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgLight}`}>
                    <div className="flex items-start">
                      <FaExchangeAlt className={`mt-1 mr-3 text-lg ${config.textColor}`} />
                      <div>
                        <p className={`font-semibold text-lg mb-1 ${config.textColor}`}>
                          Documento Relacionado
                        </p>
                        <p className="text-gray-700">
                          Esta {config.textoCompleto.toLowerCase()} está relacionada con la factura #{notaData.iddte_relacionado}
                        </p>
                        {notaData.ncontrol_relacionado && (
                          <p className="text-gray-600 text-sm mt-1">
                            Control: {notaData.ncontrol_relacionado}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}