import React, { useEffect, useRef, useMemo, useState } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import katex from 'katex';
import DiagramaVenn from '../../../Graficas/Tema_1/DiagramaVenn';
import MarcoWidgetMAT251 from '../../../ui/MarcoWidgetMAT251';
import { IconoCalculadora, EditarDatos } from '../../../../../ui/iconos';
import { calcularReglaAdicion } from '../../../Matematicas/logica_Tema1';

const FormulaAdicion = ({ resultado }) => {
    const formulaRef = useRef(null);

    useEffect(() => {
        if (formulaRef.current && resultado) {
            let formulaLatex = `\\begin{aligned}\n`;
            formulaLatex += `P(A \\cup B) &= P(A) + P(B) - P(A \\cap B) \\\\\n`;
            formulaLatex += `P(A \\cup B) &= ${resultado.pA.toFixed(4)} + ${resultado.pB.toFixed(4)} - ${resultado.pAandB.toFixed(4)} \\\\\n`;
            formulaLatex += `P(A \\cup B) &= \\mathbf{${resultado.pAorB.toFixed(4)}}\n`;
            formulaLatex += `\\end{aligned}`;

            katex.render(formulaLatex, formulaRef.current, { throwOnError: false, displayMode: true });
        }
    }, [resultado]);

    return (
        <div style={{ overflowX: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: RADIUS }}>
            <div ref={formulaRef}></div>
        </div>
    );
};

