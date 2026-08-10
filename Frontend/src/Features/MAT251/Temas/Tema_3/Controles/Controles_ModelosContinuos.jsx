import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/Temas/Tema3.css';
import { calcularDistribucionContinua, generarDatosGraficoContinua } from '../../../Matematicas/logica_Tema3_continuas';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

    // Condición
    const [tipoCondicion, setTipoCondicion] = useState('menor_igual'); // 'menor_igual', 'mayor_igual', 'intervalo'
    const [valorX, setValorX] = useState('');
    const [valorB_cond, setValorB_cond] = useState('');

    // Matriz
    const [columnaSeleccionada, setColumnaSeleccionada] = useState(0);
    const [statsEstimados, setStatsEstimados] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setParamA('');
        setParamB('');
        
        setTipoCondicion('menor_igual');
        setValorX('');
        setValorB_cond('');
        
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
        } else {
            return setError('Este modelo continuo aún está en construcción.');
        }

        let condicionCalculo = null;
        let condicionVisual = null;
        
        if (valorX !== '') {
            let x = parseFloat(valorX);
            if (isNaN(x)) return setError('El valor objetivo "x" debe ser numérico.');

            let valB = 0;
            if (tipoCondicion.includes('intervalo')) {
                valB = parseFloat(valorB_cond);
                if (isNaN(valB) || valB <= x) return setError('El límite superior del intervalo debe ser mayor que el límite inferior.');
            }

            condicionVisual = { tipo: tipoCondicion, valorX: x, valorB: valB };
            condicionCalculo = { tipo: tipoCondicion, valorX: x, valorB: valB };
        }

        const resultados = calcularDistribucionContinua(modelo, params, condicionCalculo);
        const datosGrafico = generarDatosGraficoContinua(modelo, params, condicionCalculo);

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

        if (modelo !== 'Uniforme') {
            return (
                <div style={{ textAlign: 'center', marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-color)', width: '100%' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Módulo en construcción. Muy pronto podrás estimar y graficar esta distribución continua.</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '15px', marginTop: '5px' }}>

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

                {modo === 'matriz' && modelo === 'Uniforme' && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }}>
                            <div>
                                <div style={{ color: 'var(--primary-color, #0d6efd)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Conjunto de Datos numéricos:</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                                    Cargados: <strong style={{ color: 'var(--primary-color, #0d6efd)' }}>{statsDatos ? statsDatos.cargados : 0}</strong> &nbsp;
                                </div>
                            </div>
                            <button
                                onClick={abrirEditor}
                                style={{ padding: '8px 16px', background: 'var(--bg-input, #e2e8f0)', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color, #1e293b)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Mínimo {renderLatex('a')}</span>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.min?.toFixed(4)}</strong>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Máximo {renderLatex('b')}</span>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-color, #0f172a)' }}>{statsEstimados.max?.toFixed(4)}</strong>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>No hay datos cargados en el estado global. Ve a Gestión de Datos para importar.</p>
                        )}
                    </div>
                )}

                {renderParametrosManuales()}

                {modelo === 'Uniforme' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button className="tema3-btn" onClick={manejarCalculo} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto' }}>
                            Graficar
                        </button>
                    </div>
                )}

                {children && modelo === 'Uniforme' && (
                    <>
                        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', margin: '15px 0' }}></div>

                        <h4 style={{ color: 'var(--text-color, #334155)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>Condición de Probabilidad</h4>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '25px' }}>
                            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
                                <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Operador lógico</label>
                                <CustomSelect
                                    value={tipoCondicion}
                                    onChange={val => setTipoCondicion(val)}
                                    options={[
                                        { value: 'menor_igual', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X \\leq x) \\text{ o } P(X < x)')}</div> },
                                        { value: 'mayor_igual', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X \\geq x) \\text{ o } P(X > x)')}</div> },
                                        { value: 'intervalo', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(a \\leq X \\leq b)')}</div> },
                                    ]}
                                />
                            </div>

                            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                                <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Valor {tipoCondicion.includes('intervalo') ? 'Inferior (a)' : '(x)'}</label>
                                <input
                                    type="number" step="any" className="tema3-input"
                                    value={valorX} onChange={e => setValorX(e.target.value)}
                                    placeholder="0"
                                    style={{ padding: '0 10px', fontSize: '0.85rem', height: '36px', boxSizing: 'border-box' }}
                                />
                            </div>

                            {tipoCondicion.includes('intervalo') && (
                                <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                                    <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Valor Superior (b)</label>
                                    <input
                                        type="number" step="any" className="tema3-input"
                                        value={valorB_cond} onChange={e => setValorB_cond(e.target.value)}
                                        placeholder="0"
                                        style={{ padding: '0 10px', fontSize: '0.85rem', height: '36px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}
                            
                            <button className="tema3-btn" onClick={manejarCalculo} style={{ flex: '0 0 auto', padding: '0 16px', fontSize: '0.9rem', height: '36px', width: 'auto' }}>
                                Calcular Prob.
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

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div ref={selectRef} style={{ position: 'relative', width: '100%', fontFamily: 'var(--font-family, inherit)' }}>
            <div 
                onClick={() => setIsOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 10px',
                    height: '36px',
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
                    <div style={{ fontWeight: 400, fontSize: '0.8rem' }}>{selectedOption.label}</div>
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
                        const active = value === op.value;
                        return (
                            <div 
                                key={op.value}
                                onClick={() => { onChange(op.value); setIsOpen(false); }}
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
                                    padding: '8px 12px', cursor: 'pointer',
                                    background: active ? 'var(--primary-color, #3b82f6)' : 'transparent',
                                    color: active ? 'white' : 'var(--text-color, #1e293b)',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.15s ease',
                                    borderBottom: idx < options.length - 1 ? '1px solid var(--border-color, #f1f5f9)' : 'none'
                                }}
                            >
                                {op.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
