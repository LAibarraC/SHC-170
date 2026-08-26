import { useEffect, useState } from "react";
import { CierreX } from "../ui/iconos";

/**
 * Modal de confirmación reutilizable, con el mismo estilo de la aplicación.
 *
 * Props:
 *  - open: boolean
 *  - titulo: string
 *  - mensaje: string | ReactNode
 *  - textoConfirmar: string  (default: "Confirmar")
 *  - textoCancelar: string   (default: "Cancelar")
 *  - variant: "danger" | "primary"  (default: "danger")
 *  - onConfirm: () => void | Promise<void>
 *  - onCancel: () => void
 *
 * Devuelve `null` cuando `open === false` para no interferir con el resto de la UI.
 */
export default function ModalConfirm({
  open,
  titulo = "¿Estás seguro?",
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  const [procesando, setProcesando] = useState(false);

  // Reset del estado interno cada vez que el modal se reabre
  useEffect(() => {
    if (open) setProcesando(false);
  }, [open]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !procesando) onCancel?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, procesando, onCancel]);

  if (!open) return null;

  const palette = variant === "danger"
    ? { border: "rgba(220, 38, 38, 0.35)", tituloColor: "#dc2626", btnBg: "#dc2626" }
    : { border: "var(--border-color, #eee)", tituloColor: "var(--primary-color)", btnBg: "var(--accent-color)" };

  const handleConfirm = async () => {
    if (procesando) return;
    try {
      setProcesando(true);
      await Promise.resolve(onConfirm?.());
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Cerrar al hacer clic sobre el fondo, salvo que esté procesando
        if (e.target === e.currentTarget && !procesando) onCancel?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card, white)",
          color: "var(--text-main)",
          width: "100%",
          maxWidth: "440px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          border: `1px solid ${palette.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color, #eee)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.1rem",
              color: palette.tituloColor,
            }}
          >
            {titulo}
          </h2>
          <button
            onClick={onCancel}
            disabled={procesando}
            aria-label="Cerrar"
            style={{
              background: "transparent",
              border: "none",
              cursor: procesando ? "not-allowed" : "pointer",
              color: "var(--text-muted)",
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              padding: "4px",
              opacity: procesando ? 0.5 : 1,
            }}
          >
            <CierreX width="22" height="22" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {typeof mensaje === "string" ? (
            <p style={{ margin: 0, color: "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {mensaje}
            </p>
          ) : (
            mensaje
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            padding: "14px 20px",
            borderTop: "1px solid var(--border-color, #eee)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={procesando}
            style={{
              padding: "10px 15px",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border-color)",
              borderRadius: "5px",
              cursor: procesando ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={procesando}
            style={{
              padding: "10px 20px",
              background: procesando ? "#9ca3af" : palette.btnBg,
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: procesando ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {procesando ? "Procesando…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
