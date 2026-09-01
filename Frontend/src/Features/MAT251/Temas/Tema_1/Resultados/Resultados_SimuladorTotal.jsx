import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import { IconoCalculadora, EditarDatos, IconoAlerta } from '../../../../../ui/iconos';
import katex from 'katex';
import ArbolProbabilidad from '../../../Graficas/Tema_1/ArbolProbabilidad';
import MarcoWidgetMAT251 from '../../../ui/MarcoWidgetMAT251';
import { calcularProbabilidadTotal } from '../../../Matematicas/logica_Tema1';

const InlineMath = ({ math }) => (
    <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false }) }} />
);

const FormulaMatematica = ({ resultado }) => {
    const formulaRef = useRef(null);

    useEffect(() => {
        if (formulaRef.current && resultado) {
            let formulaLatex = `\\displaystyle \\begin{aligned}\n`;
            // Fórmula principal (tamaño normal)
            formulaLatex += `P(A) &= \\sum_{i=1}^{n} P(A B_i) = \\sum_{i=1}^{n} P(B_i)P(A|B_i) \\\\\n`;

            // Cálculos (tamaño más pequeño)
            let sumatoriaStr = resultado.desglose.map(r => `P(\\text{${r.nombre}}) \\cdot P(A|\\text{${r.nombre}})`).join(' + ');
            formulaLatex += `\\footnotesize P(A) &\\footnotesize = ${sumatoriaStr} \\\\\n`;

            let valoresStr = resultado.desglose.map(r => `(${r.pA.toFixed(4)} \\cdot ${r.pB_A.toFixed(4)})`).join(' + ');
            formulaLatex += `\\footnotesize P(A) &\\footnotesize = ${valoresStr} \\\\\n`;

            let multsStr = resultado.desglose.map(r => `${r.mult.toFixed(4)}`).join(' + ');
            formulaLatex += `\\footnotesize P(A) &\\footnotesize = ${multsStr} \\\\\n`;

            formulaLatex += `\\footnotesize P(A) &\\footnotesize = \\mathbf{${resultado.probB.toFixed(4)}}\n`;
            formulaLatex += `\\end{aligned}`;

            katex.render(formulaLatex, formulaRef.current, { throwOnError: false, displayMode: false });
        }
    }, [resultado]);

    return (
        <div style={{ overflowX: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: RADIUS, textAlign: 'left' }}>
            <div ref={formulaRef}></div>
        </div>
    );
};

const FormulaBayes = ({ resultado, ramaSeleccionada }) => {
    const formulaRef = useRef(null);

    useEffect(() => {
        if (formulaRef.current && resultado && ramaSeleccionada) {
            let formulaLatex = `\\displaystyle \\begin{aligned}\n`;
            // Fórmula principal
            formulaLatex += `P(\\text{${ramaSeleccionada.nombre}} | A) &= \\frac{P(\\text{${ramaSeleccionada.nombre}}) \\cdot P(A|\\text{${ramaSeleccionada.nombre}})}{P(A)} \\\\\n`;
            
            // Cálculos más pequeños
            formulaLatex += `\\footnotesize P(\\text{${ramaSeleccionada.nombre}} | A) &\\footnotesize = \\frac{${ramaSeleccionada.pA.toFixed(4)} \\cdot ${ramaSeleccionada.pB_A.toFixed(4)}}{${resultado.probB.toFixed(4)}} \\\\\n`;
            formulaLatex += `\\footnotesize P(\\text{${ramaSeleccionada.nombre}} | A) &\\footnotesize = \\frac{${ramaSeleccionada.mult.toFixed(4)}}{${resultado.probB.toFixed(4)}} \\\\\n`;
            const bayesVal = resultado.probB > 0 ? (ramaSeleccionada.mult / resultado.probB) : 0;
            formulaLatex += `\\footnotesize P(\\text{${ramaSeleccionada.nombre}} | A) &\\footnotesize = \\mathbf{${bayesVal.toFixed(4)}}\n`;
            formulaLatex += `\\end{aligned}`;

            katex.render(formulaLatex, formulaRef.current, { throwOnError: false, displayMode: false });
        }
    }, [resultado, ramaSeleccionada]);

    return (
        <div style={{ overflowX: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: RADIUS, textAlign: 'left' }}>
            <div ref={formulaRef}></div>
        </div>
    );
};

