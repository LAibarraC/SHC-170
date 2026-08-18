import React from "react";
import ExcelContent from "../../../../components/excel/ExcelContent";
import Calculator from "../../../../components/excel/Calculator";
import { DataGrid } from "react-data-grid";

// 1️⃣ Agregamos la función para que las celdas se puedan editar correctamente
function textEditor({ row, column, onRowChange, onClose }) {
  return (
    <input
      className="editor_text"
      autoFocus
      value={row[column.key]}
      onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown"
        ) {
          e.stopPropagation();
        }
      }}
    />
  );
}

// 2️⃣ Fíjate que aquí ya NO existe rdgColumns en esta lista
export default function PanelConfiguracion({
  panelAbierto, setPanelAbierto,
  files, selectedFile, setSelectedFile,
  origenArchivos, setOrigenArchivos,
  misCursos,
  cursoSeleccionado, setCursoSeleccionado,
  usuario, setSelectedSheet,
  columns, variables,
  calculo, setCalculo,
  subTemaIndices, setSubTemaIndices,
  colPrecioBase, setColPrecioBase, colCantidadBase, setColCantidadBase,
  colPrecioActual, setColPrecioActual, colCantidadActual, setColCantidadActual,
  nuevoIndiceBase, setNuevoIndiceBase,
  conPonderacion, setConPonderacion,
  tipoIndiceSimple, setTipoIndiceSimple,
  conColumnaItem, setConColumnaItem,
  columnaItem, setColumnaItem,
  selectedColumn, setSelectedColumn,
  selectedColumnY, setSelectedColumnY,
  esBivariada, esUnidimensional,
  metodoSeries, setMetodoSeries, periodosK, setPeriodosK, pesos, setPesos, alfa, setAlfa,
  tipoIntervalo, setTipoIntervalo, metodoK, setMetodoK, kPersonalizado, setKPersonalizado, percentilK, setPercentilK,
  mostrarTabla, excelData, handleGridChange,
  ejecutarCalculo, modoCreacion, setModoCreacion,
  mostrarCalculadora, setMostrarCalculadora,
  handleActualizarColumna,
  handleCrearColumna
}) {
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(284);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Restamos un pequeño margen para los bordes del grid
        setContainerWidth(Math.max(100, entry.contentRect.width - 4));
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const [mostrarActualizarCol, setMostrarActualizarCol] = React.useState(false);
  const [columnaAEditar, setColumnaAEditar] = React.useState("");
  const [textoValores, setTextoValores] = React.useState("");
  const [isOpenNuevaColumna, setIsOpenNuevaColumna] = React.useState(false);
  const [nombreNuevaColumna, setNombreNuevaColumna] = React.useState("");

  React.useEffect(() => {
    if (mostrarActualizarCol) {
      const initialCol = selectedColumn || (columns.length > 0 ? columns[0] : "");
      setColumnaAEditar(initialCol);
      if (initialCol) {
        const vals = excelData.map(row => row[initialCol] !== undefined ? row[initialCol] : "");
        setTextoValores(vals.join("\n"));
      } else {
        setTextoValores("");
      }
    }
  }, [mostrarActualizarCol, selectedColumn, columns, excelData]);

  // 3️⃣ Aquí es el ÚNICO lugar donde se crea rdgColumns
  const rdgColumns = [];
  
  const addCol = (colKey, suffix, name, cssClass) => {
    if (colKey) {
      const variableCapturada = variables.find(variable => variable.nombre === colKey);
      const nombresInternos = variableCapturada?.nombresColumnas || [];
      const columnas = nombresInternos.length > 1 ? nombresInternos : [null];

      columnas.forEach((nombreInterno, index) => {
        // Una variable matricial necesita una columna visual por cada campo interno.
        const uniqueKey = `${colKey}__${suffix}${nombreInterno ? `__${index}` : ""}`;
        rdgColumns.push({
          key: uniqueKey,
          name: nombreInterno ? `${name} - ${nombreInterno}` : name,
          renderEditCell: textEditor,
          editable: true,
          resizable: true,
          cellClass: cssClass,
        });
      });
    }
  };

  // Lógica para armar las columnas según el tema
  if (calculo === "numeros_indices") {
    if (conColumnaItem && columnaItem) {
      addCol(columnaItem, "Item", `${columnaItem} (Ítem)`, "celda-editable");
    }
    if (subTemaIndices === "compuestos") {
      if (!conPonderacion) {
        if (tipoIndiceSimple === "precios") {
          addCol(colPrecioBase, "P0", `${colPrecioBase} (P₀)`, "celda-editable");
          addCol(colPrecioActual, "Pt", `${colPrecioActual} (Pt)`, "celda-editable");
        } else {
          addCol(colCantidadBase, "Q0", `${colCantidadBase} (Q₀)`, "celda-editable-y");
          addCol(colCantidadActual, "Qt", `${colCantidadActual} (Qt)`, "celda-editable-y");
        }
      } else {
        addCol(colPrecioBase, "P0", `${colPrecioBase} (P₀)`, "celda-editable");
        addCol(colCantidadBase, "Q0", `${colCantidadBase} (Q₀)`, "celda-editable-y");
        addCol(colPrecioActual, "Pt", `${colPrecioActual} (Pt)`, "celda-editable");
        addCol(colCantidadActual, "Qt", `${colCantidadActual} (Qt)`, "celda-editable-y");
      }
    } else if (subTemaIndices === "deflacion") {
      addCol(selectedColumn, "Tiempo", `${selectedColumn} (Tiempo)`, "celda-editable");
      addCol(selectedColumnY, "Nominal", `${selectedColumnY} (Nominal)`, "celda-editable-y");
      addCol(colPrecioBase, "IPC", `${colPrecioBase} (IPC)`, "celda-editable");
    } else if (subTemaIndices === "empalme") {
      addCol(selectedColumn, "Tiempo", `${selectedColumn} (Tiempo)`, "celda-editable");
      addCol(selectedColumnY, "Indice", `${selectedColumnY} (Índice)`, "celda-editable-y");
    }
  } else {
    addCol(selectedColumn, "X", `${selectedColumn} (Var X)`, "celda-editable");
    if ((esBivariada || calculo === "regresion_simple" || calculo === "series_tiempo") && selectedColumnY) {
      if (selectedColumn !== selectedColumnY) {
        addCol(selectedColumnY, "Y", `${selectedColumnY} (Var Y)`, "celda-editable-y");
      }
    }
  }

  // Ajustar el ancho de las columnas de forma dinámica y responsiva para que quepan en el panel izquierdo (350px de ancho)
  const colCount = rdgColumns.length;
  if (colCount > 0) {
    const widthPerCol = Math.floor(containerWidth / colCount);
    rdgColumns.forEach(col => {
      col.width = widthPerCol;
      col.minWidth = Math.min(30, widthPerCol); // Permitir compresión sin forzar scrollbar
    });
  }

  const obtenerValoresVistaPrevia = (realKey) => {
    if (excelData.length > 0 && excelData.some(row => row[realKey] !== undefined)) {
      return excelData.map(row => row[realKey] ?? "");
    }

    const variableCapturada = variables.find(variable => variable.nombre === realKey);
    return variableCapturada?.datos || [];
  };

  const cantidadFilasVistaPrevia = Math.max(
    excelData.length,
    ...rdgColumns.map(col => obtenerValoresVistaPrevia(col.key.split("__")).length),
    0
  );

  // Mapeamos los datos de las filas para asociar las propiedades únicas
  const mappedRows = Array.from({ length: cantidadFilasVistaPrevia }, (_, index) => {
    const newRow = { ...(excelData[index] || {}) };
    rdgColumns.forEach((col) => {
      const [realKey, , internalIndex] = col.key.split("__");
      const valores = obtenerValoresVistaPrevia(realKey);
      const valor = valores[index];
      if (internalIndex !== undefined) {
        const partes = Array.isArray(valor)
          ? valor
          : String(valor ?? "").split(/\s*\|\s*/);
        newRow[col.key] = partes[Number(internalIndex)] ?? "";
      } else {
        newRow[col.key] = valor ?? "";
      }
    });
    return newRow;
  });

  // Manejador intermedio para traducir las actualizaciones de celdas al formato original de Excel
  const handleMappedGridChange = (newRows, changeData) => {
    const { indexes, column } = changeData;
    const realKey = column.key.split("__")[0];
    
    const originalColumn = { ...column, key: realKey };
    const originalRows = newRows.map(row => {
      const origRow = { ...row };
      origRow[realKey] = row[column.key];
      return origRow;
    });
    
    handleGridChange(originalRows, { indexes, column: originalColumn });
  };

  const renderOpcionesColumnas = () => (
    <>
      <optgroup label="Columnas del Excel">
        {columns.map((col) => (
          <option key={col} value={col}>{col}</option>
        ))}
      </optgroup>
      <optgroup label="Variables Capturadas">
        {variables.map((v) => (
          <option key={v.id} value={v.nombre}>{v.nombre}</option>
        ))}
      </optgroup>
    </>
  );

  return (
    <>
      <button
        id="tour-btn-toggle-panel"
        onClick={() => setPanelAbierto(!panelAbierto)}
        className={`boton-toggle-medio ${panelAbierto ? "abierto" : "cerrado"}`}
        title={panelAbierto ? "Ocultar panel" : "Mostrar panel"}
        style={{
          position: "fixed",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          zIndex: 50,
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

      <div 
        className={`calculadora-datos transition-all duration-300 ${panelAbierto ? "" : "w-0 overflow-hidden opacity-0 p-0 border-none"}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: panelAbierto ? "15px" : "0px",
          padding: panelAbierto ? "15px" : "0px",
          border: panelAbierto ? "1px solid var(--border-color)" : "none"
        }}
      >
        
        <div style={{ borderBottom: panelAbierto ? "1px solid var(--border-color)" : "none", paddingBottom: "5px", marginBottom: panelAbierto ? "5px" : "0" }}>
          {panelAbierto && <h3 style={{ margin: 0 }}> Configuración de Análisis </h3>}
        </div>

        {panelAbierto && (
          <>
            {/* Selector de origen de archivos (Personal vs Cursos) */}
            <div
              id="tour-origen-datos"
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
                type="button"
                onClick={() => {
                  setOrigenArchivos("personal");
                  setCursoSeleccionado("");
                  setSelectedFile(""); // Limpiar archivo seleccionado
                  setModoCreacion(false);
                }}
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
                  fontSize: "0.85rem",
                  transition: "all 0.3s ease",
                  background:
                    origenArchivos === "personal"
                      ? "var(--accent-color)"
                      : "transparent",
                  color:
                    origenArchivos === "personal" ? "white" : "var(--text-muted)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Mi Espacio
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrigenArchivos("curso");
                  setSelectedFile(""); // Limpiar archivo seleccionado
                  setModoCreacion(false);
                }}
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
                  fontSize: "0.85rem",
                  transition: "all 0.3s ease",
                  background:
                    origenArchivos === "curso"
                      ? "var(--primary-color)"
                      : "transparent",
                  color:
                    origenArchivos === "curso" ? "white" : "var(--text-muted)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Mis Cursos
              </button>
            </div>

            {/* Selector de curso (desplegable) si se elige origen de Cursos */}
            {origenArchivos === "curso" && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9rem", color: "var(--text-main)" }}>Selecciona tu curso:</label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => {
                    setCursoSeleccionado(e.target.value);
                    setSelectedFile(""); // Limpiar al cambiar de curso
                  }}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
                >
                  <option value="">-- Selecciona un curso --</option>
                  {misCursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div id="tour-seleccion-archivo">
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>
                {origenArchivos === "curso" ? "Archivo de la clase:" : "Selecciona un archivo:"}
              </label>
              <select
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                  setModoCreacion(false);
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              >
                <option value="">
                  {origenArchivos === "curso" 
                    ? (cursoSeleccionado ? "-- Selecciona un archivo de este curso --" : "-- Selecciona un curso primero --") 
                    : "-- Selecciona un archivo personal --"}
                </option>
                {files.map((file) => (
                  <option key={file.filename} value={file.filename}>
                    {file.filename}
                  </option>
                ))}
              </select>
            </div>

            <ExcelContent
              filename={selectedFile}
              autor={usuario?.nombre}
              curso={origenArchivos === "curso" ? cursoSeleccionado : ""}
              mostrarTabla={false}
              onSheetChange={setSelectedSheet}
            />

            {columns.length > 0 || variables.length > 0 ? (
              <div style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "15px" }}>
                <div id="tour-seleccion-operacion">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Operación:</label>
                  <select
                    value={calculo}
                    onChange={(e) => setCalculo(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)" }}
                  >
                    <optgroup label="Tema 2: Distribución de Frecuencias">
                      <option value="frecuencias_completas">Tabla de Frecuencias</option>
                      <option value="distribucion_intervalos">Distribución por Intervalos</option>
                    </optgroup>
                    <optgroup label="Tema 3: Tendencia y Posición">
                      <option value="tendencia_y_posicion">Tendencia y Posición</option>
                    </optgroup>
                    <optgroup label="Tema 4: Dispersión y Forma">
                      <option value="variabilidad_y_forma">Análisis de Variabilidad y Forma</option>
                    </optgroup>
                    <optgroup label="Tema 5: Distribuciones Bivariantes">
                      <option value="distribucion_bivariada_avanzada">Análisis Bivariante Avanzado</option>
                    </optgroup>
                    <optgroup label="Tema 6: Regresión">
                      <option value="regresion_simple">Análisis de Regresión</option>
                    </optgroup>
                    <optgroup label="Tema 7: Series de Tiempo">
                      <option value="series_tiempo">Pronósticos (Series de Tiempo)</option>
                    </optgroup>
                    <optgroup label="Tema 8: Números Índices">
                      <option value="numeros_indices">Análisis de Índices y Deflación</option>
                    </optgroup>
                  </select>
                </div>

                {calculo === "numeros_indices" ? (
                  <div id="tour-seleccion-variables" style={{ padding: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "4px", marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", color: "var(--primary-color)" }}>Módulo de Análisis:</label>
                    <select value={subTemaIndices} onChange={(e) => setSubTemaIndices(e.target.value)} style={{ width: "100%", marginBottom: "15px", padding: "5px" }}>
                      <option value="compuestos">1. Índices Compuestos (Laspeyres/Paasche/Fisher)</option>
                      <option value="empalme">2. Empalme y Cambio de Base</option>
                      <option value="deflacion">3. Análisis Financiero (Deflación)</option>
                    </select>

                    {subTemaIndices === "compuestos" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
                        
                        {/* Switch 1: Incluir Ponderaciones */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            Incluir Ponderaciones (Cantidades)
                          </span>
                          <button
                            type="button"
                            onClick={() => setConPonderacion(!conPonderacion)}
                            style={{
                              width: '44px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: conPonderacion ? 'var(--primary-color)' : '#9ca3af',
                              position: 'relative',
                              padding: 0,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              outline: 'none'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: conPonderacion ? '23px' : '3px',
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }} />
                          </button>
                        </div>

                        {/* Switch 2: Incluir columna de ITEM */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            Incluir columna de ITEM (Etiquetas)
                          </span>
                          <button
                            type="button"
                            onClick={() => setConColumnaItem(!conColumnaItem)}
                            style={{
                              width: '44px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: conColumnaItem ? 'var(--primary-color)' : '#9ca3af',
                              position: 'relative',
                              padding: 0,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              outline: 'none'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: conColumnaItem ? '23px' : '3px',
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }} />
                          </button>
                        </div>

                        {/* Campos dinámicos según switches */}
                        {conColumnaItem && (
                          <div style={{ marginTop: '5px' }}>
                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Columna de ITEM (Etiquetas):</label>
                            <select 
                              value={columnaItem} 
                              onChange={(e) => setColumnaItem(e.target.value)} 
                              style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}
                            >
                              {renderOpcionesColumnas()}
                            </select>
                          </div>
                        )}

                        {!conPonderacion ? (
                          <>
                            <div>
                              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Tipo de Índice Simple:</label>
                              <select 
                                value={tipoIndiceSimple} 
                                onChange={(e) => setTipoIndiceSimple(e.target.value)} 
                                style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}
                              >
                                <option value="precios">Índice Simple de Precios</option>
                                <option value="cantidades">Índice Simple de Cantidades</option>
                              </select>
                            </div>

                            {tipoIndiceSimple === "precios" ? (
                              <>
                                <div>
                                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Precio Base (P₀):</label>
                                  <select value={colPrecioBase} onChange={(e) => setColPrecioBase(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                                </div>
                                <div>
                                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Precio Actual (Pt):</label>
                                  <select value={colPrecioActual} onChange={(e) => setColPrecioActual(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Cantidad Base (Q₀):</label>
                                  <select value={colCantidadBase} onChange={(e) => setColCantidadBase(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                                </div>
                                <div>
                                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Cantidad Actual (Qt):</label>
                                  <select value={colCantidadActual} onChange={(e) => setColCantidadActual(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Precio Base (P₀):</label>
                              <select value={colPrecioBase} onChange={(e) => setColPrecioBase(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                            </div>
                            <div>
                              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Cantidad Base (Q₀):</label>
                              <select value={colCantidadBase} onChange={(e) => setColCantidadBase(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                            </div>
                            <div>
                              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Precio Actual (Pt):</label>
                              <select value={colPrecioActual} onChange={(e) => setColPrecioActual(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                            </div>
                            <div>
                              <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Cantidad Actual (Qt):</label>
                              <select value={colCantidadActual} onChange={(e) => setColCantidadActual(e.target.value)} style={{ width: "100%" }}>{renderOpcionesColumnas()}</select>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {subTemaIndices === "empalme" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
                        {/* Switch: Incluir columna de ITEM */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            Incluir columna de ITEM (Etiquetas)
                          </span>
                          <button
                            type="button"
                            onClick={() => setConColumnaItem(!conColumnaItem)}
                            style={{
                              width: '44px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: conColumnaItem ? 'var(--primary-color)' : '#9ca3af',
                              position: 'relative',
                              padding: 0,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              outline: 'none'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: conColumnaItem ? '23px' : '3px',
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }} />
                          </button>
                        </div>

                        {conColumnaItem && (
                          <div style={{ marginTop: '5px' }}>
                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Columna de ITEM (Etiquetas):</label>
                            <select 
                              value={columnaItem} 
                              onChange={(e) => setColumnaItem(e.target.value)} 
                              style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}
                            >
                              {renderOpcionesColumnas()}
                            </select>
                          </div>
                        )}

                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Eje de Tiempo (Años/Meses):</label>
                          <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}>{renderOpcionesColumnas()}</select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Serie de Índices (Original):</label>
                          <select value={selectedColumnY} onChange={(e) => setSelectedColumnY(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}>{renderOpcionesColumnas()}</select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Valor para la Nueva Base:</label>
                          <input type="number" step="0.1" value={nuevoIndiceBase} onChange={(e) => setNuevoIndiceBase(e.target.value)} className="container_cal_input" placeholder="Ej: 105.4" style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }} />
                        </div>
                      </div>
                    )}
                    {subTemaIndices === "deflacion" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
                        {/* Switch: Incluir columna de ITEM */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            Incluir columna de ITEM (Etiquetas)
                          </span>
                          <button
                            type="button"
                            onClick={() => setConColumnaItem(!conColumnaItem)}
                            style={{
                              width: '44px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: conColumnaItem ? 'var(--primary-color)' : '#9ca3af',
                              position: 'relative',
                              padding: 0,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              outline: 'none'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: conColumnaItem ? '23px' : '3px',
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }} />
                          </button>
                        </div>

                        {conColumnaItem && (
                          <div style={{ marginTop: '5px' }}>
                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Columna de ITEM (Etiquetas):</label>
                            <select 
                              value={columnaItem} 
                              onChange={(e) => setColumnaItem(e.target.value)} 
                              style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}
                            >
                              {renderOpcionesColumnas()}
                            </select>
                          </div>
                        )}

                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Eje de Tiempo (Años/Meses):</label>
                          <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}>{renderOpcionesColumnas()}</select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Valor Nominal (Sueldos/Ventas):</label>
                          <select value={selectedColumnY} onChange={(e) => setSelectedColumnY(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}>{renderOpcionesColumnas()}</select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Índice de Precios (IPC):</label>
                          <select value={colPrecioBase} onChange={(e) => setColPrecioBase(e.target.value)} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-color)" }}>{renderOpcionesColumnas()}</select>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div id="tour-seleccion-variables">
                    <label>{calculo === "series_tiempo" ? "Eje de Tiempo X:" : esBivariada || calculo === "regresion_simple" ? "Variable X:" : "Columna Seleccionada:"}</label>
                    <select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>{renderOpcionesColumnas()}</select>

                    {(esBivariada || calculo === "regresion_simple" || calculo === "series_tiempo") && (
                      <div style={{ padding: "10px", border: "1px solid var(--border-color)", borderRadius: "4px", marginBottom: "15px", backgroundColor: "var(--bg-card)" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>{calculo === "series_tiempo" ? "Valores Históricos Y (Demanda/Ventas):" : "Variable Y (Dependiente):"}</label>
                        <select value={selectedColumnY} onChange={(e) => setSelectedColumnY(e.target.value)} style={{ width: "100%", padding: "5px" }}><option value="">-- Seleccionar Variable Y --</option>{renderOpcionesColumnas()}</select>
                      </div>
                    )}
                  </div>
                )}

                {calculo === "series_tiempo" && (
                  <div className="container_intervalos" style={{ padding: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "4px", marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", color: "var(--primary-color)" }}>Método de Pronóstico:</label>
                    <select value={metodoSeries} onChange={(e) => setMetodoSeries(e.target.value)} className="container_select" style={{ marginBottom: "10px" }}>
                      <option value="movil_simple">Promedios Móviles Simples</option>
                      <option value="movil_ponderado">Promedios Móviles Ponderados</option>
                      <option value="suavizamiento_exponencial">Suavizamiento Exponencial</option>
                    </select>
                    {metodoSeries === "movil_simple" && <><label>Periodos (k):</label><input type="number" min="2" value={periodosK} onChange={(e) => setPeriodosK(e.target.value)} className="container_cal_input" /></>}
                    {metodoSeries === "movil_ponderado" && <><label>Pesos:</label><input type="text" value={pesos} onChange={(e) => setPesos(e.target.value)} className="container_cal_input" placeholder="Ej: 0.5, 0.3, 0.2" /></>}
                    {metodoSeries === "suavizamiento_exponencial" && <><label>Alfa (α):</label><input type="number" step="0.01" min="0" max="1" value={alfa} onChange={(e) => setAlfa(e.target.value)} className="container_cal_input" /></>}
                  </div>
                )}

                {esUnidimensional && calculo !== "frecuencias_completas" && calculo !== "estadistica_descriptiva" && (
                  <div className="container_intervalos">
                    {(calculo === "distribucion_intervalos" || calculo === "tendencia_central" || calculo === "tendencia_y_posicion" || calculo === "variabilidad_y_forma") && (
                      <>
                        <label>Tipo Intervalo:</label>
                        <select value={tipoIntervalo} onChange={(e) => setTipoIntervalo(e.target.value)} className="container_select">
                          <option value="semiabierto">[a, b)</option>
                          <option value="cerrado">[a, b]</option>
                          <option value="abierto">(a, b)</option>
                        </select>
                        <label>Método K:</label>
                        <select value={metodoK} onChange={(e) => setMetodoK(e.target.value)} className="container_select">
                          <option value="sturges">Sturges</option>
                          <option value="cuadratica">Cuadrática</option>
                          <option value="logaritmica">Logarítmica</option>
                          <option value="personalizada">Manual</option>
                        </select>
                        {metodoK === "personalizada" && <input type="number" value={kPersonalizado} onChange={(e) => setKPersonalizado(e.target.value)} placeholder="Valor k" className="container_cal_input" />}
                      </>
                    )}
                   {(calculo === "medidas_posicion" || calculo === "tendencia_y_posicion") && (
                      <div className="container_cal_percentil" style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ fontWeight: "bold", margin: 0 }}>
                          Percentil (1 - 99):
                        </label>
                        
                        {/* 🚀 Controles personalizados e indestructibles */}
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-color)", borderRadius: "2px", overflow: "hidden", backgroundColor: "var(--bg-card)" }}>
                          <button 
                            type="button"
                            onClick={() => setPercentilK(p => {
                              const actual = p === "" ? 50 : p;
                              return actual > 1 ? actual - 1 : 1;
                            })}
                            style={{ padding: "6px 12px", border: "none", background: "rgba(0,0,0,0.05)", color: "var(--text-main)", cursor: "pointer", fontWeight: "bold", borderRight: "1px solid var(--border-color)", fontSize: "1.1rem" }}
                          >
                            −
                          </button>
                          
                          <input 
                            type="text" // Usamos text para burlar las flechas ocultas del navegador
                            value={percentilK === "" ? "" : percentilK} 
                            onChange={(e) => {
                              const valor = e.target.value;
                              if (valor === "") { setPercentilK(""); return; }
                              const num = parseInt(valor, 10);
                              if (!isNaN(num) && num >= 1 && num <= 99) { setPercentilK(num); }
                            }} 
                            style={{
                              width: "45px", padding: "6px 0", border: "none", textAlign: "center",
                              backgroundColor: "transparent", color: "var(--text-main)", fontWeight: "bold", outline: "none"
                            }}
                          />
                          
                          <button 
                            type="button"
                            onClick={() => setPercentilK(p => {
                              const actual = p === "" ? 50 : p;
                              return actual < 99 ? actual + 1 : 99;
                            })}
                            style={{ padding: "6px 12px", border: "none", background: "rgba(0,0,0,0.05)", color: "var(--text-main)", cursor: "pointer", fontWeight: "bold", borderLeft: "1px solid var(--border-color)", fontSize: "1.1rem" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mostrarTabla && cantidadFilasVistaPrevia > 0 && (
                  <div id="tour-tabla-grid" ref={containerRef} className="container_dataset" style={{ marginTop: "10px", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <p className="info_vista" style={{ margin: 0 }}>Vista Previa (Doble clic para editar):</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Botón 1 (Actualizar Columna) */}
                        <div className="col-btn-container">
                          <button
                            type="button"
                            onClick={() => setMostrarActualizarCol(true)}
                            className="col-btn-minimal col-btn-blue"
                            title="Actualizar columna actual"
                            style={{ color: '#6b7280' }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }}
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <div className="col-btn-tooltip">
                            Actualizar columna actual
                          </div>
                        </div>

                        {/* Botón 2 (Crear Nueva Columna) */}
                        <div className="col-btn-container">
                          <button
                            type="button"
                            onClick={() => {
                              setNombreNuevaColumna("");
                              setIsOpenNuevaColumna(true);
                            }}
                            className="col-btn-minimal col-btn-green"
                            title="Crear nueva columna"
                            style={{ color: '#6b7280' }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }}
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          </button>
                          <div className="col-btn-tooltip">
                            Crear nueva columna
                          </div>
                        </div>
                      </div>
                    </div>
                    <DataGrid
                      columns={rdgColumns}
                      rows={mappedRows}
                      onRowsChange={handleMappedGridChange}
                      className="rdg-light"
                      style={{ blockSize: "100%", border: "1px solid var(--border-color)", height: "400px", textAlign: "center", width: "100%" }}
                    />
                  </div>
                )}

                <button id="tour-btn-calcular" onClick={ejecutarCalculo} className="button_calcular" style={{ marginTop: "15px" }}>CALCULAR</button>
              </div>
            ) : (
              <p className="info_cargando">Cargando datos o selecciona un archivo...</p>
            )}

            {/* <button
              onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
              style={{ width: "100%", padding: "8px", background: "#6b7280", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "10px" }}
            >
              {mostrarCalculadora ? "Ocultar Calculadora Manual" : "Mostrar Calculadora Manual"}
            </button>
            {mostrarCalculadora && <Calculator />} */}
          </>
        )}
      </div>

      {mostrarActualizarCol && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 99999
        }}>
          <div style={{
            background: "var(--bg-card)",
            padding: "25px",
            borderRadius: "10px",
            width: "450px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}>
            <h3 style={{ margin: 0, color: "var(--primary-color)" }}>Actualizar Datos de Columna</h3>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>
                Selecciona la Columna:
              </label>
              <select
                value={columnaAEditar}
                onChange={(e) => {
                  const col = e.target.value;
                  setColumnaAEditar(col);
                  const vals = excelData.map(row => row[col] !== undefined ? row[col] : "");
                  setTextoValores(vals.join("\n"));
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }}
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "var(--text-main)" }}>
                Valores (uno por línea o separados por comas):
              </label>
              <textarea
                value={textoValores}
                onChange={(e) => setTextoValores(e.target.value)}
                rows="10"
                placeholder="Escribe los nuevos valores de la columna..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
              <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Puedes copiar una columna de Excel y pegarla directamente aquí.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "5px" }}>
              <button
                type="button"
                onClick={() => setMostrarActualizarCol(false)}
                style={{ padding: "8px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!columnaAEditar) return;
                  let parts = [];
                  if (textoValores.includes("\n")) {
                    parts = textoValores.split("\n");
                  } else if (textoValores.includes(",")) {
                    parts = textoValores.split(",");
                  } else {
                    parts = [textoValores];
                  }
                  const values = parts.map(p => p.trim());
                  handleActualizarColumna(columnaAEditar, values);
                  setMostrarActualizarCol(false);
                }}
                style={{ padding: "8px 20px", background: "var(--accent-color)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpenNuevaColumna && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 99999
        }}>
          <div style={{
            background: "var(--bg-card)",
            padding: "25px",
            borderRadius: "10px",
            width: "450px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "15px"
          }}>
            <h3 style={{ margin: 0, color: "var(--primary-color)" }}>Crear Nueva Columna</h3>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "var(--text-main)" }}>
                Nombre de la Columna:
              </label>
              <input
                type="text"
                value={nombreNuevaColumna}
                onChange={(e) => setNombreNuevaColumna(e.target.value)}
                placeholder="Ej: Edad, Calificaciones, etc."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  boxSizing: "border-box"
                }}
                required
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setIsOpenNuevaColumna(false)}
                style={{ padding: "8px 15px", background: "var(--bg-main)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (nombreNuevaColumna && nombreNuevaColumna.trim()) {
                    handleCrearColumna(nombreNuevaColumna.trim());
                    setIsOpenNuevaColumna(false);
                  }
                }}
                style={{ padding: "8px 20px", background: "var(--accent-color)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}