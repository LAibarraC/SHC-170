import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/components/SelectorFecha.css";
import { useNavigate } from "react-router-dom";
import { useData } from "../../components/Gestion_Datos/DataContext";
import { alerta } from "../../utils/Notificaciones";
import api, { BASE_URL } from "../../services/api";
import qrApi from "../../services/qrApi";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import escudoAdmin from "../../assets/images/escudoAdmin.png";
import CentroControlCurso from "../qr/CentroControlCurso";
import EscanerQR from "../qr/EscanerQR";
import { IconoQr, CierreX } from "../../ui/iconos";

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

export default function Grupos() {
  const { usuario } = useData();
  const navigate = useNavigate();

  const iniciarTour = () => {
    const esEstudiante = usuario.rol === "Estudiante";
    const tourSteps = esEstudiante ? [
      {
        element: '#tour-matriculacion-seccion',
        popover: {
          title: 'Matricularse a un Curso',
          description: 'Haz clic en este botón para abrir la ventana y registrarte en tu clase usando el código de tu docente.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#tour-clases-activas',
        popover: {
          title: 'Materias/Cursos',
          description: 'Aquí se listarán todas las materias en las que te has matriculado exitosamente.',
          side: "top",
          align: 'start'
        }
      }
    ] : [
      {
        element: '#tour-titulo-cursos',
        popover: {
          title: 'Gestión Académica',
          description: '¡Bienvenido al panel docente! Aquí puedes administrar tus clases y el material de estudio para tus alumnos.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#tour-btn-crear-curso',
        popover: {
          title: 'Crear una Clase',
          description: 'Crea un nuevo grupo ingresando el nombre de la materia y fijando una fecha límite de matriculación opcional.',
          side: "left",
          align: 'center'
        }
      },
      {
        element: '#tour-lista-cursos',
        popover: {
          title: 'Tus Cursos Activos',
          description: 'En esta sección se muestran todas las clases que tienes a tu cargo actualmente.',
          side: "top",
          align: 'start'
        }
      }
    ];

    if (!esEstudiante && document.querySelector('.tour-curso-codigo')) {
      tourSteps.push({
        element: '.tour-curso-codigo',
        popover: {
          title: 'Código de Acceso',
          description: 'Este es el código único y seguro autogenerado. Compártelo con tus estudiantes para que puedan matricularse.',
          side: "right",
          align: 'center'
        }
      });
    }

    if (!esEstudiante && document.querySelector('.tour-curso-gestionar')) {
      tourSteps.push({
        element: '.tour-curso-gestionar',
        popover: {
          title: 'Administrar Clase',
          description: 'Usa este botón para cambiar el nombre del curso, modificar la fecha límite de matrícula o ver estadísticas del grupo.',
          side: "bottom",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-curso-subir')) {
      tourSteps.push({
        element: '.tour-curso-subir',
        popover: {
          title: 'Cargar Material Excel',
          description: esEstudiante
            ? 'Accede al gestor de archivos para descargar o visualizar los libros de trabajo compartidos por tu profesor.'
            : 'Accede al gestor de archivos para subir bases de datos de Excel que tus estudiantes usarán en sus análisis.',
          side: "bottom",
          align: 'center'
        }
      });
    }

    if (!esEstudiante && document.querySelector('.tour-curso-eliminar')) {
      tourSteps.push({
        element: '.tour-curso-eliminar',
        popover: {
          title: 'Eliminar Materia',
          description: 'Elimina de forma permanente el curso del sistema. Se te pedirá ingresar la confirmación "ELIMINAR" para evitar errores.',
          side: "top",
          align: 'center'
        }
      });
    }

    if (esEstudiante && document.querySelector('.tour-ir-material')) {
      tourSteps.push({
        element: '.tour-ir-material',
        popover: {
          title: 'Ir a los Archivos',
          description: 'Abre directamente el material de estudio y los libros de datos de esta asignatura para empezar a trabajar.',
          side: "bottom",
          align: 'center'
        }
      });
    }

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      steps: tourSteps
    });
    driverObj.drive();
  };

  // Estados vacíos (se llenarán desde la Base de Datos)
  const [misCursos, setMisCursos] = useState([]);
  const [cursosInscritos, setCursosInscritos] = useState([]);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [fechaLimiteMatriculacion, setFechaLimiteMatriculacion] = useState("");
  const [hoveredCursoId, setHoveredCursoId] = useState(null);

  // Estados para la eliminación de cursos
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  const [palabraConfirmar, setPalabraConfirmar] = useState("");

  // NUEVOS ESTADOS PARA ESTUDIANTE
  const [mostrarModalMatricular, setMostrarModalMatricular] = useState(false); // <-- Nuevo estado para el modal de estudiante
  const [mostrarModalDesmatricular, setMostrarModalDesmatricular] = useState(false);
  const [cursoADesmatricular, setCursoADesmatricular] = useState(null);
  const [procesandoUnion, setProcesandoUnion] = useState(false);
  const [escanerActivo, setEscanerActivo] = useState(false);

  // Estados del Centro de Control del Curso
  const [mostrarCentroControl, setMostrarCentroControl] = useState(false);
  const [cursoParaGestionar, setCursoParaGestionar] = useState(null);
  const [qrsActivos, setQrsActivos] = useState({}); // { clase_id: qrObject }

  // --- ESTADOS PARA BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Cantidad de cursos por página (ideal para diseño en grid)

  // Extraemos el correo con seguridad
  const correoUsuario = usuario?.email || usuario?.id;

  if (!usuario) {
    navigate("/login");
    return null;
  }

  const esAdmin = usuario.rol === "Administrador" || usuario.isAdmin === true;
  const esDocente = usuario.rol === "Docente";
  const esEstudiante = usuario.rol === "Estudiante";

  // 1. CARGAR DATOS DESDE MYSQL AL ABRIR LA PÁGINA
  const cargarCursos = async () => {
    try {
      if (esDocente || esAdmin) {
        const res = await fetch(`${BASE_URL}/mis_clases/${correoUsuario}`);
        if (res.ok) {
          const data = await res.json();
          setMisCursos(data);
          setCursoParaGestionar((prev) => {
            if (!prev) return null;
            const updated = data.find((c) => c.id === prev.id);
            return updated ? { ...prev, ...updated } : prev;
          });
        } else {
          console.error("Error loading docente classes:", res.status, res.statusText);
        }
      } else {
        const res = await fetch(`${BASE_URL}/mis_inscripciones/${correoUsuario}`);
        if (res.ok) {
          const data = await res.json();
          setCursosInscritos(data);
        } else {
          console.error("Error loading student classes:", res.status, res.statusText);
        }
      }
    } catch (error) {
      console.error("Error cargando cursos:", error);
    }
  };

  // 🆕 CARGAR QRs ACTIVOS PARA LOS CURSOS DEL DOCENTE
  const cargarQRsActivos = async () => {
    if (!esDocente && !esAdmin) return; // Solo para docentes
    try {
      const listaQRs = await qrApi.listarMisQRs();
      const qrsPorClase = {};
      (listaQRs || []).forEach((qr) => {
        // Mostrar el QR activo de la clase; si no existe, conservar el más
        // reciente para que el docente pueda gestionar el histórico.
        const anterior = qrsPorClase[qr.clase_id];
        const debeReemplazar =
          !anterior ||
          (qr.activo && !anterior.activo) ||
          (qr.activo === anterior.activo &&
            new Date(qr.fecha_creacion) > new Date(anterior.fecha_creacion));
        if (debeReemplazar) {
          qrsPorClase[qr.clase_id] = qr;
        }
      });
      setQrsActivos(qrsPorClase);
    } catch (error) {
      console.error("Error cargando QRs activos:", error);
    }
  };

  // 🆕 HELPER: Obtener QR activo para una clase
  const obtenerQRActivoDeClase = (claseId) => {
    return qrsActivos[claseId] || null;
  };

  // CALLBACK: sincronizar el estado persistido después de cerrar o habilitar.
  const handleQRDesactivado = async () => {
    await cargarCursos();
    await cargarQRsActivos();
  };

  useEffect(() => {
    console.log("=== GRUPOS PAGE LOADED ===");
    console.log("BASE_URL:", BASE_URL);
    console.log("Usuario:", usuario);
    console.log("Correo:", correoUsuario);

    // Verificar conexión al servidor
    const verificarConexion = async () => {
      try {
        console.log("Verificando conexión a:", `${BASE_URL}/health`);
        const res = await fetch(`${BASE_URL}/health`, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });
        console.log("Health check:", res.status, res.statusText);
      } catch (error) {
        console.error("✗ NO PUEDE CONECTARSE AL SERVIDOR");
        console.error("Error:", error.message);
        alerta.error("Servidor no disponible", `No se puede conectar a ${BASE_URL}. Verifica que el servidor esté corriendo.`);
      }
    };

    const cargarTodo = async () => {
      await cargarCursos();
      // Cargar QRs activos después de cargar los cursos
      await cargarQRsActivos();
    };

    cargarTodo();
    verificarConexion();
  }, [usuario]);

  // --- LÓGICA DE BÚSQUEDA Y PAGINACIÓN ---
  const listaBase = (esDocente || esAdmin) ? misCursos : cursosInscritos;

  const filteredCursos = listaBase.filter((curso) => {
    const nombreMatch = curso.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const codigoMatch = curso.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    return nombreMatch || codigoMatch;
  });

  const totalPages = Math.ceil(filteredCursos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCursos = filteredCursos.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Volver a la página 1 al buscar
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCursos.length, currentPage, totalPages]);


  // --- LÓGICA DEL DOCENTE: Crear curso en la BD ---
  const handleCrearCurso = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      alerta.error("Campos vacíos", "Por favor ingresa el nombre del curso.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/crear_clase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          docente_email: correoUsuario,
          fecha_limite_matriculacion: fechaLimiteMatriculacion || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        alerta.success("Curso creado", `El código para tus alumnos es: ${data.codigo_acceso}`);
        setNuevoNombre("");
        setFechaLimiteMatriculacion("");
        setMostrarModal(false);
        await cargarCursos(); // Recargamos la lista desde la BD
        await cargarQRsActivos(); // Recargamos los QRs activos inmediatamente
      } else {
        alerta.error("Error", data.error || "No se pudo crear la clase.");
      }
    } catch (error) {
      alerta.error("Error de conexión", "No hay respuesta del servidor.");
    }
  };

  // El botón Gestionar curso abre el Centro de Control del Curso.
  const handleOpenGestionar = (curso) => {
    setCursoParaGestionar(curso);
    setMostrarCentroControl(true);
  };

  // --- LÓGICA DEL DOCENTE/ADMIN: Eliminar curso (Seguro) ---
  const handleOpenEliminar = (curso) => {
    setCursoAEliminar(curso);
    setPalabraConfirmar("");
    setMostrarModalEliminar(true);
  };

  const handleConfirmarEliminar = async (e) => {
    e.preventDefault();
    if (palabraConfirmar !== "ELIMINAR") {
      alerta.error("Confirmación incorrecta", "Debes escribir exactamente la palabra ELIMINAR.");
      return;
    }

    try {
      const res = await api.eliminarClase(cursoAEliminar.id, correoUsuario);
      alerta.success("Curso eliminado", res.message || "El curso ha sido eliminado permanentemente.");
      setMostrarModalEliminar(false);
      setCursoAEliminar(null);
      cargarCursos(); // Recargar la lista desde la BD
    } catch (error) {
      alerta.error("No se pudo eliminar", error.message || "Ocurrió un error al intentar eliminar el curso.");
    }
  };

  // --- LÓGICA DEL ESTUDIANTE: Unirse a curso en la BD (CORREGIDA) ---

  /**
   * Extrae el token limpio a partir del texto leído por el escáner QR
   * (cámara o archivo). Acepta:
   *   - token puro (ej. "abc123")
   *   - URL completa con token al final (ej. https://app.com/matricular/abc123)
   *   - hash router (ej. https://app.com/#/matricular/abc123)
   *   - URLs con query params (ej. https://app.com/matricular/abc123?foo=bar)
   */
  const extraerTokenDeQR = (texto) => {
    let crudo = (texto || "").trim();
    if (!crudo) return "";

    let candidato = crudo;

    // 1) Caso hash router: #/matricular/TOKEN
    if (candidato.includes("#")) {
      const despuesDelHash = candidato.split("#").pop();
      const partes = despuesDelHash.split("/").filter(Boolean);
      if (partes.length > 0) candidato = partes[partes.length - 1];
    } else if (candidato.includes("/")) {
      // 2) URL con paths: https://.../matricular/TOKEN
      const sinQuery = candidato.split("?")[0];
      const partes = sinQuery.split("/").filter(Boolean);
      candidato = partes[partes.length - 1] || candidato;
    }

    // 3) Limpiar query/fragment sobrante por si quedó pegado.
    return (candidato || "").split(/[?#]/)[0].trim();
  };

  const redirigirDespuesDelToast = () => {
    setTimeout(() => navigate("/mis-cursos", { replace: true }), 1200);
  };

  // Handler único para matrícula manual y QR dentro de la plataforma.
  const procesarMatricula = async (tokenOCodigo, esQR = false) => {
    const valor = (tokenOCodigo || "").trim();

    if (!valor) {
      alerta.error("Campo vacío", "Ingresa el código de matriculación del curso.");
      return;
    }

    if (procesandoUnion) return;
    setProcesandoUnion(true);

    try {
      let data = {};
      let res;

      if (esQR) {
        data = await qrApi.matricularPorQR(valor);
        res = { ok: true, status: 200 };
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          res = await fetch(`${BASE_URL}/unirse_clase`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              codigo_acceso: valor.toUpperCase(),
              estudiante_email: correoUsuario,
            }),
            signal: controller.signal,
          });
          data = await res.json().catch(() => ({}));
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const mensajeError = data.error || data.detail || "No fue posible completar la matrícula.";

      if (res.ok) {
        setCodigoBusqueda("");
        setMostrarModalMatricular(false);
        alerta.success(
          "¡Inscripción Exitosa!",
          `Te has unido a ${data.clase_nombre || "la materia"} exitosamente`
        );
        redirigirDespuesDelToast();
        await cargarCursos();
      } else if (res.status === 409) {
        const errorYaMatriculado = new Error(mensajeError);
        errorYaMatriculado.status = 409;
        throw errorYaMatriculado;
      } else {
        alerta.error("No se pudo completar la matrícula", mensajeError);
      }
    } catch (error) {
      if (error.status === 409) {
        setMostrarModalMatricular(false);
        alerta.warning("Ya Matriculado", "Ya te encuentras matriculado en esta asignatura.");
        redirigirDespuesDelToast();
      } else if (error.name === "AbortError") {
        alerta.error("Error de matrícula", "El servidor tardó demasiado en responder. Intenta nuevamente.");
      } else {
        alerta.error(
          "No se pudo completar la matrícula",
          error.message || "No se pudo conectar con el servidor."
        );
      }
    } finally {
      setProcesandoUnion(false);
    }
  };

  // --- NUEVO: Abrir modal de desmatriculación (estudiante) ---
  const handleOpenDesmatricular = (curso) => {
    setCursoADesmatricular(curso);
    setMostrarModalDesmatricular(true);
  };

  // --- NUEVO: Confirmar desmatriculación ---
  const handleConfirmarDesmatricular = async () => {
    if (!cursoADesmatricular) return;

    try {
      const res = await api.abandonarClase(cursoADesmatricular.id, correoUsuario);
      alerta.success("Desmatriculado", res.message || "Has abandonado el curso correctamente.");
      setMostrarModalDesmatricular(false);
      setCursoADesmatricular(null);
      await cargarCursos();
    } catch (error) {
      alerta.error("No se pudo desmatricular", error.message || "Ocurrió un error al abandonar el curso.");
    }
  };

  // --- COMPONENTE REUTILIZABLE DE PAGINACIÓN ---
  const ControlesPaginacion = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "25px", paddingBottom: "20px" }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #d1d5db)",
            background: currentPage === 1 ? "var(--bg-input, #f3f4f6)" : "transparent",
            color: currentPage === 1 ? "#9ca3af" : "var(--text-main, #333)",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "0.9rem",
            transition: "all 0.2s"
          }}
        >
          Anterior
        </button>

        <span style={{ fontSize: "0.9rem", color: "var(--text-muted, #6b7280)", fontWeight: "bold" }}>
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #d1d5db)",
            background: currentPage === totalPages ? "var(--bg-input, #f3f4f6)" : "transparent",
            color: currentPage === totalPages ? "#9ca3af" : "var(--text-main, #333)",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "0.9rem",
            transition: "all 0.2s"
          }}
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ position: "relative" }}>
      {/* Marca de agua de fondo */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "450px",
          height: "450px",
          backgroundImage: `url(${escudoAdmin})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.04,
          zIndex: 0,
          pointerEvents: "none"
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
        <button
          onClick={iniciarTour}
          className="guia-rapida-flotante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="guia-rapida-flotante-texto">Guía Rápida</span>
        </button>
      </div>

      {/* ========================================= */}
      {/* VISTA DEL DOCENTE / ADMINISTRADOR         */}
      {/* ========================================= */}
      {(esDocente || esAdmin) && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h2 id="tour-titulo-cursos" style={{ color: "var(--primary-color)", margin: 0, fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}>
              {esAdmin ? "Todos los Cursos del Sistema (Vista Global)" : "Mis Cursos Creados"}
            </h2>
            <button
              id="tour-btn-crear-curso"
              onClick={() => setMostrarModal(true)}
              style={{ background: "var(--accent-color)", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "background 0.3s", textAlign: "center" }}
            >
              + Crear Nuevo Curso
            </button>
          </div>

          {/* BUSCADOR DOCENTE */}
          {(listaBase.length > 0 || searchTerm !== "") && (
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Buscar curso por nombre o código..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", outline: "none", fontSize: "0.95rem" }}
              />
            </div>
          )}

          {/* ESTADO VACÍO Y LISTA */}
          {filteredCursos.length === 0 && searchTerm !== "" ? (
            <div style={{ padding: "30px", textAlign: "center", background: "var(--bg-main)", borderRadius: "8px", color: "var(--text-muted)" }}>
              No se encontraron cursos que coincidan con "{searchTerm}".
            </div>
          ) : (
            <>
              <div id="tour-lista-cursos" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {currentCursos.map((curso) => {
                  const puedeGestionar = esAdmin || curso.docente_email === correoUsuario;
                  const qrDeCurso = obtenerQRActivoDeClase(curso.id);
                  const fechaVencida = Boolean(
                    curso.fecha_limite_matriculacion &&
                    curso.fecha_limite_matriculacion < new Date().toISOString().slice(0, 10)
                  );
                  const matriculaCerrada = curso.activa === false || fechaVencida;
                  const qrHabilitado = !matriculaCerrada && Boolean(
                    (curso.codigo || curso.codigo_acceso) && qrDeCurso && qrDeCurso.activo !== false
                  );
                  return (
                    <div key={curso.id} style={{ background: "var(--bg-card, white)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color, #eee)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <h3 style={{ margin: 0, color: "var(--text-main, #333)", lineHeight: 1.3, overflowWrap: "anywhere" }}>{curso.nombre}</h3>
                        {qrHabilitado && (
                          <span
                            title="Código QR habilitado"
                            aria-label="Código QR habilitado"
                            style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "8px", color: "var(--accent-color)", background: "color-mix(in srgb, var(--accent-color) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-color) 28%, transparent)" }}
                          >
                            <IconoQr width="17" height="17" />
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "0 0 5px 0", color: "var(--text-muted, #666)" }}>
                        <strong>Código de Matriculación:</strong>{" "}
                        <span
                          className="tour-curso-codigo"
                          style={{
                            color: matriculaCerrada ? "#dc2626" : "var(--accent-color)",
                            fontWeight: "bold",
                          }}
                        >
                          {curso.codigo || curso.codigo_acceso || "Sin código"}
                        </span>
                      </p>
                      {curso.fecha_limite_matriculacion && (
                        <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          <strong>Límite de Matrícula:</strong> {curso.fecha_limite_matriculacion}
                        </p>
                      )}
                      {curso.docente_nombre && (
                        <p style={{ margin: "5px 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          <strong>Docente:</strong> {curso.docente_nombre}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
                        {puedeGestionar && (
                          <button
                            onClick={() => handleOpenGestionar(curso)}
                            className="tour-curso-gestionar"
                            onMouseEnter={() => setHoveredCursoId(curso.id)}
                            onMouseLeave={() => setHoveredCursoId(null)}
                            style={{
                              flex: 1, padding: "8px", background: hoveredCursoId === curso.id ? "#374151" : "#4b5563", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", color: "#ffffff", transition: "background-color 0.2s"
                            }}
                          >
                            Gestionar curso
                          </button>
                        )}
                        <button
                          onClick={() => navigate("/archivos", { state: { cursoIdSeleccionado: curso.id } })}
                          className="tour-curso-subir"
                          style={{ flex: 1, padding: "8px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Subir Material
                        </button>
                      </div>

                      {puedeGestionar && (
                        <button
                          onClick={() => handleOpenEliminar(curso)}
                          className="tour-curso-eliminar"
                          style={{ width: "100%", padding: "8px", marginTop: "10px", background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", color: "#dc2626", transition: "all 0.2s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#ffffff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)"; e.currentTarget.style.color = "#dc2626"; }}
                        >
                          Eliminar Curso
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <ControlesPaginacion />
            </>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA DEL ESTUDIANTE                      */}
      {/* ========================================= */}
      {esEstudiante && (
        <div>
          <div id="tour-clases-activas" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h2 style={{ color: "#27ae60", margin: 0, fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}>Mis Clases Activas</h2>
            <button
              id="tour-matriculacion-seccion"
              onClick={() => setMostrarModalMatricular(true)}
              style={{ background: "#27ae60", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "background 0.3s", textAlign: "center" }}
            >
              + Matricularse
            </button>
          </div>

          {/* BUSCADOR ESTUDIANTE */}
          {(listaBase.length > 0 || searchTerm !== "") && (
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Buscar materia por nombre..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", outline: "none", fontSize: "0.95rem" }}
              />
            </div>
          )}

          {listaBase.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "var(--bg-main)", borderRadius: "8px", color: "var(--text-muted)" }}>
              Aún no estás inscrito en ninguna materia. ¡Haz clic en "+ Matricularse" para empezar!
            </div>
          ) : filteredCursos.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", background: "var(--bg-main)", borderRadius: "8px", color: "var(--text-muted)" }}>
              No se encontraron materias que coincidan con "{searchTerm}".
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {currentCursos.map((curso) => (
                  <div key={curso.id} style={{ background: "var(--bg-card, white)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color, #eee)", borderTop: "4px solid #27ae60" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--text-main, #333)" }}>{curso.nombre}</h3>

                    {/* INFORMACIÓN ADICIONAL DEL CURSO */}
                    <div style={{ marginBottom: "10px", fontSize: "0.9rem", color: "var(--text-muted, #666)" }}>
                      {curso.codigo && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>Código:</strong> {curso.codigo}
                        </p>
                      )}
                      {curso.docente_nombre && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>Docente:</strong> {curso.docente_nombre}
                        </p>
                      )}
                      {curso.fecha_limite_matriculacion && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>Límite de matrícula:</strong> {curso.fecha_limite_matriculacion}
                        </p>
                      )}
                      {curso.fecha_inscripcion && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>Inscrito el:</strong> {curso.fecha_inscripcion}
                        </p>
                      )}
                    </div>

                    {/* BOTONES LADO A LADO */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                      <button
                        onClick={() => navigate("/archivos", { state: { cursoIdSeleccionado: curso.id } })}
                        className="tour-ir-material"
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "transparent",
                          border: "1px solid #27ae60",
                          color: "#27ae60",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#27ae60"; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#27ae60"; }}
                      >
                        Ir a Material
                      </button>

                      <button
                        onClick={() => handleOpenDesmatricular(curso)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "rgba(220, 38, 38, 0.1)",
                          border: "1px solid #dc2626",
                          color: "#dc2626",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#ffffff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)"; e.currentTarget.style.color = "#dc2626"; }}
                      >
                        Desmatricular
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <ControlesPaginacion />
            </>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* NUEVO MODAL: MATRICULARSE (ESTUDIANTE)    */}
      {/* ========================================= */}
      {mostrarModalMatricular && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "16px" }}>
          <div style={{ background: "var(--bg-card)", padding: "clamp(20px, 4vw, 30px)", borderRadius: "10px", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", boxSizing: "border-box" }}>
            <h2 style={{ marginTop: 0, color: "#27ae60" }}>Matricularse a un Curso</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
              Introduce el código único de matriculación proporcionado por tu docente o
              escanea el código QR con tu cámara.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>
                Código de Matriculación:
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                <input
                  type="text"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && procesarMatricula(codigoBusqueda)}
                  placeholder="Ej. MAT-205..."
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-main)",
                    textTransform: "uppercase",
                    boxSizing: "border-box",
                  }}
                  disabled={procesandoUnion}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setEscanerActivo((v) => !v)}
                  disabled={procesandoUnion}
                  title={escanerActivo ? "Cerrar cámara" : "Escanear código QR"}
                  aria-label="Escanear código QR"
                  style={{
                    flexShrink: 0,
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: escanerActivo ? "#dc2626" : "#27ae60", // Color sólido verde
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: procesandoUnion ? "not-allowed" : "pointer",
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {escanerActivo ? (
                    <CierreX width="22" height="22" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                  ) : (
                    <IconoQr width="22" height="22" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Escáner de QR — se monta dentro del modal cuando está activo */}
            <EscanerQR
              activo={escanerActivo}
              onDeteccion={(texto) => {
                setEscanerActivo(false);
                const tokenLimpio = extraerTokenDeQR(texto);
                if (!tokenLimpio) {
                  alerta.error(
                    "QR inválido",
                    "No se detectó un código de matriculación en la lectura."
                  );
                  return;
                }
                procesarMatricula(tokenLimpio, true);
              }}
              onErrorCamara={(mensaje) => alerta.warning("Cámara no disponible", mensaje)}
              onErrorArchivo={(mensaje) => alerta.warning("No se pudo leer la imagen", mensaje)}
              onCerrar={() => setEscanerActivo(false)}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: escanerActivo ? "16px" : 0, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setEscanerActivo(false);
                  setMostrarModalMatricular(false);
                }}
                style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                disabled={procesandoUnion}
              >
                Cancelar
              </button>
              <button
                onClick={() => procesarMatricula(codigoBusqueda)}
                disabled={procesandoUnion}
                style={{
                  background: procesandoUnion ? "#95a5a6" : "#27ae60",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: procesandoUnion ? "not-allowed" : "pointer",
                  fontWeight: "bold"
                }}
              >
                {procesandoUnion ? "Procesando..." : "Unirse al Curso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VENTANA MODAL PARA CREAR CURSO            */}
      {/* ========================================= */}
      {mostrarModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", border: "1px solid var(--border-color)" }}>
            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>Crear Nuevo Curso</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
              El código de acceso se generará automáticamente de forma segura.
            </p>

            <form onSubmit={handleCrearCurso}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>Nombre de la Materia:</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Estadística Empresarial I"
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid var(--border-color)", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-main)" }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>Fecha Límite de Matriculación (Opcional):</label>
                <DatePicker
                  selected={fechaIsoADate(fechaLimiteMatriculacion)}
                  onChange={(fecha) => setFechaLimiteMatriculacion(dateAFechaIso(fecha))}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="dd/mm/aaaa"
                  isClearable
                  className="selector-fecha"
                  wrapperClassName="selector-fecha-wrapper"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: "10px 20px", background: "var(--accent-color)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                  Generar Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VENTANA MODAL PARA CONFIRMAR ELIMINACIÓN  */}
      {/* ========================================= */}
      {mostrarModalEliminar && cursoAEliminar && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
            <h2 style={{ marginTop: 0, color: "#dc2626" }}>Eliminar Curso</h2>
            <p style={{ color: "var(--text-main)", fontSize: "0.95rem", marginBottom: "15px" }}>
              ¿Estás seguro de que deseas eliminar permanentemente el curso <strong>{cursoAEliminar.nombre}</strong>?
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Esta acción borrará todas las inscripciones, archivos compartidos e historial de cálculos asociados a esta clase. Esta acción no se puede deshacer.
            </p>

            <form onSubmit={handleConfirmarEliminar}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)", fontSize: "0.9rem" }}>
                  Escribe la palabra <strong>ELIMINAR</strong> en mayúsculas:
                </label>
                <input
                  type="text"
                  value={palabraConfirmar}
                  onChange={(e) => setPalabraConfirmar(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #dc2626", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text-main)" }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalEliminar(false);
                    setCursoAEliminar(null);
                  }}
                  style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Confirmar Eliminación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* NUEVO MODAL: DESMATRICULARSE (ESTUDIANTE) */}
      {/* ========================================= */}
      {mostrarModalDesmatricular && cursoADesmatricular && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
            <h2 style={{ marginTop: 0, color: "#dc2626" }}>Desmatricularse del Curso</h2>
            <p style={{ color: "var(--text-main)", fontSize: "0.95rem", marginBottom: "15px" }}>
              ¿Seguro que deseas abandonar el curso <strong>{cursoADesmatricular.nombre}</strong>?
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Perderás acceso al material compartido y al historial de actividades de esta clase. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setMostrarModalDesmatricular(false);
                  setCursoADesmatricular(null);
                }}
                style={{ padding: "10px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarDesmatricular}
                style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Sí, Desmatricular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* CENTRO DE CONTROL DEL CURSO (DOCENTE / ADMIN) */}
      {/* ========================================= */}
      {mostrarCentroControl && cursoParaGestionar && (
        <CentroControlCurso
          curso={cursoParaGestionar}
          qrActivo={obtenerQRActivoDeClase(cursoParaGestionar.id)}
          onClose={async () => {
            setMostrarCentroControl(false);
            setCursoParaGestionar(null);
            // Recargar QRs activos al cerrar para sincronizar la UI
            await cargarQRsActivos();
          }}
          onDesactivar={handleQRDesactivado}
          onCursoActualizado={(actualizado) => {
            if (actualizado) {
              setCursoParaGestionar((prev) => (prev ? { ...prev, ...actualizado } : actualizado));
            }
            cargarCursos();
          }}
        />
      )}
    </div>
  );
}