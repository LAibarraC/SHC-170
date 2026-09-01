import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logoCarrera from "../../assets/images/Logo-Adm.png";
import { alerta } from '../../utils/Notificaciones.jsx';
import '../../styles/ui/Login.css'; // Aseguramos que cargue los estilos de la tarjeta

import { BASE_URL, api } from "../../services/api.js";
import { IconoCorreo, IconoCheck, IconoX, IconoMostrar, IconoOcultar } from "../../ui/iconos.jsx";

export default function Registro({ onLogin }) {
  const [step, setStep] = useState(1);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rol, setRol] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const isPasswordMatch = pass === confirmPass;

  const hasMinLength = pass.length >= 6;
  const hasUpperCase = /[A-Z]/.test(pass);
  const hasLowerCase = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const showPasswordError = pass.length > 0 && !isPasswordValid;

  const nextStep = async () => {
    if (step === 1) {
      if (!rol) {
        alerta.error("Selecciona un rol", "Por favor, selecciona si eres Estudiante o Docente para continuar.");
        return;
      }
    } else if (step === 2) {
      if (!nombres.trim() || !apellidos.trim()) {
        alerta.error("Datos incompletos", "Por favor, ingresa tus nombres y apellidos.");
        return;
      }
    } else if (step === 3) {
      if (!email.trim()) {
        alerta.error("Datos incompletos", "Por favor, ingresa tu correo electrónico.");
        return;
      }
      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alerta.error("Correo inválido", "Por favor, ingresa un correo electrónico válido.");
        return;
      }

      // Verificación con el backend para saber si el correo ya existe
      try {
        const respuesta = await api.verificarEmail(email.trim());
        if (respuesta.existe) {
          alerta.error("Correo registrado", "Este correo electrónico ya pertenece a una cuenta existente.");
          return;
        }
      } catch (error) {
        alerta.error("Error", "Hubo un problema al verificar el correo.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si no está en el paso 4, el botón Siguiente manejará el avance
    if (step !== 4) {
      nextStep();
      return;
    }

    if (!isPasswordValid) {
      alerta.error("Contraseña débil", "La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }

    if (pass !== confirmPass) {
      alerta.error("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (nombres && apellidos && email && pass && rol) {
      try {
        const payload = {
          nombre: `${String(nombres).trim()} ${String(apellidos).trim()}`,
          email: String(email).trim(),
          password: String(pass),
          rol: rol
        };

        const response = await fetch(`${BASE_URL}/registrar_usuario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Auto-login después de registro
          try {
            const data = await api.loginLocal(email, pass);
            if (data.token) {
              localStorage.setItem("token", data.token);
            }
            if (onLogin) {
              onLogin(data);
            }
            alerta.success("Cuenta creada", "Te has registrado e iniciado sesión automáticamente.");
            navigate("/"); 
          } catch (error) {
            alerta.success("Cuenta creada", "Tu cuenta ha sido registrada exitosamente. Por favor, inicia sesión.");
            navigate("/login"); 
          }
        } else {
          let msgError = "No se pudo registrar.";
          try {
            const errorData = await response.json();
            if (errorData.detail) {
              if (Array.isArray(errorData.detail)) {
                msgError = errorData.detail.map(err => {
                  const campo = err.loc ? err.loc[err.loc.length - 1] : "";
                  return campo ? `El campo '${campo}': ${err.msg}` : err.msg;
                }).join(" | ");
              } else {
                msgError = errorData.detail;
              }
            } else if (errorData.error) {
              msgError = errorData.error;
            }
          } catch (jsonErr) {
            msgError = `Error del servidor (${response.status}): ${response.statusText || "Error interno"}`;
          }
          alerta.error("Error al registrar", msgError);
        }
      } catch (error) {
        alerta.error("Error de conexión", "No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.");
      }
    } else {
      alerta.error("Datos incompletos", "Por favor, llena todos los campos del formulario.");
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Rol de Usuario";
      case 2: return "Datos Personales";
      case 3: return "Contacto";
      case 4: return "Seguridad";
      default: return "";
    }
  };

  return (
    <div className="login-container" style={{ padding: '20px', position: 'relative' }}>
      {/* Ocultamos el pie de página global para la vista de registro */}
      <style>{`
        .pie-top, footer, .pie-pagina-institucional {
          display: none !important;
        }
      `}</style>

      <div className="login-card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <img src={logoCarrera} alt="Logo" style={{ width: '150px', height: 'auto' }} />
          <h3 style={{ marginTop: '15px', color: 'var(--text-main)' }}>Registro de Usuario</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '30px' }}>Crea tu cuenta para acceder al sistema.</p>

          {/* Stepper UI (4 Pasos) */}
          <div className="stepper-wrapper">
            <div className={`stepper-item ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`}>
              <div className="step-counter">1</div>
              <div className="step-name">Rol</div>
            </div>

            <div className={`step-line ${step >= 2 ? 'completed' : ''}`}></div>

            <div className={`stepper-item ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>
              <div className="step-counter">2</div>
              <div className="step-name">Datos</div>
            </div>

            <div className={`step-line ${step >= 3 ? 'completed' : ''}`}></div>

            <div className={`stepper-item ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>
              <div className="step-counter">3</div>
              <div className="step-name">Contacto</div>
            </div>

            <div className={`step-line ${step >= 4 ? 'completed' : ''}`}></div>

            <div className={`stepper-item ${step >= 4 ? 'completed' : ''} ${step === 4 ? 'active' : ''}`}>
              <div className="step-counter">4</div>
              <div className="step-name">Seguridad</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* PASO 1: SELECCIÓN DE ROL */}
          {step === 1 && (
            <div className="step-animation" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'left', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  ¿Cuál es tu rol? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Selecciona cómo utilizarás la plataforma para configurar tu cuenta.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '5px' }}>
                {/* Opción Estudiante */}
                <div
                  onClick={() => setRol('estudiante')}
                  style={{
                    position: 'relative',
                    padding: '20px 12px',
                    borderRadius: '12px',
                    border: rol === 'estudiante' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    backgroundColor: rol === 'estudiante' ? 'rgba(255, 112, 0, 0.12)' : 'rgba(128, 128, 128, 0.05)',
                    boxShadow: rol === 'estudiante' ? '0 0 15px rgba(255, 112, 0, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (rol !== 'estudiante') {
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (rol !== 'estudiante') {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Badge indicador */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: rol === 'estudiante' ? 'none' : '1.5px solid var(--border-color)',
                    backgroundColor: rol === 'estudiante' ? 'var(--accent-color)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    {rol === 'estudiante' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Icono */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: rol === 'estudiante' ? 'var(--accent-color)' : 'rgba(128, 128, 128, 0.12)',
                    color: rol === 'estudiante' ? 'white' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    transition: 'all 0.25s ease'
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>

                  <span style={{
                    fontWeight: '700',
                    fontSize: '1.05rem',
                    color: rol === 'estudiante' ? 'var(--accent-color)' : 'var(--text-main)',
                    marginBottom: '4px'
                  }}>
                    Estudiante
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted, #888)',
                    lineHeight: '1.3'
                  }}>
                    Aprende y compite en simulaciones
                  </span>
                </div>

                {/* Opción Docente */}
                <div
                  onClick={() => setRol('docente')}
                  style={{
                    position: 'relative',
                    padding: '20px 12px',
                    borderRadius: '12px',
                    border: rol === 'docente' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    backgroundColor: rol === 'docente' ? 'rgba(255, 112, 0, 0.12)' : 'rgba(128, 128, 128, 0.05)',
                    boxShadow: rol === 'docente' ? '0 0 15px rgba(255, 112, 0, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (rol !== 'docente') {
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (rol !== 'docente') {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Badge indicador */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: rol === 'docente' ? 'none' : '1.5px solid var(--border-color)',
                    backgroundColor: rol === 'docente' ? 'var(--accent-color)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}>
                    {rol === 'docente' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Icono */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: rol === 'docente' ? 'var(--accent-color)' : 'rgba(128, 128, 128, 0.12)',
                    color: rol === 'docente' ? 'white' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    transition: 'all 0.25s ease'
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                      <path d="M6 14h6" />
                    </svg>
                  </div>

                  <span style={{
                    fontWeight: '700',
                    fontSize: '1.05rem',
                    color: rol === 'docente' ? 'var(--accent-color)' : 'var(--text-main)',
                    marginBottom: '4px'
                  }}>
                    Docente
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted, #888)',
                    lineHeight: '1.3'
                  }}>
                    Crea clases y gestiona grupos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS PERSONALES */}
          {step === 2 && (
            <div className="form-row-responsive step-animation">
              <div className="floating-input-group always-floating" style={{ textAlign: 'left', flex: 1, height: '50px' }}>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan Carlos"
                  style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 14px", boxSizing: "border-box" }}
                  required={step === 2}
                />
                <label className="etiqueta">Nombres</label>
                <fieldset className="notch"><legend><span>Nombres</span></legend></fieldset>
              </div>
              <div className="floating-input-group always-floating" style={{ textAlign: 'left', flex: 1, height: '50px' }}>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Pérez Gómez"
                  style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 14px", boxSizing: "border-box" }}
                  required={step === 2}
                />
                <label className="etiqueta">Apellidos</label>
                <fieldset className="notch"><legend><span>Apellidos</span></legend></fieldset>
              </div>
            </div>
          )}

          {/* PASO 3: CONTACTO */}
          {step === 3 && (
            <div className="floating-input-group always-floating is-email step-animation" style={{ textAlign: 'left', height: '50px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={{ flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box" }}
                required={step === 3}
              />
              <label className="etiqueta">Correo Electrónico</label>
              <fieldset className="notch"><legend><span>Correo Electrónico</span></legend></fieldset>
              <div className="icono-email" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-35%)', color: 'white', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                <IconoCorreo />
              </div>
            </div>
          )}

          {/* PASO 4: SEGURIDAD */}
          {step === 4 && (
            <div className="form-row-responsive step-animation" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="floating-input-group always-floating" style={{ textAlign: 'left', height: '50px' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Usa letras y números"
                    style={{
                      flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box"
                    }}
                    required={step === 4}
                  />
                  <label className="etiqueta">Contraseña</label>
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
                      color: "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                      zIndex: 2
                    }}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <IconoOcultar /> : <IconoMostrar />}
                  </button>
                  <fieldset className="notch" style={showPasswordError ? { borderColor: '#dc2626' } : {}}><legend><span>Contraseña</span></legend></fieldset>
                </div>

                {/* Checklist de requisitos de contraseña - Solo visible cuando se empieza a escribir */}
                {pass.length > 0 && (
                  <div style={{ marginTop: '10px', textAlign: 'left', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {isPasswordValid ? (
                      <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                        <IconoCheck /> Contraseña segura
                      </span>
                    ) : (
                      <>
                        <span style={{ color: hasMinLength ? '#22c55e' : '#dc2626', transition: 'color 0.3s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {hasMinLength ? <IconoCheck /> : <IconoX />} Al menos 6 caracteres
                        </span>
                        <span style={{ color: hasUpperCase ? '#22c55e' : '#dc2626', transition: 'color 0.3s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {hasUpperCase ? <IconoCheck /> : <IconoX />} Una letra mayúscula
                        </span>
                        <span style={{ color: hasLowerCase ? '#22c55e' : '#dc2626', transition: 'color 0.3s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {hasLowerCase ? <IconoCheck /> : <IconoX />} Una letra minúscula
                        </span>
                        <span style={{ color: hasNumber ? '#22c55e' : '#dc2626', transition: 'color 0.3s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {hasNumber ? <IconoCheck /> : <IconoX />} Un número
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="floating-input-group always-floating" style={{ textAlign: 'left', height: '50px' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repite la contraseña"
                    style={{
                      flex: 1, minWidth: 0, height: "100%", margin: 0, padding: "0 40px 0 14px", boxSizing: "border-box"
                    }}
                    required={step === 4}
                  />
                  <label className="etiqueta">Confirmar Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-35%)',
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                      zIndex: 2
                    }}
                    title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <IconoOcultar /> : <IconoMostrar />}
                  </button>
                  <fieldset className="notch" style={!isPasswordMatch && confirmPass !== "" ? { borderColor: '#dc2626' } : {}}><legend><span>Confirmar Contraseña</span></legend></fieldset>
                </div>
                {!isPasswordMatch && confirmPass !== "" && (
                  <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '5px', display: 'block', fontWeight: 'bold', textAlign: 'left' }}>
                    Las contraseñas no coinciden.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-auth"
                style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                Atrás
              </button>
            )}

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
                fontWeight: 'bold',
                flex: 2
              }}
            >
              {step === 4 ? 'Crear Cuenta' : 'Siguiente'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-main)' }}>¿Ya tienes una cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
}