"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { addToast } from "./Toast";
import Scanner from "./Scanner.jsx";

function playBeep() {
        try {
    const AudioContextRef =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextRef) return;

    const ctx = new AudioContextRef();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    oscillator.onended = () => ctx.close();
    } catch (error) {
    console.log(error);
    }
}

export default function BarcodeScanner({
        onDetected,
    onError,
}) {
    const [isActive, setIsActive] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState("");
    const [cameraError, setCameraError] = useState("");

    const scannerRef = useRef(null);
    const hasDetectedRef = useRef(false);

  // ===============================
  // STOP SCANNER
  // ===============================
    const stopScanner = useCallback(async () => {
    console.log("[BARCODE] Deteniendo scanner...");

    if (scannerRef.current?.isScanning) {
        try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        } catch (err) {
        console.error("[BARCODE] Error deteniendo:", err);
        }
    }

    scannerRef.current = null;
    hasDetectedRef.current = false;

    setIsActive(false);
    setCameraError("");
    }, []);

  // ===============================
  // START SCANNER
  // ===============================
    const startScanner = useCallback(async () => {
    console.log("[BARCODE] Iniciando scanner...");

    setIsActive(true);
    setCameraError("");
    hasDetectedRef.current = false;

    setTimeout(async () => {
        try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        const element = document.getElementById("barcode-qr-reader");

        if (!element) {
            throw new Error("Elemento no encontrado");
        }

        console.log("[BARCODE] Creando Html5Qrcode...");

        const scanner = new Html5Qrcode("barcode-qr-reader");

        scannerRef.current = scanner;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.777,
            formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            ],
        };

        console.log("[BARCODE] Iniciando cámara...");

        await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
            console.log(
                "[BARCODE] ✓✓✓ CÓDIGO DETECTADO:",
                decodedText
            );

            if (hasDetectedRef.current) return;

            hasDetectedRef.current = true;

            setLastScannedCode(decodedText);

            playBeep();

            if (onDetected) {
                onDetected(decodedText);
            }

            setTimeout(() => {
                stopScanner();
            }, 500);
            },
            () => {
            // Ignorar errores continuos
            }
        );

        console.log("[BARCODE] ✓ Cámara iniciada correctamente");
        } catch (err) {
        console.error("[BARCODE] Error:", err);

        const errorMsg =
            err?.message || "Error desconocido";

        setCameraError(errorMsg);
        setIsActive(false);

        addToast(`Error activando cámara: ${errorMsg}`, "error");

        if (onError) {
            onError(errorMsg);
        }
        }
    }, 100);
    }, [onDetected, onError, stopScanner]);

  // ===============================
  // CLEANUP
  // ===============================
    useEffect(() => {
    return () => {
        if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
        }
    };
    }, []);

  // ===============================
  // UI
  // ===============================
    return (
    <div className="space-y-4">
      {/* BOTONES */}
        <div className="flex items-center gap-3">
        {!isActive ? (
        <button
        type="button"
        onClick={startScanner}
        className="flex items-center gap-2 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-lg font-medium transition"
        >
        <Scanner size={18} />
        Escanear código
        </button>
        ) : (
            <button
            type="button"
            onClick={stopScanner}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
            <CameraOff className="w-4 h-4" />
            Detener
            </button>
        )}

        {isActive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
            <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse" />
            Escaneando...
            </div>
        )}
        </div>

      {/* SCANNER */}
        <div className="relative rounded-xl overflow-hidden border-2 border-blue-950 shadow-xl">
        {isActive ? (
            <div
            id="barcode-qr-reader"
            className="bg-black"
            style={{
                width: "100%",
                minHeight: "400px",
            }}
            />
        ) : (
            <div className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
<div className="text-center">
  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
    <Scanner size={40} className="text-blue-900" />
  </div>
</div>
            </div>
        )}
        </div>

      {/* ERROR */}
        {cameraError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
            Error:
            </p>

            <p className="text-sm text-red-900">
            {cameraError}
            </p>
        </div>
        )}

      {/* RESULTADO */}
        {lastScannedCode && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
            <p className="text-xs text-green-700 font-medium">
            ✓ Codigo detectado:
            </p>

            <p className="text-sm text-green-900 font-mono font-bold break-all">
            {lastScannedCode}
            </p>
        </div>
        )}
    </div>
    );
}