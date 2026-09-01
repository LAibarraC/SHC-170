import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { alerta } from "../../utils/Notificaciones.jsx";
import logoCarrera from "../../assets/images/Logo-Adm.png";
import "../../styles/ui/Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordMatch = password === confirmPassword;
  const canSubmit = password !== "" && confirmPassword !== "" && isPasswordMatch && password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alerta.error("Error", "Falta el token de recuperación en la URL.");
      return;
    }
    if (!isPasswordMatch) {
      alerta.error("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      alerta.error("Contraseña muy corta", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nueva_contrasena: password }),
      });

      if (res.ok) {
        alerta.success("Contraseña restablecida", "Tu contraseña ha sido cambiada. Inicia sesión con tus nuevas credenciales.");
        navigate("/login");
      } else {
        const errData = await res.json();
        alerta.error("Error", errData.detail || "El token es inválido o ha expirado.");
      }
    } catch (error) {
      console.error(error);
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
          Restablecer Contraseña
        </h3>

        {!token ? (
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <p style={{ color: "#dc2626", fontWeight: "bold", fontSize: "0.95rem" }}>
              Token de recuperación no válido o ausente.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "10px", lineHeight: "1.5" }}>
              Por favor, asegúrate de acceder al enlace completo enviado a tu correo electrónico.
            </p>
            <div style={{ marginTop: "25px" }}>
              <Link to="/login" style={{ color: "var(--accent-color)", fontWeight: "bold", textDecoration: "none" }}>
                Ir al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Ingresa y confirma tu nueva contraseña de acceso (mínimo 6 caracteres).
            </p>

            <div style={{ textAlign: "left" }}>
              <label className="etiqueta" style={{ color: "var(--text-main)" }}>Nueva Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{ width: "100%", paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "54%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0
                  }}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "left" }}>
              <label className="etiqueta" style={{ color: "var(--text-main)" }}>Confirmar Nueva Contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                style={{
                  borderColor: !isPasswordMatch && confirmPassword !== "" ? "#dc2626" : "var(--border-color)",
                }}
                required
              />
              {!isPasswordMatch && confirmPassword !== "" && (
                <span style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "5px", display: "block", fontWeight: "bold" }}>
                  Las contraseñas no coinciden.
                </span>
              )}
            </div>

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
                marginTop: "10px",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? "Restableciendo..." : "Cambiar Contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
