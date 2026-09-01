import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../../components/Gestion_Datos/DataContext";
import { alerta } from "../../utils/Notificaciones";
import qrApi from "../../services/qrApi";
import { CierreX, Regenerar, Desactivar, Graduacion } from "../../ui/iconos";

/**
 * Pantalla a la que llega el estudiante tras escanear el QR del docente.
 *
 * Ruta: /matricular/:token
 *
 * Comportamiento:
 *   1. Lee el token de la URL.
 *   2. Consulta la información pública del QR (GET /api/qr/info/{token}).
 *      Esto se hace SIEMPRE (incluso sin sesión) para mostrar al estudiante
 *      si el QR es válido, expirado, desactivado o inexistente.
 *   3. Si el QR no es válido, muestra el error y bloquea la matrícula.
 *   4. Si no hay sesión, redirige al Login conservando la URL completa
 *      `?redirect=/matricular/<token>` para que tras autenticarse vuelva aquí.
 *   5. Si hay sesión pero el usuario no es Estudiante, bloquea.
 *   6. Si todo es válido, muestra un botón "Matricularme" que llama a
 *      POST /api/qr/matricular con el token. El backend identifica al
 *      estudiante desde la sesión (no se envía estudiante_id).
 *   7. Tras matricularse muestra confirmación. Si el estudiante ya estaba
 *      inscrito (409 del backend), se muestra un estado informativo en lugar
 *      del formulario.
 */
