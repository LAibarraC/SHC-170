import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoCarrera from "../../assets/images/Logo-Adm.png";
import { api } from "../../services/api.js";
import { alerta } from '../../utils/Notificaciones.jsx';
import '../../styles/ui/Login.css';
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

// Importamos tu componente original (Ajusta la ruta si tu carpeta se llama distinto)
import OscuroClaro from "../../ui/oscuro_claro.jsx";
import { IconoCorreo } from "../../ui/iconos.jsx";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados para recuperación de contraseña
  const [vista, setVista] = useState("login"); // login | forgot | reset
  const [token, setToken] = useState("");
  const [nuevoPass, setNuevoPass] = useState("");
  const [confirmarNuevoPass, setConfirmarNuevoPass] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.loginLocal(email, pass);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      onLogin(data);
      alerta.success("Acceso concedido", `Bienvenido, ${data.nombre}`);
    } catch (error) {
      if (error.message === "Credenciales incorrectas") {
        alerta.error("Credenciales incorrectas", "Por favor, verifica tu correo y contraseña.");
      } else {
        alerta.error("Error de conexión", "Asegúrate de que el servidor Backend esté corriendo.");
      }
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    if (!email) {
      alerta.error("Campo vacío", "Por favor, introduce tu correo electrónico.");
      return;
    }
    try {
      const res = await api.recuperarPassword(email);
      alerta.success("Código de recuperación generado", `Para pruebas locales, introduce el código: ${res.token}`);
      setVista("reset");
    } catch (err) {
      alerta.error("Error", err.message || "Error al solicitar el código de recuperación.");
    }
  };

  const handleResetear = async (e) => {
    e.preventDefault();
    if (!token || !nuevoPass || !confirmarNuevoPass) {
      alerta.error("Campos vacíos", "Por favor, completa todos los campos.");
      return;
    }
    if (nuevoPass !== confirmarNuevoPass) {
      alerta.error("Error", "Las contraseñas no coinciden.");
      return;
    }
    try {
      await api.resetearPassword(email, token, nuevoPass);
      alerta.success("Contraseña restablecida", "Tu contraseña ha sido cambiada. Inicia sesión con tus nuevas credenciales.");
      setPass("");
      setVista("login");
    } catch (err) {
      alerta.error("Error", err.message || "El token es inválido o ha expirado.");
    }
  };

  return (
    <div className="login-container" style={{ position: 'relative' }}>

      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '35px', marginTop: '5px' }}>
          <img
            src={logoCarrera}
            alt="Logo Administración de Empresas"
            style={{ width: '200px', height: 'auto' }}
          />
        </div>

        {vista === "login" && (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="floating-input-group is-email" style={{ textAlign: 'left', height: '50px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box" }}
                />
                <label className="etiqueta">Correo Electrónico</label>
                <fieldset className="notch"><legend><span>Correo Electrónico</span></legend></fieldset>
                <div className="icono-email" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-35%)', color: 'white', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                  <IconoCorreo />
                </div>
              </div>

              <div className="floating-input-group" style={{ textAlign: 'left', height: '50px' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder=" "
                  required
                  style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box" }}
                />
                <label className="etiqueta">Contraseña</label>
                <fieldset className="notch"><legend><span>Contraseña</span></legend></fieldset>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-35%)',
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                    zIndex: 2
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

              <button
                type="submit"
                className="btn-auth"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  padding: '12px',
                  fontSize: '1rem',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}
              >
                Ingresar
              </button>
            </form>

            {/* --- SEPARADOR Y BOTÓN DE GOOGLE --- */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #ccc)' }}></div>
              <span style={{ margin: '0 10px', color: 'var(--text-muted, #777)', fontSize: '0.8rem' }}>O continuar con</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color, #ccc)' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const data = await api.loginGoogle(credentialResponse.credential);
                      if (data.token) {
                        localStorage.setItem("token", data.token);
                      }
                      onLogin(data);
                      alerta.success("Acceso concedido", `Bienvenido, ${data.nombre}`);
                    } catch (err) {
                      alerta.error("Error de conexión", err.message || "No se pudo iniciar sesión en el servidor");
                    }
                  }}
                  onError={() => {
                    alerta.error("Error", "No se pudo iniciar sesión con Google");
                  }}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                />
              </GoogleOAuthProvider>
            </div>
            {/* ----------------------------------- */}

            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem' }}>
              <Link
                to="/forgot-password"
                style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
              <p>¿No tienes una cuenta? <Link to="/registro" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Regístrate aquí</Link></p>
            </div>
          </>
        )}

        {vista === "forgot" && (
          <>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>Recuperación de Contraseña</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
              Introduce tu correo electrónico para obtener un código de reseteo.
            </p>
            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="floating-input-group is-email" style={{ textAlign: 'left', height: '52px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box" }}
                />
                <label className="etiqueta">Correo Electrónico</label>
                <fieldset className="notch"><legend><span>Correo Electrónico</span></legend></fieldset>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'white', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                  <IconoCorreo />
                </div>
              </div>

              <button type="submit" className="btn-auth" style={{
                backgroundColor: 'var(--accent-color)',
                padding: '12px',
                fontSize: '1rem',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}>
                Obtener Código
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
              <button
                onClick={() => setVista("login")}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {vista === "reset" && (
          <>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>Restablecer Contraseña</h3>
            <form onSubmit={handleResetear} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="floating-input-group" style={{ textAlign: 'left', height: '52px' }}>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder=" "
                  required
                  style={{ width: "100%", height: "100%", margin: 0, padding: "0 14px", boxSizing: "border-box", display: "block" }}
                />
                <label className="etiqueta">Código de Recuperación</label>
                <fieldset className="notch"><legend><span>Código de Recuperación</span></legend></fieldset>
              </div>

              <div className="floating-input-group" style={{ textAlign: 'left', height: '52px' }}>
                <input
                  type="password"
                  value={nuevoPass}
                  onChange={(e) => setNuevoPass(e.target.value)}
                  placeholder=" "
                  required
                  style={{ width: "100%", height: "100%", margin: 0, padding: "0 14px", boxSizing: "border-box", display: "block" }}
                />
                <label className="etiqueta">Nueva Contraseña</label>
                <fieldset className="notch"><legend><span>Nueva Contraseña</span></legend></fieldset>
              </div>

              <div className="floating-input-group" style={{ textAlign: 'left', height: '52px' }}>
                <input
                  type="password"
                  value={confirmarNuevoPass}
                  onChange={(e) => setConfirmarNuevoPass(e.target.value)}
                  placeholder=" "
                  required
                  style={{ width: "100%", height: "100%", margin: 0, padding: "0 14px", boxSizing: "border-box", display: "block" }}
                />
                <label className="etiqueta">Confirmar Nueva Contraseña</label>
                <fieldset className="notch"><legend><span>Confirmar Nueva Contraseña</span></legend></fieldset>
              </div>

              <button type="submit" className="btn-auth" style={{
                backgroundColor: 'var(--accent-color)',
                padding: '12px',
                fontSize: '1rem',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '5px',
                fontWeight: 'bold',
                marginTop: '10px'
              }}>
                Cambiar Contraseña
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
              <button
                onClick={() => setVista("login")}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Cancelar y volver
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}