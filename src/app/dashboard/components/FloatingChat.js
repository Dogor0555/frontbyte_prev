"use client";
import { useState, useEffect, useRef } from "react";
import { 
  FaHeadset, FaTimes, FaPaperPlane, FaImage, FaSpinner, FaCheckCircle, 
  FaExclamationTriangle, FaUser, FaHeadset as FaSupport, FaClock, 
  FaPlus, FaTicketAlt, FaComment,
  FaInfoCircle, FaQuestionCircle, FaBug, FaFileInvoice, FaChartLine, FaUsers,
  FaBox, FaSearch, FaRobot,
  FaRegClock, FaCheck, FaCircle, FaAngleLeft, FaChevronDown, FaChevronUp,
  FaPaperPlane as FaSend, FaHistory, FaEye, FaBell, FaVolumeUp, FaVolumeMute
} from "react-icons/fa";
import { API_BASE_URL } from "../../../lib/api";

export default function FloatingChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [mostrarFormNuevoTicket, setMostrarFormNuevoTicket] = useState(false);
  const [nuevoTicketTitulo, setNuevoTicketTitulo] = useState("");
  const [nuevoTicketDescripcion, setNuevoTicketDescripcion] = useState("");
  const [nuevoTicketCategoria, setNuevoTicketCategoria] = useState("");
  const [nuevoTicketPrioridad, setNuevoTicketPrioridad] = useState("media");
  const [creandoTicket, setCreandoTicket] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [ticketsHistorial, setTicketsHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [notificacionPermiso, setNotificacionPermiso] = useState(null);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const audioRef = useRef(null);

  // ─── Permission system (same as Sidebar) ───────────────────────────────────
  const [permisos, setPermisos] = useState([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [tieneAcceso, setTieneAcceso] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const activoRef = useRef(false);

  // ─── Solicitar permiso para notificaciones push ────────────────────────────
  useEffect(() => {
    if ("Notification" in window) {
      setNotificacionPermiso(Notification.permission);
    }
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const solicitarPermisoNotificacion = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permiso = await Notification.requestPermission();
      setNotificacionPermiso(permiso);
    }
  };

  const reproducirSonido = () => {
  if (sonidoActivo) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
    oscillator.stop(audioCtx.currentTime + 0.5);
  }
};

  const mostrarNotificacion = (titulo, cuerpo, ticketId, tipo = "nuevo_mensaje") => {
    reproducirSonido();
    
    if (notificacionPermiso === "granted" && document.hidden) {
      const notification = new Notification(titulo, {
        body: cuerpo,
        icon: "/favicon.ico",
        tag: `ticket-${ticketId}-${Date.now()}`,
        silent: false,
      });
      notification.onclick = () => {
        window.focus();
        setIsOpen(true);
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          setTicketSeleccionado(ticket);
          marcarLeidos(ticketId);
        }
        notification.close();
      };
    }
  };

  const mensajesPredeterminados = [
    { texto: "No puedo generar facturas", icono: <FaFileInvoice />, tipo: "facturacion", tag: "Facturación" },
    { texto: "Error al transmitir DTE", icono: <FaBug />, tipo: "dte", tag: "DTE" },
    { texto: "Problema con reportes", icono: <FaChartLine />, tipo: "reportes", tag: "Reportes" },
    { texto: "Error al iniciar sesión", icono: <FaUser />, tipo: "login", tag: "Acceso" },
    { texto: "Problema con productos", icono: <FaBox />, tipo: "productos", tag: "Productos" },
    { texto: "Problema con clientes", icono: <FaUsers />, tipo: "clientes", tag: "Clientes" },
    { texto: "Sistema lento", icono: <FaClock />, tipo: "rendimiento", tag: "Rendimiento" },
    { texto: "Otra consulta", icono: <FaQuestionCircle />, tipo: "otro", tag: "Otro" },
  ];

  const categorias = [
    { valor: "facturacion", label: "Facturación" },
    { valor: "dte", label: "DTE / Hacienda" },
    { valor: "reportes", label: "Reportes" },
    { valor: "productos", label: "Productos" },
    { valor: "clientes", label: "Clientes" },
    { valor: "login", label: "Inicio de Sesión" },
    { valor: "tecnico", label: "Problema Técnico" },
    { valor: "otro", label: "Otro" },
  ];

  // ─── Load permissions ──────────────────────────────────────────────────────
  useEffect(() => {
    cargarPermisos();
  }, []);

  const cargarPermisos = async () => {
    try {
      setLoadingPermisos(true);
      const response = await fetch(`${API_BASE_URL}/permisos/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        const lista = data.permisos || [];
        setPermisos(lista);
        setTieneAcceso(lista.includes("Soporte"));
      } else {
        setPermisos([]);
        setTieneAcceso(false);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      setPermisos([]);
      setTieneAcceso(false);
    } finally {
      setLoadingPermisos(false);
    }
  };

  // ─── Event listener & data fetching ────────────────────────────────────────
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("openFloatingChat", handleOpenChat);
    return () => window.removeEventListener("openFloatingChat", handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && !ticketSeleccionado) fetchTickets();
  }, [isOpen, ticketSeleccionado]);

  useEffect(() => {
    if (ticketSeleccionado) {
      activoRef.current = true;
      fetchMensajes();
      intervalRef.current = setInterval(fetchMensajes, 10000);
    }
    return () => {
      activoRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ticketSeleccionado?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // ─── Marcar mensajes como leídos ──────────────────────────────────────────
  const marcarLeidos = async (ticketId) => {
    try {
      await fetch(`${API_BASE_URL}/tickets/${ticketId}/leer`, {
        method: "PATCH",
        credentials: "include",
      });
      await fetchTickets();
    } catch (error) {
      console.error("Error al marcar leídos:", error);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/mis-tickets`, { credentials: "include" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const oldTickets = tickets;
      setTickets(data);
      
      data.forEach(ticket => {
        const oldTicket = oldTickets.find(t => t.id === ticket.id);
        if (oldTicket && ticket.mensajes_no_leidos > oldTicket.mensajes_no_leidos) {
          const diferencia = ticket.mensajes_no_leidos - oldTicket.mensajes_no_leidos;
          mostrarNotificacion(
            `📨 Nuevo mensaje en ticket #${ticket.id}`,
            `${ticket.titulo.substring(0, 50)}... (${diferencia} nuevo${diferencia !== 1 ? "s" : ""})`,
            ticket.id,
            "nuevo_mensaje"
          );
        }
      });
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchMensajes = async () => {
    if (!ticketSeleccionado) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}`, { credentials: "include" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!activoRef.current) return;
      
      const nuevosMensajes = data.mensajes || [];
      const mensajesAnteriores = mensajes;
      
      setTicketSeleccionado(data.ticket);
      setMensajes(nuevosMensajes);
      
      if (nuevosMensajes.length > mensajesAnteriores.length) {
        const mensajesNuevos = nuevosMensajes.slice(mensajesAnteriores.length);
        mensajesNuevos.forEach(msg => {
          if (msg.remitente_tipo === "soporte") {
            mostrarNotificacion(
              `💬 Nueva respuesta de soporte`,
              `${msg.mensaje?.substring(0, 80) || "Imagen adjunta"}...`,
              ticketSeleccionado.id,
              "respuesta_soporte"
            );
          }
        });
      }
      
      await marcarLeidos(ticketSeleccionado.id);
      
    } catch { /* silent */ }
  };

  // ─── Cargar historial de tickets del mismo cliente ─────────────────────────
  const cargarHistorialTickets = async () => {
    if (!ticketSeleccionado?.empresa?.id) return;
    setCargandoHistorial(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/mis-tickets`, { credentials: "include" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const historial = data.filter(t => 
        t.id !== ticketSeleccionado.id && 
        t.empresa?.id === ticketSeleccionado.empresa?.id
      );
      setTicketsHistorial(historial);
      setMostrarHistorial(true);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede exceder los 5MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Formato no soportado. Use JPG, PNG o WEBP"); return; }
    setImagen(file);
    setImagenPreview(URL.createObjectURL(file));
    setError("");
  };

  const eliminarImagen = () => {
    setImagen(null);
    setImagenPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() && !imagen) { setError("Escribe un mensaje o adjunta una imagen"); return; }
    setEnviando(true); setError(""); setExito("");
    const formData = new FormData();
    if (nuevoMensaje.trim()) formData.append("mensaje", nuevoMensaje);
    if (imagen) formData.append("imagen", imagen);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketSeleccionado.id}/mensajes`, {
        method: "POST", credentials: "include", body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar mensaje");
      setNuevoMensaje(""); eliminarImagen();
      setExito("Mensaje enviado"); setTimeout(() => setExito(""), 3000);
      await fetchMensajes();
      inputRef.current?.focus();
    } catch (err) { setError(err.message); } finally { setEnviando(false); }
  };

  const crearTicketRapido = async (e) => {
    e.preventDefault();
    if (!nuevoTicketTitulo.trim()) { setError("El título es requerido"); return; }
    setCreandoTicket(true); setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: nuevoTicketTitulo, descripcion: nuevoTicketDescripcion, prioridad: nuevoTicketPrioridad, categoria: nuevoTicketCategoria || "otro" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al crear el ticket");
      setMostrarFormNuevoTicket(false);
      setNuevoTicketTitulo(""); setNuevoTicketDescripcion(""); setNuevoTicketCategoria(""); setNuevoTicketPrioridad("media");
      await fetchTickets();
      setExito("Ticket creado"); setTimeout(() => setExito(""), 3000);
    } catch (err) { setError(err.message); } finally { setCreandoTicket(false); }
  };

  const volverALista = () => {
    activoRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTicketSeleccionado(null);
    setMensajes([]);
    setMostrarFormNuevoTicket(false);
    setMostrarHistorial(false);
    fetchTickets();
  };

  const usarMensajePredeterminado = (mensaje, categoria) => {
    setMostrarFormNuevoTicket(true);
    setNuevoTicketTitulo(mensaje);
    setNuevoTicketDescripcion(`Problema: ${mensaje}\n\nPor favor ayúdenme con este inconveniente.`);
    setNuevoTicketCategoria(categoria);
  };

  const getEstadoInfo = (estado) => {
    const map = {
      abierto:    { dot: "#f59e0b", label: "Abierto",     chip: "estado-abierto" },
      en_proceso: { dot: "#3b82f6", label: "En Proceso",  chip: "estado-proceso" },
      resuelto:   { dot: "#10b981", label: "Resuelto",    chip: "estado-resuelto" },
      cerrado:    { dot: "#6b7280", label: "Cerrado",     chip: "estado-cerrado" },
    };
    return map[estado] || { dot: "#6b7280", label: estado, chip: "estado-cerrado" };
  };

  const getPrioridadInfo = (prioridad) => {
    const map = {
      urgente: { label: "Urgente", chip: "prio-urgente" },
      alta:    { label: "Alta",    chip: "prio-alta" },
      media:   { label: "Media",   chip: "prio-media" },
      baja:    { label: "Baja",    chip: "prio-baja" },
    };
    return map[prioridad] || { label: prioridad, chip: "prio-baja" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diff = Date.now() - date;
    const hours = diff / 3600000;
    if (hours < 1) return `${Math.floor(diff / 60000)}m`;
    if (hours < 24) return `${Math.floor(hours)}h`;
    return date.toLocaleDateString("es-SV", { day: "numeric", month: "short" });
  };

  const ticketsFiltrados = filtroEstado === "todos" ? tickets : tickets.filter(t => t.estado === filtroEstado);
  const totalNoLeidos = tickets.reduce((sum, t) => sum + (t.mensajes_no_leidos || 0), 0);

  // ─── Permission guard ──────────────────────────────────────────────────────
  if (loadingPermisos || !tieneAcceso) return null;

  // ─── Floating button ───────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <>
        <style>{styles}</style>
        <button onClick={() => setIsOpen(true)} className="fc-trigger" aria-label="Abrir soporte técnico">
          <FaHeadset className="fc-trigger-icon" />
          {totalNoLeidos > 0 && (
            <span className="fc-badge">{totalNoLeidos > 9 ? "9+" : totalNoLeidos}</span>
          )}
          <span className="fc-tooltip">Soporte Técnico</span>
        </button>
      </>
    );
  }

  // ─── Full chat panel ───────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="fc-panel">

        {/* Header */}
        <div className="fc-header">
          <div className="fc-header-left">
            <div className="fc-avatar">
              <FaHeadset />
            </div>
            <div>
              <p className="fc-header-title">Soporte Técnico</p>
              <p className="fc-header-status">
                <span className="fc-status-dot" />
                En línea
              </p>
            </div>
          </div>
          <div className="fc-header-actions">
            <button onClick={() => setSonidoActivo(!sonidoActivo)} className="fc-icon-btn" title={sonidoActivo ? "Silenciar notificaciones" : "Activar sonido"}>
              {sonidoActivo ? <FaVolumeUp className="text-white" /> : <FaVolumeMute className="text-gray-400" />}
            </button>
            {notificacionPermiso === "default" && (
              <button onClick={solicitarPermisoNotificacion} className="fc-icon-btn" title="Activar notificaciones">
                <FaBell />
              </button>
            )}
            <button onClick={() => setIsMinimized(!isMinimized)} className="fc-icon-btn">
              {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            <button onClick={() => { setIsOpen(false); setTicketSeleccionado(null); setMostrarFormNuevoTicket(false); }} className="fc-icon-btn">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Minimized bar */}
        {isMinimized && (
          <div className="fc-minimized-bar">
            <span className="fc-minimized-text">
              {totalNoLeidos > 0 ? `${totalNoLeidos} mensaje(s) nuevo(s)` : "Disponible para ayudarte"}
            </span>
            <button onClick={() => setIsMinimized(false)} className="fc-minimized-btn">Abrir</button>
          </div>
        )}

        {/* Body */}
        {!isMinimized && (
          <div className="fc-body">

            {/* ── CHAT VIEW ─────────────────────────────────── */}
            {ticketSeleccionado ? (
              <div className="fc-chat-wrapper">

                {/* Chat subheader con botón de historial */}
                <div className="fc-subheader">
                  <button onClick={volverALista} className="fc-back-btn">
                    <FaAngleLeft /> Volver
                  </button>
                  <div className="fc-subheader-info">
                    <p className="fc-ticket-title">{ticketSeleccionado.titulo}</p>
                    <div className="fc-chips">
                      <span className={`fc-chip ${getEstadoInfo(ticketSeleccionado.estado).chip}`}>
                        <span className="fc-chip-dot" style={{ background: getEstadoInfo(ticketSeleccionado.estado).dot }} />
                        {getEstadoInfo(ticketSeleccionado.estado).label}
                      </span>
                      <span className={`fc-chip ${getPrioridadInfo(ticketSeleccionado.prioridad).chip}`}>
                        {getPrioridadInfo(ticketSeleccionado.prioridad).label}
                      </span>
                    </div>
                  </div>
                  {/* Botón de historial */}
                  <button onClick={cargarHistorialTickets} className="fc-history-btn" title="Ver tickets anteriores">
                    <FaHistory /> Historial
                  </button>
                </div>

                {/* Modal de historial */}
                {mostrarHistorial && (
                  <div className="fc-modal-overlay" onClick={() => setMostrarHistorial(false)}>
                    <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="fc-modal-header">
                        <h3 className="fc-modal-title">
                          <FaHistory /> Tickets anteriores de {ticketSeleccionado.empresa?.nombre || "este cliente"}
                        </h3>
                        <button onClick={() => setMostrarHistorial(false)} className="fc-modal-close">
                          <FaTimes />
                        </button>
                      </div>
                      <div className="fc-modal-body">
                        {cargandoHistorial ? (
                          <div className="fc-loading"><FaSpinner className="fc-spin fc-spin-lg" /></div>
                        ) : ticketsHistorial.length === 0 ? (
                          <div className="fc-empty-historial">
                            <FaHistory className="fc-empty-icon" />
                            <p>No hay tickets anteriores de este cliente</p>
                          </div>
                        ) : (
                          <div className="fc-historial-list">
                            {ticketsHistorial.map(t => (
                              <button
                                key={t.id}
                                className="fc-historial-item"
                                onClick={() => {
                                  setTicketSeleccionado(t);
                                  marcarLeidos(t.id);
                                  setMostrarHistorial(false);
                                }}
                              >
                                <div className="fc-historial-header">
                                  <span className={`fc-chip ${getEstadoInfo(t.estado).chip}`}>
                                    {getEstadoInfo(t.estado).label}
                                  </span>
                                  <span className="fc-historial-date">
                                    <FaRegClock /> {formatDate(t.created_at)}
                                  </span>
                                </div>
                                <p className="fc-historial-title">{t.titulo}</p>
                                <div className="fc-historial-footer">
                                  <span className="fc-historial-cat">{t.categoria || "Sin categoría"}</span>
                                  <FaEye className="fc-historial-view" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="fc-messages">
                  {mensajes.length === 0 ? (
                    <div className="fc-empty-msg">
                      <div className="fc-empty-icon"><FaComment /></div>
                      <p className="fc-empty-title">Sin mensajes aún</p>
                      <p className="fc-empty-sub">Escribe para comenzar la conversación</p>
                    </div>
                  ) : mensajes.map((msg, idx) => {
                    const esCliente = msg.remitente_tipo === "cliente";
                    return (
                      <div key={msg.id || idx} className={`fc-msg-row ${esCliente ? "fc-msg-right" : "fc-msg-left"}`}>
                        {!esCliente && (
                          <div className="fc-msg-avatar fc-avatar-support"><FaSupport /></div>
                        )}
                        <div className="fc-msg-content">
                          <div className={`fc-bubble ${esCliente ? "fc-bubble-client" : "fc-bubble-support"}`}>
                            {msg.mensaje && <p className="fc-bubble-text">{msg.mensaje}</p>}
                            {msg.imagen_url && (
                              <img src={msg.imagen_url} alt="Adjunto" className="fc-bubble-img"
                                onClick={() => window.open(msg.imagen_url, "_blank")} />
                            )}
                          </div>
                          <span className="fc-msg-time">{formatDate(msg.created_at)}</span>
                        </div>
                        {esCliente && (
                          <div className="fc-msg-avatar fc-avatar-client"><FaUser /></div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input con notificaciones */}
                <div className="fc-input-area">
                  {error && <div className="fc-alert fc-alert-error"><FaExclamationTriangle />{error}</div>}
                  {exito && <div className="fc-alert fc-alert-success"><FaCheckCircle />{exito}</div>}
                  
                  {imagenPreview && (
                    <div className="fc-img-preview">
                      <img src={imagenPreview} alt="Preview" />
                      <button onClick={eliminarImagen} className="fc-img-remove">×</button>
                    </div>
                  )}
                  {ticketSeleccionado?.estado === "cerrado" ? (
                    <p className="fc-closed-notice">Este ticket está cerrado</p>
                  ) : (
                    <form onSubmit={enviarMensaje} className="fc-form">
                      <input type="file" ref={fileInputRef} onChange={handleImagenChange}
                        accept="image/jpeg,image/png,image/webp" className="fc-file-input" id="fc-img-input" />
                      <label htmlFor="fc-img-input" className="fc-attach-btn" title="Adjuntar imagen">
                        <FaImage />
                      </label>
                      <input ref={inputRef} type="text" value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder="Escribe tu mensaje..." className="fc-text-input" />
                      <button type="submit" disabled={enviando} className="fc-send-btn">
                        {enviando ? <FaSpinner className="fc-spin" /> : <FaSend />}
                      </button>
                    </form>
                  )}
                </div>
              </div>

            ) : (
              /* ── LIST VIEW ──────────────────────────────────── */
              <div className="fc-list-wrapper">

                {/* List header con indicador de no leídos */}
                <div className="fc-list-header">
                  <div className="fc-list-top">
                    <div className="fc-list-title-wrapper">
                      <h4 className="fc-list-title">Mis Tickets</h4>
                      {totalNoLeidos > 0 && (
                        <span className="fc-unread-indicator">
                          {totalNoLeidos} nuevo{totalNoLeidos !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setMostrarFormNuevoTicket(!mostrarFormNuevoTicket)} className="fc-new-btn">
                      <FaPlus /> Nuevo
                    </button>
                  </div>

                  {/* Filter pills */}
                  <div className="fc-filters">
                    {[
                      { key: "todos", label: "Todos" },
                      { key: "abierto", label: "Abierto" },
                      { key: "en_proceso", label: "En proceso" },
                      { key: "resuelto", label: "Resuelto" },
                    ].map(f => (
                      <button key={f.key} onClick={() => setFiltroEstado(f.key)}
                        className={`fc-filter-pill ${filtroEstado === f.key ? "fc-filter-active" : ""}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fc-list-body">
                  {/* Quick help */}
                  {!mostrarFormNuevoTicket && (
                    <div className="fc-quick-help">
                      <div className="fc-quick-label">
                        <FaRobot className="fc-quick-icon" />
                        <span>Ayuda rápida</span>
                      </div>
                      <div className="fc-quick-chips">
                        {mensajesPredeterminados.slice(0, 4).map((msg, idx) => (
                          <button key={idx} onClick={() => usarMensajePredeterminado(msg.texto, msg.tipo)}
                            className="fc-quick-chip">
                            {msg.icono}
                            <span>{msg.tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New ticket form */}
                  {mostrarFormNuevoTicket && (
                    <form onSubmit={crearTicketRapido} className="fc-new-form">
                      <p className="fc-new-form-title">Nuevo Ticket</p>
                      {error && <div className="fc-alert fc-alert-error"><FaExclamationTriangle />{error}</div>}
                      <input type="text" placeholder="Título del problema *" value={nuevoTicketTitulo}
                        onChange={(e) => setNuevoTicketTitulo(e.target.value)}
                        className="fc-field" required />
                      <textarea placeholder="Describe tu problema..." value={nuevoTicketDescripcion}
                        onChange={(e) => setNuevoTicketDescripcion(e.target.value)}
                        rows="3" className="fc-field fc-textarea" />
                      <div className="fc-field-row">
                        <select value={nuevoTicketCategoria} onChange={(e) => setNuevoTicketCategoria(e.target.value)} className="fc-select">
                          <option value="">Categoría</option>
                          {categorias.map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}
                        </select>
                        <select value={nuevoTicketPrioridad} onChange={(e) => setNuevoTicketPrioridad(e.target.value)} className="fc-select">
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                      <div className="fc-form-actions">
                        <button type="button" onClick={() => setMostrarFormNuevoTicket(false)} className="fc-btn-cancel">
                          Cancelar
                        </button>
                        <button type="submit" disabled={creandoTicket} className="fc-btn-submit">
                          {creandoTicket ? "Creando..." : "Crear Ticket"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tickets list con indicador de no leídos */}
                  {loading ? (
                    <div className="fc-loading"><FaSpinner className="fc-spin fc-spin-lg" /></div>
                  ) : ticketsFiltrados.length === 0 ? (
                    <div className="fc-empty">
                      <div className="fc-empty-icon-lg"><FaTicketAlt /></div>
                      <p className="fc-empty-title">Sin tickets</p>
                      <p className="fc-empty-sub">Crea uno para recibir ayuda</p>
                    </div>
                  ) : (
                    <div className="fc-ticket-list">
                      {ticketsFiltrados.map((ticket) => {
                        const est = getEstadoInfo(ticket.estado);
                        const prio = getPrioridadInfo(ticket.prioridad);
                        const cat = categorias.find(c => c.valor === ticket.categoria);
                        const tieneNoLeidos = ticket.mensajes_no_leidos > 0;
                        return (
                          <button 
                            key={ticket.id} 
                            onClick={() => {
                              setTicketSeleccionado(ticket);
                              marcarLeidos(ticket.id);
                            }} 
                            className={`fc-ticket-card ${tieneNoLeidos ? "fc-ticket-unread" : ""}`}
                          >
                            <div className="fc-ticket-top">
                              <div className="fc-ticket-meta">
                                {cat && <span className="fc-cat-label">{cat.label}</span>}
                                {tieneNoLeidos && (
                                  <span className="fc-unread-badge">
                                    {ticket.mensajes_no_leidos} nuevo{ticket.mensajes_no_leidos !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <span className="fc-ticket-time">
                                <FaRegClock /> {formatDate(ticket.created_at)}
                              </span>
                            </div>
                            <p className="fc-ticket-name">{ticket.titulo}</p>
                            <div className="fc-ticket-chips">
                              <span className={`fc-chip ${est.chip}`}>
                                <span className="fc-chip-dot" style={{ background: est.dot }} />
                                {est.label}
                              </span>
                              <span className={`fc-chip ${prio.chip}`}>{prio.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

  .fc-panel, .fc-panel * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

  /* ── Trigger button ───────────────────────────────────── */
  .fc-trigger {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    width: 58px; height: 58px; border-radius: 50%;
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .fc-trigger:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(37,99,235,0.55), 0 4px 12px rgba(0,0,0,0.15); }
  .fc-trigger-icon { font-size: 22px; color: #fff; }
  .fc-badge {
    position: absolute; top: -4px; right: -4px;
    background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
    border-radius: 99px; min-width: 18px; height: 18px; padding: 0 4px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff; animation: fc-pulse 1.5s infinite;
  }
  @keyframes fc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  .fc-tooltip {
    position: absolute; bottom: calc(100% + 10px); right: 0;
    background: #0f172a; color: #e2e8f0; font-size: 12px; font-weight: 500;
    padding: 6px 10px; border-radius: 8px; white-space: nowrap;
    opacity: 0; pointer-events: none; transition: opacity 0.2s;
  }
  .fc-trigger:hover .fc-tooltip { opacity: 1; }

  /* ── Panel ────────────────────────────────────────────── */
  .fc-panel {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    width: 400px; max-height: 700px;
    background: #f8fafc; border-radius: 20px;
    box-shadow: 0 24px 80px rgba(15,23,42,0.2), 0 8px 24px rgba(15,23,42,0.1);
    display: flex; flex-direction: column; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.8);
  }

  /* ── Header ───────────────────────────────────────────── */
  .fc-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%);
    padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .fc-header-left { display: flex; align-items: center; gap: 14px; }
  .fc-avatar {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(255,255,255,0.18); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }
  .fc-header-title { color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 2px; letter-spacing: -0.01em; }
  .fc-header-status { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.75); font-size: 12px; margin: 0; }
  .fc-status-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #4ade80;
    box-shadow: 0 0 0 2px rgba(74,222,128,0.35);
    animation: fc-pulse 2s infinite;
  }
  .fc-header-actions { display: flex; gap: 4px; }
  .fc-icon-btn {
    background: rgba(255,255,255,0.12); border: none; cursor: pointer;
    color: rgba(255,255,255,0.85); width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    transition: background 0.15s;
  }
  .fc-icon-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

  /* ── Minimized bar ────────────────────────────────────── */
  .fc-minimized-bar {
    background: #fff; padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid #e2e8f0;
  }
  .fc-minimized-text { font-size: 13px; color: #64748b; }
  .fc-minimized-btn {
    font-size: 13px; font-weight: 600; color: #2563eb;
    background: none; border: none; cursor: pointer; padding: 0;
  }
  .fc-minimized-btn:hover { text-decoration: underline; }

  /* ── Body ─────────────────────────────────────────────── */
  .fc-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .fc-chat-wrapper, .fc-list-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* ── Subheader ────────────────────────────────────────── */
  .fc-subheader {
    background: #fff; padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .fc-back-btn {
    display: flex; align-items: center; gap: 4px;
    background: #f1f5f9; border: none; cursor: pointer; color: #475569;
    font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 8px;
    white-space: nowrap; transition: all 0.15s;
  }
  .fc-back-btn:hover { background: #e2e8f0; color: #1e40af; }
  .fc-subheader-info { flex: 1; min-width: 0; }
  .fc-ticket-title { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fc-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .fc-history-btn {
    display: flex; align-items: center; gap: 6px;
    background: #f1f5f9; border: none; cursor: pointer; color: #475569;
    font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 8px;
    transition: all 0.15s;
  }
  .fc-history-btn:hover { background: #e2e8f0; color: #2563eb; }

  /* ── Modal Historial ──────────────────────────────────── */
  .fc-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 10000;
    display: flex; align-items: center; justify-content: center;
  }
  .fc-modal {
    background: #fff; border-radius: 20px; width: 380px; max-width: 90%;
    max-height: 80%; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  }
  .fc-modal-header {
    padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    background: #f8fafc;
  }
  .fc-modal-title {
    display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600;
    color: #0f172a; margin: 0;
  }
  .fc-modal-close {
    background: none; border: none; cursor: pointer; color: #94a3b8;
    padding: 4px; font-size: 14px;
  }
  .fc-modal-close:hover { color: #475569; }
  .fc-modal-body { flex: 1; overflow-y: auto; padding: 16px; }
  .fc-empty-historial {
    text-align: center; padding: 32px 16px; color: #94a3b8;
  }
  .fc-empty-historial .fc-empty-icon { font-size: 40px; margin-bottom: 12px; }
  .fc-historial-list { display: flex; flex-direction: column; gap: 12px; }
  .fc-historial-item {
    width: 100%; text-align: left; background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
    cursor: pointer; transition: all 0.15s;
  }
  .fc-historial-item:hover { border-color: #93c5fd; background: #eff6ff; }
  .fc-historial-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .fc-historial-date { font-size: 10px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
  .fc-historial-title { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 8px; }
  .fc-historial-footer { display: flex; justify-content: space-between; align-items: center; }
  .fc-historial-cat { font-size: 10px; color: #64748b; background: #e2e8f0; padding: 2px 8px; border-radius: 99px; }
  .fc-historial-view { color: #94a3b8; font-size: 12px; }

  /* ── Notificaciones ───────────────────────────────────── */
  .fc-notif-prompt {
    display: flex; align-items: center; gap: 10px;
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 10px; padding: 8px 12px; margin-bottom: 10px;
    font-size: 12px; color: #1e40af;
  }
  .fc-notif-btn {
    margin-left: auto; background: #2563eb; color: #fff;
    border: none; border-radius: 6px; padding: 4px 12px;
    font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .fc-notif-btn:hover { background: #1d4ed8; }

  /* ── List title con indicador ─────────────────────────── */
  .fc-list-title-wrapper { display: flex; align-items: center; gap: 8px; }
  .fc-unread-indicator {
    background: #ef4444; color: #fff; font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 99px;
  }

  /* ── Ticket card con no leídos ────────────────────────── */
  .fc-ticket-unread {
    border-left: 3px solid #ef4444;
    background: linear-gradient(90deg, #fff, #fff9f0);
  }

  /* ── Chips ────────────────────────────────────────────── */
  .fc-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px; letter-spacing: 0.01em;
  }
  .fc-chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .estado-abierto   { background: #fef3c7; color: #92400e; }
  .estado-proceso   { background: #dbeafe; color: #1e40af; }
  .estado-resuelto  { background: #d1fae5; color: #065f46; }
  .estado-cerrado   { background: #f1f5f9; color: #475569; }
  .prio-urgente     { background: #fee2e2; color: #991b1b; }
  .prio-alta        { background: #ffedd5; color: #9a3412; }
  .prio-media       { background: #fef9c3; color: #854d0e; }
  .prio-baja        { background: #dcfce7; color: #166534; }

  /* ── Messages ─────────────────────────────────────────── */
  .fc-messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex;
    flex-direction: column; gap: 12px; background: #f1f5f9;
  }
  .fc-messages::-webkit-scrollbar { width: 4px; }
  .fc-messages::-webkit-scrollbar-track { background: transparent; }
  .fc-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .fc-msg-row { display: flex; align-items: flex-end; gap: 8px; }
  .fc-msg-right { flex-direction: row-reverse; }
  .fc-msg-left  { flex-direction: row; }

  .fc-msg-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;
  }
  .fc-avatar-support { background: #dbeafe; color: #1d4ed8; }
  .fc-avatar-client  { background: #d1fae5; color: #059669; }

  .fc-msg-content { display: flex; flex-direction: column; max-width: 80%; }
  .fc-msg-right .fc-msg-content { align-items: flex-end; }
  .fc-msg-left  .fc-msg-content { align-items: flex-start; }

  .fc-bubble {
    padding: 10px 14px; border-radius: 16px; max-width: 100%;
    word-break: break-word;
  }
  .fc-bubble-client {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; border-bottom-right-radius: 4px;
    box-shadow: 0 2px 12px rgba(37,99,235,0.25);
  }
  .fc-bubble-support {
    background: #fff; color: #1e293b; border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;
  }
  .fc-bubble-text { font-size: 13.5px; line-height: 1.55; margin: 0; white-space: pre-wrap; }
  .fc-bubble-img {
    display: block; max-width: 200px; max-height: 150px; border-radius: 10px;
    cursor: pointer; margin-top: 8px; transition: opacity 0.15s;
  }
  .fc-bubble-img:hover { opacity: 0.88; }
  .fc-msg-time { font-size: 10.5px; color: #94a3b8; margin-top: 4px; }

  .fc-empty-msg {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px;
  }
  .fc-empty-icon {
    width: 52px; height: 52px; background: #e0e7ff; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 20px; color: #4f46e5; margin-bottom: 12px;
  }
  .fc-empty-title { font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 4px; }
  .fc-empty-sub   { font-size: 12.5px; color: #94a3b8; margin: 0; }

  /* ── Input area ───────────────────────────────────────── */
  .fc-input-area {
    background: #fff; padding: 12px 14px; border-top: 1px solid #e2e8f0; flex-shrink: 0;
  }
  .fc-alert {
    display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500;
    padding: 8px 12px; border-radius: 8px; margin-bottom: 10px;
  }
  .fc-alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .fc-alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

  .fc-img-preview { position: relative; display: inline-block; margin-bottom: 10px; }
  .fc-img-preview img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; border: 2px solid #e2e8f0; }
  .fc-img-remove {
    position: absolute; top: -8px; right: -8px;
    width: 20px; height: 20px; border-radius: 50%; background: #ef4444;
    color: #fff; border: 2px solid #fff; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0;
  }

  .fc-form { display: flex; gap: 8px; align-items: center; }
  .fc-file-input { display: none; }
  .fc-attach-btn {
    color: #94a3b8; font-size: 17px; cursor: pointer; padding: 8px;
    border-radius: 8px; transition: all 0.15s; display: flex; align-items: center;
  }
  .fc-attach-btn:hover { color: #2563eb; background: #eff6ff; }
  .fc-text-input {
    flex: 1; padding: 10px 16px; border: 1.5px solid #e2e8f0; border-radius: 99px;
    font-size: 13.5px; background: #f8fafc; color: #0f172a; outline: none;
    transition: border 0.15s, box-shadow 0.15s;
  }
  .fc-text-input::placeholder { color: #94a3b8; }
  .fc-text-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: #fff; }
  .fc-send-btn {
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(37,99,235,0.4); transition: all 0.15s; flex-shrink: 0;
  }
  .fc-send-btn:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 4px 14px rgba(37,99,235,0.5); }
  .fc-send-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .fc-closed-notice { text-align: center; font-size: 12px; color: #94a3b8; padding: 8px 0; }

  /* ── List view ────────────────────────────────────────── */
  .fc-list-header {
    background: #fff; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .fc-list-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .fc-list-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
  .fc-new-btn {
    display: flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 99px;
    border: none; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3);
  }
  .fc-new-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.4); }

  .fc-filters { display: flex; gap: 6px; flex-wrap: wrap; }
  .fc-filter-pill {
    font-size: 11.5px; font-weight: 500; padding: 5px 12px; border-radius: 99px;
    border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b;
    cursor: pointer; transition: all 0.15s;
  }
  .fc-filter-pill:hover { border-color: #93c5fd; color: #1d4ed8; background: #eff6ff; }
  .fc-filter-active { background: #1d4ed8 !important; color: #fff !important; border-color: #1d4ed8 !important; }

  .fc-list-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .fc-list-body::-webkit-scrollbar { width: 4px; }
  .fc-list-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  /* ── Quick help ───────────────────────────────────────── */
  .fc-quick-help {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .fc-quick-label {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .fc-quick-icon { color: #2563eb; }
  .fc-quick-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .fc-quick-chip {
    display: flex; align-items: center; gap: 6px;
    background: #f1f5f9; border: 1.5px solid #e2e8f0; color: #475569;
    font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 99px;
    cursor: pointer; transition: all 0.15s;
  }
  .fc-quick-chip:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }

  /* ── New ticket form ──────────────────────────────────── */
  .fc-new-form {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .fc-new-form-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
  .fc-field {
    width: 100%; padding: 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 13px; color: #0f172a; background: #f8fafc; outline: none;
    transition: border 0.15s, box-shadow 0.15s; resize: vertical;
  }
  .fc-field::placeholder { color: #94a3b8; }
  .fc-field:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }
  .fc-textarea { resize: none; }
  .fc-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fc-select {
    padding: 9px 10px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 13px; color: #374151; background: #f8fafc; outline: none;
    cursor: pointer; transition: border 0.15s;
  }
  .fc-select:focus { border-color: #2563eb; }
  .fc-form-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fc-btn-cancel {
    padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    background: #f8fafc; color: #64748b; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .fc-btn-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .fc-btn-submit {
    padding: 10px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3);
  }
  .fc-btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
  .fc-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Ticket cards ─────────────────────────────────────── */
  .fc-ticket-list { display: flex; flex-direction: column; gap: 8px; }
  .fc-ticket-card {
    width: 100%; text-align: left; background: #fff;
    border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px;
    cursor: pointer; transition: all 0.18s; display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .fc-ticket-card:hover {
    border-color: #93c5fd; transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37,99,235,0.12);
  }
  .fc-ticket-top { display: flex; align-items: center; justify-content: space-between; }
  .fc-ticket-meta { display: flex; align-items: center; gap: 6px; }
  .fc-cat-label { font-size: 11px; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 3px 8px; border-radius: 99px; }
  .fc-unread-badge { font-size: 11px; font-weight: 700; background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 99px; }
  .fc-ticket-time { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; white-space: nowrap; }
  .fc-ticket-name { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0; line-height: 1.4; }
  .fc-ticket-chips { display: flex; gap: 6px; }

  /* ── States ───────────────────────────────────────────── */
  .fc-loading { display: flex; justify-content: center; padding: 48px 0; }
  .fc-spin { animation: fc-spin 1s linear infinite; }
  .fc-spin-lg { font-size: 28px; color: #2563eb; }
  @keyframes fc-spin { to { transform: rotate(360deg); } }

  .fc-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 20px; text-align: center;
  }
  .fc-empty-icon-lg {
    width: 56px; height: 56px; background: #f1f5f9; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 22px; color: #cbd5e1; margin-bottom: 12px;
  }
`;