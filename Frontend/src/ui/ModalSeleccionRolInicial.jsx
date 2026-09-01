import { useState } from "react";
import { api } from "../services/api";
import { alerta } from "../utils/Notificaciones";
import logoCarrera from "../assets/images/Logo-Adm.png";

export default function ModalSeleccionRolInicial({ usuario, onRolAsignado }) {
  const [rolSeleccionado, setRolSeleccionado] = useState("estudiante");
  const [guardando, setGuardando] = useState(false);

  const handleConfirmar = async () => {
    if (!rolSeleccionado) {
      alerta.error("Selecciona un rol", "Por favor, elige si eres Estudiante o Docente.");
      return;
    }

    setGuardando(true);
    try {
      const dataActualizada = await api.asignarRolInicial(rolSeleccionado);
      if (dataActualizada.token) {
        localStorage.setItem("token", dataActualizada.token);
      }
      alerta.success("Perfil configurado", `Te has identificado como ${dataActualizada.rol}. ¡Bienvenido!`);
      if (onRolAsignado) {
        onRolAsignado(dataActualizada);
      }
    } catch (error) {
      alerta.error("Error al guardar rol", error.message || "No se pudo guardar tu rol.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999999,
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "460px",
        width: "100%",
        backgroundColor: "var(--bg-card, #1e293b)",
        borderRadius: "16px",
        border: "1px solid var(--accent-color, #f97316)",
        padding: "30px 25px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
        textAlign: "center",
        animation: "fadeInScale 0.3s ease-out"
      }}>
        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <img src={logoCarrera} alt="Logo" style={{ width: "130px", height: "auto", marginBottom: "15px" }} />
        
        <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main, #fff)", fontSize: "1.3rem" }}>
          ¡Bienvenido, {usuario?.nombre || "Usuario"}!
        </h3>
        <p style={{ margin: "0 0 22px 0", color: "var(--text-muted, #94a3b8)", fontSize: "0.9rem", lineHeight: "1.4" }}>
          Es tu primera vez iniciando sesión. Selecciona tu rol para configurar tu experiencia:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "25px" }}>
          {/* Opción Estudiante */}
          <div
            onClick={() => setRolSeleccionado("estudiante")}
            style={{
              position: "relative",
              padding: "18px 10px",
              borderRadius: "12px",
              border: rolSeleccionado === "estudiante" ? "2px solid var(--accent-color, #f97316)" : "1px solid var(--border-color, #334155)",
              backgroundColor: rolSeleccionado === "estudiante" ? "rgba(249, 115, 22, 0.15)" : "rgba(128, 128, 128, 0.05)",
              boxShadow: rolSeleccionado === "estudiante" ? "0 0 15px rgba(249, 115, 22, 0.3)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              userSelect: "none"
            }}
          >
            <div style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: rolSeleccionado === "estudiante" ? "var(--accent-color, #f97316)" : "transparent",
              border: rolSeleccionado === "estudiante" ? "none" : "1.5px solid var(--border-color, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}>
              {rolSeleccionado === "estudiante" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "10px",
              backgroundColor: rolSeleccionado === "estudiante" ? "var(--accent-color, #f97316)" : "rgba(128, 128, 128, 0.12)",
              color: rolSeleccionado === "estudiante" ? "white" : "var(--text-main, #fff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>

            <span style={{ fontWeight: "bold", fontSize: "1rem", color: rolSeleccionado === "estudiante" ? "var(--accent-color, #f97316)" : "var(--text-main, #fff)", marginBottom: "3px" }}>
              Estudiante
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              Aprende y compite
            </span>
          </div>

          {/* Opción Docente */}
          <div
            onClick={() => setRolSeleccionado("docente")}
            style={{
              position: "relative",
              padding: "18px 10px",
              borderRadius: "12px",
              border: rolSeleccionado === "docente" ? "2px solid var(--accent-color, #f97316)" : "1px solid var(--border-color, #334155)",
              backgroundColor: rolSeleccionado === "docente" ? "rgba(249, 115, 22, 0.15)" : "rgba(128, 128, 128, 0.05)",
              boxShadow: rolSeleccionado === "docente" ? "0 0 15px rgba(249, 115, 22, 0.3)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              userSelect: "none"
            }}
          >
            <div style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: rolSeleccionado === "docente" ? "var(--accent-color, #f97316)" : "transparent",
              border: rolSeleccionado === "docente" ? "none" : "1.5px solid var(--border-color, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}>
              {rolSeleccionado === "docente" && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "10px",
              backgroundColor: rolSeleccionado === "docente" ? "var(--accent-color, #f97316)" : "rgba(128, 128, 128, 0.12)",
              color: rolSeleccionado === "docente" ? "white" : "var(--text-main, #fff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M6 14h6" />
              </svg>
            </div>

            <span style={{ fontWeight: "bold", fontSize: "1rem", color: rolSeleccionado === "docente" ? "var(--accent-color, #f97316)" : "var(--text-main, #fff)", marginBottom: "3px" }}>
              Docente
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)" }}>
              Crea y gestiona clases
            </span>
          </div>
        </div>

        <button
          onClick={handleConfirmar}
          disabled={guardando}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: "var(--accent-color, #f97316)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: guardando ? "not-allowed" : "pointer",
            opacity: guardando ? 0.7 : 1,
            transition: "all 0.2s"
          }}
        >
          {guardando ? "Guardando..." : `Continuar como ${rolSeleccionado === "docente" ? "Docente" : "Estudiante"}`}
        </button>
      </div>
    </div>
  );
}
