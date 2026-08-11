import React, { useState, useEffect, useRef, useMemo } from 'react';
import 'react-data-grid/lib/styles.css';
import { useMAT251Data } from '../../../components/Gestion_Datos/DataContext';
import { calcularTecnicasConteo, calcularProbabilidadClasica, calcularProbabilidadCondicional, calcularProbabilidadTotalParticion } from '../Matematicas/logica_Tema1';
import { calcularMomentosDiscreta } from '../Matematicas/logica_Tema2';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../styles/pages/Pantalla.css';


// ── IMPORTACIONES DE LA NUEVA ESTRUCTURA ──
import { FONT, FS, RADIUS, OPERACIONES, filaVacia, labelStyle } from '../Principal/Constantes';
import ModalEditor, { textEditor } from '../Temas/Tema_1/Modales/Modal_Editor';
import ModalEventos from '../Temas/Tema_1/Modales/Modal_Eventos_Modify';
import ModalVariables from '../Temas/Tema_1/Modales/Modal_Variables'; 

import ControlesConteo from '../Temas/Tema_1/Controles/Controles_Conteo';
import ControlesProbabilidad from '../Temas/Tema_1/Controles/Controles_Probabilidad';
import ResultadosConteo from '../Temas/Tema_1/Resultados/Resultados_conteo';
import ResultadosProbabilidad from '../Temas/Tema_1/Resultados/Resultados_Probabilidad';
import ResultadosSimuladorTotal from '../Temas/Tema_1/Resultados/Resultados_SimuladorTotal';
import ControlesReglaAdicion from '../Temas/Tema_1/Controles/Controles_ReglaAdicion';
import ResultadosReglaAdicion from '../Temas/Tema_1/Resultados/Resultados_ReglaAdicion';
import ResultadosReglaMultiplicacion from '../Temas/Tema_1/Resultados/Resultados_ReglaMultiplicacion';
import ResultadosMuestreo from '../Temas/Tema_1/Resultados/Resultados_Muestreo';
import ResultadosEspacioContinuo from '../Temas/Tema_1/Resultados/Resultados_EspacioContinuo';

import Resultados_DistribucionesMuestrales from '../Temas/Tema_1/Resultados/Resultados_DistribucionesMuestrales';

import Operacion from '../Temas/Tema_1/Controles/Operacion';
import Controles_DistribucionDiscreta from '../Temas/Tema_2/Controles/Controles_DistribucionDiscreta';
import ControlDistribucionContinua from '../Temas/Tema_2/Controles/ControlDistribucionContinua';
import ControlDistribucionContinua_v2 from '../Temas/Tema_2/Controles/ControlDistribucionContinua_v2';
import Resultados_DistribucionDiscreta from '../Temas/Tema_2/Resultados/Resultados_DistribucionDiscreta';
import ResultadoDistribucionContinua from '../Temas/Tema_2/Resultados/ResultadoDistribucionContinua';
import ResultadoDistribucionContinua_v2 from '../Temas/Tema_2/Resultados/ResultadoDistribucionContinua_v2';
import { calcularMomentosTeoricos } from '../Matematicas/logica_Tema2_v2';
import '../styles/Temas/Tema2.css';

import Controles_ModelosDiscretos from '../Temas/Tema_3/Controles/Controles_ModelosDiscretos';
import Resultados_ModelosDiscretos from '../Temas/Tema_3/Resultados/Resultados_ModelosDiscretos';
import Controles_ModelosContinuos from '../Temas/Tema_3/Controles/Controles_ModelosContinuos';
import GraficoModelosContinuos from '../Graficas/Tema_3/GraficoModelosContinuos';
import Resultados_ModelosContinuos from '../Temas/Tema_3/Resultados/Resultados_ModelosContinuos';
import GraficoBastonesModelos from '../Graficas/Tema_3/GraficoBastonesModelos';
import ModalProcedimientoModelos from '../Temas/Tema_3/Modales/ModalProcedimientoModelos';
import '../styles/Temas/Tema3.css';

