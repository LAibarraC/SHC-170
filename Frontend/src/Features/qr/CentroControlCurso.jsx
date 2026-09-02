import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/components/SelectorFecha.css";
import { alerta } from "../../utils/Notificaciones";
import qrApi from "../../services/qrApi";
import api from "../../services/api";
import { Descargar, Copiar, Regenerar, CierreX } from "../../ui/iconos";

registerLocale("es", es);

const fechaIsoADate = (fecha) => {
  if (!fecha) return null;
  const [year, month, day] = String(fecha).slice(0, 10).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

const dateAFechaIso = (fecha) => {
  if (!fecha) return "";
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Centro de control del curso: gestiona sus ajustes, matrícula y código QR.
 *
 * Props:
 *  - curso: { id, nombre, periodo?, codigo?, docente_nombre? }
 *  - qrActivo: (opcional) { id, token, url, clase_id, clase_nombre, fecha_creacion, fecha_expiracion, activo, alumnos_inscritos }
 *  - onClose: () => void
 *  - onDesactivar: () => void (opcional, callback cuando cambia el estado de matrícula)
 *  - onCursoActualizado: (cursoActualizado) => void
 */
export default function CentroControlCurso({
  curso,
  qrActivo: qrActivoProp,
  onClose,
  onDesactivar,
  onCursoActualizado,
}) {
  // ────────────── Estados ──────────────
  const [generando, setGenerando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [nombreCurso, setNombreCurso] = useState(curso?.nombre || "");
  const [fechaLimite, setFechaLimite] = useState(curso?.fecha_limite_matriculacion || "");
  const [codigoAcceso, setCodigoAcceso] = useState(curso?.codigo || null);
  const [guardandoCurso, setGuardandoCurso] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("general");
  const [reseteandoCurso, setReseteandoCurso] = useState(false);
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

  // Sincronizar estado cuando cambian las props
  useEffect(() => {
    if (curso) {
      setNombreCurso(curso.nombre || "");
      setFechaLimite(curso.fecha_limite_matriculacion || "");
      setCodigoAcceso(curso.codigo || null);
      setMatriculaCerrada(!curso.codigo || qrActivoProp?.activo === false);
    }
    if (qrActivoProp !== undefined) {
      setQr(qrActivoProp);
    }
  }, [curso, qrActivoProp]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ────────────── Acciones ──────────────

  const handleResetearCurso = async () => {
    const confirmado = await alerta.confirmar({
      titulo: "Resetear integrantes",
      mensaje: `Se eliminará a todos los integrantes de «${nombreCurso || curso.nombre}». Esta acción no se puede deshacer.`,
      textoConfirmar: "Sí, eliminar integrantes",
      textoCancelar: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) return;

    setReseteandoCurso(true);
    try {
      const resultado = await api.resetearIntegrantesClase(curso.id);
      alerta.success(
        "Curso reseteado",
        `${resultado.eliminados || 0} integrante(s) fueron eliminados.`
      );
      onCursoActualizado?.(curso);
    } catch (e) {
      alerta.error("No se pudo resetear el curso", e.message || "Intenta nuevamente.");
    } finally {
      setReseteandoCurso(false);
    }
  };

  const handleGuardarCurso = async () => {
    if (!nombreCurso.trim()) {
      alerta.error("Nombre requerido", "Ingresa el nombre de la materia.");
      return;
    }
    setGuardandoCurso(true);
    try {
      const actualizado = await api.actualizarClase(
        curso.id,
        nombreCurso.trim(),
        fechaLimite,
        false
      );
      setCodigoAcceso(actualizado.codigo_acceso ?? codigoAcceso);
      onCursoActualizado?.(actualizado);
      alerta.success("Curso actualizado", "La información del curso se guardó correctamente.");
    } catch (e) {
      alerta.error("No se pudo guardar el curso", e.message || "Intenta nuevamente.");
    } finally {
      setGuardandoCurso(false);
    }
  };

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
      mensaje:
        "¿Cerrar la matrícula? El código y el QR dejarán de permitir nuevas matrículas. Las ya realizadas no se eliminarán.",
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
      // Reflejar también el estado del QR mostrado
      setQr((qrActual) => (qrActual ? { ...qrActual, activo: false } : qrActual));
      onCursoActualizado?.(actualizado);
      onDesactivar?.();
      alerta.success("Matrícula cerrada", "El estado se guardó correctamente en el servidor.");
    } catch (e) {
      alerta.error("No se pudo cerrar la matrícula", e.message || "Intenta nuevamente.");
    } finally {
      setDesactivando(false);
    }
  };

  const copiarConRespaldo = (texto) => {
    const areaTemporal = document.createElement("textarea");
    areaTemporal.value = texto;
    areaTemporal.setAttribute("readonly", "");
    areaTemporal.style.position = "fixed";
    areaTemporal.style.opacity = "0";
    areaTemporal.style.pointerEvents = "none";
    document.body.appendChild(areaTemporal);
    areaTemporal.focus();
    areaTemporal.select();
    areaTemporal.setSelectionRange(0, areaTemporal.value.length);
    const copiado = document.execCommand("copy");
    document.body.removeChild(areaTemporal);
    return copiado;
  };

  const handleCopiarCodigo = async () => {
    if (!codigoAcceso) {
      alerta.error("No se pudo copiar", "No hay código de acceso disponible.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codigoAcceso);
      } else if (!copiarConRespaldo(codigoAcceso)) {
        throw new Error("No se pudo copiar");
      }
      alerta.success("Código copiado al portapapeles", `Código: ${codigoAcceso}`);
    } catch {
      try {
        if (!copiarConRespaldo(codigoAcceso)) throw new Error("No se pudo copiar");
        alerta.success("Código copiado al portapapeles", `Código: ${codigoAcceso}`);
      } catch {
        alerta.error(
          "No se pudo copiar el código",
          "Verifica los permisos del navegador e inténtalo nuevamente."
        );
      }
    }
  };

  const handleCopiarEnlace = async () => {
    const enlace = qr?.url;
    if (!enlace) {
      alerta.error("No se pudo copiar", "El enlace del código QR no está disponible.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(enlace);
      } else if (!copiarConRespaldo(enlace)) {
        throw new Error("No se pudo copiar");
      }
      alerta.success("Enlace copiado", "El enlace se copió correctamente al portapapeles.");
    } catch {
      try {
        if (!copiarConRespaldo(enlace)) throw new Error("No se pudo copiar");
        alerta.success("Enlace copiado", "El enlace se copió correctamente al portapapeles.");
      } catch {
        alerta.error(
          "No se pudo copiar el enlace",
          "Verifica los permisos del navegador e inténtalo nuevamente."
        );
      }
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
        ctx.fillText(qr.clase_nombre || nombreCurso || curso.nombre, canvas.width / 2, size - 30);
        ctx.font = "20px Arial";
        ctx.fillStyle = "#6b7280";
        ctx.fillText("Matricúlate escaneando este código", canvas.width / 2, size + 10);
        ctx.fillText(`Válido hasta: ${formatearFecha(fechaLimite)}`, canvas.width / 2, size + 45);

        const link = document.createElement("a");
        link.download = `QR_${(qr.clase_nombre || nombreCurso || curso.nombre).replace(/\s+/g, "_")}.png`;
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
      alerta.success(
        "Fecha actualizada",
        "La misma fecha límite se actualizó para el curso y el QR."
      );
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
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color, #eee)",
        }}
      >
        {/* Cabecera del Modal */}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <line x1="14" y1="14" x2="14" y2="17" />
              <line x1="14" y1="20" x2="17" y2="20" />
              <line x1="20" y1="14" x2="20" y2="17" />
              <line x1="20" y1="20" x2="21" y2="20" />
            </svg>
            Centro de Control del Curso
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

        {/* Pestañas de Navegación */}
        <nav
          aria-label="Secciones del centro de control"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            padding: "10px 20px 0",
            background: "var(--bg-card)",
          }}
        >
          {[
            ["general", "Ajustes"],
            ["qr", "Acceso y código QR"],
          ].map(([id, etiqueta]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeccionActiva(id)}
              style={{
                padding: "11px 8px",
                border: "none",
                borderBottom: `3px solid ${seccionActiva === id ? "var(--accent-color)" : "transparent"
                  }`,
                background: "transparent",
                color: seccionActiva === id ? "var(--accent-color)" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.88rem",
              }}
            >
              {etiqueta}
            </button>
          ))}
        </nav>

        {/* Contenido del Modal */}
        <div style={{ padding: "20px" }}>
          {seccionActiva === "general" ? (
            /* ════════════════════════════════════════════════════════════════
               PESTAÑA: AJUSTES (ORDEN DESCENDENTE)
               1. Nombre de la Materia (Input + Guardar Cambios)
               2. Fecha Límite de Matriculación (DatePicker + Guardar Fecha)
               3. Código de acceso (Visualización + Botón Generar nuevo código)
               4. Estado de Matriculación (Switch / Toggle Cerrar / Abrir)
               5. Zona de peligro (Botón Resetear Integrantes)
               ════════════════════════════════════════════════════════════════ */
            <section
              aria-labelledby="seccion-general"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* 1. Nombre de la Materia */}
              <div
                style={{
                  background: "var(--bg-input, #f9fafb)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #eee)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <label
                    id="seccion-general"
                    htmlFor="nombre-curso-control"
                    style={{
                      color: "var(--text-main)",
                      fontWeight: "bold",
                      fontSize: "0.92rem",
                    }}
                  >
                    Nombre de la Materia
                  </label>
                  {(curso.periodo || curso.paralelo) && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {[
                        curso.periodo ? `Periodo: ${curso.periodo}` : null,
                        curso.paralelo ? `Paralelo: ${curso.paralelo}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    id="nombre-curso-control"
                    type="text"
                    value={nombreCurso}
                    onChange={(e) => setNombreCurso(e.target.value)}
                    aria-label="Nombre de la Materia"
                    style={{
                      flex: "1 1 240px",
                      boxSizing: "border-box",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGuardarCurso}
                    disabled={guardandoCurso || actualizandoFecha}
                    style={{
                      padding: "9px 16px",
                      background: guardandoCurso ? "#9ca3af" : "var(--accent-color)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: guardandoCurso ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "0.88rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {guardandoCurso ? "Guardando…" : "Guardar Cambios"}
                  </button>
                </div>
              </div>

              {/* 2. Fecha Límite de Matriculación */}
              <div
                style={{
                  background: "var(--bg-input, #f9fafb)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #eee)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "var(--text-main)",
                    fontWeight: "bold",
                    fontSize: "0.92rem",
                  }}
                >
                  Fecha Límite de Matriculación
                </label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <DatePicker
                      selected={fechaIsoADate(fechaLimite)}
                      onChange={(fecha) => setFechaLimite(dateAFechaIso(fecha))}
                      dateFormat="dd/MM/yyyy"
                      locale="es"
                      placeholderText="dd/mm/aaaa"
                      isClearable
                      className="selector-fecha"
                      disabled={actualizandoFecha}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCambiarFecha}
                    disabled={actualizandoFecha}
                    style={{
                      padding: "9px 16px",
                      background: actualizandoFecha ? "#9ca3af" : "var(--primary-color)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: actualizandoFecha ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "0.88rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {actualizandoFecha ? "Guardando…" : "Guardar Fecha"}
                  </button>
                </div>
              </div>

              {/* 3. Código de Acceso */}
              <div
                style={{
                  background: "var(--bg-input, #f9fafb)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #eee)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "var(--text-main)",
                        fontSize: "0.92rem",
                      }}
                    >
                      Código de acceso:
                    </span>
                    {codigoAcceso ? (
                      <code
                        style={{
                          padding: "4px 10px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          color: "var(--primary-color)",
                          letterSpacing: "1px",
                        }}
                      >
                        [ {codigoAcceso} ]
                      </code>
                    ) : (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontStyle: "italic",
                        }}
                      >
                        Sin código asignado
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                    }}
                  >
                    Al generar un nuevo código, el anterior dejará de funcionar inmediatamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerarNuevo}
                  disabled={desactivando}
                  style={{
                    padding: "9px 14px",
                    background: desactivando ? "#9ca3af" : "var(--accent-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: desactivando ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.88rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {desactivando ? (
                    "Generando…"
                  ) : (
                    <>
                      <Regenerar width="16" height="16" /> Generar nuevo código
                    </>
                  )}
                </button>
              </div>

              {/* 4. Estado de Matriculación (NUEVO: Switch / Toggle Cerrar / Abrir Matrícula) */}
              <div
                style={{
                  background: "var(--bg-input, #f9fafb)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #eee)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "var(--text-main)",
                      fontSize: "0.92rem",
                    }}
                  >
                    Cerrar / Abrir Matrícula
                  </span>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {matriculaCerrada || fechaVencida
                      ? "La matrícula está bloqueada. Activa el interruptor para reabrirla y permitir inscripciones."
                      : "La matrícula está activa. Desactiva el interruptor para impedir nuevas inscripciones."}
                  </p>
                </div>

                {/* Switch / Toggle interactivo */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!matriculaCerrada && !fechaVencida}
                  aria-label="Cerrar o abrir matrícula"
                  disabled={desactivando}
                  onClick={handleCambiarEstado}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    width: "52px",
                    height: "28px",
                    backgroundColor:
                      matriculaCerrada || fechaVencida ? "#9ca3af" : "#10b981",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: desactivando ? "not-allowed" : "pointer",
                    padding: "2px",
                    transition: "background-color 0.25s ease",
                    opacity: desactivando ? 0.6 : 1,
                    outline: "none",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      transform:
                        matriculaCerrada || fechaVencida
                          ? "translateX(0px)"
                          : "translateX(24px)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </button>
              </div>

              {/* 5. Zona de Peligro */}
              <div
                style={{
                  marginTop: "4px",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(220, 38, 38, 0.35)",
                  background: "rgba(220, 38, 38, 0.05)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 4px",
                    color: "#dc2626",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⚠️ Zona de peligro
                </h3>
                <p
                  style={{
                    margin: "0 0 12px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    lineHeight: 1.4,
                  }}
                >
                  Elimina a todos los estudiantes inscritos en este curso. El curso, sus materiales y su código de acceso se mantendrán.
                </p>
                <button
                  type="button"
                  onClick={handleResetearCurso}
                  disabled={reseteandoCurso}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid rgba(220, 38, 38, 0.45)",
                    background: reseteandoCurso ? "#9ca3af" : "transparent",
                    color: reseteandoCurso ? "white" : "#dc2626",
                    cursor: reseteandoCurso ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                  }}
                >
                  {reseteandoCurso ? "Eliminando integrantes…" : "Resetear Integrantes"}
                </button>
              </div>
            </section>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               PESTAÑA: ACCESO Y CÓDIGO QR (ORDEN DESCENDENTE)
               1. Encabezado de Acceso (Código + Botón Copiar Código)
               2. Título de la Materia (MAT-100)
               3. Imagen/SVG del Código QR
               4. Badge de Estado (Matrícula habilitada / cerrada)
               5. Metadatos (Fecha de Creación y Válido hasta)
               6. Barra de Acciones Inferior (Descargar PNG, Copiar enlace)
               ════════════════════════════════════════════════════════════════ */
            <section aria-labelledby="seccion-qr">
              {!qr ? (
                <div style={{ textAlign: "center" }}>
                  {/* 1. Encabezado de Acceso */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--bg-input, #f9fafb)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color, #eee)",
                      marginBottom: "16px",
                      gap: "12px",
                      flexWrap: "wrap",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          color: "var(--text-muted)",
                        }}
                      >
                        Código de acceso:
                      </span>
                      {codigoAcceso ? (
                        <code
                          style={{
                            padding: "3px 8px",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            color: "var(--primary-color)",
                            letterSpacing: "1px",
                          }}
                        >
                          {codigoAcceso}
                        </code>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          Sin código asignado
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopiarCodigo}
                      disabled={!codigoAcceso}
                      style={{
                        padding: "7px 14px",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        cursor: !codigoAcceso ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Copiar width="15" height="15" /> Copiar código
                    </button>
                  </div>

                  <p style={{ color: "var(--text-muted)", marginTop: "20px" }}>
                    El QR utilizará la fecha límite de matrícula del curso.
                  </p>
                  <p style={{ color: "var(--text-main)", fontWeight: "bold" }}>
                    Válido hasta: {formatearFecha(fechaLimite)}
                  </p>
                  <button
                    onClick={
                      matriculaCerrada || fechaVencida ? handleCambiarEstado : handleGenerar
                    }
                    disabled={generando || desactivando}
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      background:
                        generando || desactivando ? "#9ca3af" : "var(--accent-color)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: generando || desactivando ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      marginTop: "12px",
                    }}
                  >
                    {generando
                      ? "Generando…"
                      : desactivando
                        ? "Habilitando…"
                        : matriculaCerrada || fechaVencida
                          ? "Habilitar matrícula"
                          : "Generar Código QR"}
                  </button>
                </div>
              ) : (
                /* ── ESTADO: POST-GENERACIÓN CON QR ACTIVO ── */
                <div style={{ textAlign: "center" }}>
                  {/* 1. Encabezado de Acceso (NUEVO) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--bg-input, #f9fafb)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color, #eee)",
                      marginBottom: "16px",
                      gap: "12px",
                      flexWrap: "wrap",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          color: "var(--text-muted)",
                        }}
                      >
                        Código de acceso:
                      </span>
                      {codigoAcceso ? (
                        <code
                          style={{
                            padding: "3px 8px",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            color: "var(--primary-color)",
                            letterSpacing: "1px",
                          }}
                        >
                          {codigoAcceso}
                        </code>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          Sin código asignado
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopiarCodigo}
                      disabled={!codigoAcceso}
                      style={{
                        padding: "7px 14px",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        cursor: !codigoAcceso ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Copiar width="15" height="15" /> Copiar código
                    </button>
                  </div>

                  {/* 2. Título de la Materia */}
                  <h3
                    id="seccion-qr"
                    style={{
                      margin: "0 0 4px 0",
                      color: "var(--primary-color)",
                      fontSize: "1.15rem",
                      fontWeight: "bold",
                    }}
                  >
                    {qr.clase_nombre || nombreCurso || curso.nombre}
                  </h3>

                  {(curso.periodo || curso.paralelo || curso.cupos != null) && (
                    <div
                      style={{
                        marginBottom: "12px",
                        color: "var(--text-muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {[
                        curso.periodo ? `Periodo: ${curso.periodo}` : null,
                        curso.paralelo ? `Paralelo: ${curso.paralelo}` : null,
                        curso.cupos != null ? `Cupos: ${curso.cupos}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}

                  {/* 3. Imagen/SVG del Código QR */}
                  <div
                    ref={qrContainerRef}
                    style={{
                      display: "inline-block",
                      padding: "14px",
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      margin: "6px auto",
                    }}
                  >
                    <QRCodeSVG value={qr.url} size={240} level="H" includeMargin={true} />
                  </div>

                  {/* 4. Badge de Estado */}
                  <div style={{ marginTop: "10px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 14px",
                        borderRadius: "20px",
                        background:
                          matriculaCerrada || fechaVencida ? "#dc2626" : "#10b981",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      {matriculaCerrada
                        ? "🔴 Matrícula cerrada"
                        : fechaVencida
                          ? "⚠️ Fecha vencida"
                          : "🟢 Matrícula habilitada"}
                    </span>
                  </div>

                  {/* 5. Metadatos (Fecha de Creación y Válido hasta) */}
                  <div
                    style={{
                      textAlign: "left",
                      marginTop: "16px",
                      padding: "12px 16px",
                      background: "var(--bg-input, #f9fafb)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #eee)",
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
                  </div>

                  {/* 6. Barra de Acciones Inferior */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleDescargar}
                      style={{
                        padding: "10px 14px",
                        background: "var(--primary-color)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
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
                      type="button"
                      onClick={handleCopiarEnlace}
                      style={{
                        padding: "10px 14px",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
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
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
