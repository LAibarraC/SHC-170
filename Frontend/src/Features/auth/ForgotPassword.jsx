import { useState } from "react";
import { Link } from "react-router-dom";
import { alerta } from "../../utils/Notificaciones.jsx";
import logoCarrera from "../../assets/images/Logo-Adm.png";
import { IconoCorreo } from "../../ui/iconos.jsx";
import "../../styles/ui/Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Expresión regular robusta para validar formato de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Si está vacío, no se marca como inválido inmediatamente para evitar mostrar rojo de entrada
  const isEmailValid = email === "" || emailRegex.test(email);
  const canSubmit = email !== "" && emailRegex.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      console.log(`[ForgotPassword] Iniciando recuperación para: ${email}`);
      console.log(`[ForgotPassword] POST URL: ${BASE_URL}/api/auth/forgot-password`);

      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
        alerta.success("Solicitud enviada", "Si el correo está registrado, recibirás un enlace de recuperación.");
      } else {
        const errData = await res.json();
        alerta.error("Error", errData.detail || "Error al procesar la solicitud.");
      }
    } catch (error) {
      console.error("[ForgotPassword] Error:", error);
      alerta.error("Error de conexión", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ position: "relative" }}>
      {/* Ocultamos el pie de página global */}
      <style>{`
        .pie-top, footer, .pie-pagina-institucional {
          display: none !important;
        }
      `}</style>

      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={logoCarrera} alt="Logo" style={{ width: "200px", height: "auto" }} />
        </div>

        <h3 style={{ color: "var(--text-main)", marginBottom: "15px", textAlign: "center" }}>
          Recuperar Contraseña
        </h3>

        {success ? (
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <p style={{ color: "var(--text-main)", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Si el correo está registrado, recibirás un enlace en tu bandeja de entrada. Por favor, revisa también tu carpeta de Spam o Correo No Deseado por si acaso.
            </p>
            <div style={{ marginTop: "25px" }}>
              <Link to="/login" style={{ color: "var(--accent-color)", fontWeight: "bold", textDecoration: "none" }}>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Introduce tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>

            <div className="floating-input-group is-email" style={{ textAlign: 'left', height: '50px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                style={{ 
                  flex: 1, 
                  minWidth: 0, 
                  height: "100%", 
                  margin: 0, 
                  padding: "0 40px 0 14px", 
                  boxSizing: "border-box",
                  borderColor: !isEmailValid ? "#dc2626" : "var(--border-color)",
                  outline: "none"
                }}
              />
              <label className="etiqueta">Correo Electrónico</label>
              <fieldset className="notch"><legend><span>Correo Electrónico</span></legend></fieldset>
              <div className="icono-email" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-35%)', color: 'white', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                <IconoCorreo />
              </div>
            </div>
            {!isEmailValid && (
              <span style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "-10px", display: "block", fontWeight: "bold", textAlign: "left" }}>
                Por favor, introduce un correo electrónico válido.
              </span>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                backgroundColor: loading || !canSubmit ? "var(--border-color)" : "var(--accent-color)",
                cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                padding: "12px",
                fontSize: "1rem",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontWeight: "bold",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>

            <div style={{ textAlign: "center", fontSize: "0.9rem", marginTop: "5px" }}>
              <p style={{ color: "var(--text-main)" }}>
                ¿Recordaste tu contraseña?{" "}
                <Link to="/login" style={{ color: "var(--accent-color)", fontWeight: "bold", textDecoration: "none" }}>
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
