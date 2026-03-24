"use client";
import { useState, useEffect, useRef } from "react";
import { 
  FaVideo, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, 
  FaVideoSlash, FaDesktop, FaSpinner, FaExpand, FaCompress, 
  FaVolumeUp, FaWindowMinimize, FaWindowMaximize
} from "react-icons/fa";

export default function VideoCall({ isOpen, onClose, roomId, isInitiator, onCallEnded }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(true);
  const [callConnected, setCallConnected] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerRef = useRef(null);
  const remoteVideoContainerRef = useRef(null);
  const isMountedRef = useRef(true);
  const currentRoomIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const minimizedRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ]
  };

  const obtenerStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!isMountedRef.current) return null;
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Error al obtener stream:", err);
      setError("No se pudo acceder a la cámara/micrófono. Verifica los permisos.");
      return null;
    }
  };

  const limpiarRecursos = () => {
    setIsCleaningUp(true);
    if (peerRef.current) {
      try { peerRef.current.close(); } catch (e) {}
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => { try { track.stop(); } catch (e) {} });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "leave", room: roomId }));
        }
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setCallConnected(false);
    setConnecting(true);
    setCallAccepted(false);
    setWaitingForAgent(true);
    setRemoteStream(null);
    setScreenSharing(false);
    setIsCleaningUp(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    currentRoomIdRef.current = roomId;
    // Posición inicial en esquina inferior derecha
    setPosition({ x: window.innerWidth - 360, y: window.innerHeight - 280 });
    return () => {
      isMountedRef.current = false;
      limpiarRecursos();
    };
  }, []);

  // Manejar arrastre de la ventana minimizada
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    // Limitar al viewport
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 320, newX)),
      y: Math.max(0, Math.min(window.innerHeight - 240, newY))
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (minimized) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, minimized]);

  useEffect(() => {
    if (!isOpen) { limpiarRecursos(); return; }
    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      limpiarRecursos();
      currentRoomIdRef.current = roomId;
    }
    if (!roomId) return;

    obtenerStream();

    const getWebSocketUrl = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const wsUrl = apiUrl.replace("http", "ws").replace("https", "wss");
      return `${wsUrl}/ws/signaling`;
    };

    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current || isCleaningUp) return;
      ws.send(JSON.stringify({ 
        type: "join", 
        room: roomId, 
        peerId: isInitiator ? `agent-${Date.now()}` : `client-${Date.now()}` 
      }));
    };

    ws.onmessage = async (event) => {
      if (!isMountedRef.current || isCleaningUp) return;
      try {
        const message = JSON.parse(event.data);

        // Para el agente (isInitiator = true)
        if (isInitiator) {
          if (message.type === "participants" && message.participants.length > 1 && waitingForAgent && !isCleaningUp) {
            setWaitingForAgent(false);
            await iniciarLlamada();
          }
          
          if (message.type === "new-participant" && waitingForAgent && !isCleaningUp) {
            setWaitingForAgent(false);
            await iniciarLlamada();
          }
          
          if (message.type === "answer" && peerRef.current && peerRef.current.signalingState !== "closed" && !isCleaningUp) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
          }
        } 
        // Para el cliente (isInitiator = false)
        else {
          if (message.type === "offer" && !callAccepted && !isCleaningUp) {
            setWaitingForAgent(false);
            setConnecting(false);
            const stream = localStreamRef.current || await obtenerStream();
            if (!stream) return;
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            const pc = new RTCPeerConnection(configuration);
            peerRef.current = pc;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            pc.ontrack = (event) => {
              if (!isMountedRef.current || isCleaningUp) return;
              const remStream = event.streams[0];
              setRemoteStream(remStream);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remStream;
                remoteVideoRef.current.muted = false;
                remoteVideoRef.current.play().catch(() => {
                  remoteVideoRef.current.muted = true;
                  remoteVideoRef.current.play().then(() => {
                    remoteVideoRef.current.muted = false;
                  }).catch(e => console.warn("Error al reproducir video remoto:", e));
                });
              }
            };
            pc.onicecandidate = (event) => {
              if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN && isMountedRef.current && !isCleaningUp) {
                wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate, room: roomId }));
              }
            };
            pc.oniceconnectionstatechange = () => {
              if (!isMountedRef.current || isCleaningUp) return;
              if (pc.iceConnectionState === "connected") setCallConnected(true);
              if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") setCallConnected(false);
            };
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            if (wsRef.current?.readyState === WebSocket.OPEN && isMountedRef.current && !isCleaningUp) {
              wsRef.current.send(JSON.stringify({ type: "answer", sdp: pc.localDescription, room: roomId }));
            }
            setCallAccepted(true);
          }
        }

        // Manejar ICE candidates para ambos
        if (message.type === "ice-candidate" && peerRef.current && peerRef.current.signalingState !== "closed" && !isCleaningUp) {
          try { await peerRef.current.addIceCandidate(new RTCIceCandidate(message.candidate)); }
          catch (err) { console.warn("Error adding ICE candidate:", err); }
        }
      } catch (err) { console.error("Error procesando mensaje:", err); }
    };

    ws.onclose = () => console.log("🔌 [Cliente] WebSocket cerrado");
    ws.onerror = (error) => console.error("❌ [Cliente] Error en WebSocket:", error);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: "leave", room: roomId })); } catch (e) {}
        ws.close();
      }
    };
  }, [isOpen, roomId, isInitiator]);

  const iniciarLlamada = async () => {
    if (isCleaningUp) return;
    const stream = localStreamRef.current || await obtenerStream();
    if (!stream) return;
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    const pc = new RTCPeerConnection(configuration);
    peerRef.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.ontrack = (event) => {
      if (!isMountedRef.current || isCleaningUp) return;
      const remStream = event.streams[0];
      setRemoteStream(remStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch(() => {
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().then(() => {
            remoteVideoRef.current.muted = false;
          }).catch(e => console.warn("Error al reproducir video remoto:", e));
        });
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN && isMountedRef.current && !isCleaningUp) {
        wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate, room: roomId }));
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (!isMountedRef.current || isCleaningUp) return;
      if (pc.iceConnectionState === "connected") { 
        setConnecting(false); 
        setWaitingForAgent(false); 
        setCallConnected(true); 
      }
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") setCallConnected(false);
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (wsRef.current?.readyState === WebSocket.OPEN && isMountedRef.current && !isCleaningUp) {
      wsRef.current.send(JSON.stringify({ type: "offer", sdp: pc.localDescription, room: roomId }));
    }
  };

  const desbloquearAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(e => console.warn("Error al desbloquear audio:", e));
      setAudioMuted(false);
    }
  };

  const compartirPantalla = async () => {
    if (isCleaningUp) return;
    try {
      if (screenSharing) {
        const original = localStreamRef.current;
        if (original && localVideoRef.current) {
          localVideoRef.current.srcObject = original;
          if (peerRef.current && peerRef.current.signalingState !== "closed") {
            const videoSender = peerRef.current.getSenders().find(s => s.track?.kind === "video");
            if (videoSender && original.getVideoTracks()[0]) await videoSender.replaceTrack(original.getVideoTracks()[0]);
          }
          setLocalStream(original);
        }
        setScreenSharing(false);
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenSharing(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        if (peerRef.current && peerRef.current.signalingState !== "closed") {
          const videoSender = peerRef.current.getSenders().find(s => s.track?.kind === "video");
          if (videoSender && screenStream.getVideoTracks()[0]) await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        screenStream.getVideoTracks()[0].onended = () => { if (isMountedRef.current && !isCleaningUp) compartirPantalla(); };
      }
    } catch (err) { setError("No se pudo compartir pantalla"); }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream && !isCleaningUp) {
      const newState = !micEnabled;
      stream.getAudioTracks().forEach(track => { track.enabled = newState; });
      setMicEnabled(newState);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream && !isCleaningUp) {
      const newState = !videoEnabled;
      stream.getVideoTracks().forEach(track => { track.enabled = newState; });
      setVideoEnabled(newState);
    }
  };

  const toggleFullscreen = () => {
    if (!remoteVideoContainerRef.current) return;
    if (!document.fullscreenElement) {
      remoteVideoContainerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const colgar = () => {
    limpiarRecursos();
    setMinimized(false);
    if (onCallEnded) onCallEnded();
    onClose();
  };

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  // Vista minimizada (flotante)
  if (minimized && callConnected) {
    return (
      <div
        ref={minimizedRef}
        className="fixed z-50 bg-gray-900 rounded-xl shadow-2xl border-2 border-blue-500 overflow-hidden cursor-move"
        style={{
          left: position.x,
          top: position.y,
          width: 320,
          height: 220,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {callConnected ? "🔴 En llamada" : "🟡 Conectando..."}
          </div>
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1.5 transition-colors"
              title="Maximizar"
            >
              <FaWindowMaximize size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); colgar(); }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
              title="Colgar llamada"
            >
              <FaPhoneSlash size={12} />
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Vista completa
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl"
        style={{ height: "min(700px, 90vh)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <FaVideo className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Videollamada {isInitiator ? "(Agente)" : "(Cliente)"}</h3>
              <p className="text-xs text-blue-100">
                {callConnected ? "🔴 En llamada" : waitingForAgent ? "⏳ Esperando conexión..." : "🟢 Conectando..."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {callConnected && (
              <button
                onClick={() => setMinimized(true)}
                className="text-white bg-blue-500 hover:bg-blue-600 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center"
                title="Minimizar"
              >
                <FaWindowMinimize />
              </button>
            )}
            <button
              onClick={colgar}
              className="text-white bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center"
              title="Colgar llamada"
            >
              <FaPhoneSlash />
            </button>
          </div>
        </div>

        {/* Videos */}
        <div className="flex-1 p-4 relative min-h-0">
          {connecting && !callConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-xl">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-white mx-auto mb-2" />
                <p className="text-white">Conectando con el otro participante...</p>
                <p className="text-gray-400 text-sm mt-2">Esperando conexión WebRTC</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-10">
              {error}
            </div>
          )}
          {audioMuted && remoteStream && (
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg"
              onClick={desbloquearAudio}
            >
              <FaVolumeUp /> Haz clic aquí para activar el audio
            </div>
          )}
          {/* Video remoto */}
          <div
            ref={remoteVideoContainerRef}
            className="w-full h-full bg-black rounded-xl overflow-hidden relative cursor-pointer"
            onClick={toggleFullscreen}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaVideo className="text-3xl text-gray-600" />
                  </div>
                  <p className="text-gray-400">Esperando video del otro participante...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              {callConnected ? "🔴 En vivo" : "🟡 Conectando..."}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            >
              {fullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
            </button>
          </div>
          {/* Video local */}
          <div className="absolute bottom-6 right-6 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-lg border-2 border-blue-500">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${videoEnabled ? "bg-green-500" : "bg-red-500"}`}></div>
              <span>Tú</span>
              {!micEnabled && <FaMicrophoneSlash className="text-red-400 text-xs ml-1" />}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-gray-800 p-4 flex justify-center gap-4 flex-shrink-0 flex-wrap">
          <button
            onClick={toggleMic}
            disabled={!localStream || isCleaningUp}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${(!localStream || isCleaningUp) ? "opacity-50 cursor-not-allowed" : ""} ${micEnabled ? "bg-gray-600 hover:bg-gray-500" : "bg-red-500 hover:bg-red-600 ring-2 ring-red-400"}`}
            title={micEnabled ? "Silenciar micrófono" : "Activar micrófono"}
          >
            {micEnabled ? <FaMicrophone className="text-white text-xl" /> : <FaMicrophoneSlash className="text-white text-xl" />}
          </button>
          <button
            onClick={toggleVideo}
            disabled={!localStream || isCleaningUp}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${(!localStream || isCleaningUp) ? "opacity-50 cursor-not-allowed" : ""} ${videoEnabled ? "bg-gray-600 hover:bg-gray-500" : "bg-red-500 hover:bg-red-600 ring-2 ring-red-400"}`}
            title={videoEnabled ? "Apagar cámara" : "Encender cámara"}
          >
            {videoEnabled ? <FaVideo className="text-white text-xl" /> : <FaVideoSlash className="text-white text-xl" />}
          </button>
          <button
            onClick={compartirPantalla}
            disabled={!localStream || isCleaningUp}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${(!localStream || isCleaningUp) ? "opacity-50 cursor-not-allowed" : ""} ${screenSharing ? "bg-green-500 hover:bg-green-600 ring-2 ring-green-400" : "bg-gray-600 hover:bg-gray-500"}`}
            title={screenSharing ? "Dejar de compartir pantalla" : "Compartir pantalla"}
          >
            <FaDesktop className="text-white text-xl" />
          </button>
          {remoteStream && (
            <button
              onClick={desbloquearAudio}
              className="p-3 rounded-full transition-all duration-200 hover:scale-110 bg-yellow-500 hover:bg-yellow-400"
              title="Activar audio remoto"
            >
              <FaVolumeUp className="text-white text-xl" />
            </button>
          )}
          <button
            onClick={colgar}
            className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg"
            title="Colgar llamada"
          >
            <FaPhoneSlash className="text-white text-xl" />
          </button>
        </div>

        {/* Indicadores */}
        <div className="bg-gray-900/80 px-4 py-2 flex justify-center gap-4 text-xs text-gray-400 border-t border-gray-700 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${micEnabled ? "bg-green-500" : "bg-red-500"}`}></div>
            <span>{micEnabled ? "Micrófono activo" : "Micrófono silenciado"}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${videoEnabled ? "bg-green-500" : "bg-red-500"}`}></div>
            <span>{videoEnabled ? "Cámara activa" : "Cámara apagada"}</span>
          </div>
          {screenSharing && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Compartiendo pantalla</span>
            </div>
          )}
          {callConnected && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Llamada activa</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}