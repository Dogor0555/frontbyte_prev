"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  FaArrowLeft, FaPaperPlane, FaImage, FaSpinner, FaCheckCircle, 
  FaExclamationTriangle, FaUser, FaHeadset, FaClock, FaPaperclip, 
  FaDownload, FaEye, FaEyeSlash, FaBell, FaCheck
} from "react-icons/fa";
import { API_BASE_URL } from "@/lib/api";

export default function TicketDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicket = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/soporte");
          return;
        }
        throw new Error("Error al cargar el ticket");
      }
      const data = await response.json();
      setTicket(data.ticket);
      setMensajes(data.mensajes || []);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudo cargar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no puede exceder los 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Formato no soportado. Use JPG, PNG o WEBP");
        return;
      }
      setImagen(file);
      setImagenPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const eliminarImagen = () => {
    setImagen(null);
    setImagenPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() && !imagen) {
      setError("Escribe un mensaje o adjunta una imagen");
      return;
    }

    setEnviando(true);
    setError("");
    setExito("");

    const formData = new FormData();
    if (nuevoMensaje.trim()) formData.append("mensaje", nuevoMensaje);
    if (imagen) formData.append("imagen", imagen);

    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}/mensajes`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar mensaje");
      }

      setNuevoMensaje("");
      eliminarImagen();
      setExito("Mensaje enviado");
      setTimeout(() => setExito(""), 3000);
      await fetchTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "abierto": return "bg-yellow-100 text-yellow-800";
      case "en_proceso": return "bg-blue-100 text-blue-800";
      case "resuelto": return "bg-green-100 text-green-800";
      case "cerrado": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case "urgente": return "bg-red-100 text-red-800";
      case "alta": return "bg-orange-100 text-orange-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baja": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-SV", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadImage = (base64Url, filename) => {
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Ticket no encontrado</h2>
          <Link href="/dashboard/soporte" className="mt-4 inline-block text-blue-600 hover:underline">
            Volver a mis tickets
          </Link>
        </div>
      </div>
    );
  }

  const puedeResponder = ticket.estado !== "cerrado";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link
            href="/dashboard/soporte"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a mis tickets
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{ticket.titulo}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                  {ticket.estado === "abierto" && "Abierto"}
                  {ticket.estado === "en_proceso" && "En Proceso"}
                  {ticket.estado === "resuelto" && "Resuelto"}
                  {ticket.estado === "cerrado" && "Cerrado"}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                  Prioridad: {ticket.prioridad === "urgente" && "Urgente"}
                  {ticket.prioridad === "alta" && "Alta"}
                  {ticket.prioridad === "media" && "Media"}
                  {ticket.prioridad === "baja" && "Baja"}
                </span>
                {ticket.categoria && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {ticket.categoria}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <FaClock className="text-gray-400" />
              Creado: {formatDate(ticket.created_at)}
            </div>
          </div>
          {ticket.descripcion && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.descripcion}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h2 className="font-semibold text-gray-700">Conversación</h2>
          </div>

          <div className="h-[450px] overflow-y-auto p-4 space-y-4">
            {mensajes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaComment className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No hay mensajes aún. Sé el primero en escribir.</p>
              </div>
            ) : (
              mensajes.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.remitente_tipo === "cliente" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] ${msg.remitente_tipo === "cliente" ? "order-2" : "order-1"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.remitente_tipo === "soporte" ? (
                        <>
                          <FaHeadset className="text-blue-500 text-sm" />
                          <span className="text-xs font-medium text-gray-500">Soporte</span>
                        </>
                      ) : (
                        <>
                          <FaUser className="text-green-500 text-sm" />
                          <span className="text-xs font-medium text-gray-500">Tú</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.remitente_tipo === "cliente"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.mensaje && (
                        <p className="whitespace-pre-wrap break-words">{msg.mensaje}</p>
                      )}
                      {msg.imagen_url && (
                        <div className="mt-2 group relative inline-block">
                          <img
                            src={msg.imagen_url}
                            alt="Adjunto"
                            className="max-w-[250px] max-h-[250px] rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.imagen_url, "_blank")}
                          />
                          <button
                            onClick={() => downloadImage(msg.imagen_url, `adjunto_${msg.id}.jpg`)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaDownload size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4 bg-white">
            {!puedeResponder ? (
              <div className="text-center p-4 bg-gray-100 rounded-lg text-gray-500">
                <FaCheckCircle className="inline mr-2 text-green-500" />
                Este ticket está cerrado. No se pueden enviar más mensajes.
              </div>
            ) : (
              <form onSubmit={enviarMensaje}>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <FaExclamationTriangle className="mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {exito && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
                    <FaCheckCircle className="mt-0.5" />
                    <span>{exito}</span>
                  </div>
                )}

                {imagenPreview && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={imagenPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={eliminarImagen}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <textarea
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows="3"
                    disabled={enviando}
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImagenChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      id="imagen-input"
                    />
                    <label
                      htmlFor="imagen-input"
                      className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 cursor-pointer"
                    >
                      <FaImage />
                      <FaPaperclip />
                      <span className="text-sm">Adjuntar imagen</span>
                    </label>
                    <span className="text-xs text-gray-400 ml-2">Máx. 5MB</span>
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {enviando ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}