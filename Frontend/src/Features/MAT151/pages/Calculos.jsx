import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "react-data-grid/lib/styles.css";
import "../style/pages/Calculos.css";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- IMPORTS DE SERVICIOS Y CONTEXTO ---
import { useCalculadoraExcel } from "../hooks/useCalculadoraExcel";
import { useModuleData } from "../../../components/Gestion_Datos/DataContext";
import { api, BASE_URL } from "../../../services/api";
import { alerta } from "../../../utils/Notificaciones";

// --- IMPORTS DE LOS PANELES MODULARES ---
import ReportePDF from "../components/Resultados/ReportePDF";
import PanelResultados from "../components/Resultados/PanelResultados";
import PanelConfiguracion from "../components/Resultados/PanelConfiguracion";

export default function Calculos() {
  const { variables, usuario } = useModuleData();
  const location = useLocation();

  const iniciarTour = () => {
    // Si el modal de creación de tablas está abierto (se detecta por la presencia de #tour-crear-nombre)
    if (document.querySelector('#tour-crear-nombre')) {
      const tourCrearSteps = [
        {
          element: '#tour-crear-nombre',
          popover: {
            title: '1. Asignar un Nombre',
            description: 'Escribe un nombre descriptivo para tu conjunto de datos. Se guardará con formato Excel (.xlsx).',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-crear-generador',
          popover: {
            title: '2. Generar Matriz Rápida',
            description: 'Especifica la cantidad de Observaciones (filas) y Variables (columnas) que deseas crear inicialmente, y haz clic en "Generar". Esto creará la estructura vacía lista para usar.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-crear-herramientas',
          popover: {
            title: '3. Barra de Herramientas',
            description: 'Usa estos botones para agregar más filas, eliminar la última fila, o añadir nuevas columnas (variables). También puedes configurar el tipo de dato de cada columna (número, texto o categorías) haciendo clic en su cabecera.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-crear-grilla',
          popover: {
            title: '4. Cuadrícula de Datos',
            description: 'Haz doble clic en cualquier celda para escribir tus datos estadísticos directamente. ¡También puedes copiar rangos de celdas desde un Excel real y pegarlos aquí usando Ctrl+V!',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '#tour-crear-guardar',
          popover: {
            title: '5. Guardar la Tabla',
            description: 'Una vez ingresados todos tus datos, haz clic en "Guardar Tabla" para guardarla en tu base de datos y empezar a analizarla en la calculadora.',
            side: 'left',
            align: 'start'
          }
        }
      ];

      const driverObj = driver({
        showProgress: true,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        progressText: '{{current}} de {{total}}',
        steps: tourCrearSteps
      });
      driverObj.drive();
      return;
    }

    // --- NUEVO: Tour exclusivo si el modal de "Gestión de Datos" está abierto ---
    if (document.querySelector('#tour-datos-archivos')) {
      const driverObj = driver({
        showProgress: true,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        progressText: '{{current}} de {{total}}',
        steps: [
            {
                element: '#tour-datos-archivos',
                popover: { title: 'Archivos Subidos', description: 'Aquí puedes seleccionar cualquier archivo Excel que ya hayas subido anteriormente a la base de datos.', side: 'bottom', align: 'start' }
            },
            {
                element: '#tour-datos-upload',
                popover: { title: 'Subir Nuevos Datos', description: 'Si tienes un nuevo archivo Excel, puedes arrastrarlo aquí o hacer clic para subirlo y poder analizarlo.', side: 'bottom', align: 'start' }
            },
            {
                element: '#tour-datos-variables',
                popover: { title: 'Definir Variables', description: 'Una vez cargada tu tabla, aquí puedes definir y nombrar tus variables para que el sistema sepa qué columnas analizar.', side: 'right', align: 'start' }
            },
            {
                element: '#tour-datos-tabla',
                popover: { title: 'Vista de Tabla', description: 'Aquí verás los datos de tu Excel. Selecciona los rangos de celdas para asignarlos a las variables que creaste.', side: 'top', align: 'start' }
            }
        ]
      });
      driverObj.drive();
      return;
    }
    // -------------------------------------------------------------------------

    const tourSteps = [
      {
        element: '#tour-origen-datos',
        popover: {
          title: 'Origen de los Datos',
          description: 'Elige entre "Mis Archivos" para tus hojas de cálculo personales, o "Cursos / Grupos" para usar los datos compartidos por tus docentes.',
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-seleccion-archivo',
        popover: {
          title: 'Selección de Archivo',
          description: 'Elige el libro de Excel y la hoja de trabajo en la que se encuentran los datos estadísticos que deseas analizar.',
          side: "right",
          align: 'start'
        }
      }
    ];

    if (document.querySelector('#tour-seleccion-operacion')) {
      tourSteps.push({
        element: '#tour-seleccion-operacion',
        popover: {
          title: 'Operación Estadística',
          description: 'Selecciona el tema de análisis que vas a realizar (Frecuencias, Intervalos, Regresión, Series de Tiempo, Números Índices, etc.). El tour se adaptará automáticamente a tu elección.',
          side: "right",
          align: 'start'
        }
      });
    }

    // Pasos específicos según la operación seleccionada
    switch (calculo) {
      case "frecuencias_completas":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Variable de Frecuencias',
              description: 'Selecciona una única columna de tipo categórica o cuantitativa discreta para contar sus frecuencias absolutas y relativas.',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "distribucion_intervalos":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Variable Continua e Intervalos',
              description: 'Selecciona una variable numérica continua. Podrás configurar el tipo de intervalo [semiabierto, cerrado, abierto] y el método para calcular el número de clases (como Sturges o manual).',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "tendencia_y_posicion":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Variable y Medidas de Posición',
              description: 'Configura la variable a analizar. En la parte inferior de este panel podrás definir qué Percentil (de 1 a 99) deseas calcular específicamente.',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "variabilidad_y_forma":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Variabilidad, Forma y Boxplot',
              description: 'Estudia la dispersión (Varianza, Desviación Estándar, Coeficiente de Variación) y la simetría de tus datos. Generará un diagrama de caja (Boxplot) interactivo.',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "distribucion_bivariada_avanzada":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Variables Bidimensionales',
              description: 'Para la tabla de contingencia bivariante, debes seleccionar dos variables: la Variable X (filas) y la Variable Y (columnas).',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "regresion_simple":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Regresión y Correlación',
              description: 'Selecciona la Variable X (independiente) y la Variable Y (dependiente) para analizar su relación matemática.',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "series_tiempo":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Eje de Tiempo y Valores Históricos',
              description: 'Selecciona el Eje de Tiempo X (años, meses) y los Valores Históricos Y. Abajo podrás elegir el método de pronóstico (Promedio Móvil Simple, Ponderado o Suavizamiento Exponencial).',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      case "numeros_indices":
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Módulo de Números Índices',
              description: 'Selecciona si deseas calcular Índices Compuestos (Laspeyres, Paasche, Fisher), hacer un Empalme/Cambio de base o realizar una Deflación. Configura los precios y cantidades base y actuales correspondientes.',
              side: "right",
              align: 'start'
            }
          });
        }
        break;

      default:
        if (document.querySelector('#tour-seleccion-variables')) {
          tourSteps.push({
            element: '#tour-seleccion-variables',
            popover: {
              title: 'Configurar Variables',
              description: 'Define qué columnas actuarán como variables (X para análisis unidimensional, X e Y para análisis bidimensional o regresión).',
              side: "right",
              align: 'start'
            }
          });
        }
        break;
    }

    if (document.querySelector('#tour-tabla-grid')) {
      tourSteps.push({
        element: '#tour-tabla-grid',
        popover: {
          title: 'Editor de Datos en Tiempo Real',
          description: '¡Los cálculos se procesan de forma inmediata en la interfaz! Haz doble clic en cualquier celda para corregir o cambiar valores, y verás cómo los coeficientes y gráficos se actualizan automáticamente al presionar Calcular.',
          side: "right",
          align: 'start'
        }
      });
    }

    if (document.querySelector('#tour-btn-calcular')) {
      tourSteps.push({
        element: '#tour-btn-calcular',
        popover: {
          title: 'Procesar Cálculos',
          description: 'Haz clic aquí para ejecutar el motor estadístico sobre tus datos y rellenar el panel de resultados.',
          side: "right",
          align: 'start'
        }
      });
    }

    if (document.querySelector('#tour-btn-toggle-panel')) {
      tourSteps.push({
        element: '#tour-btn-toggle-panel',
        popover: {
          title: 'Ocultar/Mostrar Panel',
          description: 'Haz clic aquí para colapsar por completo el panel de configuración lateral y ampliar el área de resultados, brindando mayor espacio de visualización de tablas y gráficos.',
          side: "right",
          align: 'start'
        }
      });
    }

    tourSteps.push({
      element: '#tour-resultados-panel',
      popover: {
        title: 'Panel de Resultados',
        description: 'Aquí verás las tablas de distribución, estadígrafos calculados, fórmulas paso a paso y los gráficos dinámicos del análisis.',
        side: "left",
        align: 'start'
      }
    });

    if (document.querySelector('#tour-btn-gestion')) {
      tourSteps.push({
        element: '#tour-btn-gestion',
        popover: {
          title: 'Gestión de Datos',
          description: 'Abre el panel de administración de tus archivos de Excel, donde podrás subir nuevos libros, eliminar los antiguos o alternar entre el espacio personal y el de tus cursos asignados. (Versión de prueba (Beta) - Aún se encuentra en fase de desarrollo)',
          side: "left",
          align: 'start'
        }
      });
    }

    if (document.querySelector('#tour-btn-crear-tabla')) {
      tourSteps.push({
        element: '#tour-btn-crear-tabla',
        popover: {
          title: 'Crear Tabla',
          description: 'Diseña y crea tablas dinámicas personalizadas de datos desde cero, ingresando directamente valores en filas y columnas sin requerir un archivo de Excel previo.',
          side: "left",
          align: 'start'
        }
      });
    }

    if (document.querySelector('#tour-acciones-finales')) {
      tourSteps.push({
        element: '#tour-acciones-finales',
        popover: {
          title: 'Exportar y Guardar',
          description: 'Descarga un reporte académico formal en formato PDF o guarda este cálculo en tu Historial para reabrirlo más tarde.',
          side: "top",
          align: 'center'
        }
      });
    }

    if (document.querySelector('#tour-btn-guia-rapida')) {
      tourSteps.push({
        element: '#tour-btn-guia-rapida',
        popover: {
          title: 'Guía Rápida',
          description: 'Reinicia este tour interactivo en cualquier momento si necesitas recordar el propósito de algún componente.',
          side: "right",
          align: 'start'
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

  const [files, setFiles] = useState([]);
  const [ordenGraficos, setOrdenGraficos] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [mostrarTabla, _setMostrarTabla] = useState(true);
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [filtroFractil, setFiltroFractil] = useState("Cuartil");
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [modoCreacion, setModoCreacion] = useState(false);

  // Estados para diferenciar origen de archivos y gestionar selección de cursos
  const [origenArchivos, setOrigenArchivos] = useState("personal"); // "personal" o "curso"
  const [misCursos, setMisCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");

  // 1. ESTADO DEL HISTORIAL
  const snapshotInicial = location.state?.snapshot?.datosSnapshot || null;
  const [datosHistorial, setDatosHistorial] = useState(snapshotInicial);

  // Estado para controlar qué tablas de desarrollo se incluyen en el reporte PDF
  const [tablasDesarrolloReporte, setTablasDesarrolloReporte] = useState({});

  // Estado para controlar qué modelos de regresión están activos (visibles) en el gráfico y las tablas
  const [modelosVisibles, setModelosVisibles] = useState({});

  const {
    excelData, columns, selectedColumn, setSelectedColumn, selectedColumnY, setSelectedColumnY,
    resultado, calculo, setCalculo, tipoIntervalo, setTipoIntervalo, metodoK, setMetodoK,
    kPersonalizado, setKPersonalizado, percentilK, setPercentilK, handleChangeDato, ejecutarCalculo, errorNumerico,
    metodoSeries, setMetodoSeries, periodosK, setPeriodosK, pesos, setPesos, alfa, setAlfa,
    subTemaIndices, setSubTemaIndices, colPrecioBase, setColPrecioBase, colCantidadBase, setColCantidadBase,
    colPrecioActual, setColPrecioActual, colCantidadActual, setColCantidadActual, nuevoIndiceBase, setNuevoIndiceBase,
    conPonderacion, setConPonderacion, tipoIndiceSimple, setTipoIndiceSimple,
    conColumnaItem, setConColumnaItem, columnaItem, setColumnaItem,
    handleActualizarColumna, handleCrearColumna,
  } = useCalculadoraExcel(selectedFile, selectedSheet, datosHistorial, origenArchivos === "curso" ? cursoSeleccionado : "");


  // 🚀 2. EL BLINDAJE: Memoria interna para detectar cambios REALES
  const estadosActuales = useRef({
    archivo: selectedFile,
    hoja: selectedSheet,
    colX: selectedColumn,
    colY: selectedColumnY
  });

  // Mantenemos la memoria actualizada de forma silenciosa
  useEffect(() => {
    estadosActuales.current = { archivo: selectedFile, hoja: selectedSheet, colX: selectedColumn, colY: selectedColumnY };
  }, [selectedFile, selectedSheet, selectedColumn, selectedColumnY]);

  // Funciones protegidas: Solo rompen el historial si el usuario ELIGE algo diferente
  const handleCambioArchivo = useCallback((e) => {
    const valor = e?.target?.value !== undefined ? e.target.value : e;
    if (valor !== estadosActuales.current.archivo) {
      setSelectedFile(valor);
      setDatosHistorial(null);
    }
  }, []);

  const handleCambioHoja = useCallback((e) => {
    const valor = e?.target?.value !== undefined ? e.target.value : e;
    if (valor !== "" && valor !== undefined) {
      const numValor = Number(valor);
      if (numValor !== estadosActuales.current.hoja) {
        setSelectedSheet(numValor);
        setDatosHistorial(null);
      }
    }
  }, []);

  const handleCambioColX = useCallback((e) => {
    const valor = e?.target?.value !== undefined ? e.target.value : e;
    if (valor !== estadosActuales.current.colX) {
      setSelectedColumn(valor);
      setDatosHistorial(null);
    }
  }, [setSelectedColumn]);

  const handleCambioColY = useCallback((e) => {
    const valor = e?.target?.value !== undefined ? e.target.value : e;
    if (valor !== estadosActuales.current.colY) {
      setSelectedColumnY(valor);
      setDatosHistorial(null);
    }
  }, [setSelectedColumnY]);

  const salirModoHistorialManual = () => setDatosHistorial(null);

  // --- RESTO DEL CÓDIGO INTACTO ---
  const calculoPendiente = useRef(false);

  useEffect(() => {
    if (location.state && location.state.snapshot && !calculoPendiente.current) {
      const { archivoReabrir, calculoReabrir, snapshot } = location.state;
      if (archivoReabrir) setSelectedFile(archivoReabrir);
      if (calculoReabrir) setCalculo(calculoReabrir);

      if (snapshot.configuracion) {
        const conf = snapshot.configuracion;

        // Restaurar Columnas
        if (conf.columnasSeleccionadas && conf.columnasSeleccionadas.x) {
          setSelectedColumn(conf.columnasSeleccionadas.x);
          setSelectedColumnY(conf.columnasSeleccionadas.y || "");
        }

        // Restaurar Parámetros Tema 2, 3 y 4
        if (conf.tipoIntervalo) setTipoIntervalo(conf.tipoIntervalo);
        if (conf.metodoK) setMetodoK(conf.metodoK);
        if (conf.kPersonalizado) setKPersonalizado(conf.kPersonalizado);
        if (conf.percentilK) setPercentilK(conf.percentilK); // 👈 TEMA 3: PERCENTILES

        // Restaurar Parámetros Series de Tiempo
        if (conf.metodoSeries) setMetodoSeries(conf.metodoSeries);
        if (conf.periodosK) setPeriodosK(conf.periodosK);
        if (conf.pesos) setPesos(conf.pesos);
        if (conf.alfa) setAlfa(conf.alfa);

        // 👈 TEMA 8: NÚMEROS ÍNDICES COMPLETO
        if (conf.subTemaIndices) setSubTemaIndices(conf.subTemaIndices);
        if (conf.colPrecioBase) setColPrecioBase(conf.colPrecioBase);
        if (conf.colCantidadBase) setColCantidadBase(conf.colCantidadBase);
        if (conf.colPrecioActual) setColPrecioActual(conf.colPrecioActual);
        if (conf.colCantidadActual) setColCantidadActual(conf.colCantidadActual);
        if (conf.nuevoIndiceBase) setNuevoIndiceBase(conf.nuevoIndiceBase);
        if (conf.conPonderacion !== undefined) setConPonderacion(conf.conPonderacion);
        if (conf.tipoIndiceSimple) setTipoIndiceSimple(conf.tipoIndiceSimple);
        if (conf.conColumnaItem !== undefined) setConColumnaItem(conf.conColumnaItem);
        if (conf.columnaItem) setColumnaItem(conf.columnaItem);
      }
      calculoPendiente.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [
    location.state, setCalculo, setSelectedColumn, setSelectedColumnY,
    setTipoIntervalo, setMetodoK, setKPersonalizado, setPercentilK,
    setMetodoSeries, setPeriodosK, setPesos, setAlfa,
    setSubTemaIndices, setColPrecioBase, setColCantidadBase, setColPrecioActual, setColCantidadActual, setNuevoIndiceBase,
    setConPonderacion, setTipoIndiceSimple, setConColumnaItem, setColumnaItem
  ]);

  useEffect(() => {
    if (calculoPendiente.current && excelData && excelData.length > 0) {
      const timer = setTimeout(() => {
        ejecutarCalculo();
        alerta.exito("Historial Cargado", "Se restauró el cálculo guardado.");
      }, 400);
      calculoPendiente.current = false;
      return () => clearTimeout(timer);
    }
  }, [excelData, ejecutarCalculo]);

  const formatearCelda = (valor) => {
    if (typeof valor === "number") return Number.isInteger(valor) ? valor : Number(valor).toFixed(2);
    if (!isNaN(parseFloat(valor)) && isFinite(valor)) {
      const num = Number(valor);
      return Number.isInteger(num) ? num : num.toFixed(2);
    }
    return valor;
  };

  const cargarCursos = async () => {
    if (!usuario) return;
    try {
      const correoUsuario = usuario.email || usuario.id;
      const esAdmin = usuario.rol === "Administrador" || usuario.isAdmin === true;
      const esDocente = usuario.rol === "Docente";

      let res;
      if (esDocente || esAdmin) {
        res = await fetch(`${BASE_URL}/mis_clases/${correoUsuario}`);
      } else {
        res = await fetch(`${BASE_URL}/mis_inscripciones/${correoUsuario}`);
      }

      if (res.ok) {
        const data = await res.json();
        setMisCursos(data);
      }
    } catch (error) {
      console.error("Error al cargar cursos para la calculadora:", error);
    }
  };

  const cargarArchivos = async (nuevoNombre = "") => {
    if (!usuario) return;
    try {
      let data;
      if (origenArchivos === "curso") {
        if (!cursoSeleccionado) {
          setFiles([]);
          return;
        }
        data = await api.obtenerArchivos(usuario.nombre, "privado", cursoSeleccionado);
      } else {
        data = await api.obtenerArchivos(usuario.nombre, "personal");
      }
      if (data && data.files) {
        setFiles(data.files);
        if (nuevoNombre) {
          const nombreCompleto = nuevoNombre.endsWith(".xlsx") ? nuevoNombre : `${nuevoNombre}.xlsx`;
          setSelectedFile(nombreCompleto);
        }
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      setFiles([]);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, [usuario]);

  useEffect(() => {
    cargarArchivos();
  }, [usuario, origenArchivos, cursoSeleccionado]);

  useEffect(() => {
    const handleTablaCreada = (e) => {
      const nuevoNombre = e.detail?.nombre;
      cargarArchivos(nuevoNombre);
    };
    window.addEventListener("tabla-creada", handleTablaCreada);
    return () => {
      window.removeEventListener("tabla-creada", handleTablaCreada);
    };
  }, [usuario, origenArchivos, cursoSeleccionado]);

  const handleGuardarResultado = async () => {
    if (!usuario) return;
    try {
      const snapshotCompleto = {
        datosSnapshot: excelData,
        configuracion: {
          calculo, tipoIntervalo, metodoK, kPersonalizado, percentilK,
          metodoSeries, periodosK, pesos, alfa, subTemaIndices,
          colPrecioBase, colCantidadBase, colPrecioActual, colCantidadActual, nuevoIndiceBase,
          columnasSeleccionadas: { x: selectedColumn, y: selectedColumnY },
          conPonderacion, tipoIndiceSimple, conColumnaItem, columnaItem
        },
        resultadoFinal: resultado,
      };
      await api.guardarEnHistorial(usuario.nombre, calculo, selectedFile, snapshotCompleto);
      alerta.exito("¡Guardado Permanentemente!", "El cálculo completo está en el historial.");
    } catch (error) {
      console.error(error);
      alerta.error("Error", "No se pudo guardar el snapshot.");
    }
  };

  const esIntervalo = calculo === "distribucion_intervalos";
  const esUnidimensional = ["frecuencias_completas", "distribucion_intervalos", "estadistica_descriptiva", "tendencia_central", "medidas_posicion", "tendencia_y_posicion", "variabilidad_y_forma"].includes(calculo);
  const esBivariada = ["distribucion_bivariada", "distribucion_bivariada_avanzada"].includes(calculo);

  const handleGridChange = (newRows, { indexes, column }) => {
    indexes.forEach((index) => {
      handleChangeDato(index, column.key, newRows[index][column.key]);
    });
  };

  return (
    <>
      {/* Botón Flotante para Guía Rápida */}
      <button
        id="tour-btn-guia-rapida"
        onClick={iniciarTour}
        className="guia-rapida-flotante"
        style={{
          bottom: '20px',
          zIndex: 10000
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="guia-rapida-flotante-texto">Guía Rápida</span>
      </button>

      <div className={`calculadora-layout ${panelAbierto ? "" : "colapsado"}`} style={{ position: "relative" }}>
        {datosHistorial && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, background: "#f59e0b", color: "#fff",
            padding: "8px 15px", display: "flex", justifyContent: "space-between", alignItems: "center",
            fontWeight: "bold", fontSize: "0.9rem", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}>
            <span>⏱️ Viendo cálculo del historial (Modo Congelado).</span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={salirModoHistorialManual}
                style={{ background: "#b45309", border: "none", color: "white", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                title="Volver a conectarse con el servidor para usar otros datos"
              >
                Volver a Calculadora Normal
              </button>
              <button
                onClick={salirModoHistorialManual}
                style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer", padding: "0 5px" }}
                title="Cerrar vista de historial"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <PanelConfiguracion
          panelAbierto={panelAbierto} setPanelAbierto={setPanelAbierto}
          files={files}
          origenArchivos={origenArchivos} setOrigenArchivos={setOrigenArchivos}
          misCursos={misCursos}
          cursoSeleccionado={cursoSeleccionado} setCursoSeleccionado={setCursoSeleccionado}
          selectedFile={selectedFile} setSelectedFile={handleCambioArchivo}
          selectedSheet={selectedSheet} setSelectedSheet={handleCambioHoja}
          selectedColumn={selectedColumn} setSelectedColumn={handleCambioColX}
          selectedColumnY={selectedColumnY} setSelectedColumnY={handleCambioColY}
          usuario={usuario} columns={columns} variables={variables}
          calculo={calculo} setCalculo={setCalculo}
          subTemaIndices={subTemaIndices} setSubTemaIndices={setSubTemaIndices}
          colPrecioBase={colPrecioBase} setColPrecioBase={setColPrecioBase}
          colCantidadBase={colCantidadBase} setColCantidadBase={setColCantidadBase}
          colPrecioActual={colPrecioActual} setColPrecioActual={setColPrecioActual}
          colCantidadActual={colCantidadActual} setColCantidadActual={setColCantidadActual}
          nuevoIndiceBase={nuevoIndiceBase} setNuevoIndiceBase={setNuevoIndiceBase}
          conPonderacion={conPonderacion} setConPonderacion={setConPonderacion}
          tipoIndiceSimple={tipoIndiceSimple} setTipoIndiceSimple={setTipoIndiceSimple}
          conColumnaItem={conColumnaItem} setConColumnaItem={setConColumnaItem}
          columnaItem={columnaItem} setColumnaItem={setColumnaItem}
          esBivariada={esBivariada} esUnidimensional={esUnidimensional}
          metodoSeries={metodoSeries} setMetodoSeries={setMetodoSeries}
          periodosK={periodosK} setPeriodosK={setPeriodosK} pesos={pesos} setPesos={setPesos} alfa={alfa} setAlfa={setAlfa}
          tipoIntervalo={tipoIntervalo} setTipoIntervalo={setTipoIntervalo}
          metodoK={metodoK} setMetodoK={setMetodoK} kPersonalizado={kPersonalizado} setKPersonalizado={setKPersonalizado} percentilK={percentilK} setPercentilK={setPercentilK}
          mostrarTabla={mostrarTabla} excelData={excelData} handleGridChange={handleGridChange}
          ejecutarCalculo={ejecutarCalculo} modoCreacion={modoCreacion} setModoCreacion={setModoCreacion}
          mostrarCalculadora={mostrarCalculadora} setMostrarCalculadora={setMostrarCalculadora}
          handleActualizarColumna={handleActualizarColumna}
          handleCrearColumna={handleCrearColumna}
        />

        <PanelResultados
          modoCreacion={modoCreacion} setModoCreacion={setModoCreacion} cargarArchivos={cargarArchivos}
          resultado={resultado} errorNumerico={errorNumerico} calculo={calculo}
          esBivariada={esBivariada} esUnidimensional={esUnidimensional} esIntervalo={esIntervalo}
          formatearCelda={formatearCelda} filtroFractil={filtroFractil} setFiltroFractil={setFiltroFractil}
          ordenGraficos={ordenGraficos} setOrdenGraficos={setOrdenGraficos}
          handleGuardarResultado={handleGuardarResultado}
          selectedColumn={selectedColumn}
          selectedColumnY={selectedColumnY}
          tablasDesarrolloReporte={tablasDesarrolloReporte}
          setTablasDesarrolloReporte={setTablasDesarrolloReporte}
          modelosVisibles={modelosVisibles}
          setModelosVisibles={setModelosVisibles}
        />

        <ReportePDF
          usuario={usuario} calculo={calculo} selectedFile={selectedFile} selectedSheet={selectedSheet} selectedColumn={selectedColumn}
          selectedColumnY={selectedColumnY}
          resultado={resultado} esBivariada={esBivariada} esUnidimensional={esUnidimensional} esIntervalo={esIntervalo}
          formatearCelda={formatearCelda} filtroFractil={filtroFractil} setFiltroFractil={setFiltroFractil}
          ordenGraficos={ordenGraficos}
          tablasDesarrolloReporte={tablasDesarrolloReporte}
          modelosVisibles={modelosVisibles}
          parametros={{ tipoIntervalo, metodoK, kPersonalizado, percentilK, metodoSeries, periodosK, pesos, alfa, subTemaIndices, colPrecioBase, colCantidadBase, nuevoIndiceBase }}
        />
      </div>
    </>
  );
}

