import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { alerta } from "../../utils/Notificaciones";
import qrApi from "../../services/qrApi";
import api from "../../services/api";
import { Descargar, Copiar, Compartir, Desactivar, Regenerar, Graduacion, CierreX } from "../../ui/iconos";

/**
 * Modal dinámico para generar y mostrar un código QR de matriculación.
 *
 * Props:
 *  - curso: { id, nombre, periodo?, codigo?, docente_nombre? }
 *  - qrActivo: (opcional) { id, token, url, clase_id, clase_nombre, fecha_creacion, fecha_expiracion, activo, alumnos_inscritos }
 *  - onClose: () => void
 *  - onDesactivar: (qrId) => void (opcional, callback cuando se desactiva un QR)
 *
 * Estados internos:
 *   1) Si qrActivo viene en props: muestra el QR y su estado actual.
 *   2) Si no existe QR: lo genera automáticamente al abrir el modal.
 */
export default function ModalQR({ curso, qrActivo: qrActivoProp, onClose, onDesactivar, onCursoActualizado }) {
  // ────────────── Estados ──────────────
  const [generando, setGenerando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [fechaLimite, setFechaLimite] = useState(curso?.fecha_limite_matriculacion || "");
  const [codigoAcceso, setCodigoAcceso] = useState(curso?.codigo || null);
  const [actualizandoFecha, setActualizandoFecha] = useState(false);
  const [matriculaCerrada, setMatriculaCerrada] = useState(
    !curso?.codigo || qrActivoProp?.activo === false
  );

  // Datos del QR generado (o mostrado si viene en props)
  const [qr, setQr] = useState(qrActivoProp || null);
  const qrContainerRef = useRef(null);

  // ────────────── Helpers ──────────────

  const formatearFecha = (iso) => {
    if (!iso) return "-";
    try {
      const [fecha, hora] = iso.split(" ");
      return hora ? `${fecha} ${hora}` : fecha;
    } catch {
      return iso;
    }
  };

  const fechaVencida = Boolean(
    fechaLimite && fechaLimite < new Date().toISOString().slice(0, 10)
  );

  // ────────────── Efectos ──────────────

  // El botón de la tarjeta abre directamente este modal y genera el QR si aún no existe.
  useEffect(() => {
    if (curso?.id && !matriculaCerrada && !fechaVencida && !qrActivoProp && !qr && !generando) {
      handleGenerar();
    }
    // La generación inicial solo debe ejecutarse al abrir el modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ────────────── Acciones ──────────────

  const handleGenerar = async () => {
    if (!curso?.id) {
      alerta.error("Curso inválido", "No se puede generar el QR sin un curso válido.");
      return;
    }
    setGenerando(true);
    try {
      const data = await qrApi.generarQR(curso.id);
      setQr(data);
      alerta.success("QR generado", "Tu código QR está listo para compartir.");
    } catch (e) {
      alerta.error("No se pudo generar el QR", e.message || "Intenta nuevamente.");
    } finally {
      setGenerando(false);
    }
  };

  const handleCambiarEstado = async () => {
    const cerrada = matriculaCerrada || fechaVencida;
    if (cerrada) {
      if (!fechaLimite) {
        alerta.error("Fecha requerida", "Selecciona una fecha límite para habilitar la matrícula.");
        return;
      }
      setDesactivando(true);
      try {
        // PUT persistente: genera un código de acceso nuevo y reabre la clase.
        const actualizado = await api.actualizarClase(curso.id, curso.nombre, fechaLimite, true);
        const nuevoQr = await qrApi.generarQR(curso.id);
        setCodigoAcceso(actualizado.codigo_acceso ?? null);
        setQr(nuevoQr);
        setMatriculaCerrada(false);
        onCursoActualizado?.(actualizado);
        onDesactivar?.();
        alerta.success("Matrícula habilitada", "La matrícula volvió a estar disponible.");
      } catch (e) {
        alerta.error("No se pudo habilitar la matrícula", e.message || "Intenta nuevamente.");
      } finally {
        setDesactivando(false);
      }
      return;
    }

    // El cierre pertenece a la clase, no al QR histórico. Puede existir un QR
    // sin `id` en el estado local, pero el endpoint solo necesita curso.id.
    const confirmado = await alerta.confirmar({
      titulo: "Cerrar matrícula",
      mensaje: "¿Cerrar la matrícula? El código y el QR dejarán de permitir nuevas matrículas. Las ya realizadas no se eliminarán.",
      textoConfirmar: "Sí, cerrar matrícula",
      textoCancelar: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) return;
    setDesactivando(true);
    try {
      const actualizado = await qrApi.cerrarMatricula(curso.id);
      setCodigoAcceso(actualizado.codigo_acceso ?? null);
      setMatriculaCerrada(true);
      // Reflejar también el estado del QR mostrado; de lo contrario el objeto
      // conserva `activo: true` aunque la matrícula ya se cerró en la BD.
      setQr((qrActual) => qrActual ? { ...qrActual, activo: false } : qrActual);
      onCursoActualizado?.(actualizado);
      onDesactivar?.();
      alerta.success("Matrícula cerrada", "El estado se guardó correctamente en el servidor.");
    } catch (e) {
      alerta.error("No se pudo cerrar la matrícula", e.message || "Intenta nuevamente.");
    } finally {
      setDesactivando(false);
    }
  };

  const handleCopiarEnlace = async () => {
    if (!qr?.url) return;
    try {
      await navigator.clipboard.writeText(qr.url);
      alerta.success("Enlace copiado", "El enlace fue copiado al portapapeles.");
    } catch {
      alerta.error("No se pudo copiar", "Copia manualmente el enlace mostrado en pantalla.");
    }
  };

  const handleCompartir = async () => {
    if (!qr?.url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Matricúlate a ${qr.clase_nombre}`,
          text: `Escanea el código QR o abre el siguiente enlace para matricularte a "${qr.clase_nombre}".`,
          url: qr.url,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(qr.url);
      alerta.success("Enlace copiado", "Tu navegador no soporta 'Compartir'. El enlace fue copiado al portapapeles.");
    } catch {
      alerta.error("No se pudo compartir", "Copia manualmente el enlace mostrado en pantalla.");
    }
  };

  const handleDescargar = () => {
    if (!qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) {
      alerta.error("No se pudo descargar", "Intenta nuevamente en unos segundos.");
      return;
    }
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const img = new Image();
      img.onload = () => {
        const size = 800;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size + 140;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 40, size - 200, size - 200);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText(qr.clase_nombre, canvas.width / 2, size - 30);
        ctx.font = "20px Arial";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("Matricúlate escaneando este código", canvas.width / 2, size + 10);
        ctx.fillText(`Válido hasta: ${qr.fecha_expiracion}`, canvas.width / 2, size + 45);

        const link = document.createElement("a");
        link.download = `QR_${qr.clase_nombre.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        alerta.success("Descarga iniciada", "El archivo PNG se está descargando.");
      };
      img.onerror = () => alerta.error("No se pudo descargar", "Error al procesar la imagen.");
      img.src = `data:image/svg+xml;base64,${svg64}`;
    } catch {
      alerta.error("No se pudo descargar", "Tu navegador no soporta la descarga directa.");
    }
  };

  const handleGenerarNuevo = async () => {
    const confirmado = await alerta.confirmar({
      titulo: "Generar nuevo código",
      mensaje: "El código actual dejará de funcionar. ¿Deseas generar uno nuevo?",
      textoConfirmar: "Sí, generar",
      textoCancelar: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) return;
    setDesactivando(true);
    try {
      const actualizado = await api.actualizarClase(curso.id, curso.nombre, fechaLimite, true);
      const nuevoQr = await qrApi.generarQR(curso.id);
      setCodigoAcceso(actualizado.codigo_acceso ?? null);
      setQr(nuevoQr);
      setMatriculaCerrada(false);
      onCursoActualizado?.(actualizado);
      alerta.success("Código actualizado", "El código anterior quedó inválido.");
    } catch (e) {
      alerta.error("No se pudo generar el código", e.message || "Intenta nuevamente.");
    } finally {
      setDesactivando(false);
    }
  };

  const handleCambiarFecha = async () => {
    if (!fechaLimite) {
      alerta.error("Fecha requerida", "Selecciona una fecha límite.");
      return;
    }
    setActualizandoFecha(true);
    try {
      const actualizado = await api.actualizarClase(
        curso.id,
        curso.nombre,
        fechaLimite,
        matriculaCerrada
      );
      let qrActualizado = qr;
      if (!qrActualizado) {
        qrActualizado = await qrApi.generarQR(curso.id);
      }
      setQr({ ...qrActualizado, activo: true, fecha_expiracion: `${fechaLimite} 23:59:59` });
      setMatriculaCerrada(false);
      onCursoActualizado?.(actualizado);
      alerta.success("Fecha actualizada", "La misma fecha límite se actualizó para el curso y el QR.");
    } catch (e) {
      alerta.error("No se pudo actualizar la fecha", e.message || "Intenta nuevamente.");
    } finally {
      setActualizandoFecha(false);
    }
  };

  // ────────────── Render helpers ──────────────

  if (!curso) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Cerrar al hacer clic sobre el fondo
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card, white)",
          color: "var(--text-main)",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color, #eee)",
        }}
      >
        {/* ── HEADER ── */}
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
              fontSize: "1.2rem",
              color: "var(--primary-color)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <line x1="14" y1="14" x2="14" y2="17" />
              <line x1="14" y1="20" x2="17" y2="20" />
              <line x1="20" y1="14" x2="20" y2="17" />
              <line x1="20" y1="20" x2="21" y2="20" />
            </svg>
            {qr ? (qrActivoProp ? "Código QR Activo" : "Código QR Generado") : "Generar Código QR"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              padding: "4px",
            }}
          >
            <CierreX width="22" height="22" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: "20px" }}>
          {/* Info del curso */}
          <div
            style={{
              background: "var(--bg-input, #f9fafb)",
              padding: "12px 14px",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid var(--border-color, #eee)",
            }}
          >
            <p style={{ margin: "3px 0", color: "var(--text-main)", fontWeight: "bold", fontSize: "1rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Graduacion width="18" height="18" style={{ color: "var(--text-main)" }} /> {curso.nombre}
            </p>
            {curso.periodo && (
              <p style={{ margin: "3px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Periodo: {curso.periodo}
              </p>
            )}
            {codigoAcceso && (
              <p style={{ margin: "3px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Código de acceso: <strong>{codigoAcceso}</strong>
              </p>
            )}
          </div>

          {!qr ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>
                El QR utilizará la fecha límite de matrícula del curso.
              </p>
              <p style={{ color: "var(--text-main)", fontWeight: "bold" }}>
                Válido hasta: {formatearFecha(fechaLimite) }
              </p>
              <button onClick={matriculaCerrada || fechaVencida ? handleCambiarEstado : handleGenerar} disabled={generando || desactivando} style={{ width: "100%", padding: "12px 18px", background: generando || desactivando ? "#9ca3af" : "var(--accent-color)", color: "white", border: "none", borderRadius: "6px", cursor: generando || desactivando ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                {generando ? "Generando…" : desactivando ? "Habilitando…" : matriculaCerrada || fechaVencida ? "Habilitar matrícula" : "Generar Código QR"}
              </button>
            </div>
          ) : (
            /* ── ESTADO: POST-GENERACIÓN ── */
            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  margin: "0 0 10px 0",
                  color: "var(--primary-color)",
                  fontSize: "1.15rem",
                }}
              >
                {qr.clase_nombre || curso.nombre}
              </h3>

              <div
                ref={qrContainerRef}
                style={{
                  display: "inline-block",
                  padding: "14px",
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  margin: "10px auto",
                }}
              >
                <QRCodeSVG value={qr.url} size={240} level="H" includeMargin={true} />
              </div>

              <div style={{ marginTop: "10px" }}>
                <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: "20px", background: matriculaCerrada || fechaVencida ? "#dc2626" : "#10b981", color: "white", fontWeight: "bold", fontSize: "0.85rem" }}>
                  {matriculaCerrada ? "🔴 Matrícula cerrada" : fechaVencida ? "Fecha vencida" : "Matrícula habilitada"}
                </span>
              </div>

              {/* Info */}
              <div
                style={{
                  textAlign: "left",
                  marginTop: "16px",
                  padding: "12px",
                  background: "var(--bg-input, #f9fafb)",
                  borderRadius: "6px",
                  fontSize: "0.88rem",
                }}
              >
                <p style={{ margin: "3px 0", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-main)" }}>Creado:</strong>{" "}
                  {formatearFecha(qr.fecha_creacion)}
                </p>
                <p style={{ margin: "3px 0", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-main)" }}>Válido hasta:</strong>{" "}
                  {formatearFecha(fechaLimite)}
                </p>
                {/* <p style={{ margin: "3px 0", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-main)" }}>
                    Alumnos matriculados:
                  </strong>{" "}
                  {qr.alumnos_inscritos ?? 0}
                </p> */}
                {/* <p
                  style={{
                    margin: "3px 0",
                    color: "var(--text-muted)",
                    wordBreak: "break-all",
                  }}
                >
                  <strong style={{ color: "var(--text-main)" }}>Enlace:</strong>{" "}
                  {qr.url}
                </p> */}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                <label style={{ color: "var(--text-main)", fontWeight: "bold" }}>
                  {fechaVencida ? "Ampliar fecha:" : "Cambiar fecha:"}
                </label>
                <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} disabled={actualizandoFecha} />
                <button onClick={handleCambiarFecha} disabled={actualizandoFecha} style={{ padding: "7px 10px", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                  {actualizandoFecha ? "Guardando…" : "Guardar fecha"}
                </button>
              </div>

              {/* Acciones */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                <button
                  onClick={handleDescargar}
                  style={{
                    padding: "10px 12px",
                    background: "var(--primary-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Descargar width="16" height="16" /> Descargar PNG
                </button>
                <button
                  onClick={handleCopiarEnlace}
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Copiar width="16" height="16" /> Copiar enlace
                </button>
                {/* <button
                  onClick={handleCompartir}
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Compartir width="16" height="16" /> Compartir
                </button> */}
                <button
                    onClick={handleCambiarEstado}
                    disabled={desactivando}
                    style={{
                      padding: "10px 12px",
                      background: desactivando ? "#9ca3af" : "rgba(220, 38, 38, 0.1)",
                      color: "#dc2626",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: "5px",
                      cursor: desactivando ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {desactivando
                      ? matriculaCerrada || fechaVencida ? "Habilitando…" : "Cerrando…"
                      : matriculaCerrada || fechaVencida
                        ? "Habilitar matrícula"
                        : <><Desactivar width="16" height="16" /> Cerrar matrícula</>}
                  </button>
              </div>

              {/* Generar nuevo / cerrar */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleGenerarNuevo}
                  disabled={desactivando}
                  style={{
                    padding: "10px 16px",
                    background: desactivando ? "#9ca3af" : "var(--accent-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: desactivando ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {desactivando ? "Generando…" : <><Regenerar width="16" height="16" /> Generar nuevo código</>}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px 16px",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
