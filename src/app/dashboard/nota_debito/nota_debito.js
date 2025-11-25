// src/app/dashboard/notas-debito/nota_debito.js
"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaUser, FaCalendarAlt, FaFileInvoice, FaFilePdf, FaChevronLeft, FaChevronRight, FaExchangeAlt, FaExclamationTriangle, FaFileCode, FaPaperPlane, FaMoneyBillWave, FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function NotaDebitoView({ user, hasHaciendaToken, haciendaStatus }) {
  const [isMobile, setIsMobile] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [notasDebito, setNotasDebito] = useState([]);
  const [notasCredito, setNotasCredito] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermNotas, setSearchTermNotas] = useState("");
  const [searchTermNotasCredito, setSearchTermNotasCredito] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("reciente");
  const [ordenFechaNotas, setOrdenFechaNotas] = useState("reciente");
  const [ordenFechaNotasCredito, setOrdenFechaNotasCredito] = useState("reciente");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNotas, setCurrentPageNotas] = useState(1);
  const [currentPageNotasCredito, setCurrentPageNotasCredito] = useState(1);
  const [enviando, setEnviando] = useState(null);
  const [motivoNota, setMotivoNota] = useState("");
  const [montoNota, setMontoNota] = useState("");
  const [tipoNota, setTipoNota] = useState("debito"); // 'debito' o 'credito'
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const itemsPerPage = 6;
  const router = useRouter();


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const facturasResponse = await fetch("http://localhost:3000/creditos/getAllDteCreditos", {
          credentials: "include"
        });
        
        if (!facturasResponse.ok) throw new Error("Error al cargar facturas");
        const facturasData = await facturasResponse.json();
        
        const notasDebitoResponse = await fetch("http://localhost:3000/notasdebito/", {
          credentials: "include"
        });

        const notasCreditoResponse = await fetch("http://localhost:3000/notascredito/", {
          credentials: "include"
        });

        
        let notasDebitoData = [];
        if (notasDebitoResponse.ok) {
          notasDebitoData = await notasDebitoResponse.json();
        } else {
          console.warn("Error al cargar notas de débito, usando datos de respaldo");
          if (Array.isArray(facturasData)) {
            notasDebitoData = facturasData.filter(factura => 
              factura.tipodocumento === 'NOTA_DEBITO' || factura.esnotadebito
            );
          }
        }

        let notasCreditoData = [];
        if (notasCreditoResponse.ok) {
          notasCreditoData = await notasCreditoResponse.json();
        } else {
          console.warn("Error al cargar notas de crédito, usando datos de respaldo");
          if (Array.isArray(facturasData)) {
            notasCreditoData = facturasData.filter(factura => 
              factura.tipodocumento === 'NOTA_CREDITO' || factura.esnotacredito
            );
          }
        }

        let facturasParaNota = [];
        if (Array.isArray(facturasData)) {
          facturasParaNota = facturasData.filter(factura => puedeGenerarNota(factura));
        }
        
        setFacturas(facturasParaNota);
        setNotasDebito(Array.isArray(notasDebitoData) ? notasDebitoData : []);
        setNotasCredito(notasCreditoData);
        
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar los datos: " + error.message);
        setFacturas([]);
        setNotasDebito([]);
        setNotasCredito([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const puedeGenerarNota = (factura) => {
    if (!factura) return false;
    if (factura.tipodocumento === 'NOTA_DEBITO' || factura.esnotadebito) return false;
    if (factura.tipodocumento === 'NOTA_CREDITO' || factura.esnotacredito) return false;
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO', 'ACEPTADO'].includes(factura.estado)) return false;
    
    if (factura.fechaemision) {
      const fechaEmision = new Date(factura.fechaemision);
      const ahora = new Date();
      const horasTranscurridas = (ahora - fechaEmision) / (1000 * 60 * 60);
      return horasTranscurridas <= 24;
    }
    
    return false;
  };

  const ordenarFacturasPorFecha = (facturas, orden) => {
    return [...facturas].sort((a, b) => {
      const fechaA = new Date(a.fechaemision || a.fechacreacion || 0);
      const fechaB = new Date(b.fechaemision || b.fechacreacion || 0);
      
      if (orden === "reciente") {
        return fechaB - fechaA;
      } else {
        return fechaA - fechaB;
      }
    });
  };

  const facturasFiltradas = Array.isArray(facturas)
    ? facturas.filter((factura) => {
        if (!factura) return false;
        const searchLower = searchTerm.toLowerCase();

        const matchSearch =
          (factura.codigo?.toLowerCase() || "").includes(searchLower) ||
          (factura.nombrentrega?.toLowerCase() || "").includes(searchLower) ||
          (factura.numerofacturausuario?.toString() || "").includes(searchTerm) ||
          (factura.iddtefactura?.toString() || "").includes(searchTerm) ||
          (factura.ncontrol?.toString() || "").includes(searchTerm); // ← Agregar número de control

        return matchSearch;
      })
    : [];

  const facturasOrdenadas = ordenarFacturasPorFecha(facturasFiltradas, ordenFecha);

  const notasDebitoFiltradas = Array.isArray(notasDebito)
    ? notasDebito.filter((nota) => {
        if (!nota) return false;
        const searchLower = searchTermNotas.toLowerCase();

        const matchSearch =
          (nota.codigo?.toLowerCase() || "").includes(searchLower) ||
          (nota.nombrentrega?.toLowerCase() || "").includes(searchLower) ||
          (nota.numerofacturausuario?.toString() || "").includes(searchTermNotas) ||
          (nota.iddtefactura?.toString() || "").includes(searchTermNotas) ||
          (nota.ncontrol?.toString() || "").includes(searchTermNotas); // ← Agregar número de control

        return matchSearch;
      })
    : [];

  const notasDebitoOrdenadas = ordenarFacturasPorFecha(notasDebitoFiltradas, ordenFechaNotas);

  const notasCreditoFiltradas = Array.isArray(notasCredito)
    ? notasCredito.filter((nota) => {
        if (!nota) return false;
        const searchLower = searchTermNotasCredito.toLowerCase();

        const matchSearch =
          (nota.codigo?.toLowerCase() || "").includes(searchLower) ||
          (nota.nombrentrega?.toLowerCase() || "").includes(searchLower) ||
          (nota.numerofacturausuario?.toString() || "").includes(searchTermNotasCredito) ||
          (nota.iddtefactura?.toString() || "").includes(searchTermNotasCredito) ||
          (nota.ncontrol?.toString() || "").includes(searchTermNotasCredito); // ← Agregar número de control

        return matchSearch;
      })
    : [];

  const notasCreditoOrdenadas = ordenarFacturasPorFecha(notasCreditoFiltradas, ordenFechaNotasCredito);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = facturasOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(facturasOrdenadas.length / itemsPerPage);

  const indexOfLastItemNotas = currentPageNotas * itemsPerPage;
  const indexOfFirstItemNotas = indexOfLastItemNotas - itemsPerPage;
  const currentItemsNotas = notasDebitoOrdenadas.slice(indexOfFirstItemNotas, indexOfLastItemNotas);
  const totalPagesNotas = Math.ceil(notasDebitoOrdenadas.length / itemsPerPage);

  const indexOfLastItemNotasCredito = currentPageNotasCredito * itemsPerPage;
  const indexOfFirstItemNotasCredito = indexOfLastItemNotasCredito - itemsPerPage;
  const currentItemsNotasCredito = notasCreditoOrdenadas.slice(indexOfFirstItemNotasCredito, indexOfLastItemNotasCredito);
  const totalPagesNotasCredito = Math.ceil(notasCreditoOrdenadas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const paginateNotas = (pageNumber) => setCurrentPageNotas(pageNumber);
  const paginateNotasCredito = (pageNumber) => setCurrentPageNotasCredito(pageNumber);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const handleGenerarNota = (factura, tipo) => {
    router.push(`/dashboard/nota_debito/emitir/${factura.iddtefactura}?tipo=${tipo}`);
  };

  const handleGeneratePDF = async (notaId) => {
    setPdfLoading(notaId);
    try {
      const facturaResponse = await fetch(`http://localhost:3000/facturas/${notaId}`, {
        credentials: "include"
      });
      if (!facturaResponse.ok) {
        throw new Error("No se pudo obtener la factura");
      }
      const factura = await facturaResponse.json();
      const numeroControl = factura.numero_control || `nota-${notaId}`;

      const response = await fetch(`http://localhost:3000/facturas/${notaId}/descargar-pdf`, {
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
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${numeroControl}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setPdfLoading(null);
    }
  };


  const handleDownloadJSON = async (iddtefactura) => {
    setPdfLoading(iddtefactura);
    try {
      const facturaResponse = await fetch(`http://localhost:3000/facturas/${iddtefactura}`, {
        credentials: "include"
      });
      if (!facturaResponse.ok) {
        throw new Error("No se pudo obtener la factura");
      }
      const factura = await facturaResponse.json();
      const numeroControl = factura.numero_control || `nota-${iddtefactura}`;

      const response = await fetch(`http://localhost:3000/facturas/${iddtefactura}/descargar-json`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${numeroControl}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error descargando JSON:', error);
      alert(`Error al descargar JSON: ${error.message}`);
    } finally {
      setPdfLoading(null);
    }
  };


  const openNotaModal = (factura, tipo) => {
    setFacturaSeleccionada(factura);
    setTipoNota(tipo);
    setMontoNota("");
    setMotivoNota("");
    setShowModal(true);
  };

  const handleViewDetails = () => {
    if (esNotaDebito || esNotaCredito || 
        factura.tipodocumento === 'NOTA_DEBITO' || 
        factura.tipodocumento === 'NOTA_CREDITO' ||
        factura.esnotadebito || 
        factura.esnotacredito) {
      router.push(`/dashboard/notas-debito/${factura.iddtefactura}`);
    } else {
      router.push(`/dashboard/creditos/${factura.iddtefactura}`);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true); 
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  const FacturaCard = ({ factura, esNotaDebito = false, esNotaCredito = false }) => {
      const esNota = esNotaDebito || esNotaCredito;
      const tipoNota = esNotaDebito ? 'debito' : esNotaCredito ? 'credito' : 'factura';
      const colorNota = esNotaDebito ? 'purple' : esNotaCredito ? 'blue' : 'green';
      
      const [cliente, setCliente] = useState(null);
      const [loadingCliente, setLoadingCliente] = useState(false);

      useEffect(() => {
          const cargarCliente = async () => {
              if (factura.nombrecibe) {
                  setCliente({ nombre: factura.nombrecibe, dui: factura.docuentrega });
                  return;
              }
              
              if (factura.idcliente) {
                  setLoadingCliente(true);
                  try {
                      const response = await fetch(`http://localhost:3000/clientes/${factura.idcliente}`, {
                          credentials: "include"
                      });
                      
                      if (response.ok) {
                          const clienteData = await response.json();
                          console.log(clienteData);
                          setCliente({
                              nombre: clienteData.data.nombre || clienteData.razonsocial || 'Cliente no especificado',
                              dui: clienteData.dui || clienteData.nit || ''
                          });
                      } else {
                          setCliente({
                              nombre: factura.nombrecibe || 'Cliente no especificado',
                              dui: factura.docuentrega || ''
                          });
                      }
                  } catch (error) {
                      console.error("Error cargando cliente:", error);
                      setCliente({
                          nombre: factura.nombrecibe || 'Cliente no especificado',
                          dui: factura.docuentrega || ''
                      });
                  } finally {
                      setLoadingCliente(false);
                  }
              } else {
                  setCliente({
                      nombre: factura.nombrecibe || 'Cliente no especificado',
                      dui: factura.docuentrega || ''
                  });
              }
          };

          cargarCliente();
      }, [factura.idcliente, factura.nombrecibe, factura.docuentrega]);

      const handleViewDetails = () => {
          if (esNotaDebito || esNotaCredito || 
              factura.tipodocumento === 'NOTA_DEBITO' || 
              factura.tipodocumento === 'NOTA_CREDITO' ||
              factura.esnotadebito || 
              factura.esnotacredito) {
              router.push(`/dashboard/nota_debito/${factura.iddtefactura}`);
          } else {
              router.push(`/dashboard/creditos/${factura.iddtefactura}`);
          }
      };

      return (
          <div
              key={factura.iddtefactura}
              className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                  esNota ? `border-${colorNota}-200` : 'border-gray-100'
              } hover:shadow-lg transition-all duration-200`}
          >
              <div className={`p-3 ${esNota ? `bg-${colorNota}-600` : 'bg-green-600'} text-white`}>
                  <div className="flex justify-between items-center">
                      <div className="flex items-center">
                          <div className="bg-white/20 p-1 rounded mr-2">
                              {esNotaDebito ? <FaPlusCircle className="text-white text-xs" /> : 
                              esNotaCredito ? <FaMinusCircle className="text-white text-xs" /> : 
                              <FaFileAlt className="text-white text-xs" />}
                          </div>
                          <div>
                              <span className="font-semibold text-xs block">
                                  {esNotaDebito ? 'NOTA DÉBITO' : 
                                  esNotaCredito ? 'NOTA CRÉDITO' : 'CRÉDITO FISCAL'}
                              </span>
                              <span className="text-xs font-light opacity-90">
                                  #{factura.numerofacturausuario?.toString().padStart(4, '0') || factura.iddtefactura}
                              </span>
                          </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          esNota 
                              ? `bg-${colorNota}-500/30 text-${colorNota}-100` 
                              : factura.estado === 'TRANSMITIDO' 
                                  ? 'bg-green-500/30 text-green-100'
                                  : factura.estado === 'PENDIENTE'
                                      ? 'bg-yellow-500/30 text-yellow-100'
                                      : 'bg-gray-500/30 text-gray-100'
                      }`}>
                          {factura.estado?.toUpperCase() || 'PENDIENTE'}
                      </span>
                  </div>
              </div>

              <div className="p-4">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className={`mr-1 ${esNota ? `text-${colorNota}-500` : 'text-green-500'} text-xs`} />
                          <span className="text-xs">
                              {new Date(factura.fechaemision).toISOString().split("T")[0]}
                          </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          factura.documentofirmado && factura.documentofirmado !== "null"
                              ? esNota ? `bg-${colorNota}-100 text-${colorNota}-800` : 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                          {factura.documentofirmado && factura.documentofirmado !== "null" ? "FIRMADO" : "NO FIRMADO"}
                      </span>
                  </div>

                  <div className="mb-3">
                      <div className="flex items-center text-gray-700 mb-1">
                          <FaUser className={`mr-1 ${esNota ? `text-${colorNota}-500` : 'text-green-500'} text-xs`} />
                          <span className="text-xs font-medium">Cliente</span>
                      </div>
                      
                      {loadingCliente ? (
                          <div className="pl-3">
                              <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4 mb-1"></div>
                              <div className="animate-pulse bg-gray-200 h-3 rounded w-1/2"></div>
                          </div>
                      ) : (
                          <>
                              <p className="text-gray-900 text-sm font-medium truncate pl-3">
                                  {cliente?.nombre || 'Cliente no especificado'}
                              </p>
                              {cliente?.dui && (
                                  <p className="text-xs text-gray-500 pl-3 mt-0.5">DUI: {cliente.dui}</p>
                              )}
                              {factura.idcliente && (
                                  <p className="text-xs text-gray-400 pl-3 mt-0.5">ID: {factura.idcliente}</p>
                              )}
                          </>
                      )}
                  </div>

                  {esNota && factura.ncontrol_relacionado && (
                      <div className="mb-3">
                          <div className="flex items-center text-gray-700 mb-1">
                              <FaFileInvoice className={`mr-1 ${esNota ? `text-${colorNota}-500` : 'text-green-500'} text-xs`} />
                              <span className="text-xs font-medium">Documento Relacionado</span>
                          </div>
                          <p className="text-gray-900 text-sm font-medium truncate pl-3">
                              {factura.ncontrol_relacionado}
                          </p>
                      </div>
                  )}

                  {!esNota && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                              <div className="text-xs text-gray-500 mb-0.5">Código</div>
                              <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded">
                                  {factura.codigo || 'N/A'}
                              </div>
                          </div>
                          <div>
                              <div className="text-xs text-gray-500 mb-0.5">Control</div>
                              <div className="text-xs font-mono text-gray-800 bg-gray-50 p-1 rounded truncate">
                                  {factura.ncontrol || 'N/A'}
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="border-t border-gray-100 pt-2">
                      <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                              {esNota ? 'MONTO NOTA' : 'TOTAL'}
                          </div>
                          <div className={`text-lg font-bold ${esNota ? `text-${colorNota}-600` : 'text-green-600'}`}>
                              {formatCurrency(factura.totalapagar || factura.montototaloperacion || 0)}
                          </div>
                      </div>
                  </div>
              </div>

              <div className={`px-3 py-3 flex flex-wrap gap-2 justify-between border-t ${
                  esNota ? `bg-${colorNota}-50 border-${colorNota}-100` : 'bg-green-50 border-green-100'
              }`}>
                  <button
                      onClick={handleViewDetails}
                      className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                          esNota 
                              ? `text-${colorNota}-600 hover:text-${colorNota}-800` 
                              : 'text-green-600 hover:text-green-800'
                      }`}
                      title="Ver detalles completos"
                  >
                      <FaFileAlt className="mr-1 text-xs" />
                      Detalles
                  </button>

                  <div className="flex items-center gap-1">
                      {!esNota && (
                          <div className="flex gap-1">
                              <button
                                  onClick={() => handleGenerarNota(factura, "debito")}
                                  className="flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                  title="Generar Nota de Débito"
                              >
                                  <FaPlusCircle className="mr-1 text-xs" />
                                  Nota Débito
                              </button>
                              <button
                                  onClick={() => handleGenerarNota(factura, "credito")}
                                  className="flex items-center px-2 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                  title="Generar Nota de Crédito"
                              >
                                  <FaMinusCircle className="mr-1 text-xs" />
                                  Nota Crédito
                              </button>
                          </div>
                      )}

                      {esNota && (
                          <>
                              <button
                                  onClick={() => handleGeneratePDF(factura.iddtefactura)}
                                  disabled={pdfLoading === factura.iddtefactura || !(factura.documentofirmado && factura.documentofirmado !== "null")}
                                  className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      pdfLoading === factura.iddtefactura
                                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                          : (!(factura.documentofirmado && factura.documentofirmado !== "null"))
                                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                              : `bg-${colorNota}-500 hover:bg-${colorNota}-600 text-white`
                                  }`}
                                  title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Nota no firmada" : "Descargar DTE en PDF"}
                              >
                                  {pdfLoading === factura.iddtefactura ? (
                                      <>
                                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                                          Generando
                                      </>
                                  ) : (
                                      <>
                                          <FaFilePdf className="mr-1 text-xs" />
                                          PDF
                                      </>
                                  )}
                              </button>

                              <button
                                  onClick={() => handleDownloadJSON(factura.iddtefactura)}
                                  disabled={!(factura.documentofirmado && factura.documentofirmado !== "null")}
                                  className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      !(factura.documentofirmado && factura.documentofirmado !== "null")
                                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                                  }`}
                                  title={!(factura.documentofirmado && factura.documentofirmado !== "null") ? "No se puede descargar: Nota no firmada" : "Descargar DTE en JSON"}
                              >
                                  <FaFileCode className="mr-1 text-xs" />
                                  JSON
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-l-md border ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaChevronLeft className="text-sm" />
          </button>
          
          {(() => {
            const pages = [];
            const maxVisiblePages = isMobile ? 3 : 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
              startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            if (startPage > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => onPageChange(1)}
                  className={`px-3 py-1 border-t border-b ${
                    1 === currentPage ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  1
                </button>
              );
              
              if (startPage > 2) {
                pages.push(
                  <span key="ellipsis-start" className="px-2 py-1 border-t border-b bg-white text-gray-500">
                    ...
                  </span>
                );
              }
            }
            
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`px-3 py-1 border-t border-b ${
                    i === currentPage ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i}
                </button>
              );
            }

            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(
                  <span key="ellipsis-end" className="px-2 py-1 border-t border-b bg-white text-gray-500">
                    ...
                  </span>
                );
              }
              
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => onPageChange(totalPages)}
                  className={`px-3 py-1 border-t border-b ${
                    totalPages === currentPage ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              );
            }
            
            return pages;
          })()}
          
          <button
            onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-r-md border ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaChevronRight className="text-sm" />
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className="flex h-screen text-black bg-purple-50 overflow-hidden">
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">  
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Generar Notas de Débito y Crédito</h1>
                    <p className="text-gray-600">
                      {facturas.length} {facturas.length === 1 ? "factura disponible" : "facturas disponibles"} 
                      {searchTerm && ` (${facturasFiltradas.length} encontradas)`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar facturas..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>

                    <select
                      value={ordenFecha}
                      onChange={(e) => {
                        setOrdenFecha(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-purple-500 focus:border-purple-500 text-gray-700"
                    >
                      <option value="reciente">Más reciente</option>
                      <option value="antigua">Más antigua</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Nota:</strong> Solo puedes generar notas de débito y crédito para facturas transmitidas con menos de 24 horas de antigüedad y que estén en estado "TRANSMITIDO" o "RE-TRANSMITIDO".
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((factura) => (
                    <FacturaCard key={factura.iddtefactura} factura={factura} />
                  ))}
                </div>

                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={paginate}
                />

                {facturasOrdenadas.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-3">
                      <FaFileAlt className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">
                      {facturas.length === 0 ? 'No hay facturas disponibles para notas' : 'No se encontraron coincidencias'}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {facturas.length === 0 
                        ? 'Las facturas transmitidas con menos de 24 horas aparecerán aquí' 
                        : 'Intenta con otros términos de búsqueda'}
                    </p>
                  </div>
                )}
              </div>

              {/* Sección de Notas de Débito Generadas */}
              <div className="border-t border-gray-200 pt-8 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Notas de Débito Generadas</h2>
                    <p className="text-gray-600">
                      {notasDebito.length} {notasDebito.length === 1 ? "nota de débito" : "notas de débito"}
                      {searchTermNotas && ` (${notasDebitoFiltradas.length} encontradas)`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar notas de débito..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={searchTermNotas}
                        onChange={(e) => {
                          setSearchTermNotas(e.target.value);
                          setCurrentPageNotas(1);
                        }}
                      />
                    </div>

                    <select
                      value={ordenFechaNotas}
                      onChange={(e) => {
                        setOrdenFechaNotas(e.target.value);
                        setCurrentPageNotas(1);
                      }}
                      className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-purple-500 focus:border-purple-500 text-gray-700"
                    >
                      <option value="reciente">Más reciente</option>
                      <option value="antigua">Más antigua</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItemsNotas.map((nota) => (
                    <FacturaCard key={nota.iddtefactura} factura={nota} esNotaDebito={true} />
                  ))}
                </div>

                <Pagination 
                  currentPage={currentPageNotas}
                  totalPages={totalPagesNotas}
                  onPageChange={paginateNotas}
                />

                {notasDebitoOrdenadas.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-3">
                      <FaMinusCircle className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">
                      No hay notas de débito generadas
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Las notas de débito que generes aparecerán aquí
                    </p>
                  </div>
                )}
              </div>

              {/* Sección de Notas de Crédito Generadas */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Notas de Crédito Generadas</h2>
                    <p className="text-gray-600">
                      {notasCredito.length} {notasCredito.length === 1 ? "nota de crédito" : "notas de crédito"}
                      {searchTermNotasCredito && ` (${notasCreditoFiltradas.length} encontradas)`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar notas de crédito..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={searchTermNotasCredito}
                        onChange={(e) => {
                          setSearchTermNotasCredito(e.target.value);
                          setCurrentPageNotasCredito(1);
                        }}
                      />
                    </div>

                    <select
                      value={ordenFechaNotasCredito}
                      onChange={(e) => {
                        setOrdenFechaNotasCredito(e.target.value);
                        setCurrentPageNotasCredito(1);
                      }}
                      className="px-3 py-2 border rounded-lg focus:ring-2 bg-white focus:ring-purple-500 focus:border-purple-500 text-gray-700"
                    >
                      <option value="reciente">Más reciente</option>
                      <option value="antigua">Más antigua</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItemsNotasCredito.map((nota) => (
                    <FacturaCard key={nota.iddtefactura} factura={nota} esNotaCredito={true} />
                  ))}
                </div>

                <Pagination 
                  currentPage={currentPageNotasCredito}
                  totalPages={totalPagesNotasCredito}
                  onPageChange={paginateNotasCredito}
                />

                {notasCreditoOrdenadas.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-3">
                      <FaPlusCircle className="inline-block text-4xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">
                      No hay notas de crédito generadas
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Las notas de crédito que generes aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal para generar nota */}
      {showModal && facturaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className={`p-4 ${tipoNota === "debito" ? "bg-purple-600" : "bg-green-600"} text-white rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Generar Nota de {tipoNota === "debito" ? "Débito" : "Crédito"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setMotivoNota("");
                    setMontoNota("");
                  }}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Factura seleccionada:</h4>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">#{facturaSeleccionada.numerofacturausuario || facturaSeleccionada.iddtefactura}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(facturaSeleccionada.fechaemision).toISOString().split("T")[0]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Cliente: {facturaSeleccionada.nombrecibe || 'No especificado'}
                  </div>
                  <div className="text-sm font-medium">
                    Total: {formatCurrency(facturaSeleccionada.totalpagar || facturaSeleccionada.montototaloperacion || 0)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de la nota
                </label>
                <textarea
                  value={motivoNota}
                  onChange={(e) => setMotivoNota(e.target.value)}
                  placeholder={`Ingresa el motivo de la nota de ${tipoNota === "debito" ? "débito" : "crédito"}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows="3"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de la nota (USD)
                </label>
                <input
                  type="number"
                  value={montoNota}
                  onChange={(e) => setMontoNota(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={facturaSeleccionada.totalpagar || facturaSeleccionada.montototaloperacion || 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Monto máximo: {formatCurrency(facturaSeleccionada.totalpagar || facturaSeleccionada.montototaloperacion || 0)}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setMotivoNota("");
                    setMontoNota("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleGenerarNota(facturaSeleccionada.iddtefactura, motivoNota, montoNota, tipoNota)}
                  disabled={!motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando === facturaSeleccionada.iddtefactura}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center ${
                    !motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando === facturaSeleccionada.iddtefactura
                      ? "bg-gray-400 cursor-not-allowed"
                      : tipoNota === "debito" 
                        ? "bg-purple-600 hover:bg-purple-700" 
                        : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {enviando === facturaSeleccionada.iddtefactura ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    `Generar Nota de ${tipoNota === "debito" ? "Débito" : "Crédito"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}