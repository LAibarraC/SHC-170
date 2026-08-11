import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/Temas/Tema3.css';
import { calcularDistribucionContinua, generarDatosGraficoContinua } from '../../../Matematicas/logica_Tema3_continuas';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { IconoMas, IconoBasura } from '../../../../../ui/iconos';

export default function Controles_ModelosContinuos({
    varSeleccionada,
    filas,
    statsDatos,
    abrirEditor,
    onCalcular,
    children
}) {
    const [modelo, setModelo] = useState('Uniforme');
    const [modo, setModo] = useState('matriz'); // 'manual' | 'matriz'

    const renderLatex = (str) => {
        return <span style={{ fontSize: '0.9em' }} dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    // Parámetros Manuales Uniforme
    const [paramA, setParamA] = useState('');
    const [paramB, setParamB] = useState('');

    // Parámetros Manuales Normal
    const [paramMu, setParamMu] = useState('');
    const [paramSigma, setParamSigma] = useState('');

    // Condición
    const [calcMode, setCalcMode] = useState('directa'); // 'directa' o 'inversa'
    const [tipoCondicion, setTipoCondicion] = useState('menor_igual');
    const [valorX, setValorX] = useState('');
    const [valorX2, setValorX2] = useState('');
    const [valorP, setValorP] = useState('');
    const [intervals, setIntervals] = useState([{ id: 1, min: '', max: '' }, { id: 2, min: '', max: '' }]);

    // Matriz
    const [columnaSeleccionada, setColumnaSeleccionada] = useState(0);
    const [statsEstimados, setStatsEstimados] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setParamA('');
        setParamB('');
        setParamMu('');
        setParamSigma('');
        
        setCalcMode('directa');
        setTipoCondicion('menor_igual');
        setValorX('');
        setValorX2('');
        setValorP('');
        setIntervals([{ id: 1, min: '', max: '' }, { id: 2, min: '', max: '' }]);
        
        setColumnaSeleccionada(0);
        setStatsEstimados(null);
        setError('');
        
        if (onCalcular) onCalcular(null);
    }, [modo]);

    const handleCambiarModelo = (nuevoModelo) => {
        if (modelo === nuevoModelo) return;
        setModelo(nuevoModelo);
        
        setParamA('');
        setParamB('');
        setParamMu('');
        setParamSigma('');
        
        setTipoCondicion('menor_igual');
        setValorX('');
        setValorB_cond('');
        
        setColumnaSeleccionada(0);
        setStatsEstimados(null);
        setError('');

        if (onCalcular) onCalcular(null);
    };

    // Extraer datos
    const columnasDisponibles = useMemo(() => {
        return (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 0)
            ? varSeleccionada.nombresColumnas
            : (varSeleccionada ? [varSeleccionada.nombre || 'Datos'] : []);
    }, [varSeleccionada]);

    const datosColumna = useMemo(() => {
        if (!varSeleccionada || !filas || filas.length === 0) return [];
        const validas = filas.filter(f => (f.valor || '').toString().trim() !== '');

        return validas.map(f => {
            if (varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
                const partes = (f.valor || '').toString().split(' | ');
                return partes[columnaSeleccionada] ? partes[columnaSeleccionada].trim() : '';
            }
            return (f.valor || '').toString().trim();
        }).map(v => parseFloat(v)).filter(v => !isNaN(v));
    }, [varSeleccionada, filas, columnaSeleccionada]);

    // Estimar desde datos
    const estimarDesdeDatos = () => {
        if (datosColumna.length === 0) {
            setError('No hay datos numéricos válidos en la columna.');
            return;
        }

        if (modelo === 'Uniforme') {
            const min = Math.min(...datosColumna);
            const max = Math.max(...datosColumna);

            setStatsEstimados({
                total: datosColumna.length,
                min: min,
                max: max
            });

            setParamA(min.toString());
            setParamB(max.toString());
        } else if (modelo === 'Normal') {
            const sum = datosColumna.reduce((a, b) => a + b, 0);
            const media = sum / datosColumna.length;
            const variance = datosColumna.reduce((a, b) => a + Math.pow(b - media, 2), 0) / (datosColumna.length - 1); // Varianza muestral
            const dev = Math.sqrt(variance);

            setStatsEstimados({
                total: datosColumna.length,
                media: media,
                desviacion: dev
            });

            setParamMu(media.toFixed(4));
            setParamSigma(dev.toFixed(4));
        }
        setError('');
    };

    const manejarCalculo = () => {
        setError('');

        let params = {};

        if (modelo === 'Uniforme') {
            const a = parseFloat(paramA);
            const b = parseFloat(paramB);
            if (isNaN(a) || isNaN(b)) return setError('En Uniforme, "a" y "b" deben ser números válidos.');
            if (a >= b) return setError('El parámetro "a" (mínimo) debe ser estrictamente menor que "b" (máximo).');
            params = { a, b };
        } else if (modelo === 'Normal') {
            const mu = parseFloat(paramMu);
            const sigma = parseFloat(paramSigma);
            if (isNaN(mu) || isNaN(sigma)) return setError('En Normal, la media y desviación deben ser números válidos.');
            if (sigma <= 0) return setError('La desviación estándar debe ser mayor a 0.');
            params = { mu, sigma };
        } else {
            return setError('Este modelo continuo aún está en construcción.');
        }

        let condicionCalculo = null;
        let condicionVisual = null;

        if (tipoCondicion === 'suma_intervalos') {
            const hasValidInterval = intervals.some(i => i.min !== '' && i.max !== '');
            if (!hasValidInterval) return setError('Ingresa al menos un intervalo válido.');
            condicionVisual = { tipo: tipoCondicion, intervals };
            condicionCalculo = { tipo: tipoCondicion, intervals };
        } else if (['inversa_menor', 'inversa_mayor', 'inversa_exterior', 'inversa_entre'].includes(tipoCondicion)) {
            let p = parseFloat(valorP);
            if (isNaN(p) || p <= 0 || p >= 1) return setError('La probabilidad debe ser un número entre 0 y 1.');
            condicionVisual = { tipo: tipoCondicion, valP: p };
            condicionCalculo = { tipo: tipoCondicion, valP: p };
        } else if (valorX !== '') {
            let x = parseFloat(valorX);
            if (isNaN(x)) return setError('El valor objetivo "x" debe ser numérico.');

            let valB = '';
            if (['entre', 'exterior', 'intervalo'].includes(tipoCondicion)) {
                valB = parseFloat(valorX2);
                if (isNaN(valB) || valB <= x) return setError('El límite superior debe ser mayor que el límite inferior.');
            }

            condicionVisual = { tipo: tipoCondicion, valX: x, valX2: valB };
            condicionCalculo = { tipo: tipoCondicion, valX: x, valX2: valB };
        }

        const resultados = calcularDistribucionContinua(modelo, params, condicionCalculo);
        const datosGrafico = generarDatosGraficoContinua(modelo, params, condicionCalculo, resultados);

        onCalcular({ modelo, params, condicion: condicionVisual, resultados, datosGrafico });
    };

    const renderParametrosManuales = () => {
        const isMatriz = modo === 'matriz';
        const readOnlyParams = isMatriz;

        const disabledStyle = {
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px dashed #94a3b8',
            cursor: 'not-allowed',
            fontWeight: 600
        };

        if (modelo !== 'Uniforme' && modelo !== 'Normal') {
            return (
                <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-color)', width: '100%' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Módulo en construcción. Muy pronto podrás estimar y graficar esta distribución continua.</p>
                </div>
            );
        }

        if (modelo === 'Normal') {
            return (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '1 1 250px' }}>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', width: '100px', display: 'flex', alignItems: 'center' }}>Media <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('\\mu')}</span></label>
                            <input
                                type="number" className="tema3-input" step="any"
                                value={paramMu} onChange={e => setParamMu(e.target.value)}
                                placeholder="0.00"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', width: '100px', display: 'flex', alignItems: 'center' }}>Desviación <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('\\sigma')}</span></label>
                            <input
                                type="number" className="tema3-input" step="any"
                                value={paramSigma} onChange={e => setParamSigma(e.target.value)}
                                placeholder="1.00"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#334155', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        {renderLatex(`f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}`)}
                    </div>
                </div>
            );
        }

        return (
            <div className="tema3-grid" style={{ marginBottom: '5px', gap: '10px' }}>
                <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Mínimo <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('a')}</span></label>
                    <input
                        type="number" className="tema3-input" step="any"
                        value={paramA} onChange={e => setParamA(e.target.value)}
                        placeholder="0.00"
                        disabled={readOnlyParams}
                        style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                    />
                </div>
                <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Máximo <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('b')}</span></label>
                    <input
                        type="number" className="tema3-input" step="any"
                        value={paramB} onChange={e => setParamB(e.target.value)}
                        placeholder="0.00"
                        disabled={readOnlyParams}
                        style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '15px', color: '#334155', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', width: '100%', boxSizing: 'border-box' }}>
                    {renderLatex(`f(x) = \\frac{1}{${paramB || 'b'} - ${paramA || 'a'}}`)}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* GRUPO DE SELECTORES (MODELO Y MODO) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '15px', marginTop: '0px' }}>

                {/* SELECTOR DE MODELO CONTINUO */}
                <div style={{ display: 'flex', width: '100%', maxWidth: '750px', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    {[
                        { id: 'Uniforme', label: 'Uniforme' },
                        { id: 'Normal', label: 'Normal' },
                        { id: 'NormalEstandar', label: 'Normal Estándar' },
                        { id: 'ChiCuadrado', label: 'Chi-cuadrado' },
                        { id: 'FFisher', label: 'F de Fisher' }
                    ].map(tipo => (
                        <button
                            key={tipo.id}
                            type="button"
                            onClick={() => handleCambiarModelo(tipo.id)}
                            style={{
                                flex: 1,
                                padding: '8px 6px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: modelo === tipo.id ? 'var(--primary-color, #0d6efd)' : 'transparent',
                                color: modelo === tipo.id ? '#fff' : 'var(--text-muted, #64748b)',
                                transition: 'all 0.2s ease',
                                boxShadow: modelo === tipo.id ? '0 2px 4px rgba(13, 110, 253, 0.3)' : 'none'
                            }}
                        >
                            {tipo.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <button
                        type="button"
                        onClick={() => { setModo('matriz'); setError(''); }}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'matriz' ? 'var(--primary-color, #0d6efd)' : 'transparent',
                            color: modo === 'matriz' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Análisis de Matriz
                    </button>
                    <button
                        type="button"
                        onClick={() => { setModo('manual'); setError(''); }}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'manual' ? 'var(--primary-color, #0d6efd)' : 'transparent',
                            color: modo === 'manual' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Modo Manual
                    </button>
                </div>
            </div>

            <div className="tema3-card">

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>
                        <strong>Error: </strong> {error}
                    </div>
                )}

                {modo === 'matriz' && (modelo === 'Uniforme' || modelo === 'Normal') && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }}>
                            <div>
                                <div style={{ color: 'var(--primary-color, #2563eb)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Conjunto de Datos:</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                                    Cargados: <strong style={{ color: 'var(--primary-color, #2563eb)' }}>{statsDatos ? statsDatos.cargados : 0}</strong> &nbsp;
                                    Agregados: <strong style={{ color: 'var(--primary-color, #2563eb)' }}>{statsDatos ? statsDatos.agregados : 0}</strong> &nbsp;
                                    Total: <strong style={{ color: 'var(--primary-color, #2563eb)' }}>{statsDatos ? statsDatos.total : 0}</strong>
                                </div>
                            </div>
                            <button
                                onClick={abrirEditor}
                                style={{ padding: '8px 16px', background: 'var(--primary-color, #2563eb)', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Editar Datos
                            </button>
                        </div>
                        {columnasDisponibles.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="tema3-form-group" style={{ flex: 1 }}>
                                        <label className="tema3-label">Columna:</label>
                                        <select
                                            className="tema3-select"
                                            value={columnaSeleccionada}
                                            onChange={e => { setColumnaSeleccionada(Number(e.target.value)); setStatsEstimados(null); }}
                                        >
                                            {columnasDisponibles.map((col, idx) => (
                                                <option key={idx} value={idx}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button className="tema3-btn" onClick={estimarDesdeDatos} style={{ background: '#10b981', marginBottom: '10px', width: 'auto', margin: '0 auto', display: 'block', padding: '8px 16px' }}>
                                    Estimar Parámetros
                                </button>

                                {statsEstimados && (
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '5px', color: 'var(--text-muted, #475569)', marginTop: '10px', backgroundColor: 'var(--bg-card, #ffffff)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', textAlign: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Total Registros</span>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.total}</strong>
                                        </div>
                                        {modelo === 'Uniforme' ? (
                                            <>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Mínimo {renderLatex('a')}</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.min?.toFixed(4)}</strong>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Máximo {renderLatex('b')}</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.max?.toFixed(4)}</strong>
                                                </div>
                                            </>
                                        ) : modelo === 'Normal' ? (
                                            <>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Media {renderLatex('\\mu')}</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.media?.toFixed(4)}</strong>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Desviación {renderLatex('\\sigma')}</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.desviacion?.toFixed(4)}</strong>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>No hay datos cargados en el estado global. Ve a Gestión de Datos para importar.</p>
                        )}
                    </div>
                )}

                {renderParametrosManuales()}

                {(modelo === 'Uniforme' || modelo === 'Normal') && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button className="tema3-btn" onClick={manejarCalculo} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto' }}>
                            Graficar
                        </button>
                    </div>
                )}

                {children && (modelo === 'Uniforme' || modelo === 'Normal') && (
                    <>
                        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', margin: '15px 0' }}></div>

                        <h4 style={{ color: 'var(--text-color, #334155)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>Condición de Probabilidad</h4>

                        {/* Toggle de Modo de Cálculo */}
                        <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }}>
                            <button 
                                onClick={() => {
                                    setCalcMode('directa');
                                    setTipoCondicion('menor_igual');
                                    setValorX(''); setValorX2(''); setValorP('');
                                }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: calcMode === 'directa' ? 'var(--primary-color, #0d6efd)' : 'transparent',
                                    color: calcMode === 'directa' ? '#fff' : 'var(--text-muted, #64748b)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '150px'
                                }}
                            >
                                Calcular Probabilidad
                            </button>
                            <button 
                                onClick={() => {
                                    setCalcMode('inversa');
                                    setTipoCondicion('inversa_menor');
                                    setValorX(''); setValorX2(''); setValorP('');
                                }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: calcMode === 'inversa' ? 'var(--primary-color, #0d6efd)' : 'transparent',
                                    color: calcMode === 'inversa' ? '#fff' : 'var(--text-muted, #64748b)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '150px'
                                }}
                            >
                                Calcular Valor Inverso
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '25px' }}>
                            
                            {/* Select Custom */}
                            <div style={{ flex: '1 1 0%', minWidth: '180px', display: 'flex', flexDirection: 'column' }}>
                                <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: '600' }}>Tipo de Probabilidad</label>
                                <CustomSelect
                                    value={tipoCondicion}
                                    onChange={val => { 
                                        setTipoCondicion(val); 
                                        setValorX(''); setValorX2(''); setValorP(''); 
                                        setIntervals([{ id: 1, min: '', max: '' }, { id: 2, min: '', max: '' }]); 
                                    }}
                                    options={(() => {
                                        // Regla estricta: Si es continua, solo mostrar <= y >= (inclusivos).
                                        const isContinua = true; 

                                        if (calcMode === 'directa') {
                                            const opts = [];
                                            if (!isContinua) {
                                                opts.push({ value: 'igual', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(X = x)')}</span> });
                                            }
                                            
                                            // Cola Izquierda
                                            opts.push({ value: 'menor_igual', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(X \\leq x)')}</span> });
                                            if (!isContinua) {
                                                opts.push({ value: 'menor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(X < x)')}</span> });
                                            }

                                            // Cola Derecha
                                            opts.push({ value: 'mayor_igual', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(X \\geq x)')}</span> });
                                            if (!isContinua) {
                                                opts.push({ value: 'mayor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(X > x)')}</span> });
                                            }

                                            // Intervalos
                                            opts.push({ value: 'entre', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(a \\leq X \\leq b)' : 'P(a < X < b)')}</span> });
                                            opts.push({ value: 'exterior', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(a > X > b)' : 'P(X < a \\cup X > b)')}</span> });
                                            opts.push({ value: 'suma_intervalos', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex('P(a \\leq X \\leq b) + \\dots')}</span> });
                                            
                                            return opts;
                                        } else {
                                            return [
                                                { value: 'inversa_menor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(X \\leq c) = p' : 'P(X < c) = p')}</span> },
                                                { value: 'inversa_mayor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(X \\geq c) = p' : 'P(X > c) = p')}</span> },
                                                { value: 'inversa_entre', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(c_1 \\leq X \\leq c_2) = p' : 'P(c_1 < X < c_2) = p')}</span> },
                                                { value: 'inversa_exterior', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{renderLatex(isContinua ? 'P(c_1 > X > c_2) = p' : 'P(X < c_1 \\cup X > c_2) = p')}</span> }
                                            ];
                                        }
                                    })()}
                                />
                            </div>

                            {/* Input para Inversas (Probabilidad) */}
                            {calcMode === 'inversa' && (
                                <div style={{ flex: '1 1 0%', minWidth: '150px', display: 'flex', flexDirection: 'column' }}>
                                    <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: '600' }}>Probabilidad (p)</label>
                                    <input
                                        type="number" step="0.01" min="0.0001" max="0.9999" className="tema3-input"
                                        value={valorP} onChange={e => setValorP(e.target.value)}
                                        placeholder="Ej. 0.05"
                                        style={{ padding: '0 10px', fontSize: '0.85rem', height: '38px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {/* Inputs para Directas (Valores X) */}
                            {calcMode === 'directa' && tipoCondicion !== 'suma_intervalos' && (
                                <>
                                    <div style={{ flex: '1 1 0%', minWidth: '150px', display: 'flex', flexDirection: 'column' }}>
                                        <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: '600' }}>
                                            {tipoCondicion === 'exterior' ? 'Límite Izq. (a)' : ['entre', 'intervalo'].includes(tipoCondicion) ? 'Lím. Inferior (a)' : 'Valor (x)'}
                                        </label>
                                        <input
                                            type="number" step="any" className="tema3-input"
                                            value={valorX} onChange={e => setValorX(e.target.value)}
                                            placeholder="0"
                                            style={{ padding: '0 10px', fontSize: '0.85rem', height: '38px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    {['entre', 'exterior', 'intervalo'].includes(tipoCondicion) && (
                                        <div style={{ flex: '1 1 0%', minWidth: '150px', display: 'flex', flexDirection: 'column' }}>
                                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: '600' }}>
                                                {tipoCondicion === 'exterior' ? 'Límite Der. (b)' : 'Lím. Superior (b)'}
                                            </label>
                                            <input
                                                type="number" step="any" className="tema3-input"
                                                value={valorX2} onChange={e => setValorX2(e.target.value)}
                                                placeholder="0"
                                                style={{ padding: '0 10px', fontSize: '0.85rem', height: '38px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* Interfaz para Suma de Intervalos */}
                            {calcMode === 'directa' && tipoCondicion === 'suma_intervalos' && (
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                        {intervals.map((inv, index) => (
                                            <div key={inv.id} style={{ position: 'relative', flex: '1 1 calc(50% - 15px)', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-card, #fff)', padding: '24px 15px 15px 15px', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)' }}>
                                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', flex: '0 0 140px', color: 'var(--text-color, #334155)' }}>
                                                        {renderLatex(`\\text{Límite Inferior } (x_{${index * 2 + 1}}):`)}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={inv.min}
                                                        onChange={e => {
                                                            const newIntervals = [...intervals];
                                                            newIntervals[index].min = e.target.value;
                                                            setIntervals(newIntervals);
                                                        }}
                                                        step="any"
                                                        style={{ flex: 1, minWidth: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #fff)', color: 'var(--text-color, #334155)', marginRight: '30px' }}
                                                    />
                                                </div>
                                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', flex: '0 0 140px', color: 'var(--text-color, #334155)' }}>
                                                        {renderLatex(`\\text{Límite Superior } (x_{${index * 2 + 2}}):`)}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={inv.max}
                                                        onChange={e => {
                                                            const newIntervals = [...intervals];
                                                            newIntervals[index].max = e.target.value;
                                                            setIntervals(newIntervals);
                                                        }}
                                                        step="any"
                                                        style={{ flex: 1, minWidth: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #fff)', color: 'var(--text-color, #334155)', marginRight: '30px' }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (intervals.length > 1) {
                                                            setIntervals(intervals.filter(i => i.id !== inv.id));
                                                        }
                                                    }}
                                                    disabled={intervals.length === 1}
                                                    style={{
                                                        position: 'absolute', top: '8px', right: '8px',
                                                        padding: '5px', background: intervals.length === 1 ? 'transparent' : '#fee2e2', color: intervals.length === 1 ? '#94a3b8' : '#ef4444', border: 'none', borderRadius: '6px', cursor: intervals.length === 1 ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title="Eliminar intervalo"
                                                >
                                                    <IconoBasura width="15" height="15" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIntervals([...intervals, { id: Date.now(), min: '', max: '' }])}
                                        style={{ padding: '8px 12px', background: 'var(--primary-color, #2563eb)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <IconoMas width="16" height="16" /> Agregar otro intervalo
                                    </button>
                                </div>
                            )}

                            <button className="tema3-btn" onClick={manejarCalculo} style={{ flex: '0 0 auto', padding: '0 24px', fontSize: '0.9rem', height: '38px', width: 'auto' }}>
                                Calcular
                            </button>
                        </div>
                    </>
                )}

                {/* SECCIÓN DE GRAFICADO Y RESULTADOS */}
                <div style={{ margin: '20px 0' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function CustomSelect({ value, onChange, options }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allOptions = React.useMemo(() => {
        let list = [];
        options.forEach(o => {
            if (o.group) {
                list.push(...o.items);
            } else {
                list.push(o);
            }
        });
        return list;
    }, [options]);

    const selectedOption = allOptions.find(o => o.value === value) || allOptions[0] || { label: 'Seleccionar...' };

    return (
        <div ref={selectRef} style={{ position: 'relative', width: '100%', fontFamily: 'var(--font-family, inherit)' }}>
            <div 
                onClick={() => setIsOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px',
                    height: '38px',
                    boxSizing: 'border-box',
                    background: 'var(--bg-input, white)',
                    border: `1px solid ${isOpen ? 'var(--primary-color, #3b82f6)' : 'var(--border-color, #cbd5e1)'}`,
                    borderRadius: '8px', cursor: 'pointer',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-color, #1e293b)',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selectedOption.label}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted, #64748b)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'var(--bg-panel, white)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeInDropdown 0.2s ease',
                    maxHeight: '440px',
                    overflowY: 'auto',
                }}>
                    {options.map((op, idx) => {
                        if (op.group) {
                            return (
                                <div key={op.group}>
                                    <div style={{ padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        {op.group}
                                    </div>
                                    {op.items.map((subOp, subIdx) => {
                                        const active = value === subOp.value;
                                        return (
                                            <div 
                                                key={subOp.value}
                                                onClick={() => { onChange(subOp.value); setIsOpen(false); }}
                                                onMouseEnter={e => {
                                                    if (!active) {
                                                        e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                                                        e.currentTarget.style.color = '#3b82f6';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!active) {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = 'var(--text-color, #1e293b)';
                                                    }
                                                }}
                                                style={{
                                                    padding: '10px 14px', cursor: 'pointer',
                                                    background: active ? 'var(--primary-color, #3b82f6)' : 'transparent',
                                                    color: active ? 'white' : 'var(--text-color, #1e293b)',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.15s ease',
                                                    borderBottom: (subIdx < op.items.length - 1) ? '1px solid var(--border-color, #f1f5f9)' : 'none'
                                                }}
                                            >
                                                {subOp.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        } else {
                            // Render plano si no usa grupos
                            const active = value === op.value;
                            return (
                                <div 
                                    key={op.value}
                                    onClick={() => { onChange(op.value); setIsOpen(false); }}
                                    style={{
                                        padding: '10px 14px', cursor: 'pointer',
                                        background: active ? 'var(--primary-color, #3b82f6)' : 'transparent',
                                        color: active ? 'white' : 'var(--text-color, #1e293b)',
                                        fontSize: '0.85rem',
                                        borderBottom: idx < options.length - 1 ? '1px solid var(--border-color, #f1f5f9)' : 'none'
                                    }}
                                >
                                    {op.label}
                                </div>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
}
