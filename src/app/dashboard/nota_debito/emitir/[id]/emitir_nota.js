"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../../components/sidebar";
import Footer from "../../../components/footer";
import Navbar from "../../../components/navbar";
import MensajeModal from "../../../components/MensajeModal";
import { 
  FaArrowLeft, 
  FaFileAlt, 
  FaUser, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaExchangeAlt,
  FaPaperPlane,
  FaExclamationTriangle
} from "react-icons/fa";

export default function EmitirNotaCombined({ user, hasHaciendaToken, haciendaStatus, facturaId }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [motivoNota, setMotivoNota] = useState("");
  const [montoNota, setMontoNota] = useState("");
  const [tipoNota, setTipoNota] = useState("debito");
  const [errorMonto, setErrorMonto] = useState("");

  // Estados para el modal de mensajes
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState({
    tipo: "exito",
    titulo: "",
    mensaje: "",
    detalles: "",
    idFactura: null
  });
  const [descargandoTicket, setDescargandoTicket] = useState(false);

  useEffect(() => {
    const tipoFromUrl = searchParams.get('tipo');
    if (tipoFromUrl === 'debito' || tipoFromUrl === 'credito') {
      setTipoNota(tipoFromUrl);
    }
  }, [searchParams]);

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

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/creditos/${facturaId}`, {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cargar la factura`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error("La respuesta del servidor no es JSON válido");
        }

        const data = await response.json();

        setFactura(data);
      } catch (err) {
        console.error("Error cargando factura:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (facturaId) {
      fetchFactura();
    }
  }, [facturaId]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const puedeGenerarNota = (facturaData) => {
    if (!facturaData) return false;
    if (facturaData.tipodocumento === 'NOTA_DEBITO' || facturaData.esnotadebito) return false;
    if (facturaData.tipodocumento === 'NOTA_CREDITO' || facturaData.esnotacredito) return false;
    if (!['TRANSMITIDO', 'RE-TRANSMITIDO', 'ACEPTADO'].includes(facturaData.estado)) return false;
    
    return false;
  };

  const handleBack = () => {
    router.back();
  };

  const validarMontoNota = (monto, tipoNota, factura) => {
    if (!monto || monto === "") {
      return {
        valido: false,
        mensaje: "El monto es requerido"
      };
    }

    const montoNumerico = parseFloat(monto);
    const totalFactura = parseFloat(factura.totalpagar || factura.montototaloperacion || 0);
    
    if (isNaN(montoNumerico)) {
      return {
        valido: false,
        mensaje: "El monto debe ser un número válido"
      };
    }
    
    if (montoNumerico <= 0) {
      return {
        valido: false,
        mensaje: "El monto debe ser mayor a 0"
      };
    }
    
    if (tipoNota === "credito") {
      // Para nota de crédito: no puede ser mayor al total de la factura original
      if (montoNumerico > totalFactura) {
        return {
          valido: false,
          mensaje: `El monto de la nota de crédito no puede exceder el total de la factura (${formatCurrency(totalFactura)})`
        };
      }
    }
    
    return {
      valido: true,
      mensaje: ""
    };
  };

  // Función para cambiar el tipo de nota con validación automática
  const cambiarTipoNota = (nuevoTipo) => {
    setTipoNota(nuevoTipo);
    
    // Validar el monto actual con el nuevo tipo de nota
    if (montoNota && factura) {
      const validacion = validarMontoNota(montoNota, nuevoTipo, factura);
      setErrorMonto(validacion.mensaje);
    }
  };

  const handleMontoChange = (e) => {
    const nuevoMonto = e.target.value;
    setMontoNota(nuevoMonto);
    
    // Validación en tiempo real
    if (nuevoMonto && factura) {
      const validacion = validarMontoNota(nuevoMonto, tipoNota, factura);
      setErrorMonto(validacion.mensaje);
    } else {
      setErrorMonto("");
    }
  };

  // Función para mostrar mensajes en el modal
  const mostrarModalMensaje = (tipo, titulo, mensaje, detalles = "", idFactura = null) => {
    setMensajeConfig({
      tipo,
      titulo,
      mensaje,
      detalles,
      idFactura
    });
    setMostrarMensaje(true);
  };

  // Función para descargar el ticket de la nota
  const descargarTicketNota = async (idNota) => {
    setDescargandoTicket(true);
    
    try {
      // Determinar el endpoint según el tipo de nota
      const endpoint = `${API_BASE_URL}/facturas/${idNota}/ver-compacto`;

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/pdf' }
      });

      if (response.ok) {
        // Crear un blob y descargar el archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const newTab = window.open(url, '_blank');

        if (!newTab) {
          throw new Error('El navegador bloqueó la nueva pestaña. Por favor, permite ventanas emergentes.');
        }
        
        // Obtener el nombre del archivo del header Content-Disposition o usar uno por defecto
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `nota_${idNota}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        mostrarModalMensaje(
          "exito", 
          "Ticket Abierto", 
          `El ticket de la nota de ${tipoNota === "debito" ? "débito" : "crédito"} se ha abierto en una nueva pestaña.`,
          `Archivo: ${filename}`
        );

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);

      } else {
        throw new Error('Error al descargar el ticket');
      }
    } catch (error) {
      console.error('Error al descargar ticket:', error);
      mostrarModalMensaje(
        "error",
        "Error en Descarga",
        `No se pudo descargar el ticket de la nota de ${tipoNota === "debito" ? "débito" : "crédito"}.`,
        error.message
      );
    } finally {
      setDescargandoTicket(false);
    }
  };

  const handleGenerarNota = async () => {
    if (!factura || !motivoNota.trim() || !montoNota) {
      mostrarModalMensaje(
        "error",
        "Datos Incompletos",
        "Por favor complete todos los campos requeridos"
      );
      return;
    }

    // Validación del monto
    const validacionMonto = validarMontoNota(montoNota, tipoNota, factura);
    if (!validacionMonto.valido) {
      setErrorMonto(validacionMonto.mensaje);
      mostrarModalMensaje(
        "error",
        "Error de Validación",
        validacionMonto.mensaje
      );
      return;
    }

    setErrorMonto(""); // Limpiar error si la validación pasa

    if (parseFloat(montoNota) <= 0) {
      mostrarModalMensaje(
        "error",
        "Monto Inválido",
        "El monto debe ser mayor a 0"
      );
      return;
    }

    setEnviando(true);
    try {
      const total = parseFloat(montoNota);
      const monto = total / 1.13;
      const iva = total - monto;

      const idCliente = factura.idcliente || factura.idcliente_factura || factura.cliente_id;
      
      if (!idCliente) {
        throw new Error("No se pudo identificar el cliente asociado a esta factura");
      }

      const baseEndpoint = tipoNota === "debito" 
        ? `${API_BASE_URL}/notasdebito`
        : `${API_BASE_URL}/notascredito`;

      const encabezadoData = {
          idcliente: idCliente,
          iddte_relacionado: factura.iddtefactura,
          
          fechaemision: (() => {
              const ahora = new Date();
              const offset = -6;
              const salvadorTime = new Date(ahora.getTime() + (offset * 60 * 60 * 1000));
              const year = salvadorTime.getUTCFullYear();
              const month = String(salvadorTime.getUTCMonth() + 1).padStart(2, '0');
              const day = String(salvadorTime.getUTCDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
          })(),
          
          horaemision: new Date().toTimeString().split(' ')[0].substring(0, 8),
          subtotal: monto.toFixed(2),
          totalapagar: total.toFixed(2), // El total a pagar es el monto ingresado
          totalgravada: monto.toFixed(2),
          valorletras: convertirNumeroALetras(total),
          tipoventa: "contado",
          formapago: "efectivo",
          estado: 1,
          verjson: "3.0",
          transaccioncontable: `TRX-ND-${Date.now()}`,
          tributos: [
              {
                  codigo: "20",
                  descripcion: "IVA Débito Fiscal",
                  valor: iva.toFixed(2)
              }
          ]
      };

      console.log("Enviando encabezado con cliente:", encabezadoData);

      const encabezadoResponse = await fetch(`${baseEndpoint}/encabezado`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encabezadoData),
      });

      if (!encabezadoResponse.ok) {
        const errorText = await encabezadoResponse.text();
        throw new Error(`Error creando encabezado: ${errorText}`);
      }

      const encabezadoResult = await encabezadoResponse.json();
      console.log("Encabezado creado:", encabezadoResult);

      const { iddtefactura } = encabezadoResult;

      const detallesData = {
        transmitir: true,
        detalles: [
          {
            descripcion: `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} - ${motivoNota.trim()}`,
            cantidad: 1,
            precio: total.toFixed(2), // El precio unitario es el total
            preciouni: total.toFixed(2),
            subtotal: monto.toFixed(2),
            ventagravada: monto.toFixed(2),
            iva: iva.toFixed(2), // El IVA calculado
            total: total.toFixed(2),
            unidadmedida: "UNI",
            tributo: "20",
            tributos: [
              {
                codigo: "20",
                descripcion: "Impuesto al Valor Agregado 13%",
                valor: iva.toFixed(2)
              }
            ]
          }
        ]
      };

      console.log("Enviando detalles:", detallesData);

      const detallesResponse = await fetch(`${baseEndpoint}/${iddtefactura}/detalles`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(detallesData),
          });

          if (!detallesResponse.ok) {
            const errorText = await detallesResponse.text();
            throw new Error(`Error enviando detalles: ${errorText}`);
          }

          const detallesResult = await detallesResponse.json();
          console.log("Detalles procesados:", detallesResult);

          let mensajeTitulo = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} Generada`;
          let mensajeDetalles = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} generada exitosamente`;
          
          if (detallesResult.hacienda && detallesResult.hacienda.estado) {
            if (detallesResult.hacienda.estado === "PROCESADO" && detallesResult.hacienda.descripcionMsg === "RECIBIDO") {
              mensajeTitulo = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} Transmitida`;
              mensajeDetalles = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} generada y transmitida exitosamente a Hacienda`;
            } else {
              throw new Error(detallesResult.hacienda.descripcionMsg || `Error en Hacienda: ${detallesResult.hacienda.estado}`);
            }
          } 
          
          if (detallesResult.contingencia && detallesResult.aviso) {
            mensajeTitulo = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} en Contingencia`;
            mensajeDetalles = `${detallesResult.aviso}\n${detallesResult.message || "La nota se ha generado en modo de contingencia."}`;
          } 

          else if (detallesResult.transmitido) {
            mensajeTitulo = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} Transmitida`;
            mensajeDetalles = `Nota de ${tipoNota === "debito" ? "débito" : "crédito"} transmitida exitosamente`;
          }

          // Mostrar mensaje de éxito en el modal
          mostrarModalMensaje(
            "exito",
            mensajeTitulo,
            `La nota de ${tipoNota === "debito" ? "débito" : "crédito"} se ha procesado correctamente.`,
            mensajeDetalles,
            iddtefactura
          );

        } catch (error) {
          console.error(`Error al generar nota de ${tipoNota}:`, error);
          mostrarModalMensaje(
            "error",
            "Error al Generar Nota",
            `No se pudo generar la nota de ${tipoNota === "debito" ? "débito" : "crédito"}.`,
            error.message
          );
        } finally {
          setEnviando(false);
        }
      };

  const convertirNumeroALetras = (numero) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    const entero = Math.floor(numero);
    const decimal = Math.round((numero - entero) * 100);
    
    if (entero === 0) return `CERO CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero === 1) return `UNO CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero < 10) return `${unidades[entero].toUpperCase()} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
    if (entero < 20) return `${especiales[entero - 10].toUpperCase()} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;

    return `${entero} CON ${decimal.toString().padStart(2, '0')}/100 DÓLARES`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-SV', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-SV');
  };

  // Función para manejar el cierre del modal de mensajes
  const handleCierreMensaje = () => {
    setMostrarMensaje(false);
    // Si fue un mensaje de éxito, redirigir a la lista de notas
    if (mensajeConfig.tipo === "exito") {
      const rutaRedireccion = tipoNota === "debito" 
        ? "/dashboard/nota_debito" 
        : "/dashboard/nota_debito";
      router.push(rutaRedireccion);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <div className={`fixed md:relative z-20 h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
        >
          <Sidebar />
        </div>

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

          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando factura...</p>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <div className={`fixed md:relative z-20 h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
        >
          <Sidebar />
        </div>

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

          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {error ? "Error" : "Factura no encontrada"}
              </h2>
              <p className="text-gray-600 mb-4">{error || "La factura solicitada no existe"}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaArrowLeft className="inline mr-2" />
                Volver
              </button>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen  text-black bg-gray-50 overflow-hidden">
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
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
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={handleBack}
                className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Volver a facturas
              </button>
              
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Emitir Nota de {tipoNota === "debito" ? "Débito" : "Crédito"}
                </h1>
                <p className="text-gray-600">
                  Complete la información para generar la nota
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaFileAlt className="text-blue-500 mr-2" />
                    Factura Original
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Número de Control</label>
                      <p className="text-gray-800 font-semibold break-all">
                        {factura.ncontrol || 'No disponible'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
                      <p className="text-gray-800 flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2 text-sm" />
                        {formatDate(factura.fechaemision)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cliente</label>
                      <p className="text-gray-800 font-medium">
                        {factura.nombrecibe || 'Cliente no especificado'}
                      </p>
                      {factura.docuentrega && (
                        <p className="text-sm text-gray-500">DUI: {factura.docuentrega}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <p className="text-gray-800">{factura.estado || 'PENDIENTE'}</p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-500">Total Factura</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Nota *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => cambiarTipoNota("debito")}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          tipoNota === "debito"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-purple-300"
                        }`}
                      >
                        <FaExchangeAlt className={`mx-auto mb-2 text-lg ${
                          tipoNota === "debito" ? "text-purple-500" : "text-gray-400"
                        }`} />
                        <div className="font-semibold">Nota de Débito</div>
                        <div className="text-sm text-gray-500 mt-1">Aumentar el monto</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => cambiarTipoNota("credito")}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          tipoNota === "credito"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-green-300"
                        }`}
                      >
                        <FaExchangeAlt className={`mx-auto mb-2 text-lg ${
                          tipoNota === "credito" ? "text-green-500" : "text-gray-400"
                        }`} />
                        <div className="font-semibold">Nota de Crédito</div>
                        <div className="text-sm text-gray-500 mt-1">Reducir el monto</div>
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la Nota *
                    </label>
                    <textarea
                      id="motivo"
                      value={motivoNota}
                      onChange={(e) => setMotivoNota(e.target.value)}
                      placeholder={`Describa el motivo de la nota de ${tipoNota === "debito" ? "débito" : "crédito"}...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows="4"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Describa detalladamente el motivo de la nota
                    </p>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
                      Monto de la Nota (USD) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="monto"
                        value={montoNota}
                        onChange={handleMontoChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    
                    {/* Mostrar mensaje de error si existe */}
                    {errorMonto && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        {errorMonto}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Monto mínimo: $0.01</span>
                      <span>
                        {tipoNota === "credito" 
                          ? `Máximo: ${formatCurrency(factura.totalpagar || factura.montototaloperacion || 0)}`
                          : `Máximo recomendado: ${formatCurrency((factura.totalpagar || factura.montototaloperacion || 0) * 2)}`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Resumen</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo de nota:</span>
                        <span className="font-medium">
                          {tipoNota === "debito" ? "Nota de Débito" : "Nota de Crédito"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monto (Neto):</span>
                        <span className="font-medium">
                          {montoNota ? formatCurrency(parseFloat(montoNota) / 1.13) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA (13%):</span>
                        <span className="font-medium">
                          {montoNota ? formatCurrency(parseFloat(montoNota) - (parseFloat(montoNota) / 1.13)) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-800 font-semibold">Total nota:</span>
                        <span className="font-bold text-blue-600">
                          {montoNota ? formatCurrency(parseFloat(montoNota)) : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGenerarNota}
                      disabled={!motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando || errorMonto}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center ${
                        !motivoNota.trim() || !montoNota || parseFloat(montoNota) <= 0 || enviando || errorMonto
                          ? "bg-gray-400 cursor-not-allowed"
                          : tipoNota === "debito" 
                            ? "bg-purple-600 hover:bg-purple-700" 
                            : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {enviando ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="mr-2" />
                          Emitir Nota de {tipoNota === "debito" ? "Débito" : "Crédito"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6 rounded-r">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Importante:</strong> Las notas de débito/crédito solo pueden generarse para 
                        facturas transmitidas con menos de 24 horas de antigüedad y que estén en estado 
                        "TRANSMITIDO" o "RE-TRANSMITIDO".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal de Mensajes */}
      <MensajeModal
        isOpen={mostrarMensaje}
        onClose={handleCierreMensaje}
        tipo={mensajeConfig.tipo}
        titulo={mensajeConfig.titulo}
        mensaje={mensajeConfig.mensaje}
        detalles={mensajeConfig.detalles}
        idFactura={mensajeConfig.idFactura}
        onDescargarTicket={descargarTicketNota}
        descargando={descargandoTicket}
      />
    </div>
  );
}