// COMPONENTE SELECTOR PERSONALIZADO (Mismo estilo que en la Probabilidad)
const CustomSelect = ({ value, onChange, options, placeholder, accentColor = 'var(--primary-color)' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%', fontFamily: FONT }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? accentColor : 'var(--border-color)'}`,
                    borderRadius: RADIUS, cursor: 'pointer',
                    boxShadow: isOpen ? `0 0 0 3px rgba(255, 110, 0, 0.15)` : 'none',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-color)',
                    userSelect: 'none',
                    fontSize: FS.sm,
                    minHeight: '38px'
                }}
            >
                <span style={{ fontWeight: 500, color: value ? 'var(--text-color)' : 'var(--text-muted)' }}>
                    {value || placeholder}
                </span>
                <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '5px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: RADIUS,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }} className="thin-scrollbar">
                    {options.length === 0 && (
                        <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: FS.sm, fontStyle: 'italic' }}>
                            Sin opciones
                        </div>
                    )}
                    {options.map((opt, idx) => {
                        const isSelected = value === opt.value;
                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'transparent',
                                    borderBottom: idx < options.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    color: isSelected ? accentColor : 'var(--text-color)',
                                    fontSize: FS.sm,
                                    fontWeight: isSelected ? 600 : 400
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-body)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {opt.label}
                                {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function ResultadosSimuladorTotal({
    filas, varSeleccionada,
    colCausa, setColCausa,
    colEvento, setColEvento,
    valExito, setValExito,
    ramas, setRamas,
    resultado, setResultadoSimulador,
    errorSimulador, setErrorSimulador,
    statsDatos, abrirEditor
}) {
    const [inputMode, setInputMode] = useState('matriz'); // 'matriz' | 'manual'
    const [manualBranches, setManualBranches] = useState([
        { id: 1, name: 'Causa 1', pA: '', pBA: '' },
        { id: 2, name: 'Causa 2', pA: '', pBA: '' }
    ]);

    const [ordenWidgets, setOrdenWidgets] = useState(['w-arbol']);
    const [causaBayes, setCausaBayes] = useState('');

    // Mapear ramas manuales al formato del motor existente
    const { mappedRamas, mappedResultado } = useMemo(() => {
        const mapped = manualBranches.map(b => {
            const pAVal = parseFloat(b.pA) || 0;
            const pBAVal = parseFloat(b.pBA) || 0;
            const mult = pAVal * pBAVal;
            return {
                id: b.id,
                nombre: b.name || `Causa ${b.id}`,
                n_Ai: 0,
                totalDatos: 0,
                pA: pAVal,
                n_B_dado_Ai: 0,
                pB_A: pBAVal,
                mult: mult
            };
        });
        const probB = mapped.reduce((acc, r) => acc + r.mult, 0);
        return {
            mappedRamas: mapped,
            mappedResultado: { probB, desglose: mapped }
        };
    }, [manualBranches]);

    // Usar datos dinámicos según el modo activo
    const activeRamas = inputMode === 'manual' ? mappedRamas : ramas;
    const activeResultado = inputMode === 'manual' ? mappedResultado : resultado;

    const agregarRama = () => {
        const nextId = manualBranches.length > 0 ? Math.max(...manualBranches.map(b => b.id)) + 1 : 1;
        setManualBranches([...manualBranches, { id: nextId, name: `Causa ${nextId}`, pA: '', pBA: '' }]);
    };

    const eliminarRama = (id) => {
        if (manualBranches.length <= 2) return;
        const filtradas = manualBranches.filter(b => b.id !== id);
        setManualBranches(filtradas);
        const eliminada = manualBranches.find(b => b.id === id);
        if (eliminada && causaBayes === eliminada.name) {
            setCausaBayes('');
        }
    };

    const handleBranchChange = (id, field, value) => {
        setManualBranches(manualBranches.map(b => {
            if (b.id === id) {
                return { ...b, [field]: value };
            }
            return b;
        }));
    };

    const sumPA = useMemo(() => {
        return manualBranches.reduce((acc, b) => acc + (parseFloat(b.pA) || 0), 0);
    }, [manualBranches]);

    const showSumaWarning = Math.abs(sumPA - 1) > 0.0001 && manualBranches.some(b => b.pA !== '');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            setOrdenWidgets((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Extraer valores únicos para el selector de "Éxito" del evento
    const valoresUnicosEvento = useMemo(() => {
        if (!varSeleccionada || !colEvento) return [];
        const colIndex = varSeleccionada.nombresColumnas?.indexOf(colEvento);
        if (colIndex === -1 || colIndex === undefined) return [];

        const vals = filas.map(f => {
            const partes = f.valor.split(' | ').map(p => p.trim());
            return partes[colIndex];
        }).filter(Boolean);
        return [...new Set(vals)].sort();
    }, [varSeleccionada, colEvento, filas]);

    const calcular = () => {
        if (!varSeleccionada) {
            setErrorSimulador("Importa una Matriz de Excel primero.");
            setResultadoSimulador(null);
            return;
        }
        if (!colCausa || !colEvento || !valExito) {
            setErrorSimulador("Selecciona las columnas de Causa y Evento, así como el valor de éxito.");
            setResultadoSimulador(null);
            return;
        }

        const res = calcularProbabilidadTotal(filas, varSeleccionada.nombresColumnas, colCausa, colEvento, valExito);
        if (res.error) {
            setErrorSimulador(res.error);
            setResultadoSimulador(null);
        } else {
            setRamas(res.resultado.desglose);
            setResultadoSimulador(res.resultado);
            setErrorSimulador('');
            setCausaBayes(''); // Reset Bayes when calculating again
        }
    };

    // Limpiar el resultado al cambiar parámetros para forzar uso del botón Calcular
    useEffect(() => {
        setResultadoSimulador(null);
        setCausaBayes('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filas, colCausa, colEvento, valExito, varSeleccionada]);



    return (
        <div style={{ marginTop: '0px' }}>
            {/* SELECTOR DE MODO DE ENTRADA */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <button
                        type="button"
                        className={`btn-tema1-borde ${inputMode === 'matriz' ? 'active' : ''}`}
                        onClick={() => setInputMode('matriz')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: FS.sm,
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: inputMode === 'matriz' ? 'var(--primary-color)' : 'transparent',
                            color: inputMode === 'matriz' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Análisis de Matriz
                    </button>
                    <button
                        type="button"
                        className={`btn-tema1-borde ${inputMode === 'manual' ? 'active' : ''}`}
                        onClick={() => setInputMode('manual')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: FS.sm,
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: inputMode === 'manual' ? 'var(--primary-color)' : 'transparent',
                            color: inputMode === 'manual' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Modo Manual
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                {inputMode === 'manual' ? (
                    /* FORMULARIO DE INGRESO MANUAL */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '15px' }}>
                        <h4 style={{ marginBottom: '5px', fontSize: FS.sm, fontWeight: 700, color: 'var(--primary-color)' }}>Datos del Ejercicio</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {manualBranches.map((rama) => (
                                <div key={rama.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Causa:</label>
                                        <input
                                            type="text"
                                            value={rama.name}
                                            onChange={(e) => handleBranchChange(rama.id, 'name', e.target.value)}
                                            placeholder={`Causa ${rama.id}`}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT,
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>Probabilidad</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: FS.sm, color: 'var(--text-main)', whiteSpace: 'nowrap' }}><InlineMath math={`P(B_{${rama.id}})`} />:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                value={rama.pA}
                                                onChange={(e) => handleBranchChange(rama.id, 'pA', e.target.value)}
                                                placeholder="0.00"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: RADIUS,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--text-color)',
                                                    fontSize: FS.sm,
                                                    outline: 'none',
                                                    fontFamily: FONT,
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>Probabilidad</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: FS.sm, color: 'var(--text-main)', whiteSpace: 'nowrap' }}><InlineMath math={`P(A|B_{${rama.id}})`} />:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                value={rama.pBA}
                                                onChange={(e) => handleBranchChange(rama.id, 'pBA', e.target.value)}
                                                placeholder="0.00"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: RADIUS,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--text-color)',
                                                    fontSize: FS.sm,
                                                    outline: 'none',
                                                    fontFamily: FONT,
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {manualBranches.length > 2 && (
                                        <button
                                            type="button"
                                            title="Eliminar causa"
                                            onClick={() => eliminarRama(rama.id)}
                                            style={{
                                                marginTop: '24px',
                                                padding: '8px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                borderRadius: RADIUS,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#ef4444';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                e.currentTarget.style.color = '#ef4444';
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={agregarRama}
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: RADIUS,
                                    cursor: 'pointer',
                                    fontSize: FS.sm,
                                    fontWeight: 700
                                }}
                            >
                                + Agregar nueva Causa (Rama)
                            </button>
                        </div>

                        {showSumaWarning && (
                            <div style={{
                                padding: '10px 15px',
                                background: 'rgba(234, 88, 12, 0.05)',
                                color: '#ea580c',
                                border: '1.5px dashed #ea580c',
                                borderRadius: RADIUS,
                                fontSize: FS.sm,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <IconoAlerta width="18" height="18" style={{ flexShrink: 0 }} />
                                La suma de las probabilidades marginales P(B_i) es {(sumPA * 100).toFixed(2)}%. Recuerde que la suma debe ser igual al 100% (1.0).
                            </div>
                        )}
                    </div>
                ) : (
                    /* MODO MATRIZ */
                    <>
                        {/* ── BARRA DE DATOS Y EDITOR ── */}
                        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <span style={{ ...labelStyle, margin: 0 }}>Datos:</span>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                                    <small title="Datos provenientes de variables externas" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Cargados: <strong style={{ color: 'var(--primary-color)' }}>{statsDatos?.cargados || 0}</strong>
                                    </small>
                                    <small title="Datos ingresados manualmente" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Agregados: <strong style={{ color: '#3b82f6' }}>{statsDatos?.agregados || 0}</strong>
                                    </small>
                                    <small title="Total de datos válidos" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Total: <strong>{statsDatos?.total || 0}</strong>
                                    </small>
                                </div>
                            </div>
                            <button
                                onClick={abrirEditor}
                                className="btn-icon"
                                style={{
                                    borderRadius: RADIUS,
                                    fontSize: FS.sm,
                                    padding: '6px 14px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <EditarDatos />
                                Editar Datos
                            </button>
                        </div>
                        {varSeleccionada && varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 1 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '20px', background: 'var(--bg-input)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                                        Variable Causa <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B_i') }} />:
                                    </label>
                                    <CustomSelect
                                        value={colCausa}
                                        onChange={(val) => setColCausa(val)}
                                        options={varSeleccionada.nombresColumnas.map(col => ({ value: col, label: col }))}
                                        placeholder="-- Seleccionar --"
                                    />
                                </div>

                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                                        Variable Evento <span dangerouslySetInnerHTML={{ __html: katex.renderToString('A') }} />:
                                    </label>
                                    <CustomSelect
                                        value={colEvento}
                                        onChange={(val) => {
                                            setColEvento(val);
                                            setValExito('');
                                        }}
                                        options={varSeleccionada.nombresColumnas.filter(c => c !== colCausa).map(col => ({ value: col, label: col }))}
                                        placeholder="-- Seleccionar --"
                                    />
                                </div>

                                {colEvento && valoresUnicosEvento.length > 0 && (
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'block', marginBottom: '4px', color: 'var(--primary-color)', fontWeight: 'bold' }}>Valor de "Éxito":</label>
                                        <CustomSelect
                                            value={valExito}
                                            onChange={(val) => setValExito(val)}
                                            options={valoresUnicosEvento.map(val => ({ value: val, label: val }))}
                                            placeholder="-- Seleccionar --"
                                        />
                                    </div>
                                )}

                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <button
                                        onClick={calcular}
                                        className="button_calcular btn-icon"
                                        style={{ padding: '8px 25px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, height: '36px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', width: 'fit-content', flexShrink: 0 }}
                                        disabled={!varSeleccionada || !colCausa || !colEvento || !valExito}
                                    >
                                        <IconoCalculadora />
                                        CALCULAR
                                    </button>
                                </div>
                            </div>
                        ) : varSeleccionada ? (
                            <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, fontSize: FS.sm, marginBottom: '15px' }}>
                                Para usar el Teorema de Probabilidad Total, debes importar una "Matriz" que contenga al menos 2 columnas.
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: FS.sm }}>
                                Importa una matriz en el panel izquierdo para comenzar.
                            </p>
                        )}

                        {errorSimulador && (
                            <div style={{ marginBottom: '15px', padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, border: '1px solid #f87171', fontWeight: 'bold', fontSize: FS.xs }}>
                                {errorSimulador}
                            </div>
                        )}
                    </>
                )}
            </div>

            {activeResultado && (
                <>
                    <div style={{ ...cardStyle, marginBottom: '20px' }}>
                        <h4 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0', fontSize: FS.sm }}>
                            Desglose de la Matriz:
                        </h4>
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: RADIUS }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: FS.sm }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Causa Única <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B_i') }} /></th>
                                        {inputMode === 'matriz' && <th style={{ padding: '8px 6px', color: 'var(--text-muted)', fontWeight: 500 }}>Frecuencia <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(n)') }} /></th>}
                                        <th style={{ padding: '8px 6px' }}><span dangerouslySetInnerHTML={{ __html: katex.renderToString('P(B_i)') }} /></th>
                                        {inputMode === 'matriz' && <th style={{ padding: '8px 6px', color: 'var(--text-muted)', fontWeight: 500 }}>Éxitos en <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B_i') }} /></th>}
                                        <th style={{ padding: '8px 6px' }}><span dangerouslySetInnerHTML={{ __html: katex.renderToString('P(A|B_i)') }} /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeRamas.map((rama, idx) => (
                                        <tr key={rama.id} style={{ borderBottom: idx < activeRamas.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <td style={{ padding: '8px 6px', fontWeight: 600 }}>{rama.nombre}</td>
                                            {inputMode === 'matriz' && (
                                                <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                                                    {rama.n_Ai} / {rama.totalDatos}
                                                </td>
                                            )}
                                            <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{rama.pA.toFixed(4)}</td>
                                            {inputMode === 'matriz' && (
                                                <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontSize: '0.9em' }}>
                                                    {rama.n_B_dado_Ai} / {rama.n_Ai}
                                                </td>
                                            )}
                                            <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{rama.pB_A.toFixed(4)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '0 0 15px 0' }}>
                            Desarrollo Matemático: Probabilidad Total
                        </h3>
                        <FormulaMatematica resultado={activeResultado} />
                        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                            <div 
                                style={{ fontSize: FS.lg, fontWeight: 'bold', color: 'var(--primary-color)' }}
                                dangerouslySetInnerHTML={{ __html: katex.renderToString(`P(A) = ${activeResultado.probB.toFixed(4)}`) }}
                            />
                            <div style={{ fontSize: FS.sm, color: 'var(--text-main)', marginTop: '4px' }}>
                                ({(activeResultado.probB * 100).toFixed(2)}% probabilidad)
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN BAYES */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '0 0 15px 0' }}>
                            Teorema de Bayes
                        </h3>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                                ¿Cuál es la probabilidad de que la causa haya sido... <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B_k') }} />?
                            </label>
                            <div style={{ maxWidth: '400px' }}>
                                <CustomSelect
                                    value={causaBayes}
                                    onChange={(val) => setCausaBayes(val)}
                                    options={[
                                        { value: '', label: '-- Seleccionar Causa / Limpiar --' },
                                        ...activeRamas.map(r => ({ value: r.nombre, label: r.nombre }))
                                    ]}
                                    placeholder="-- Seleccionar Causa --"
                                />
                            </div>
                        </div>

                        {causaBayes && (
                            <>
                                <h4 style={{ color: 'var(--primary-color)', fontSize: FS.sm, margin: '15px 0 10px 0' }}>Desarrollo Matemático: Teorema de Bayes</h4>
                                <FormulaBayes resultado={activeResultado} ramaSeleccionada={activeRamas.find(r => r.nombre === causaBayes)} />

                                {(() => {
                                    const rama = activeRamas.find(r => r.nombre === causaBayes);
                                    if (!rama) return null;
                                    const bayesResult = activeResultado.probB > 0 ? rama.mult / activeResultado.probB : 0;
                                    return (
                                        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                                            <div 
                                                style={{ fontSize: FS.lg, fontWeight: 'bold', color: 'var(--primary-color)' }}
                                                dangerouslySetInnerHTML={{ __html: katex.renderToString(`P(\\text{${rama.nombre}} | A) = ${bayesResult.toFixed(4)}`) }}
                                            />
                                            <div style={{ fontSize: FS.sm, color: 'var(--text-main)', marginTop: '4px' }}>
                                                ({(bayesResult * 100).toFixed(2)}% probabilidad)
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>


                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={ordenWidgets} strategy={rectSortingStrategy}>
                            <div style={{ width: '100%', minWidth: 0 }}>
                                {ordenWidgets.map((id) => {
                                    if (id === 'w-arbol') {
                                        return (
                                            <MarcoWidgetMAT251 key={id} id={id} titulo="Árbol de Probabilidad" anchoCompleto={true} alto={`${Math.max(400, activeRamas.length * 140) + 120}px`}>
                                                <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                                                    <ArbolProbabilidad resultado={activeResultado} ramas={activeRamas} causaBayes={causaBayes} />
                                                </div>
                                            </MarcoWidgetMAT251>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </>
            )}
        </div>
    );
}