export default function ResultadosReglaAdicion({
    varSeleccionada, filas,
    colA, setColA, valA, setValA,
    colB, setColB, valB, setValB,
    resultado, setResultado,
    error, setError,
    statsDatos, abrirEditor
}) {
    // Estado para el modo de entrada
    const [inputMode, setInputMode] = useState('matriz'); // 'matriz' | 'manual'

    // Estados para el modo manual
    const [manualNameA, setManualNameA] = useState('A');
    const [manualNameB, setManualNameB] = useState('B');
    const [manualPA, setManualPA] = useState('');
    const [manualPB, setManualPB] = useState('');
    const [manualPAndB, setManualPAndB] = useState('');

    // Extraer valores únicos para A y B
    const valoresUnicosA = useMemo(() => {
        if (!varSeleccionada || !colA) return [];
        const colIndex = varSeleccionada.nombresColumnas?.indexOf(colA);
        if (colIndex === -1 || colIndex === undefined) return [];
        const vals = filas.map(f => f.valor.split(' | ').map(p => p.trim())[colIndex]).filter(Boolean);
        return [...new Set(vals)].sort();
    }, [varSeleccionada, colA, filas]);

    const valoresUnicosB = useMemo(() => {
        if (!varSeleccionada || !colB) return [];
        const colIndex = varSeleccionada.nombresColumnas?.indexOf(colB);
        if (colIndex === -1 || colIndex === undefined) return [];
        const vals = filas.map(f => f.valor.split(' | ').map(p => p.trim())[colIndex]).filter(Boolean);
        return [...new Set(vals)].sort();
    }, [varSeleccionada, colB, filas]);

    const calcular = () => {
        if (inputMode === 'matriz') {
            if (!varSeleccionada) {
                setError("Importa una Matriz de Excel primero.");
                setResultado(null);
                return;
            }
            if (!colA || !valA || !colB || !valB) {
                setError("Selecciona las columnas y los valores para ambos eventos (A y B).");
                setResultado(null);
                return;
            }

            const res = calcularReglaAdicion(filas, varSeleccionada.nombresColumnas, colA, valA, colB, valB);
            if (res.error) {
                setError(res.error);
                setResultado(null);
            } else {
                setResultado(res.resultado);
                setError('');
            }
        } else {
            // Calcular Modo Manual
            const pA = parseFloat(manualPA);
            const pB = parseFloat(manualPB);
            const pAandB = parseFloat(manualPAndB);

            if (isNaN(pA) || isNaN(pB) || isNaN(pAandB)) {
                setError("Todos los campos de probabilidad deben ser números válidos.");
                setResultado(null);
                return;
            }

            if (pA < 0 || pA > 1 || pB < 0 || pB > 1 || pAandB < 0 || pAandB > 1) {
                setError("Las probabilidades deben estar entre 0 y 1.");
                setResultado(null);
                return;
            }

            if (pAandB > pA || pAandB > pB) {
                setError("La probabilidad de la intersección P(A ∩ B) no puede ser mayor que P(A) ni que P(B).");
                setResultado(null);
                return;
            }

            const pAorB = pA + pB - pAandB;

            if (pAorB > 1) {
                setError("La probabilidad de la unión P(A ∪ B) calculada excede 1. Revisa tus datos.");
                setResultado(null);
                return;
            }

            setResultado({
                nameA: manualNameA || 'A',
                nameB: manualNameB || 'B',
                pA: pA,
                pB: pB,
                pAandB: pAandB,
                pAorB: pAorB,
                countA: '-', countB: '-', countAandB: '-', total: '-' 
            });
            setError('');
        }
    };

    // Auto-recalcular or clear when inputs change
    useEffect(() => {
        if (inputMode === 'matriz') {
            setResultado(null);
            setError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colA, valA, colB, valB, varSeleccionada, filas, inputMode]);

    // Limpiar resultado al cambiar valores manuales (opcional pero buena UX)
    useEffect(() => {
        if (inputMode === 'manual') {
            setResultado(null);
            setError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualPA, manualPB, manualPAndB, manualNameA, manualNameB]);

    return (
        <div style={{ marginTop: '0px', fontFamily: FONT }}>

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

            {/* ── PARÁMETROS DE LOS EVENTOS ── */}
            <div style={{ marginBottom: '20px' }}>

                {inputMode === 'matriz' ? (
                    <>
                        {/* ── BARRA DE DATOS Y EDITOR (Solo en Matriz) ── */}
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

                        <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                            Definición de Eventos:
                        </h4>

                        {varSeleccionada && varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', background: 'var(--bg-input)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                {/* EVENTO A */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                                        Variable Evento <span dangerouslySetInnerHTML={{ __html: katex.renderToString('A') }} />:
                                    </label>
                                    <select
                                        value={colA}
                                        onChange={(e) => { setColA(e.target.value); setValA(''); }}
                                        className="container_cal_input"
                                        style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)', marginBottom: '8px' }}
                                    >
                                        <option value="">-- Seleccionar Variable --</option>
                                        {varSeleccionada.nombresColumnas.filter(col => col !== colB).map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>

                                    {colA && valoresUnicosA.length > 0 && (
                                        <>
                                            <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'block', marginBottom: '4px', color: 'var(--primary-color)', fontWeight: 'bold' }}>Condición de <span dangerouslySetInnerHTML={{ __html: katex.renderToString('A') }} />:</label>
                                            <select
                                                value={valA}
                                                onChange={(e) => setValA(e.target.value)}
                                                className="container_cal_input"
                                                style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '2px solid var(--primary-color)' }}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {valoresUnicosA.map(val => <option key={val} value={val}>{val}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>

                                {/* EVENTO B */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                                        Variable Evento <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B') }} />:
                                    </label>
                                    <select
                                        value={colB}
                                        onChange={(e) => { setColB(e.target.value); setValB(''); }}
                                        className="container_cal_input"
                                        style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)', marginBottom: '8px' }}
                                    >
                                        <option value="">-- Seleccionar Variable --</option>
                                        {varSeleccionada.nombresColumnas.filter(col => col !== colA).map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>

                                    {colB && valoresUnicosB.length > 0 && (
                                        <>
                                            <label style={{ fontSize: FS.sm, fontFamily: FONT, display: 'block', marginBottom: '4px', color: 'var(--primary-color)', fontWeight: 'bold' }}>Condición de <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B') }} />:</label>
                                            <select
                                                value={valB}
                                                onChange={(e) => setValB(e.target.value)}
                                                className="container_cal_input"
                                                style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '2px solid var(--primary-color)' }}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {valoresUnicosB.map(val => <option key={val} value={val}>{val}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>

                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                    <button
                                        onClick={calcular}
                                        className="button_calcular btn-icon"
                                        style={{ padding: '8px 25px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, height: '36px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                                        disabled={!varSeleccionada || !colA || !valA || !colB || !valB}
                                    >
                                        <IconoCalculadora />
                                        CALCULAR
                                    </button>
                                </div>
                            </div>
                        ) : varSeleccionada ? (
                            <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, fontSize: FS.sm, marginBottom: '15px' }}>
                                Para usar esta función, debes importar una "Matriz" que contenga columnas.
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: FS.sm }}>
                                Importa una matriz en el panel izquierdo para comenzar.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        {/* ── MODO MANUAL ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h4 style={{ margin: 0, fontSize: FS.sm, fontWeight: 700, color: 'var(--primary-color)' }}>Datos del Ejercicio (Ingreso Manual)</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* EVENTO A */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Evento <span dangerouslySetInnerHTML={{ __html: katex.renderToString('A') }} />:</label>
                                        <input
                                            type="text"
                                            value={manualNameA}
                                            onChange={(e) => setManualNameA(e.target.value)}
                                            placeholder="Ej. A"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Probabilidad <span dangerouslySetInnerHTML={{ __html: katex.renderToString('P(A)') }} />:</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={manualPA}
                                            onChange={(e) => setManualPA(e.target.value)}
                                            placeholder="0.00"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* EVENTO B */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Evento <span dangerouslySetInnerHTML={{ __html: katex.renderToString('B') }} />:</label>
                                        <input
                                            type="text"
                                            value={manualNameB}
                                            onChange={(e) => setManualNameB(e.target.value)}
                                            placeholder="Ej. B"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Probabilidad <span dangerouslySetInnerHTML={{ __html: katex.renderToString('P(B)') }} />:</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={manualPB}
                                            onChange={(e) => setManualPB(e.target.value)}
                                            placeholder="0.00"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* INTERSECCIÓN */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Probabilidad de la Intersección <span dangerouslySetInnerHTML={{ __html: katex.renderToString('P(A \\cap B)') }} />:</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={manualPAndB}
                                            onChange={(e) => setManualPAndB(e.target.value)}
                                            placeholder="0.00"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: RADIUS,
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-card)',
                                                color: 'var(--text-color)',
                                                fontSize: FS.sm,
                                                outline: 'none',
                                                fontFamily: FONT
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', width: '100%' }}>
                                <button
                                    onClick={calcular}
                                    className="button_calcular btn-icon"
                                    style={{ padding: '8px 25px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, height: '36px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                                    disabled={manualPA === '' || manualPB === '' || manualPAndB === ''}
                                >
                                    <IconoCalculadora />
                                    CALCULAR
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, border: '1px solid #f87171', fontWeight: 'bold', fontSize: FS.xs }}>
                        {error}
                    </div>
                )}
            </div>

            {resultado && (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0', fontSize: FS.sm }}>
                            Desglose de {inputMode === 'matriz' ? 'Frecuencias' : 'Probabilidades'}:
                        </h4>
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: RADIUS }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: FS.sm }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px 6px' }}>Evento</th>
                                        {inputMode === 'matriz' && (
                                            <th style={{ padding: '8px 6px', color: 'var(--text-muted)', fontWeight: 500 }}>Frecuencia <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(n)') }} /></th>
                                        )}
                                        <th style={{ padding: '8px 6px' }}>Probabilidad <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(P)') }} /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px 6px', fontWeight: 600 }}><span dangerouslySetInnerHTML={{ __html: katex.renderToString('A') }} />: {resultado.nameA}</td>
                                        {inputMode === 'matriz' && (
                                            <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{resultado.countA} / {resultado.total}</td>
                                        )}
                                        <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{resultado.pA.toFixed(4)}</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(128, 128, 128, 0.05)' }}>
                                        <td style={{ padding: '8px 6px', fontWeight: 600 }}><span dangerouslySetInnerHTML={{ __html: katex.renderToString('B') }} />: {resultado.nameB}</td>
                                        {inputMode === 'matriz' && (
                                            <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{resultado.countB} / {resultado.total}</td>
                                        )}
                                        <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{resultado.pB.toFixed(4)}</td>
                                    </tr>
                                    <tr style={{ borderBottom: 'none' }}>
                                        <td style={{ padding: '8px 6px', fontWeight: 600 }}><span dangerouslySetInnerHTML={{ __html: katex.renderToString('A \\cap B') }} /> (Intersección)</td>
                                        {inputMode === 'matriz' && (
                                            <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{resultado.countAandB} / {resultado.total}</td>
                                        )}
                                        <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{resultado.pAandB.toFixed(4)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: 'var(--primary-color)', fontSize: FS.sm, margin: '0 0 10px 0' }}>
                            Desarrollo Matemático: Axiomas y Propiedades (Unión de Eventos)
                        </h4>
                        <FormulaAdicion resultado={resultado} />
                        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                            <div style={{ fontSize: FS.lg, fontWeight: 'bold' }}>
                                <span dangerouslySetInnerHTML={{ __html: katex.renderToString(`P(A \\cup B) = ${resultado.pAorB.toFixed(4)}`) }} />
                            </div>
                            <div style={{ fontSize: FS.sm, color: 'var(--text-main)', marginTop: '4px' }}>
                                ({(resultado.pAorB * 100).toFixed(2)}% probabilidad conjunta)
                            </div>
                        </div>
                    </div>

                    <MarcoWidgetMAT251 id="w-venn" titulo="Diagrama de Venn (Unión de Eventos)" anchoCompleto={true} alto="380px">
                        <div style={{ width: '100%', height: '100%', minWidth: 0, padding: '20px' }}>
                            <DiagramaVenn resultado={resultado} />
                        </div>
                    </MarcoWidgetMAT251>
                </>
            )}
        </div>
    );
}
