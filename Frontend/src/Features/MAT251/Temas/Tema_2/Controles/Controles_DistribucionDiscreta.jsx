import React, { useState, useMemo, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../../../styles/Temas/Tema3.css';
import { IconoBasura, IconoMas } from '../../../../../ui/iconos';

export default function Controles_DistribucionDiscreta({ onCalcular, varSeleccionada, filas, statsDatos, abrirEditor }) {
    const [modo, setModo] = useState('matriz'); // 'manual' | 'matriz'
    const [tipoMatriz, setTipoMatriz] = useState('brutos'); // 'brutos' | 'probabilidades'
    const [columnaSeleccionada, setColumnaSeleccionada] = useState('');
    const [columnaProbabilidad, setColumnaProbabilidad] = useState('');
    const [error, setError] = useState('');

    const [tabla, setTabla] = useState([
        { id: 1, x: '', p: '' },
        { id: 2, x: '', p: '' }
    ]);

    // Lógica para Gestión de Datos
    const columnasDisponibles = useMemo(() => {
        return (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 0)
            ? varSeleccionada.nombresColumnas
            : (varSeleccionada ? [varSeleccionada.nombre || 'Datos'] : []);
    }, [varSeleccionada]);

    useEffect(() => {
        setColumnaSeleccionada('');
        setColumnaProbabilidad('');
    }, [columnasDisponibles]);

    // Reseteos al cambiar de modo
    useEffect(() => {
        setError('');
        onCalcular(null);
    }, [modo, tipoMatriz]);

    const agregarFila = () => {
        setTabla([...tabla, { id: Date.now(), x: '', p: '' }]);
    };

    const eliminarFila = (id) => {
        if (tabla.length <= 1) return;
        setTabla(tabla.filter(fila => fila.id !== id));
        onCalcular(null);
    };

    const actualizarFila = (id, campo, valor) => {
        setTabla(tabla.map(fila => fila.id === id ? { ...fila, [campo]: valor } : fila));
        onCalcular(null);
    };

    const sumaProbabilidades = useMemo(() => {
        return tabla.reduce((acc, curr) => {
            const val = parseFloat(curr.p);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    }, [tabla]);

    const esSumaValida = Math.abs(sumaProbabilidades - 1) < 0.0001;
    const hayCamposVacios = tabla.some(fila => fila.x === '' || fila.p === '');

    const handleCalcular = () => {
        if (!esSumaValida || hayCamposVacios) return;
        const datos = tabla.map(fila => ({
            x: parseFloat(fila.x),
            p: parseFloat(fila.p)
        }));
        onCalcular(datos); 
    };

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const datosColumna = useMemo(() => {
        if (!varSeleccionada || !filas || filas.length === 0 || columnaSeleccionada === '') return [];
        const validas = filas.filter(f => (f.valor || '').toString().trim() !== '');

        return validas.map(f => {
            if (varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
                const partes = (f.valor || '').toString().split(' | ');
                return partes[columnaSeleccionada] ? partes[columnaSeleccionada].trim() : '';
            }
            return (f.valor || '').toString().trim();
        }).map(v => parseFloat(v)).filter(v => !isNaN(v));
    }, [varSeleccionada, filas, columnaSeleccionada]);

    const procesarMatriz = () => {
        if (tipoMatriz === 'brutos') {
            if (columnaSeleccionada === '') {
                setError('Por favor selecciona la columna a evaluar.');
                return;
            }
            if (datosColumna.length === 0) {
                setError('No hay datos numéricos válidos en la columna seleccionada.');
                return;
            }

            const counts = {};
            datosColumna.forEach(val => {
                counts[val] = (counts[val] || 0) + 1;
            });

            const totalDatos = datosColumna.length;
            const datosGenerados = Object.keys(counts).map(key => {
                const val = parseFloat(key);
                const freq = counts[key];
                return {
                    x: val,
                    p: freq / totalDatos,
                    f: freq
                };
            }).sort((a, b) => a.x - b.x); // Ordenar por X de menor a mayor

            setError('');
            onCalcular(datosGenerados);
        } else {
            // Modo Tabla de Probabilidades (2 columnas)
            if (columnaSeleccionada === '' || columnaProbabilidad === '') {
                setError('Por favor selecciona las columnas para X y P(X).');
                return;
            }

            const validas = filas.filter(f => (f.valor || '').toString().trim() !== '');
            let sumaP = 0;
            const datosGenerados = [];

            for (let f of validas) {
                let valX = '';
                let valP = '';
                if (varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
                    const partes = (f.valor || '').toString().split(' | ');
                    valX = partes[columnaSeleccionada] ? partes[columnaSeleccionada].trim() : '';
                    valP = partes[columnaProbabilidad] ? partes[columnaProbabilidad].trim() : '';
                } else {
                    valX = (f.valor || '').toString().trim();
                    valP = valX; // Fallback, though likely to sum > 1
                }

                const numX = parseFloat(valX);
                const numP = parseFloat(valP);

                if (!isNaN(numX) && !isNaN(numP)) {
                    datosGenerados.push({ x: numX, p: numP });
                    sumaP += numP;
                }
            }

            if (datosGenerados.length === 0) {
                setError('No hay filas con valores numéricos válidos en ambas columnas.');
                return;
            }

            if (Math.abs(sumaP - 1) > 0.001) {
                setError(`Las probabilidades seleccionadas suman ${sumaP.toFixed(4)}. Deben sumar 1.0.`);
                return;
            }

            datosGenerados.sort((a, b) => a.x - b.x);
            setError('');
            onCalcular(datosGenerados);
        }
    };

    const cardStyle = {
        background: 'transparent',
        color: 'var(--text-main, #1e293b)',
        padding: '5px 0',
        height: '100%',
        boxSizing: 'border-box'
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '6px',
        outline: 'none',
        fontSize: '0.85rem',
        backgroundColor: 'var(--bg-input, #fff)',
        color: 'var(--text-main, #0f172a)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <button
                        type="button"
                        className={modo === 'matriz' ? 'btn-tema3-active' : ''}
                        onClick={() => setModo('matriz')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'matriz' ? '#3b82f6' : 'transparent',
                            color: modo === 'matriz' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Análisis de Matriz
                    </button>
                    <button
                        type="button"
                        className={modo === 'manual' ? 'btn-tema3-active' : ''}
                        onClick={() => setModo('manual')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'manual' ? '#3b82f6' : 'transparent',
                            color: modo === 'manual' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Modo Manual
                    </button>
                </div>
            </div>

            <h3 style={{ marginTop: 0, color: '#3b82f6', fontSize: '1rem', fontWeight: 600, marginBottom: '10px' }}>
                Datos
            </h3>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>
                    <strong>Error: </strong> {error}
                </div>
            )}

            {modo === 'matriz' && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }}>
                        <div>
                            <div style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Conjunto de Datos:</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                                Cargados: <strong style={{ color: '#3b82f6' }}>{statsDatos ? statsDatos.cargados : 0}</strong> &nbsp;
                                Agregados: <strong style={{ color: '#3b82f6' }}>{statsDatos ? statsDatos.agregados : 0}</strong> &nbsp;
                                Total: <strong style={{ color: '#3b82f6' }}>{statsDatos ? statsDatos.total : 0}</strong>
                            </div>
                        </div>
                        <button
                            className="btn-tema3-active"
                            onClick={abrirEditor}
                            style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Editar Datos
                        </button>
                    </div>
                    {columnasDisponibles.length > 0 ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setTipoMatriz('brutos')}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: tipoMatriz === 'brutos' ? '#3b82f6' : 'transparent',
                                            color: tipoMatriz === 'brutos' ? '#fff' : 'var(--text-muted, #64748b)',
                                            transition: 'all 0.2s',
                                            boxShadow: tipoMatriz === 'brutos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        Datos Brutos (1 columna)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoMatriz('probabilidades')}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: tipoMatriz === 'probabilidades' ? '#3b82f6' : 'transparent',
                                            color: tipoMatriz === 'probabilidades' ? '#fff' : 'var(--text-muted, #64748b)',
                                            transition: 'all 0.2s',
                                            boxShadow: tipoMatriz === 'probabilidades' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        Tabla Probabilidades (2 columnas)
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div className="tema3-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="tema3-label">
                                        {tipoMatriz === 'probabilidades' ? 
                                            <>Columna de Valor {renderLatex('(X)')}:</> : 
                                            'Columna a evaluar:'}
                                    </label>
                                    <select
                                        className="tema3-select"
                                        value={columnaSeleccionada}
                                        onChange={e => { setColumnaSeleccionada(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
                                    >
                                        <option value="" disabled>Selecciona una columna...</option>
                                        {columnasDisponibles.map((col, idx) => (
                                            <option key={idx} value={idx}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                                {tipoMatriz === 'probabilidades' && (
                                    <div className="tema3-form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="tema3-label">Columna Probabilidad {renderLatex('P(X)')}:</label>
                                        <select
                                            className="tema3-select"
                                            value={columnaProbabilidad}
                                            onChange={e => { setColumnaProbabilidad(e.target.value === '' ? '' : Number(e.target.value)); setError(''); }}
                                        >
                                            <option value="" disabled>Selecciona una columna...</option>
                                            {columnasDisponibles.map((col, idx) => (
                                                <option key={idx} value={idx}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <button
                                    className="tema3-btn btn-tema3-active"
                                    onClick={procesarMatriz}
                                    style={{ width: 'auto', padding: '8px 24px' }}
                                >
                                    CALCULAR
                                </button>
                            </div>
                        </>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>No hay datos cargados en el estado global. Ve a Gestión de Datos para importar.</p>
                    )}
                </div>
            )}

            {modo === 'manual' && (
                <>
                    <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', textAlign: 'left', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0px', color: 'var(--text-muted, #475569)', fontWeight: 600, fontSize: '0.9rem', width: '45%' }}>Valor {renderLatex('(X)')}</th>
                                    <th style={{ padding: '0 10px', color: 'var(--text-muted, #475569)', fontWeight: 600, fontSize: '0.9rem', width: '45%' }}>Probabilidad {renderLatex('P(X)')}</th>
                                    <th style={{ padding: '0 0px', width: '10%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabla.map((fila) => (
                                    <tr key={fila.id}>
                                        <td style={{ padding: '0 8px 0 0' }}>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                value={fila.x}
                                                placeholder="Ej. 0"
                                                onChange={(e) => actualizarFila(fila.id, 'x', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '0 8px' }}>
                                            <input
                                                type="number"
                                                style={inputStyle}
                                                step="0.01"
                                                min="0"
                                                max="1"
                                                value={fila.p}
                                                placeholder="Ej. 0.25"
                                                onChange={(e) => actualizarFila(fila.id, 'p', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '0 0 0 8px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => eliminarFila(fila.id)}
                                                style={{
                                                    background: 'transparent',
                                                    color: 'var(--text-error, #ef4444)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '8px',
                                                    cursor: tabla.length > 1 ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: tabla.length > 1 ? 0.7 : 0.3,
                                                    transition: 'opacity 0.2s ease, transform 0.1s ease',
                                                }}
                                                onMouseEnter={(e) => { if(tabla.length > 1) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; } }}
                                                onMouseLeave={(e) => { if(tabla.length > 1) { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'scale(1)'; } }}
                                                disabled={tabla.length <= 1}
                                                title="Eliminar fila"
                                            >
                                                <IconoBasura width="18" height="18" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={{ padding: '0px', textAlign: 'center' }}>
                                        <button
                                            onClick={agregarFila}
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--primary-color, #3b82f6)',
                                                border: '1px dashed var(--primary-color, #3b82f6)',
                                                borderRadius: '10px',
                                                padding: '5px 10px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-input, rgba(59, 130, 246, 0.05))'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'transparent'; }}
                                            title="Agregar valor"
                                        >
                                            <IconoMas width="15" height="15" />
                                        </button>
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td style={{ padding: '4px 8px 0 8px' }}>
                                        <div style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: esSumaValida ? 'var(--bg-success, #dcfce7)' : 'var(--bg-error, #fee2e2)',
                                            color: esSumaValida ? 'var(--text-success, #166534)' : 'var(--text-error, #991b1b)',
                                            border: `1px solid ${esSumaValida ? '#bbf7d0' : '#fecaca'}`,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>Suma:</span> {sumaProbabilidades.toFixed(4)}
                                            </span>
                                            {!esSumaValida && (
                                                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                                    Debe sumar 1.0
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                        <button
                            className="tema3-btn btn-tema3-active"
                            onClick={handleCalcular}
                            disabled={!esSumaValida || hayCamposVacios}
                            style={{ width: 'auto' }}
                        >
                            CALCULAR
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
