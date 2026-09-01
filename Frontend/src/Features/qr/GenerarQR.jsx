import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useData } from "../../components/Gestion_Datos/DataContext";
import { alerta } from "../../utils/Notificaciones";
import { api, BASE_URL } from "../../services/api";
import qrApi from "../../services/qrApi";

/**
 * Formatea una fecha "YYYY-MM-DD HH:MM:SS" a algo más legible en es-BO.
 */
const formatearFecha = (iso) => {
  if (!iso) return "-";
  try {
    const [fecha, hora] = iso.split(" ");
    return hora ? `${fecha} ${hora}` : fecha;
  } catch {
    return iso;
  }
};

/**
 * Calcula los minutos y segundos restantes a partir de la fecha de expiración.
 * Devuelve { expirado, minutos, segundos, totalSegundos }.
 */
export default function GenerarQR() {
  const { usuario } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Datos de la clase seleccionada
  const [misCursos, setMisCursos] = useState([]);
  const [claseId, setClaseId] = useState(() => {
    const qp = searchParams.get("clase");
    return qp ? Number(qp) : null;
  });
  const [cargandoCursos, setCargandoCursos] = useState(true);

  // QR generado
  const [qr, setQr] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);

  const qrContainerRef = useRef(null);

  // 1. Cargar cursos del docente
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await api.obtenerClasesDocente();
        setMisCursos(Array.isArray(data) ? data : []);
      } catch {
        alerta.error("Error", "No se pudieron cargar tus cursos.");
      } finally {
        setCargandoCursos(false);
      }
    };
    cargar();
  }, []);

  // 2. Si nos pasaron ?clase=, intentar generar automáticamente
  useEffect(() => {
    if (claseId && !qr && !generando && !cargandoCursos) {
      handleGenerar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claseId, cargandoCursos]);

  const handleGenerar = async () => {
    if (!claseId) {
      alerta.error("Selecciona una clase", "Debes elegir una asignatura para generar el QR.");
      return;
    }
    setGenerando(true);
    try {
      const data = await qrApi.generarQR(claseId);
      setQr(data);
      alerta.success("QR generado", "Tu código QR está listo para compartir.");
    } catch (e) {
      alerta.error("No se pudo generar el QR", e.message);
    } finally {
      setGenerando(false);
    }
  };

  const handleDesactivar = async () => {
    if (!qr?.id) return;
    if (!window.confirm("¿Cerrar la matrícula? El código y el QR dejarán de permitir nuevas matrículas.")) return;
    setDesactivando(true);
    try {
      await qrApi.cerrarMatricula(qr.clase_id);
      setQr({ ...qr, activo: false });
      alerta.success("QR desactivado", "El código ya no permitirá nuevas matrículas.");
    } catch (e) {
      alerta.error("No se pudo desactivar", e.message);
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
        // Si el usuario cancela o falla, caemos al fallback de copiar.
        if (err?.name === "AbortError") return;
      }
    }
    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(qr.url);
      alerta.success("Enlace copiado", "Tu navegador no soporta 'Compartir'. El enlace fue copiado al portapapeles.");
    } catch {
      alerta.error("No se pudo compartir", "Copia manualmente el enlace mostrado en pantalla.");
    }
  };

  /**
   * Descarga el QR como PNG. Capturamos el SVG renderizado y lo dibujamos
   * sobre un canvas para exportarlo.
   */
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
        // Fondo blanco
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // QR
        ctx.drawImage(img, 100, 40, size - 200, size - 200);
        // Texto
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

  if (!usuario) {
    navigate("/login");
    return null;
  }

  if (usuario.rol !== "Docente" && usuario.rol !== "Administrador") {
    return (
      <div className="page-container">
        <h1 style={{ color: "var(--text-main)" }}>Generar QR de Matriculación</h1>
        <p style={{ color: "var(--text-muted)" }}>Esta sección está disponible solo para Docentes y Administradores.</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", borderBottom: "2px solid var(--border-color)", paddingBottom: "10px" }}>
        <h1 style={{ color: "var(--text-main)", margin: 0, fontSize: "clamp(1.3rem, 4vw, 1.8rem)" }}>
          Generar QR de Matriculación
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "5px 0 0 0" }}>
          Genera un código QR usando la misma fecha límite de matrícula del curso.
        </p>
      </div>

      <div style={{ background: "var(--bg-card, white)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color, #eee)", marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "var(--text-main)" }}>
          Selecciona la asignatura:
        </label>
        {cargandoCursos ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando cursos…</p>
        ) : misCursos.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No tienes cursos creados. Ve a <a href="#/grupos" style={{ color: "var(--accent-color)" }}>Gestión Grupos</a> para crear uno.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={claseId || ""}
              onChange={(e) => {
                setClaseId(Number(e.target.value) || null);
                setQr(null);
              }}
              style={{ flex: 1, minWidth: "240px", padding: "10px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
            >
              <option value="">— Selecciona una materia —</option>
              {misCursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerar}
              disabled={!claseId || generando}
              style={{
                padding: "10px 20px",
                background: !claseId || generando ? "#9ca3af" : "var(--accent-color)",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: !claseId || generando ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {generando ? "Generando…" : qr ? "Regenerar QR" : "Generar QR"}
            </button>
          </div>
        )}
      </div>

      {qr && (
        <div style={{ background: "var(--bg-card, white)", padding: "clamp(15px, 4vw, 30px)", borderRadius: "8px", border: "1px solid var(--border-color, #eee)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "var(--primary-color)", marginTop: 0, fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}>
              {qr.clase_nombre}
            </h2>

            <div
              ref={qrContainerRef}
              style={{
                display: "inline-block",
                padding: "16px",
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                margin: "10px auto",
              }}
            >
              <QRCodeSVG value={qr.url} size={260} level="H" includeMargin={true} />
            </div>

            <div style={{ marginTop: "15px" }}>
              <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: "20px", background: qr.activo ? "#10b981" : "#6b7280", color: "white", fontWeight: "bold", fontSize: "0.85rem" }}>
                {qr.activo ? "Matrícula habilitada" : "Matrícula cerrada"}
              </span>
            </div>

            <div style={{ textAlign: "left", marginTop: "20px", padding: "15px", background: "var(--bg-input, #f9fafb)", borderRadius: "6px" }}>
              <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--text-main)" }}>Creado:</strong> {formatearFecha(qr.fecha_creacion)}
              </p>
              <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--text-main)" }}>Válido hasta:</strong> {formatearFecha(qr.fecha_expiracion)}
              </p>
              <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--text-main)" }}>Alumnos matriculados:</strong> {qr.alumnos_inscritos}
              </p>
              <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.9rem", wordBreak: "break-all" }}>
                <strong style={{ color: "var(--text-main)" }}>Enlace:</strong> {qr.url}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleDescargar}
                style={{ padding: "10px 15px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                ⬇️ Descargar PNG
              </button>
              <button
                onClick={handleCopiarEnlace}
                style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                🔗 Copiar enlace
              </button>
              <button
                onClick={handleCompartir}
                style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                📤 Compartir
              </button>
              {qr.activo && (
                <button
                  onClick={handleDesactivar}
                  disabled={desactivando}
                  style={{ padding: "10px 15px", background: desactivando ? "#9ca3af" : "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: "5px", cursor: desactivando ? "not-allowed" : "pointer", fontWeight: "bold" }}
                >
                  {desactivando ? "Cerrando…" : "⛔ Cerrar matrícula"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/grupos")}
          style={{ background: "none", border: "none", color: "var(--accent-color)", fontWeight: "bold", cursor: "pointer" }}
        >
          ← Volver a Gestión de Cursos
        </button>
      </div>
    </div>
  );
}
