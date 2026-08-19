import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alerta } from '../../utils/Notificaciones';
import { api } from "../../services/api";
import '../../styles/pages/Perfil.css';
import Skeleton from '../../ui/Skeleton';

export default function Perfil({ usuario, setUsuario }) {
  const navigate = useNavigate();

  // --- ESTADOS PARA DATOS REALES ---
  const [historial, setHistorial] = useState([]);
  const [archivosCount, setArchivosCount] = useState(0);
  const [espacio, setEspacio] = useState({ usado: 0, limite: 10 * 1024 * 1024 });
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // --- ESTADOS PARA CAMBIAR CONTRASEÑA ---
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passNuevaConf, setPassNuevaConf] = useState("");

  const isNuevaPasswordMatch = passNueva === passNuevaConf;
  const isNuevaPasswordTooShort = passNueva.length > 0 && passNueva.length < 6;

  // --- ESTADOS PARA ELIMINAR CUENTA ---
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [passEliminar, setPassEliminar] = useState("");
  const [palabraConfirmacion, setPalabraConfirmacion] = useState("");

  useEffect(() => {
    if (usuario) {
      cargarDatosPerfil();
    }
  }, [usuario]);

  const cargarDatosPerfil = async () => {
    try {
      setCargandoDatos(true);
      // Retraso artificial de 2 segundos para ver el Skeleton (¡Bórralo luego!)
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Cargar historial de cálculos
      const histData = await api.obtenerHistorial(usuario.nombre);
      setHistorial(histData.historial || []);

      // Cargar archivos personales para contar cuántos tiene
      const filesData = await api.obtenerArchivos(usuario.nombre, "personal");
      const filesList = filesData.files || filesData || [];
      setArchivosCount(filesList.length);

      const espacioData = await api.obtenerEspacioUsado();
      if (espacioData) {
        setEspacio({ usado: espacioData.usado_bytes, limite: espacioData.limite_bytes });
      }
    } catch (error) {
      console.error("Error al cargar datos del perfil:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleEliminarHistorial = async (id) => {
    try {
      await api.eliminarHistorial(id, usuario.nombre);
      setHistorial(prev => prev.filter(reg => reg.id !== id));
      alerta.exito("Eliminado", "El registro ha sido borrado de tu historial.");
    } catch (error) {
      alerta.error("Error", "No se pudo eliminar el registro.");
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setUsuario(null);
    navigate('/login');
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (!passActual || !passNueva || !passNuevaConf) {
      alerta.error("Campos vacíos", "Por favor, completa todos los campos.");
      return;
    }
    if (passNueva.length < 6) {
      alerta.error("Contraseña muy corta", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passNueva !== passNuevaConf) {
      alerta.error("Error", "Las nuevas contraseñas no coinciden.");
      return;
    }
    try {
      await api.cambiarPasswordPerfil(usuario.email, passActual, passNueva);
      alerta.exito("Contraseña actualizada", "Tu contraseña ha sido cambiada correctamente.");
      setPassActual("");
      setPassNueva("");
      setPassNuevaConf("");
    } catch (err) {
      alerta.error("Error", err.message || "La contraseña actual es incorrecta.");
    }
  };

  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    if (palabraConfirmacion !== "ELIMINAR") {
      alerta.error("Confirmación incorrecta", "Debes escribir la palabra 'ELIMINAR' en mayúsculas.");
      return;
    }
    if (!passEliminar) {
      alerta.error("Contraseña requerida", "Por favor, ingresa tu contraseña para confirmar.");
      return;
    }
    try {
      await api.eliminarCuenta(usuario.email, passEliminar);
      alerta.exito("Cuenta eliminada", "Tu cuenta ha sido eliminada permanentemente.");
      localStorage.removeItem("token");
      setUsuario(null);
      navigate("/login");
    } catch (err) {
      alerta.error("Error", err.message || "La contraseña ingresada es incorrecta.");
    }
  };

  if (!usuario) return null;

  const getIniciales = (nombre) => {
    if (!nombre) return 'U';
    const nombreLimpio = nombre.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
    const partes = nombreLimpio.split(/\s+/).filter(Boolean);

    if (partes.length > 1) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    if (partes.length === 1) {
      return partes[0][0].toUpperCase();
    }
    return 'U';
  };

  const usadoMB = (espacio.usado / 1048576).toFixed(2);
  const limiteMB = (espacio.limite / 1048576).toFixed(2);
  const porcentajeUso = Math.min((espacio.usado / espacio.limite) * 100, 100).toFixed(1);

  return (
    <div className="perfil-container">

      {/* TARJETA DE PERFIL */}
      <div className="perfil-card">
        <div className="perfil-banner"></div>

        <div className="perfil-card-body">

          <div className="perfil-avatar">
            {getIniciales(usuario.nombre)}
          </div>

          <h2 className="perfil-name">
            {usuario.nombre}
          </h2>
          <p className="perfil-email">
            {usuario.email || "usuario@correo.com"}
          </p>

          <div className="perfil-badges">
            <span className="perfil-badge-rol">
              {usuario.perfil || usuario.rol || 'Estudiante Externo'}
            </span>

            {usuario.institucion && (
              <span className="perfil-badge-inst">
                {usuario.institucion}
              </span>
            )}
          </div>

          <div className="perfil-stats">
            <div className="perfil-stat-box">
              <h4 className="perfil-stat-value">
                {cargandoDatos ? <Skeleton height="28px" width="40px" style={{ margin: '0 auto' }} /> : historial.length}
              </h4>
              <p className="perfil-stat-label">Cálculos Guardados</p>
            </div>
            <div className="perfil-stat-box">
              <h4 className="perfil-stat-value">
                {cargandoDatos ? <Skeleton height="28px" width="40px" style={{ margin: '0 auto' }} /> : archivosCount}
              </h4>
              <p className="perfil-stat-label">Archivos Excel</p>
            </div>
          </div>

          {/* --- BARRA DE ALMACENAMIENTO MEJORADA --- */}
          <div id="tour-cuota" className="cuota-container">
            <div className="cuota-header">
              <div className="cuota-titulo">
                <span className="cuota-icono">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.9 7 2 7.9 2 9V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M2 11H22" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6 15H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Almacenamiento</span>
              </div>
              <span className={`cuota-porcentaje ${porcentajeUso > 90 ? 'cuota-critico' : porcentajeUso > 60 ? 'cuota-alerta' : ''}`}>
                {porcentajeUso}%
              </span>
            </div>

            <div className="cuota-barra-track">
              <div
                className={`cuota-barra-fill ${porcentajeUso > 90 ? 'fill-critico' : porcentajeUso > 60 ? 'fill-alerta' : 'fill-normal'}`}
                style={{ width: `${porcentajeUso}%` }}
              >
                <div className="cuota-barra-shine"></div>
              </div>
            </div>

            <div className="cuota-footer">
              <span className="cuota-usado">{usadoMB} MB usados</span>
              <span className="cuota-limite">de {limiteMB} MB</span>
            </div>

            {porcentajeUso > 90 && (
              <p className="cuota-warning-text">
                Estás por alcanzar tu límite de almacenamiento
              </p>
            )}
          </div>

          <hr className="perfil-divider" />

          <div className="perfil-actions">
            <button
              onClick={() => navigate('/calculadora')}
              className="btn-perfil btn-perfil-back"
            >
              Volver a la Calculadora
            </button>
            <button
              onClick={handleCerrarSesion}
              className="btn-perfil btn-perfil-logout"
            >
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>

      {/* --- SECCIÓN HISTORIAL DE CÁLCULOS --- */}
      <div className="perfil-card-secondary">
        <h3 className="perfil-section-title">
          <span>Mi Historial de Cálculos Recientes</span>
          <button
            onClick={() => navigate('/historial')}
            className="btn-perfil-link"
          >
            Ver Historial Completo
          </button>
        </h3>

        {cargandoDatos ? (
          <div className="perfil-table-container">
            <table className="perfil-table">
              <thead>
                <tr className="perfil-table-header-row">
                  <th className="perfil-th">Fecha / Hora</th>
                  <th className="perfil-th">Tipo de Cálculo</th>
                  <th className="perfil-th">Archivo Fuente</th>
                  <th className="perfil-th-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="perfil-table-row">
                    <td className="perfil-td">
                      <div className="perfil-date-cell">
                        <Skeleton height="16px" width="100px" style={{ marginBottom: '4px' }} />
                        <Skeleton height="12px" width="70px" />
                      </div>
                    </td>
                    <td className="perfil-td"><Skeleton height="22px" width="180px" borderRadius="12px" /></td>
                    <td className="perfil-td-muted"><Skeleton height="14px" width="120px" /></td>
                    <td className="perfil-td-center">
                      <div className="perfil-table-actions">
                        <Skeleton height="28px" width="70px" borderRadius="4px" />
                        <Skeleton height="28px" width="70px" borderRadius="4px" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : historial.length === 0 ? (
          <p className="perfil-text-info-center">
            No tienes cálculos guardados todavía. Realiza un análisis en la calculadora para guardarlo.
          </p>
        ) : (
          <div className="perfil-table-container">
            <table className="perfil-table">
              <thead>
                <tr className="perfil-table-header-row">
                  <th className="perfil-th">Fecha / Hora</th>
                  <th className="perfil-th">Tipo de Cálculo</th>
                  <th className="perfil-th">Archivo Fuente</th>
                  <th className="perfil-th-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historial.slice(0, 5).map((reg, index) => (
                  <tr key={reg.id} className="perfil-table-row">
                    <td className="perfil-td" data-label="Fecha / Hora">
                      <div className="perfil-date-cell">
                        <strong>{reg.fecha}</strong>
                        <small className="perfil-small-text">{reg.hora}</small>
                      </div>
                    </td>
                    <td className="perfil-td" data-label="Tipo de Cálculo">
                      <span className="perfil-calc-badge">
                        {reg.calculo.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="perfil-td-muted" data-label="Archivo Fuente">
                      {reg.archivo_origen}
                    </td>
                    <td className="perfil-td-center" data-label="Acciones">
                      <div className="perfil-table-actions">
                        <button
                          onClick={() => {
                            const datosBrutos = reg.snapshot || reg.resultados_json;
                            const snapshotListo = typeof datosBrutos === "string" ? JSON.parse(datosBrutos) : datosBrutos;
                            navigate("/calculadora", {
                              state: {
                                archivoReabrir: reg.archivo_origen,
                                calculoReabrir: reg.calculo,
                                snapshot: snapshotListo,
                              },
                            });
                          }}
                          className="btn-reabrir"
                        >
                          Reabrir
                        </button>
                        <button
                          onClick={() => handleEliminarHistorial(reg.id)}
                          className="btn-eliminar-registro"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historial.length > 5 && (
              <p className="perfil-footer-notice">
                Mostrando los 5 cálculos más recientes. Para ver la lista completa haz clic en
                <span onClick={() => navigate('/historial')} className="perfil-notice-link">Ver Historial Completo</span>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN DE SEGURIDAD Y CONFIGURACIÓN */}
      <div className="grafico-card perfil-card-secondary">
        <h3 className="perfil-section-title">
          Seguridad y Contraseña
        </h3>

        <form onSubmit={handleCambiarPassword} className="perfil-form">
          <div className="perfil-form-group">
            <label className="etiqueta">Contraseña Actual</label>
            <input
              type="password"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              placeholder="Contraseña actual"
              className="perfil-input"
              required
            />
          </div>

          <div className="perfil-form-row">
            <div className="perfil-form-col">
              <label className="etiqueta">Nueva Contraseña (mínimo 6 caracteres)</label>
              <input
                type="password"
                value={passNueva}
                onChange={(e) => setPassNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`perfil-input ${isNuevaPasswordTooShort ? 'input-error' : ''}`}
                required
              />
              {isNuevaPasswordTooShort && (
                <span className="perfil-input-error-text">
                  Debe tener al menos 6 caracteres.
                </span>
              )}
            </div>
            <div className="perfil-form-col">
              <label className="etiqueta">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={passNuevaConf}
                onChange={(e) => setPassNuevaConf(e.target.value)}
                placeholder="Repite nueva contraseña"
                className={`perfil-input ${!isNuevaPasswordMatch && passNuevaConf !== "" ? 'input-error' : ''}`}
                required
              />
              {!isNuevaPasswordMatch && passNuevaConf !== "" && (
                <span className="perfil-input-error-text">
                  Las contraseñas no coinciden.
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-perfil"
          >
            Actualizar Contraseña
          </button>
        </form>
      </div>

      {/* SECCIÓN DE DARSE DE BAJA */}
      <div className="grafico-card perfil-card-danger">
        <h3 className="perfil-danger-title">
          Zona de Peligro: Darse de Baja
        </h3>
        <p className="perfil-danger-desc">
          Al darse de baja, se eliminará tu cuenta y todos tus datos (archivos guardados, historial de cálculos, clases) de forma permanente del sistema. Esta acción no se puede deshacer.
        </p>

        {!mostrarConfirmarEliminar ? (
          <button
            onClick={() => setMostrarConfirmarEliminar(true)}
            className="btn-danger-perfil"
          >
            Eliminar Cuenta
          </button>
        ) : (
          <form onSubmit={handleEliminarCuenta} className="perfil-form-danger-confirm">
            <p className="perfil-danger-warning-title">
              Confirmación de Seguridad requerida:
            </p>

            <div className="perfil-form-group">
              <label className="etiqueta">
                Escribe la palabra <strong>ELIMINAR</strong> en mayúsculas:
              </label>
              <input
                type="text"
                value={palabraConfirmacion}
                onChange={(e) => setPalabraConfirmacion(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="perfil-input input-error"
                required
              />
            </div>

            <div className="perfil-form-group">
              <label className="etiqueta">
                Confirma ingresando tu contraseña actual:
              </label>
              <input
                type="password"
                value={passEliminar}
                onChange={(e) => setPassEliminar(e.target.value)}
                placeholder="Tu contraseña"
                className="perfil-input"
                required
              />
            </div>

            <div className="perfil-btn-group">
              <button
                type="submit"
                className="btn-danger-confirm"
              >
                Confirmar Borrado de Cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarConfirmarEliminar(false);
                  setPalabraConfirmacion("");
                  setPassEliminar("");
                }}
                className="btn-cancel-confirm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}