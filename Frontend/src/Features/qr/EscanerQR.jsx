import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CierreX, IconoQr } from "../../ui/iconos";

/**
 * Escáner de código QR con cámara en vivo y carga desde archivo.
 *
 * Props:
 *   - activo: boolean → indica si el panel del escáner debe mostrarse.
 *   - onDeteccion: (textoDetectado: string) => void → callback al leer un código.
 *   - onErrorCamara: (mensaje: string) => void → callback si falla el acceso a la cámara.
 *   - onErrorArchivo: (mensaje: string) => void → callback si falla la lectura del archivo.
 *   - onCerrar: () => void → callback al cerrar manualmente el escáner.
 *
 * El componente monta el lector dentro de un contenedor con id `qr-reader`.
 * Inicia la cámara cuando `activo` es true y la apaga automáticamente al
 * desmontarse o al llamar a `detener()`.
 *
 * Importante: usa la cámara trasera (`environment`) por defecto para celulares.
 * También soporta seleccionar una imagen desde el dispositivo y decodificarla.
 */
export default function EscanerQR({
  activo,
  onDeteccion,
  onErrorCamara,
  onErrorArchivo,
  onCerrar,
}) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState(null);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);

  // Limpia cualquier instancia previa al desmontar.
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {
            /* ignorar errores al limpiar */
          });
        scannerRef.current = null;
      }
    };
  }, []);

  // Inicia o detiene el escáner según el estado `activo`.
  useEffect(() => {
    if (!activo) return;

    const elementId = "qr-reader";
    // Verifica que el contenedor esté montado antes de iniciar.
    const contenedor = document.getElementById(elementId);
    if (!contenedor) return;

    setIniciando(true);
    setError(null);

    const scanner = new Html5Qrcode(elementId, { verbose: false });
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1,
    };

    // Intentar cámara trasera primero (móviles), si falla usar la predeterminada.
    scanner
      .start(
        { facingMode: "environment" },
        config,
        (texto) => {
          // Llamamos a la detección y detenemos el escáner.
          scanner
            .stop()
            .then(() => {
              scanner.clear();
              scannerRef.current = null;
              onDeteccion?.(texto);
            })
            .catch(() => {
              scanner.clear();
              scannerRef.current = null;
              onDeteccion?.(texto);
            });
        },
        () => {
          // Errores de "no se encontró código" los ignoramos silenciosamente.
        }
      )
      .catch((err) => {
        setIniciando(false);
        const mensaje = err?.message || "No se pudo acceder a la cámara.";
        setError(mensaje);
        onErrorCamara?.(mensaje);
      });

    return () => {
      // El cleanup del efecto se hace en el efecto de desmontaje del componente.
    };
  }, [activo, onDeteccion, onErrorCamara]);

  const detener = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignorar */
      }
      scannerRef.current = null;
    }
    onCerrar?.();
  };

  /**
   * Maneja la selección de un archivo de imagen y lo decodifica buscando un QR.
   * Primero detiene la cámara si está activa (no se pueden usar ambas a la vez).
   */
  const handleArchivoSeleccionado = async (event) => {
    const archivo = event.target.files?.[0];
    // Limpia el input para permitir seleccionar el mismo archivo dos veces.
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!archivo) return;

    // Asegurarse de detener la cámara antes de escanear un archivo.
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignorar */
      }
      scannerRef.current = null;
    }

    setProcesandoArchivo(true);
    setError(null);

    try {
      // Usamos una instancia temporal para no chocar con el contenedor #qr-reader.
      // No debe tener `display: none`: algunos navegadores no calculan el canvas
      // necesario para decodificar la imagen en ese estado.
      const elementId = `qr-reader-temp-${Date.now()}`;
      const container = document.createElement("div");
      container.id = elementId;
      Object.assign(container.style, {
        position: "fixed",
        width: "640px",
        height: "640px",
        left: "-10000px",
        top: "-10000px",
        overflow: "hidden",
        // Mantener dimensiones reales: html5-qrcode necesita un canvas con
        // tamaño suficiente para detectar QRs pequeños o descargados.
        opacity: "0.01",
        pointerEvents: "none",
      });
      document.body.appendChild(container);

      const scannerArchivo = new Html5Qrcode(elementId, { verbose: false });
      try {
        const texto = await scannerArchivo.scanFile(archivo, false);
        onDeteccion?.(texto);
      } finally {
        try {
          scannerArchivo.clear();
        } catch {
          /* ignorar */
        }
        container.remove();
      }
    } catch (err) {
      const mensaje =
        err?.message ||
        "No se encontró un código QR en la imagen seleccionada. Intenta con otra foto.";
      setError(mensaje);
      onErrorArchivo?.(mensaje);
    } finally {
      setProcesandoArchivo(false);
    }
  };

  if (!activo) return null;

  return (
    <div
      style={{
        marginTop: "14px",
        padding: "12px",
        background: "var(--bg-input, #f9fafb)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "8px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--text-main)",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <IconoQr width="16" height="16" />
          Apunta la cámara al código QR
        </p>
        <button
          type="button"
          onClick={detener}
          aria-label="Cerrar cámara"
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            borderRadius: "5px",
            padding: "4px 10px",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <CierreX width="14" height="14" />
          Cerrar
        </button>
      </div>

      <div
        id="qr-reader"
        style={{
          width: "100%",
          maxWidth: "320px",
          margin: "0 auto",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#000",
        }}
      />

      {iniciando && !error && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "8px 0 0 0" }}>
          Iniciando cámara…
        </p>
      )}

      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px dashed var(--border-color)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleArchivoSeleccionado}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()} // Ajusta 'fileInputRef' al nombre de tu ref si usas uno
          disabled={procesandoArchivo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-input, #f8fafc)",
            color: "var(--text-main, #1e293b)",
            cursor: procesandoArchivo ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "0.875rem",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>

          {procesandoArchivo ? "Procesando imagen…" : "Cargar QR o imagen"}
        </button>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            margin: "6px 0 0 0",
          }}
        >
          Selecciona una foto del código QR guardada en tu dispositivo.
        </p>
      </div>

      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "6px",
            color: "#dc2626",
            fontSize: "0.85rem",
            textAlign: "left",
          }}
        >
          <strong>No se pudo leer el código.</strong>
          <p style={{ margin: "5px 0 0 0" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
