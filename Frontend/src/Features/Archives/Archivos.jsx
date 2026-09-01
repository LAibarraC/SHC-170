import { useState, useEffect, useRef } from "react";
import ExcelViewer from "../../components/excel/ExcelViewer";
import ExcelUploader from "../../components/excel/ExcelUploader";
import ExcelContent from "../../components/excel/ExcelContent";

import { api, BASE_URL } from "../../services/api";

import { alerta } from "../../utils/Notificaciones";
import "../../styles/pages/Archivos.css";

import { useLocation, useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import escudoAdmin from "../../assets/images/escudoAdmin.png";

export default function Archivos({ usuario }) {
  const navigate = useNavigate();
  const [panelAbierto, setPanelAbierto] = useState(true);

  // Estados para Archivos Personales
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // 🆕 ESTADO PARA LA CUOTA DE ALMACENAMIENTO (Límite por defecto 10MB)
  const [espacio, setEspacio] = useState({ usado: 0, limite: 10 * 1024 * 1024 });

  const location = useLocation();
  const cursoInicial = location.state?.cursoIdSeleccionado
    ? String(location.state.cursoIdSeleccionado)
    : "";
  const [tabActiva, setTabActiva] = useState(cursoInicial ? "cursos" : "personales"); // 'personales' o 'cursos'
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const solicitudArchivos = useRef(0);

  const iniciarTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      steps: [
        {
          element: '#tour-titulo',
          popover: {
            title: 'Gestión de Archivos',
            description: '¡Bienvenido! Aquí puedes gestionar todos tus archivos personales y de cursos.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#tour-pestanas',
          popover: {
            title: 'Organización por Pestañas',
            description: 'Cambia entre "Mi Espacio" para tus archivos privados y "Mis Cursos" para el material académico.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#tour-subida',
          popover: {
            title: 'Subir Archivos',
            description: 'Arrastra tus archivos de Excel (.xlsx) o búscalos en tu equipo para cargarlos al sistema.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '#tour-visor',
          popover: {
            title: 'Explorador de Archivos',
            description: 'Aquí verás todos tus archivos. Puedes seleccionarlos para verlos o eliminarlos.',
            side: "top",
            align: 'start'
          }
        },
        {
          element: '#tour-vista-previa',
          popover: {
            title: 'Vista Previa del Excel',
            description: 'Al seleccionar un archivo, se desplegará una vista previa interactiva en esta sección.',
            side: "left",
            align: 'start'
          }
        },
        {
          element: '.boton-toggle-medio',
          popover: {
            title: 'Ocultar/Mostrar Panel',
            description: 'Haz clic aquí para ocultar o mostrar el panel lateral y tener más espacio para visualizar tu tabla de datos.',
            side: "right",
            align: 'center'
          }
        }
      ]
    });

    driverObj.drive();
  };

  const [cursoSeleccionado, setCursoSeleccionado] = useState(cursoInicial);
  const [misCursos, setMisCursos] = useState([]);

  useEffect(() => {
    if (location.state?.cursoIdSeleccionado) {
      navigate("/archivos", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const cargarCursos = async () => {
      if (!usuario) return;
      try {
        const correoUsuario = usuario.email || usuario.id;
        if (["Docente", "Administrador"].includes(usuario.rol)) {
          const res = await fetch(`${BASE_URL}/mis_clases/${correoUsuario}`);
          if (res.ok) setMisCursos(await res.json());
        } else {
          const res = await fetch(`${BASE_URL}/mis_inscripciones/${correoUsuario}`);
          if (res.ok) setMisCursos(await res.json());
        }
      } catch (error) {
        console.error("Error al cargar cursos para dropdown:", error);
      }
    };

    cargarCursos();
  }, [usuario]);

  // 🆕 FUNCIÓN PARA CARGAR LA CUOTA DE MEMORIA
  const cargarCuota = async () => {
    if (!usuario) return;
    try {
      const data = await api.obtenerEspacioUsado();
      if (data) {
        setEspacio({ usado: data.usado_bytes, limite: data.limite_bytes });
      }
    } catch (err) {
      console.error("Error al cargar cuota:", err);
    }
  };

  const loadFiles = async () => {
    if (!usuario) return;

    if (tabActiva === "cursos" && !cursoSeleccionado) {
      solicitudArchivos.current += 1;
      setFiles([]);
      setSelectedFile(null);
      setCargandoArchivos(false);
      return;
    }

    const solicitudActual = ++solicitudArchivos.current;
    setCargandoArchivos(true);
    setFiles([]);
    setSelectedFile(null);

    try {
      const visibilidad = tabActiva === "cursos" ? "privado" : "personal";
      const data = await api.obtenerArchivos(
        usuario.nombre,
        visibilidad,
        cursoSeleccionado,
      );

      if (solicitudActual === solicitudArchivos.current && data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Error al cargar:", err);
    } finally {
      if (solicitudActual === solicitudArchivos.current) {
        setCargandoArchivos(false);
      }
    }
  };

  // 🚀 CRÍTICO: Efecto principal para refrescar datos y memoria
  useEffect(() => {
    loadFiles();
    cargarCuota(); // Actualizamos la memoria cada vez que se recarga la lista
  }, [usuario, tabActiva, cursoSeleccionado]);

  const handleUploadFile = async (fileObj) => {
    if (!fileObj || !usuario) return;

    // 🆕 1. Validar el tamaño del archivo de forma individual
    if (fileObj.size > espacio.limite) {
      alerta.error("Archivo demasiado grande", `El archivo supera el límite total de ${(espacio.limite / 1048576).toFixed(2)}MB.`);
      return;
    }

    // 🆕 2. Validar si el archivo cabe en el espacio restante
    if (espacio.usado + fileObj.size > espacio.limite) {
      const libreMB = ((espacio.limite - espacio.usado) / 1048576).toFixed(2);
      alerta.error("Espacio insuficiente", `El archivo pesa ${(fileObj.size / 1048576).toFixed(2)}MB, pero solo te quedan ${libreMB}MB libres.`);
      return;
    }

    // Validación de curso
    if (tabActiva === "cursos" && !cursoSeleccionado) {
      alerta.error(
        "Faltan datos",
        "Selecciona el curso al que quieres subir el material.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", fileObj);
    formData.append("autor", usuario.nombre);

    formData.append(
      "visibilidad",
      tabActiva === "cursos" ? "privado" : "personal",
    );
    if (tabActiva === "cursos") formData.append("curso", cursoSeleccionado);

    try {
      await api.subirArchivo(formData);
      loadFiles();
      cargarCuota(); // 🆕 Refrescar la cuota después de subir
      alerta.success("¡Archivo Subido!");
    } catch (err) {
      alerta.error("Error al subir archivo", err.message);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (tabActiva === "cursos" && usuario.rol === "Estudiante") {
      alerta.error(
        "Acceso Denegado",
        "No puedes eliminar el material subido por el docente.",
      );
      return;
    }

    try {
      await api.eliminarArchivo(filename, usuario.nombre, tabActiva === "cursos" ? cursoSeleccionado : "");
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      if (selectedFile === filename) setSelectedFile(null);
      
      cargarCuota(); // 🆕 Refrescar la cuota para mostrar el espacio recuperado
      alerta.success("Archivo eliminado correctamente");
    } catch (err) {
      alerta.error("Error al eliminar", err.message || "No se pudo eliminar el archivo.");
    }
  };

  const handleDownload = async (filename) => {
    try {
      const autorParam = encodeURIComponent(usuario.nombre);
      const cursoParam = tabActiva === "cursos" && cursoSeleccionado ? `&curso=${encodeURIComponent(cursoSeleccionado)}` : "";
      const url = `${BASE_URL}/files/${encodeURIComponent(filename)}?autor=${autorParam}${cursoParam}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo descargar el archivo del servidor.");
      const blob = await response.blob();

      if (window.showSaveFilePicker) {
        try {
          const fileHandle = await window.showSaveFilePicker({ suggestedName: filename });
          alerta.exito("Descarga iniciada", "Guardando el archivo en tu equipo...");
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          if (error.name !== 'AbortError') {
            alerta.error("Error al guardar", "Hubo un problema al escribir el archivo.");
          }
        }
      } else {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alerta.exito("Descarga iniciada", "Elige el lugar donde se va a guardar el archivo.");
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 5000);
      }

    } catch (err) {
      console.error(err);
      alerta.error("Error al descargar", err.message || "No se pudo conectar con el servidor.");
    }
  };

  // 🆕 Cálculos para la barra de memoria
  const usadoMB = (espacio.usado / 1048576).toFixed(2);
  const limiteMB = (espacio.limite / 1048576).toFixed(2);
  const porcentajeUso = Math.min((espacio.usado / espacio.limite) * 100, 100).toFixed(1);
  const cuotaLlena = espacio.usado >= espacio.limite;

  return (
    <div className="page-container">

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
      {/* Botón flotante para colapsar panel izquierdo */}
      <button
        onClick={() => setPanelAbierto(!panelAbierto)}
        className={`boton-toggle-medio ${panelAbierto ? "abierto" : "cerrado"}`}
        title={panelAbierto ? "Ocultar panel" : "Mostrar panel"}
        style={{
          position: "fixed",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          zIndex: 9999,
          backgroundColor: "var(--accent-color, #FF7000)",
          color: "white",
          border: "1px solid var(--border-color, #eee)",
          borderLeft: "none",
          borderRadius: "0 8px 8px 0",
          width: "24px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease"
        }}
      >
        <span
          className={`icono-toggle ${panelAbierto ? "abierto" : "cerrado"}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "14px", color: "#ffffff",
            transform: panelAbierto ? "scaleX(1)" : "scaleX(-1)",
            transition: "transform 0.3s ease", lineHeight: 0,
            marginTop: "-2px", marginLeft: "-1px",
          }}
        >
          ❮
        </span>
      </button>
      <button
        onClick={iniciarTour}
        className="guia-rapida-flotante"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="guia-rapida-flotante-texto">Guía Rápida</span>
      </button>
      <div className="files-layout">
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: Pestañas y Gestión (35%)               */}
        {/* ========================================================= */}
        {panelAbierto && (
          <div className="archivos-col-izq">
            {/* SELECTOR DE PESTAÑAS */}
            <div
              id="tour-pestanas"
              style={{
                display: "flex",
                background: "var(--bg-card)",
                borderRadius: "8px",
                padding: "5px",
                border: "1px solid var(--border-color)",
                marginBottom: "15px"
              }}
            >
              <button
                onClick={() => setTabActiva("personales")}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background:
                    tabActiva === "personales"
                      ? "var(--accent-color)"
                      : "transparent",
                  color:
                    tabActiva === "personales" ? "white" : "var(--text-muted)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mi Espacio
              </button>
              <button
                onClick={() => setTabActiva("cursos")}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background:
                    tabActiva === "cursos"
                      ? "var(--primary-color)"
                      : "transparent",
                  color: tabActiva === "cursos" ? "white" : "var(--text-muted)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Mis Cursos
              </button>
            </div>

            {/* CONTENIDO SEGÚN LA PESTAÑA */}
            <div
              style={{
                background: "var(--bg-card)",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
              }}
            >
              {tabActiva === "cursos" && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    Selecciona un Curso:
                  </label>
                  <select
                    value={cursoSeleccionado}
                    onChange={(e) => setCursoSeleccionado(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-main)" }}>
                      -- Elige un curso para ver material --
                    </option>
                    {misCursos.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: "var(--bg-input)", color: "var(--text-main)" }}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* AVISO VISUAL DE CURSO SELECCIONADO CON LÓGICA DE ROL */}
              {tabActiva === "cursos" && cursoSeleccionado && (
                <div
                  style={{
                    backgroundColor: "#e8f4fd",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "15px",
                    borderLeft: "4px solid var(--primary-color)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#0056b3" }}>
                    {" "}
                    {["Docente", "Administrador"].includes(usuario?.rol)
                      ? "Estás gestionando el material del curso:"
                      : "Viendo material de estudio del curso:"}{" "}
                    <strong>
                      {misCursos.find((c) => String(c.id) === String(cursoSeleccionado))?.nombre || cursoSeleccionado}
                    </strong>
                  </p>
                </div>
              )}

              {/* Subida de archivos */}
              {!(tabActiva === "cursos" && usuario?.rol === "Estudiante") && (
                <div
                  id="tour-subida"
                  style={{
                    marginBottom: "20px",
                    paddingBottom: "20px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>
                    {tabActiva === "cursos"
                      ? "Subir Material al Curso"
                      : "Subir Archivo Personal"}
                  </h3>
                  
                  {/* 🆕 Alerta si la cuota está llena */}
                  {cuotaLlena ? (
                    <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", borderLeft: "4px solid #ef4444" }}>
                      <strong>⚠️ Espacio insuficiente:</strong> Has alcanzado tu límite de almacenamiento ({limiteMB}MB). Por favor, elimina archivos existentes antes de subir nuevos.
                    </div>
                  ) : (
                    <ExcelUploader onUpload={handleUploadFile} />
                  )}
                </div>
              )}

              <h3 style={{ margin: "0 0 15px 0", fontSize: "1.1rem" }}>
                {tabActiva === "cursos" ? "Material Compartido" : "Mis Archivos"}
              </h3>

              <div id="tour-visor">
                {/* Si es curso y no ha seleccionado uno, no mostramos la lista */}
                {tabActiva === "cursos" && !cursoSeleccionado ? (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    Selecciona un curso arriba para ver sus archivos.
                  </p>
                ) : cargandoArchivos ? (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    Cargando archivos...
                  </p>
                ) : (
                  <ExcelViewer
                    files={files}
                    onSelect={setSelectedFile}
                    onDelete={handleDeleteFile}
                    onDownload={handleDownload}
                    rol={usuario?.rol}
                    esPersonal={tabActiva === "personales"}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: Vista Previa                            */}
        {/* ========================================================= */}
        <div className="archivos-col-der" id="tour-vista-previa">
          <h3
            style={{
              margin: "0 0 15px 0",
              fontSize: "1.2rem",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "10px",
            }}
          >
            Vista Previa de Datos
          </h3>
          {selectedFile ? (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <ExcelContent
                filename={selectedFile}
                autor={usuario.nombre}
                curso={tabActiva === "cursos" ? cursoSeleccionado : ""}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                height: "80%",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontStyle: "italic",
                backgroundColor: "var(--bg-main)",
                borderRadius: "8px",
                border: "1px dashed #ccc",
              }}
            >
              Selecciona un archivo de la lista para visualizarlo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}