export default function Matricular() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { usuario } = useData();

  // Estados de la pantalla
  const [info, setInfo] = useState(null);
  const [cargandoInfo, setCargandoInfo] = useState(true);
  const [matriculando, setMatriculando] = useState(false);
  const [redirigiendoRol, setRedirigiendoRol] = useState(false);
  const redireccionPendiente = useRef(null);

  const redirigirDespuesDelToast = (ruta) => {
    redireccionPendiente.current = setTimeout(() => {
      navigate(ruta, { replace: true });
    }, 1200);
  };

  useEffect(() => () => {
    if (redireccionPendiente.current) clearTimeout(redireccionPendiente.current);
  }, []);

  // 1. Cargar información pública del QR
  useEffect(() => {
    if (!token) {
      setCargandoInfo(false);
      return;
    }
    const cargar = async () => {
      setCargandoInfo(true);
      try {
        const data = await qrApi.infoQR(token);
        setInfo(data);
      } catch (e) {
        setInfo({
          estado: "inexistente",
          mensaje: e.message || "No se pudo validar el código QR.",
        });
      } finally {
        setCargandoInfo(false);
      }
    };
    cargar();
  }, [token]);

  // 2. Si no hay sesión y el QR es válido, redirigir a Login preservando la URL.
  useEffect(() => {
    if (cargandoInfo) return;
    if (!usuario && info?.estado === "valido") {
      // encodeURIComponent es necesario porque el token puede tener caracteres especiales
      const redirect = encodeURIComponent(`/matricular/${token}`);
      navigate(`/login?redirect=${redirect}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoInfo, usuario, info]);

  // Los docentes no pueden matricularse desde un QR externo.
  useEffect(() => {
    if (cargandoInfo || info?.estado !== "valido" || usuario?.rol !== "Docente") return;

    setRedirigiendoRol(true);
    alerta.error(
      "Acción no permitida",
      "Esta funcionalidad es solo para estudiantes. Tu cuenta tiene rol de Docente."
    );
    redirigirDespuesDelToast("/grupos");
    // La función usa navigate y mantiene el retardo común del flujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoInfo, info, usuario]);

  const handleMatricular = async () => {
    if (!token) return;
    setMatriculando(true);
    try {
      const data = await qrApi.matricularPorQR(token);
      alerta.success(
        "¡Inscripción Exitosa!",
        `Te has unido a ${data.clase_nombre || "la materia"} exitosamente`
      );
      redirigirDespuesDelToast("/mis-cursos");
    } catch (e) {
      // Mapeo de mensajes amigables según el código de error
      const mensaje = e.message || "No fue posible completar la matrícula.";
      if (e.status === 409) {
        alerta.warning("Ya Matriculado", "Ya te encuentras matriculado en esta asignatura.");
        redirigirDespuesDelToast("/mis-cursos");
      } else if (e.status === 400) {
        alerta.warning("QR no disponible", mensaje);
      } else if (e.status === 403) {
        alerta.warning("Sin autorización", mensaje);
      } else {
        alerta.error("Error de matrícula", mensaje);
      }
    } finally {
      setMatriculando(false);
    }
  };

  // ────────────── Render: estados de carga / error ──────────────

  if (cargandoInfo) {
    return (
      <PantallaContenedor>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Spinner />
          <p style={{ color: "var(--text-muted)", marginTop: "15px" }}>
            Validando código QR…
          </p>
        </div>
      </PantallaContenedor>
    );
  }

  if (!info || info.estado === "inexistente") {
    return (
      <PantallaContenedor>
        <EstadoMensaje
          icono={<CierreX width="40" height="40" style={{ color: "#dc2626" }} />}
          titulo="Código QR no válido"
          mensaje={info?.mensaje || "El código QR no existe o no se pudo verificar."}
          color="#dc2626"
          navigate={navigate}
        />
      </PantallaContenedor>
    );
  }

  if (info.estado === "expirado") {
    return (
      <PantallaContenedor>
        <EstadoMensaje
          icono={<Regenerar width="40" height="40" style={{ color: "#f59e0b" }} />}
          titulo="QR expirado"
          mensaje="Este código QR ha expirado. Pide al docente que genere uno nuevo."
          color="#f59e0b"
          navigate={navigate}
          datosAdicionales={
            info.clase_nombre && (
              <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                <strong>Asignatura:</strong> {info.clase_nombre}
              </p>
            )
          }
        />
      </PantallaContenedor>
    );
  }

  if (info.estado === "desactivado") {
    return (
      <PantallaContenedor>
        <EstadoMensaje
          icono={<Desactivar width="40" height="40" style={{ color: "#6b7280" }} />}
          titulo="QR desactivado"
          mensaje="Este código QR fue desactivado por el docente y ya no permite nuevas matrículas."
          color="#6b7280"
          navigate={navigate}
          datosAdicionales={
            info.clase_nombre && (
              <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                <strong>Asignatura:</strong> {info.clase_nombre}
              </p>
            )
          }
        />
      </PantallaContenedor>
    );
  }

  // info.estado === "valido"
  if (!usuario) {
    // Mientras React ejecuta el navigate al login, mostramos un loader.
    return (
      <PantallaContenedor>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Spinner />
          <p style={{ color: "var(--text-muted)", marginTop: "15px" }}>
            Redirigiendo al inicio de sesión…
          </p>
        </div>
      </PantallaContenedor>
    );
  }

  if (usuario.rol === "Docente" && redirigiendoRol) {
    return (
      <PantallaContenedor>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Spinner />
          <p style={{ color: "var(--text-muted)", marginTop: "15px" }}>
            Redirigiendo al gestor de grupos…
          </p>
        </div>
      </PantallaContenedor>
    );
  }

  if (usuario.rol !== "Estudiante") {
    return (
      <PantallaContenedor>
        <EstadoMensaje
          icono={<CierreX width="40" height="40" style={{ color: "#dc2626" }} />}
          titulo="Acción no permitida"
          mensaje="Esta funcionalidad es solo para estudiantes."
          color="#dc2626"
          navigate={navigate}
        />
      </PantallaContenedor>
    );
  }

  // ────────────── Render: pantalla principal de matriculación ──────────────

  return (
    <PantallaContenedor>
      <div
        style={{
          padding: "clamp(20px, 4vw, 30px)",
          background: "var(--bg-card, white)",
          borderRadius: "10px",
          border: "1px solid var(--border-color, #eee)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <div style={{ lineHeight: 1, display: "flex", justifyContent: "center" }}>
          <Graduacion width="56" height="56" style={{ color: "var(--primary-color)" }} />
        </div>
        <h2
          style={{
            color: "var(--text-main)",
            margin: "10px 0 5px 0",
            fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
          }}
        >
          Matricúlate a
        </h2>
        <h1
          style={{
            color: "var(--primary-color)",
            margin: "0 0 15px 0",
            fontSize: "clamp(1.4rem, 5vw, 1.8rem)",
          }}
        >
          {info.clase_nombre || "la asignatura"}
        </h1>

        {info.docente_nombre && (
          <p style={{ color: "var(--text-muted)", margin: "5px 0" }}>
            Docente: <strong style={{ color: "var(--text-main)" }}>{info.docente_nombre}</strong>
          </p>
        )}

        {info.fecha_expiracion && (
          <p style={{ color: "var(--text-muted)", margin: "5px 0", fontSize: "0.9rem" }}>
            Válido hasta: <strong>{info.fecha_expiracion}</strong>
          </p>
        )}

        <div
          style={{
            margin: "20px auto",
            padding: "15px",
            background: "var(--bg-input, #f9fafb)",
            borderRadius: "6px",
            textAlign: "left",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ margin: "3px 0" }}>
            <strong style={{ color: "var(--text-main)" }}>Estudiante:</strong> {usuario.nombre}
          </p>
          <p style={{ margin: "3px 0" }}>
            <strong style={{ color: "var(--text-main)" }}>Correo:</strong> {usuario.email}
          </p>
        </div>

        <button
          onClick={handleMatricular}
          disabled={matriculando}
          style={{
            marginTop: "15px",
            padding: "14px 28px",
            background: matriculando ? "#9ca3af" : "var(--accent-color)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: matriculando ? "wait" : "pointer",
            fontWeight: "bold",
            fontSize: "1.05rem",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          {matriculando ? "Procesando…" : "Matricularme"}
        </button>

        <p
          style={{
            marginTop: "15px",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
          }}
        >
          Al confirmar, el docente será notificado y la asignatura aparecerá en tu lista de cursos.
        </p>
      </div>
    </PantallaContenedor>
  );
}

// ────────────── Sub-componentes ──────────────

function PantallaContenedor({ children }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "20px 16px",
        background: "var(--bg-main)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>{children}</div>
    </div>
  );
}

function EstadoMensaje({ icono, titulo, mensaje, color, datosAdicionales, navigate }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "30px 20px",
        background: "var(--bg-card, white)",
        borderRadius: "10px",
        border: "1px solid var(--border-color, #eee)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ lineHeight: 1, display: "flex", justifyContent: "center", marginBottom: "5px" }}>{icono}</div>
      <h2
        style={{
          color,
          marginTop: "15px",
          fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
        }}
      >
        {titulo}
      </h2>
      <p style={{ color: "var(--text-muted)", margin: "10px 0" }}>{mensaje}</p>
      {datosAdicionales}

      {navigate && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "25px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 18px",
              background: "var(--accent-color, #f59e0b)",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.95rem",
            }}
          >
            Volver al Inicio
          </button>
          <button
            onClick={() => navigate("/grupos")}
            style={{
              padding: "10px 18px",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              border: "1px solid var(--border-color, #ccc)",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.95rem",
            }}
          >
            Mis Cursos
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid var(--border-color, #eee)",
          borderTopColor: "var(--accent-color)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto",
        }}
      />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
}