export default function Principal() {
    const { variables } = useMAT251Data();

    // ── UI ───────────────────────────────────────────────────────────────────────
    const [panelAbierto, setPanelAbierto] = useState(true);
    const [operacion, setOperacion] = useState('');
    const [subTipoProbabilidad, setSubTipoProbabilidad] = useState('clasica');
    const [columnaParticion, setColumnaParticion] = useState(''); // Para probabilidad total

    // ── Conteo ───────────────────────────────────────────────────────────────────
    const [n, setN] = useState('0');
    const [r, setR] = useState('0');
    const [resConteo, setResConteo] = useState(null);
    const [tipoElementos, setTipoElementos] = useState('letras');
    const [customElementsInput, setCustomElementsInput] = useState('');

    const parsedElements = useMemo(() => {
        if (!customElementsInput.trim()) {
            return [];
        }
        return customElementsInput.split(',').map(el => el.trim()).filter(Boolean);
    }, [customElementsInput]);

    const finalElements = useMemo(() => {
        const numN = parseInt(n) || 0;
        if (tipoElementos === 'letras') {
            return Array.from({ length: numN }, (_, i) => String.fromCharCode(65 + i));
        }
        if (tipoElementos === 'numeros') {
            return Array.from({ length: numN }, (_, i) => (i + 1).toString());
        }

        let elements = [...parsedElements];
        if (elements.length < numN) {
            let index = 0;
            while (elements.length < numN) {
                let candidate = String.fromCharCode(65 + index);
                while (elements.includes(candidate)) {
                    index++;
                    candidate = String.fromCharCode(65 + index);
                }
                elements.push(candidate);
                index++;
            }
        } else if (elements.length > numN) {
            elements = elements.slice(0, numN);
        }
        return elements;
    }, [parsedElements, tipoElementos, n]);

    // ── Probabilidad ─────────────────────────────────────────────────────────────
    const [filas, setFilas] = useState([filaVacia(1), filaVacia(2), filaVacia(3)]);
    const [eventoFavorable, setEventoFavorable] = useState([]);
    const [eventoCondicion, setEventoCondicion] = useState([]);
    const [resProbabilidad, setResProbabilidad] = useState(null);
    const [varSeleccionada, setVarSeleccionada] = useState(null);
    const [modalVars, setModalVars] = useState(false);
    const [modalEditor, setModalEditor] = useState(false);
    const [modalEvento, setModalEvento] = useState(false);
    const [modalCondicion, setModalCondicion] = useState(false);
    const [filasTemp, setFilasTemp] = useState([]);   // copia editable en el modal
    const formulaProbRef = useRef(null);

    // ── Simulador Probabilidad Total ─────────────────────────────────────────────
    const [numRamas, setNumRamas] = useState(2);
    const [ramas, setRamas] = useState([]);
    const [errorSimulador, setErrorSimulador] = useState('');
    const [resultadoSimulador, setResultadoSimulador] = useState(null);
    const [colCausa, setColCausa] = useState('');
    const [colEvento, setColEvento] = useState('');
    const [valExito, setValExito] = useState('');

    // ── Regla de Adición ─────────────────────────────────────────────────────────────
    const [colA_Adicion, setColA_Adicion] = useState('');
    const [valA_Adicion, setValA_Adicion] = useState('');
    const [colB_Adicion, setColB_Adicion] = useState('');
    const [valB_Adicion, setValB_Adicion] = useState('');
    const [resultadoAdicion, setResultadoAdicion] = useState(null);
    const [errorAdicion, setErrorAdicion] = useState('');

    // ── Regla de Multiplicación ──────────────────────────────────────────────────
    const [modReemplazo, setModReemplazo] = useState('con_reemplazo');
    const [colA_Mult, setColA_Mult] = useState('');
    const [valA_Mult, setValA_Mult] = useState('');
    const [colB_Mult, setColB_Mult] = useState('');
    const [valB_Mult, setValB_Mult] = useState('');
    const [resultadoMult, setResultadoMult] = useState(null);
    const [errorMult, setErrorMult] = useState('');

    // ── Muestreo ─────────────────────────────────────────────────────────────────
    const [metodoMuestreo, setMetodoMuestreo] = useState('mas');
    const [tamanoMuestra, setTamanoMuestra] = useState('');
    const [varEstratificacion, setVarEstratificacion] = useState('');
    const [resultadoMuestreo, setResultadoMuestreo] = useState(null);
    const [errorMuestreo, setErrorMuestreo] = useState('');

    // ── Uniforme ─────────────────────────────────────────────────────────────────
    const [varUniforme, setVarUniforme] = useState('');
    const [inputMin, setInputMin] = useState('');
    const [inputMax, setInputMax] = useState('');
    const [resultadoUniforme, setResultadoUniforme] = useState(null);
    const [errorUniforme, setErrorUniforme] = useState('');

    // Estados para Tema 2: Discreta y Continua
    const [datosDiscretos, setDatosDiscretos] = useState(null);
    const [datosContinuos, setDatosContinuos] = useState(null);
    const [datosContinuosV2, setDatosContinuosV2] = useState(null);

    // Resultados Tema 3
    const [datosTema3, setDatosTema3] = useState(null);
    const [datosTema3Continuos, setDatosTema3Continuos] = useState(null);
    const [modalProcTema3, setModalProcTema3] = useState(false);

    // ==========================================FUNCIONES //

    const handleCalcularContinuaV2 = (tipo, parametros) => {
        if (!tipo) {
            setDatosContinuosV2(null);
            return;
        }
        if (parametros.modoB) {
            setDatosContinuosV2({ tipo, parametros, resultados: null });
        } else {
            const resultados = calcularMomentosTeoricos(tipo, parametros);
            setDatosContinuosV2({ tipo, parametros, resultados });
        }
    };

    // Valores unicos de un Espacio mustral
    const valoresUnicos = useMemo(() => {
        const vals = filas.map(f => f.valor.toString().trim()).filter(Boolean);
        return [...new Set(vals)].sort();
    }, [filas]);

    // Conteos de datos (cargados vs agregados)
    const statsDatos = useMemo(() => {
        const validas = filas.filter(f => f.valor.toString().trim() !== '');
        const cargados = validas.filter(f => f.origen === 'cargado').length;
        const agregados = validas.filter(f => f.origen === 'agregado').length;
        return { cargados, agregados, total: validas.length };
    }, [filas]);

    // Detectar si hay cambios en el editor para habilitar/deshabilitar el botón Guardar
    const hayCambiosEditor = useMemo(() => {
        let limpiosOriginal = filas.filter(f => (f.valor || '').toString().trim() !== '').map(f => (f.valor || '').toString().trim());
        let limpiosTemp = [];

        if (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
            limpiosTemp = filasTemp.filter(f => {
                return varSeleccionada.nombresColumnas.some((_, idx) => (f[`col_${idx}`] || '').toString().trim() !== '');
            }).map(f => varSeleccionada.nombresColumnas.map((_, idx) => (f[`col_${idx}`] || '').toString().trim()).join(' | '));
        } else {
            limpiosTemp = filasTemp.filter(f => (f.valor || '').toString().trim() !== '').map(f => (f.valor || '').toString().trim());
        }

        if (limpiosOriginal.length !== limpiosTemp.length) return true;
        return limpiosOriginal.some((val, idx) => val !== limpiosTemp[idx]);
    }, [filas, filasTemp, varSeleccionada]);

    // Frecuencias para el selector de eventos
    const statsEventos = useMemo(() => {
        const counts = {};
        const validas = filas.map(f => (f.valor || '').toString().trim()).filter(Boolean);
        validas.forEach(v => {
            if (v.includes(' | ')) {
                const partes = v.split(' | ').map(p => p.trim());
                partes.forEach(p => {
                    if (p) counts[p] = (counts[p] || 0) + 1;
                });
            } else {
                counts[v] = (counts[v] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([valor, count]) => ({ valor, count }))
            .sort((a, b) => a.valor.localeCompare(b.valor));
    }, [filas]);

    // Frecuencias agrupadas por columna (para datos multi-columna)
    const statsEventosPorColumna = useMemo(() => {
        const nombresColumnas = varSeleccionada?.nombresColumnas;
        if (!nombresColumnas || nombresColumnas.length <= 1) return null; // null = sin agrupación

        const validas = filas.map(f => (f.valor || '').toString().trim()).filter(Boolean);
        // Construir contadores por columna
        const porColumna = nombresColumnas.map(nombre => ({ nombre, counts: {} }));

        validas.forEach(v => {
            const partes = v.split(' | ').map(p => p.trim());
            nombresColumnas.forEach((_, idx) => {
                const val = partes[idx];
                if (val) porColumna[idx].counts[val] = (porColumna[idx].counts[val] || 0) + 1;
            });
        });

        return porColumna.map(col => ({
            nombre: col.nombre,
            eventos: Object.entries(col.counts)
                .map(([valor, count]) => ({ valor, count }))
                .sort((a, b) => a.valor.localeCompare(b.valor))
        }));
    }, [filas, varSeleccionada]);


    // Columnas dinámicas para el DataGrid (Editor)
    const columns = useMemo(() => {
        const base = [
            {
                key: 'id',
                name: 'Nº',
                width: 50,
                frozen: true,
                cellClass: 'rdg-cell-center'
            }
        ];

        if (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
            varSeleccionada.nombresColumnas.forEach((colName, idx) => {
                base.push({
                    key: `col_${idx}`,
                    name: colName,
                    renderEditCell: textEditor,
                    editable: true,
                    cellClass: 'rdg-cell-center'
                });
            });
            return base;
        }

        base.push({
            key: 'valor',
            name: varSeleccionada?.nombre ? ` ${varSeleccionada.nombre}` : (subTipoProbabilidad === 'frecuentista' ? 'Observación' : 'Datos (Valores)'),
            renderEditCell: textEditor,
            editable: true,
            cellClass: 'rdg-cell-center'
        });
        return base;
    }, [varSeleccionada, subTipoProbabilidad]);

    // Derivar inputDatos desde filas
    const inputDatos = filas.map(f => f.valor.toString().trim()).filter(Boolean).join(', ');

    // Helpers

    const ajustar = (setFn, val, op) => {
        const v = parseInt(val) || 0;
        setFn(Math.max(0, op === '+' ? v + 1 : v - 1).toString());
    };

    const abrirEditor = () => {
        let temp = [...filas, filaVacia(filas.length + 1)];
        if (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
            temp = temp.map(f => {
                const parts = (f.valor || '').toString().split(' | ');
                const newF = { ...f };
                varSeleccionada.nombresColumnas.forEach((_, idx) => {
                    newF[`col_${idx}`] = parts[idx] ? parts[idx].trim() : '';
                });
                return newF;
            });
        }
        setFilasTemp(temp);
        setModalEditor(true);
    };

    const guardarEditor = () => {
        let limpias = [];
        if (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
            limpias = filasTemp.filter(f => {
                const isNotEmpty = varSeleccionada.nombresColumnas.some((_, idx) => (f[`col_${idx}`] || '').toString().trim() !== '');
                if (!isNotEmpty) return false;
                f.valor = varSeleccionada.nombresColumnas.map((_, idx) => (f[`col_${idx}`] || '').toString().trim()).join(' | ');
                return true;
            });
        } else {
            limpias = filasTemp.filter(f => (f.valor || '').toString().trim() !== '');
        }

        const renumeradas = limpias.map((f, i) => ({ ...f, id: i + 1, valor: f.valor }));
        setFilas(renumeradas.length ? renumeradas : [filaVacia(1)]);
        setEventoFavorable([]);
        setResProbabilidad(null);
        setModalEditor(false);
    };

    const cargarVariable = (varsArray) => {
        const arr = Array.isArray(varsArray) ? varsArray : [varsArray];
        if (arr.length === 0) return;

        const nombreCombinado = arr.map(v => v.nombre).join(' | ');
        const longitud = arr[0]?.datos?.length || 0;
        const nuevas = [];

        for (let i = 0; i < longitud; i++) {
            const filaCombinada = arr.map(v => v.datos[i] !== undefined ? v.datos[i].toString() : '').join(' | ');
            nuevas.push({ id: i + 1, valor: filaCombinada, origen: 'cargado' });
        }

        setFilas(nuevas);
        setEventoFavorable([]);
        setEventoCondicion([]);
        setResProbabilidad(null);
        setVarSeleccionada({
            nombre: nombreCombinado,
            esCombinada: arr.length > 1,
            datos: nuevas.map(n => n.valor),
            // Si es combinación de varias variables, los nombres de columna son los nombres de esas variables
            // Si es una sola variable, usa su propio nombresColumnas (puede existir si viene de Excel multi-col)
            nombresColumnas: arr.length > 1 ? arr.map(v => v.nombre) : (arr[0]?.nombresColumnas || null)
        });
        setModalVars(false);
    };

    // Sincronizar datos si la variable es editada/eliminada en Gestión de Datos
    useEffect(() => {
        if (!varSeleccionada) return;
        if (varSeleccionada.esCombinada) return; // Si es combinada omitimos la sincronización automática
        const varActualizada = variables.find(v => v.nombre === varSeleccionada.nombre);

        if (!varActualizada) {
            setVarSeleccionada(null);
            setFilas([filaVacia(1), filaVacia(2), filaVacia(3)]);
            setEventoFavorable([]);
            setResProbabilidad(null);
            return;
        }

        const datosViejos = JSON.stringify(varSeleccionada.datos);
        const datosNuevos = JSON.stringify(varActualizada.datos);

        if (datosViejos !== datosNuevos) {
            setVarSeleccionada(varActualizada);
            const nuevas = varActualizada.datos.map((d, i) => ({ id: i + 1, valor: d.toString(), origen: 'cargado' }));
            setFilas(nuevas);
            setEventoFavorable([]);
            setEventoCondicion([]);
            setColumnaParticion('');
            setResProbabilidad(null);
        }
    }, [variables, varSeleccionada]);

    // Katex



    useEffect(() => {
        if (formulaProbRef.current && resProbabilidad) {
            let latex = '';
            if (subTipoProbabilidad === 'frecuentista') {
                latex = `P(A)=\\dfrac{f}{n}=\\dfrac{${resProbabilidad.casosFavorables}}{${resProbabilidad.casosTotales}}=${resProbabilidad.probabilidadDecimal}`;
            } else if (subTipoProbabilidad === 'condicional') {
                latex = `P(A|B)=\\dfrac{n(A \\cap B)}{n(B)}=\\dfrac{${resProbabilidad.casosFavorables}}{${resProbabilidad.casosTotales}}=${resProbabilidad.probabilidadDecimal}`;
            } else if (subTipoProbabilidad === 'total') {
                latex = `P(A) = \\sum_{i} P(A|B_i)P(B_i) = ${resProbabilidad.probabilidadDecimal}`;
            } else {
                latex = `P(A)=\\dfrac{n(A)}{N}=\\dfrac{${resProbabilidad.casosFavorables}}{${resProbabilidad.casosTotales}}=${resProbabilidad.probabilidadDecimal}`;
            }
            katex.render(latex, formulaProbRef.current, { throwOnError: false, displayMode: true });
        }
    }, [resProbabilidad, subTipoProbabilidad]);

    // Calcular

    const ejecutar = () => {
        if (operacion === 'conteo') {
            const res = calcularTecnicasConteo(n, r, finalElements);
            if (res?.error) { alert(res.error); return; }
            setResConteo({ ...res, n, r });
            setResProbabilidad(null);
        } else {
            if (!inputDatos) { alert('Agrega datos al espacio muestral'); return; }
            const arr = inputDatos.split(',').map(d => d.trim()).filter(Boolean);

            if (subTipoProbabilidad === 'condicional') {
                const res = calcularProbabilidadCondicional(arr, eventoFavorable, eventoCondicion);
                if (res?.error) { alert(res.error); return; }
                setResProbabilidad(res);
                setResConteo(null);
            } else if (subTipoProbabilidad === 'total') {
                const res = calcularProbabilidadTotalParticion(arr, varSeleccionada?.nombresColumnas, columnaParticion, eventoFavorable);
                if (res?.error) { alert(res.error); return; }
                setResProbabilidad(res);
                setResConteo(null);
            } else {
                const res = calcularProbabilidadClasica(arr, eventoFavorable);
                if (res?.error) { alert(res.error); return; }
                setResProbabilidad(res);
                setResConteo(null);
            }
        }
    };

    const handleOperacion = (val) => {
        setOperacion(val);
        if (val === 'probabilidad') setSubTipoProbabilidad('clasica');
        setResConteo(null);
        setResProbabilidad(null);
        setResultadoAdicion(null);
        setErrorAdicion('');
        setResultadoMult(null);
        setErrorMult('');
        setResultadoMuestreo(null);
        setErrorMuestreo('');
        setResultadoUniforme(null);
        setErrorUniforme('');
    };

    // Al cambiar subTipo, borrar resultados
    useEffect(() => {
        setResProbabilidad(null);
    }, [subTipoProbabilidad]);

    const hayResultado = resConteo || resProbabilidad;

    // Filtrar la columna usada en la condición (B) para que no aparezca en el evento de interés (A)
    const statsEventosPorColumnaParaA = useMemo(() => {
        if (!statsEventosPorColumna) return null;
        if (eventoCondicion.length === 0) return statsEventosPorColumna;

        const columnasUsadasEnB = statsEventosPorColumna.filter(col =>
            col.eventos.some(e => eventoCondicion.includes(e.valor))
        ).map(col => col.nombre);

        return statsEventosPorColumna.filter(col => !columnasUsadasEnB.includes(col.nombre));
    }, [statsEventosPorColumna, eventoCondicion]);

    return (
        <div className={`calculadora-layout ${panelAbierto ? '' : 'colapsado'}`} style={{ position: 'relative', fontFamily: FONT }}>
            {/* Estilos locales para el grid y modal */}
            <style>{`
                    .rdg-cell-center {
                    text-align: center !important;
                    line-height: 35px !important;
                    }
                    .rdg-header-row .rdg-cell {
                    text-align: center !important;
                    font-weight: 700 !important;
                    background-color: var(--bg-input) !important;
                    line-height: 35px !important;
                    }
                    .btn-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    }
                    .btn-icon:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                    }
            `}</style>
            <button onClick={() => setPanelAbierto(!panelAbierto)} className={`boton-toggle-medio ${panelAbierto ? 'abierto' : 'cerrado'}`} title={panelAbierto ? 'Ocultar panel' : 'Mostrar panel'}>
                <span className={`icono-toggle ${panelAbierto ? 'abierto' : 'cerrado'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: FS.base, color: '#fff', transition: 'transform 0.3s ease', lineHeight: 0, marginTop: '-2px', marginLeft: '-1px' }}>❮</span>
            </button>

            {/* PANEL IZQUIERDO */}
            <div className="calculadora-datos" style={{ fontFamily: FONT }}>
                <div>
                    {panelAbierto && <h3 style={{ fontSize: FS.lg, fontFamily: FONT, fontWeight: 600 }}>Parámetros</h3>}
                </div>
                {panelAbierto && (
                    <div className="panel-controles-excel" style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
                        {/* Selector de operación iterativo (Personalizado) */}
                        {/* Selector de operación iterativo (Personalizado) */}
                        <label style={{ ...labelStyle, fontSize: FS.xs, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operación:</label>
                        <Operacion operacion={operacion} handleOperacion={handleOperacion} />

                        {/* Hint cuando no hay operación */}
                        {!operacion && (
                            <div style={{ padding: '12px', background: 'var(--bg-body, #f8fafc)', border: '1px dashed var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)', opacity: 0.5, marginBottom: '6px' }}>
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <p style={{ margin: 0, fontSize: FS.xs, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    Expande un tema y elige<br />una operación para continuar.
                                </p>
                            </div>
                        )}

                        {/* SUB-SELECTOR DE PROBABILIDAD */}
                        {operacion === 'probabilidad' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ ...labelStyle, fontSize: '1.1em', marginBottom: '8px' }}>Tipo de Probabilidad:</label>
                                <div style={{ display: 'flex', gap: '5px', background: 'var(--bg-card)', padding: '4px', borderRadius: RADIUS, border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'clasica', label: 'Clásica' },
                                        { id: 'frecuentista', label: 'Frecuentista' },
                                        { id: 'condicional', label: 'Condicional' }
                                    ].map(tipo => (
                                        <button
                                            key={tipo.id}
                                            onClick={() => setSubTipoProbabilidad(tipo.id)}
                                            style={{
                                                flex: 1,
                                                padding: '8px 4px',
                                                border: 'none',
                                                borderRadius: RADIUS,
                                                background: subTipoProbabilidad === tipo.id ? 'var(--primary-color)' : 'transparent',
                                                color: subTipoProbabilidad === tipo.id ? 'white' : 'var(--text-color)',
                                                fontWeight: subTipoProbabilidad === tipo.id ? 600 : 400,
                                                cursor: 'pointer',
                                                fontSize: FS.sm,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {tipo.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEPARACION DE CONTROLES */}
                        {operacion === 'conteo' && (
                            <ControlesConteo
                                n={n} setN={setN} r={r} setR={setR}
                                ajustar={ajustar} ejecutar={ejecutar}
                                customElementsInput={customElementsInput}
                                setCustomElementsInput={setCustomElementsInput}
                                parsedElements={parsedElements}
                                tipoElementos={tipoElementos}
                                setTipoElementos={setTipoElementos}
                            />
                        )}
                        {(operacion === 'probabilidad' || operacion === 'simulador_total' || operacion === 'regla_adicion' || operacion === 'regla_multiplicacion' || operacion === 'muestreo' || operacion === 'distribuciones_muestrales' || operacion === 'dist_uniforme' || operacion === 'dist_discreta' || operacion === 'dist_continua' || operacion === 'esperanza_varianza' || operacion === 'momentos_asimetria' || operacion === 'modelos_discretos' || operacion === 'modelos_continuos') && (
                            <ControlesProbabilidad setModalVars={setModalVars} varSeleccionada={varSeleccionada} />
                        )}
                    </div>
                )}
            </div>

            {/* PANEL RESULTADOS */}

            <div className="calculadora-resultados" style={{ fontFamily: FONT }}>
                <div className="frecuencias" style={{ borderRadius: RADIUS }}>
                    {operacion && (
                        <h4 style={{ fontSize: FS.sx, fontFamily: FONT, fontWeight: 500, color: 'var(--primary-color)', margin: '0', display: 'flex', alignItems: 'center' }}>
                            Resultados: <span style={{ color: 'var(--text-main)', marginLeft: '6px' }}>{operacion === 'conteo' ? 'TÉCNICAS DE CONTEO' : operacion === 'simulador_total' ? 'PROBABILIDAD TOTAL' : operacion === 'regla_adicion' ? 'AXIOMAS Y REGLA DE LA ADICIÓN' : operacion === 'regla_multiplicacion' ? 'REGLA DE LA MULTIPLICACIÓN' : operacion === 'muestreo' ? 'INTRODUCCIÓN AL MUESTREO' : operacion === 'dist_uniforme' ? 'PROBABILIDAD EN ESPACIO CONTINUO' : operacion === 'dist_discreta' ? 'VARIABLE ALEATORIA DISCRETA' : operacion === 'dist_continua' ? 'CALCULADORA (BETA)' : operacion === 'dist_continua_v2' ? 'VARIABLE ALEATORIA CONTINUA' : operacion === 'modelos_discretos' ? 'DISTRIBUCIONES DISCRETAS' : operacion === 'modelos_continuos' ? 'DISTRIBUCIONES CONTINUAS' : (subTipoProbabilidad === 'clasica' ? 'PROBABILIDAD CLÁSICA' : subTipoProbabilidad === 'frecuentista' ? 'PROBABILIDAD FRECUENTISTA' : 'PROBABILIDAD CONDICIONAL')}</span>
                        </h4>
                    )}

                    {/* RESULTADOS */}
                    {!operacion ? (
                        <div style={{ padding: '24px 20px', fontFamily: FONT }}>
                            {/* Header bienvenida */}
                            <div className="banner-bienvenida">
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9, marginBottom: '6px' }}>
                                    MAT 251 — Estadística Matemática
                                </div>
                                <p style={{ margin: 0, fontSize: FS.xs, opacity: 0.75 }}>
                                    Selecciona un tema del panel izquierdo para comenzar
                                </p>
                            </div>

                            {/* Tarjetas de los 6 temas */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                                {[
                                    { num: '01', titulo: 'Cálculo de probabilidades e introducción al muestreo', ops: 7, activo: true },
                                    { num: '02', titulo: 'Variables aleatorias', ops: 2, activo: true },
                                    { num: '03', titulo: 'Distribuciones discretas y continuas importantes', ops: 1, activo: true },
                                    { num: '04', titulo: 'Distribuciones en el muestreo estadístico', ops: 0, activo: false },
                                    { num: '05', titulo: 'Pruebas de hipótesis paramétricas y no paramétricas', ops: 0, activo: false },
                                    { num: '06', titulo: 'Estimación e inferencia estadística', ops: 0, activo: false },
                                ].map(t => (
                                    <div key={t.num} style={{
                                        padding: '12px 14px',
                                        border: `1px solid ${t.activo ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        borderRadius: RADIUS,
                                        background: t.activo ? 'rgba(0,123,255,0.04)' : 'var(--bg-card)',
                                        opacity: t.activo ? 1 : 0.55,
                                        cursor: t.activo ? 'default' : 'not-allowed',
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: t.activo ? 'var(--primary-color)' : 'var(--text-muted)', lineHeight: 1 }}>
                                                T{t.num}
                                            </span>
                                            {t.activo ? (
                                                <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(0,123,255,0.12)', color: 'var(--primary-color)', fontWeight: 700 }}>
                                                    {t.ops} operaciones
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(148,163,184,0.15)', color: '#94a3b8', fontWeight: 600 }}>
                                                    Próximamente
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: FS.xs, color: t.activo ? 'var(--text-color)' : 'var(--text-muted)', lineHeight: 1.4 }}>
                                            {t.titulo}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : operacion === 'dist_discreta' ? (
                        <div className="tema2-container">
                            <Controles_DistribucionDiscreta
                                varSeleccionada={varSeleccionada}
                                filas={filas}
                                statsDatos={statsDatos}
                                abrirEditor={abrirEditor}
                                onCalcular={(datosRaw) => {
                                    const calculos = calcularMomentosDiscreta(datosRaw);
                                    setDatosDiscretos(calculos);
                                }}
                            />
                            <Resultados_DistribucionDiscreta resultados={datosDiscretos} />
                        </div>
                    ) : operacion === 'dist_continua' ? (
                        <div className="tema2-container">
                            <ControlDistribucionContinua onCalcular={setDatosContinuos} />
                            <ResultadoDistribucionContinua resultados={datosContinuos} />
                        </div>
                    ) : operacion === 'dist_continua_v2' ? (
                        <div className="tema2-container">
                            <ControlDistribucionContinua_v2 onCalcular={handleCalcularContinuaV2} />
                            {datosContinuosV2 && (
                                <>
                                    <ResultadoDistribucionContinua_v2 
                                        resultados={datosContinuosV2.resultados} 
                                        tipo={datosContinuosV2.tipo} 
                                        parametros={datosContinuosV2.parametros}
                                    />
                                </>
                            )}
                        </div>
                    ) : operacion === 'modelos_discretos' ? (
                        <div className="tema3-container">
                            <Controles_ModelosDiscretos 
                                varSeleccionada={varSeleccionada}
                                filas={filas}
                                statsDatos={statsDatos}
                                abrirEditor={abrirEditor}
                                onCalcular={(datos) => {
                                    setDatosTema3(datos);
                                }}
                            >
                                {datosTema3 && (
                                    <>
                                        <GraficoBastonesModelos 
                                            datos={datosTema3.datosGrafico} 
                                            condicion={datosTema3.condicion} 
                                            resultados={datosTema3.resultados}
                                        />
                                        <Resultados_ModelosDiscretos 
                                            resultados={datosTema3.resultados} 
                                            modelo={datosTema3.modelo} 
                                            params={datosTema3.params}
                                            onOpenProcedimiento={(tipo) => setModalProcTema3(tipo)}
                                        />
                                    </>
                                )}
                            </Controles_ModelosDiscretos>
                        </div>
                    ) : operacion === 'modelos_continuos' ? (
                        <div className="tema3-container">
                            <Controles_ModelosContinuos 
                                varSeleccionada={varSeleccionada}
                                filas={filas}
                                statsDatos={statsDatos}
                                abrirEditor={abrirEditor}
                                onCalcular={(datos) => {
                                    setDatosTema3Continuos(datos);
                                }}
                            >
                                {datosTema3Continuos && (
                                    <>
                                        <GraficoModelosContinuos 
                                            datos={datosTema3Continuos.datosGrafico} 
                                            condicion={datosTema3Continuos.condicion} 
                                            resultados={datosTema3Continuos.resultados}
                                        />
                                        <Resultados_ModelosContinuos 
                                            resultados={datosTema3Continuos.resultados} 
                                            modelo={datosTema3Continuos.modelo} 
                                            condicion={datosTema3Continuos.condicion}
                                            params={datosTema3Continuos.params}
                                            onOpenProcedimiento={(tipo) => setModalProcTema3(tipo)}
                                        />
                                    </>
                                )}
                            </Controles_ModelosContinuos>
                        </div>
                    ) : operacion === 'dist_uniforme' ? (
                        <ResultadosEspacioContinuo
                            varSeleccionada={varSeleccionada} filas={filas}
                            varUniforme={varUniforme} setVarUniforme={setVarUniforme}
                            inputMin={inputMin} setInputMin={setInputMin}
                            inputMax={inputMax} setInputMax={setInputMax}
                            resultado={resultadoUniforme} setResultado={setResultadoUniforme}
                            error={errorUniforme} setError={setErrorUniforme}
                            statsDatos={statsDatos} abrirEditor={abrirEditor}
                        />
                    ) : operacion === 'muestreo' ? (
                        <ResultadosMuestreo
                            varSeleccionada={varSeleccionada} filas={filas}
                            metodoMuestreo={metodoMuestreo} setMetodoMuestreo={setMetodoMuestreo}
                            tamanoMuestra={tamanoMuestra} setTamanoMuestra={setTamanoMuestra}
                            varEstratificacion={varEstratificacion} setVarEstratificacion={setVarEstratificacion}
                            resultado={resultadoMuestreo} setResultado={setResultadoMuestreo}
                            error={errorMuestreo} setError={setErrorMuestreo}
                            statsDatos={statsDatos} abrirEditor={abrirEditor}
                        />
                    ) : operacion === 'distribuciones_muestrales' ? (
                        <Resultados_DistribucionesMuestrales varSeleccionada={varSeleccionada} filas={filas} abrirEditor={abrirEditor} />
                    ) : operacion === 'regla_multiplicacion' ? (
                        <ResultadosReglaMultiplicacion
                            varSeleccionada={varSeleccionada} filas={filas}
                            modReemplazo={modReemplazo} setModReemplazo={setModReemplazo}
                            colA={colA_Mult} setColA={setColA_Mult} valA={valA_Mult} setValA={setValA_Mult}
                            colB={colB_Mult} setColB={setColB_Mult} valB={valB_Mult} setValB={setValB_Mult}
                            resultado={resultadoMult} setResultado={setResultadoMult}
                            error={errorMult} setError={setErrorMult}
                            statsDatos={statsDatos} abrirEditor={abrirEditor}
                        />
                    ) : operacion === 'regla_adicion' ? (
                        <ResultadosReglaAdicion
                            resultado={resultadoAdicion} error={errorAdicion}
                            varSeleccionada={varSeleccionada} filas={filas}
                            colA={colA_Adicion} setColA={setColA_Adicion} valA={valA_Adicion} setValA={setValA_Adicion}
                            colB={colB_Adicion} setColB={setColB_Adicion} valB={valB_Adicion} setValB={setValB_Adicion}
                            setResultado={setResultadoAdicion} setError={setErrorAdicion}
                            statsDatos={statsDatos} abrirEditor={abrirEditor}
                        />
                    ) : operacion === 'simulador_total' ? (
                        <ResultadosSimuladorTotal
                            filas={filas} varSeleccionada={varSeleccionada}
                            colCausa={colCausa} setColCausa={setColCausa}
                            colEvento={colEvento} setColEvento={setColEvento}
                            valExito={valExito} setValExito={setValExito}
                            ramas={ramas} setRamas={setRamas}
                            resultado={resultadoSimulador} setResultadoSimulador={setResultadoSimulador}
                            errorSimulador={errorSimulador} setErrorSimulador={setErrorSimulador}
                            statsDatos={statsDatos} abrirEditor={abrirEditor}
                        />
                    ) : operacion === 'conteo' ? (
                        <ResultadosConteo resConteo={resConteo} hayResultado={hayResultado} />
                    ) : (
                        <ResultadosProbabilidad
                            statsDatos={statsDatos} abrirEditor={abrirEditor} valoresUnicos={valoresUnicos}
                            statsEventos={statsEventos} setModalEvento={setModalEvento} eventoFavorable={eventoFavorable}
                            ejecutar={ejecutar} resProbabilidad={resProbabilidad} formulaProbRef={formulaProbRef}
                            inputDatos={inputDatos}
                            tipo={subTipoProbabilidad}
                            eventoCondicion={eventoCondicion} setModalCondicion={setModalCondicion}
                            columnaParticion={columnaParticion} setColumnaParticion={setColumnaParticion}
                            varSeleccionada={varSeleccionada}
                        />
                    )}
                </div>
            </div>

            {/* MODALES*/}
            <ModalEditor modalEditor={modalEditor} setModalEditor={setModalEditor} filasTemp={filasTemp} setFilasTemp={setFilasTemp} columns={columns} guardarEditor={guardarEditor} hayCambiosEditor={hayCambiosEditor} titulo={subTipoProbabilidad === 'frecuentista' ? 'Editor de Datos Históricos' : 'Editor de Espacio Muestral'} />
            <ModalEventos modalEvento={modalEvento} setModalEvento={setModalEvento} statsEventos={statsEventos} statsEventosPorColumna={statsEventosPorColumnaParaA} eventoFavorable={eventoFavorable} setEventoFavorable={setEventoFavorable} setResProbabilidad={setResProbabilidad} titulo={subTipoProbabilidad === 'frecuentista' ? 'Seleccionar Evento de Interés' : 'Seleccionar Eventos Favorables'} />
            <ModalEventos modalEvento={modalCondicion} setModalEvento={setModalCondicion} statsEventos={statsEventos} statsEventosPorColumna={statsEventosPorColumna} eventoFavorable={eventoCondicion} setEventoFavorable={setEventoCondicion} setResProbabilidad={setResProbabilidad} titulo="Seleccionar Eventos para Condición (B)" />
            <ModalVariables modalVars={modalVars} setModalVars={setModalVars} variables={variables} cargarVariable={cargarVariable} />
            
            {/* Modales Tema 3 */}
            {modalProcTema3 && (
                operacion === 'modelos_discretos' && datosTema3 ? (
                    <ModalProcedimientoModelos 
                        modelo={datosTema3.modelo}
                        params={datosTema3.params}
                        condicion={datosTema3.condicion}
                        momento={modalProcTema3}
                        onClose={() => setModalProcTema3(false)}
                    />
                ) : operacion === 'modelos_continuos' && datosTema3Continuos ? (
                    <ModalProcedimientoModelos 
                        modelo={datosTema3Continuos.modelo}
                        params={datosTema3Continuos.params}
                        condicion={datosTema3Continuos.condicion}
                        momento={modalProcTema3}
                        onClose={() => setModalProcTema3(false)}
                    />
                ) : null
            )}
        </div>
    );

}