import React, { useState, useEffect } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import { calcularDistribucionMuestral } from '../../../Matematicas/logica_Tema1';
import { EditarDatos } from '../../../../../ui/iconos';
import Latex from '../../../../../components/excel/Latex';
import Skeleton from '../../../../../ui/Skeleton';

export default function Resultados_DistribucionesMuestrales({ varSeleccionada, filas, abrirEditor }) {
    const [poblacion, setPoblacion] = useState('');
    const [n, setN] = useState('');
    const [conReemplazo, setConReemplazo] = useState(true);
    const [resDistMuestrales, setResDistMuestrales] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [cargando, setCargando] = useState(false);
    const filasPorPagina = 50;

    useEffect(() => {
        // Sincronizar estrictamente la población con las filas
        const valoresValidos = filas
            ?.map(f => (f.valor || '').toString().trim())
            .filter(v => v !== '');
            
        if (valoresValidos && valoresValidos.length > 0) {
            setPoblacion(valoresValidos.join(', '));
        } else {
            setPoblacion('');
        }
    }, [filas]);

    const filasValidas = filas?.filter(f => (f.valor || '').toString().trim() !== '') || [];

    const ejecutar = () => {
        setCargando(true);
        // Usamos un pequeño setTimeout (50ms) solo para permitir que React pinte el Skeleton antes de cálculos pesados
        setTimeout(() => {
            const res = calcularDistribucionMuestral(poblacion, n, conReemplazo);
            setResDistMuestrales(res);
            setPaginaActual(1); // Reiniciar a la página 1 en cada nuevo cálculo
            setCargando(false);
        }, 50);
    };

    // Lógica de Paginación
    const totalDatos = resDistMuestrales?.resultado?.length || 0;
    const totalPaginas = Math.ceil(totalDatos / filasPorPagina);
    const indexOfLastFila = paginaActual * filasPorPagina;
    const indexOfFirstFila = indexOfLastFila - filasPorPagina;
    const filasPaginadas = (resDistMuestrales?.resultado || []).slice(indexOfFirstFila, indexOfLastFila);

    return (
        <div style={{ fontFamily: FONT }}>
            {/* Controles movidos a la derecha */}
            <div style={{ ...cardStyle, marginBottom: '20px', background: 'var(--bg-card)' }}>
                {/* ── ESPACIO MUESTRAL Y EDITAR DATOS ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                        <span style={{ ...labelStyle, margin: 0 }}>Espacio Muestral:</span>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                            <small style={{ color: 'var(--text-muted)', fontSize: FS.xs }}>
                                Cargados: <strong>{filasValidas.filter(f => f.origen === 'cargado').length}</strong>
                            </small>
                            <small style={{ color: 'var(--text-muted)', fontSize: FS.xs }}>
                                Agregados: <strong>{filasValidas.filter(f => f.origen === 'agregado').length}</strong>
                            </small>
                            <small title="Total de filas" style={{ color: 'var(--text-muted)', fontSize: FS.xs }}>
                                Total: <strong style={{ color: 'var(--primary-color)' }}>{filasValidas.length}</strong>
                            </small>
                        </div>
                    </div>
                    <button onClick={abrirEditor} className="btn-icon" style={{ borderRadius: RADIUS, fontSize: FS.sm, padding: '6px 14px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <EditarDatos /> Editar Datos
                    </button>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />

                <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                    Parámetros de Distribuciones Muestrales
                </h4>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={labelStyle}>Tamaño de la Muestra (n):</label>
                        <input 
                            type="number" 
                            value={n} 
                            onChange={e => setN(e.target.value)} 
                            min="1"
                            placeholder="Ej. 2"
                            style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)', boxSizing: 'border-box', height: '38px' }}
                        />
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                        <label style={labelStyle}>Tipo de Muestreo:</label>
                        <div style={{ display: 'flex', position: 'relative', background: 'var(--bg-input, #f8fafc)', padding: '4px', borderRadius: RADIUS, border: '1px solid var(--border-color)', height: '38px', boxSizing: 'border-box' }}>
                            {/* Animación del selector */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: conReemplazo ? '4px' : '50%',
                                width: 'calc(50% - 4px)',
                                background: 'var(--primary-color)',
                                borderRadius: RADIUS,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }} />
                            
                            <button 
                                onClick={() => setConReemplazo(true)}
                                style={{
                                    flex: 1, padding: '0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: RADIUS,
                                    background: 'transparent',
                                    color: conReemplazo ? 'white' : 'var(--text-color)',
                                    fontWeight: conReemplazo ? 600 : 400, cursor: 'pointer',
                                    fontSize: FS.sm, transition: 'color 0.3s ease',
                                    position: 'relative', zIndex: 1
                                }}
                            >
                                Con Reemplazo
                            </button>
                            <button 
                                onClick={() => setConReemplazo(false)}
                                style={{
                                    flex: 1, padding: '0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: RADIUS,
                                    background: 'transparent',
                                    color: !conReemplazo ? 'white' : 'var(--text-color)',
                                    fontWeight: !conReemplazo ? 600 : 400, cursor: 'pointer',
                                    fontSize: FS.sm, transition: 'color 0.3s ease',
                                    position: 'relative', zIndex: 1
                                }}
                            >
                                Sin Reemplazo
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={ejecutar} 
                        disabled={cargando}
                        style={{ 
                            padding: '10px 24px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, 
                            background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        CALCULAR
                    </button>
                </div>
            </div>

            {/* Resultados */}
            {resDistMuestrales && (
                <div style={{ ...cardStyle, marginTop: '20px' }}>
                    {resDistMuestrales.error ? (
                        <div style={{ padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, border: '1px solid #f87171', fontWeight: 'bold', fontSize: FS.sm }}>
                            {resDistMuestrales.error}
                        </div>
                    ) : (
                        <>
                            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                                Subgrupos y Cálculos Muestrales
                            </h4>
                            
                            {cargando ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                    <Skeleton height="40px" borderRadius={RADIUS} />
                                    <Skeleton height="50px" borderRadius={RADIUS} />
                                    <Skeleton height="50px" borderRadius={RADIUS} />
                                    <Skeleton height="50px" borderRadius={RADIUS} />
                                    <Skeleton height="50px" borderRadius={RADIUS} />
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', fontSize: FS.sm, alignItems: 'center' }}>
                                        <div style={{ background: 'rgba(0,123,255,0.1)', padding: '5px 10px', borderRadius: RADIUS }}>
                                            Total Muestras: <strong>{resDistMuestrales.resultado?.length || 0}</strong>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="tabla-academica" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px', textAlign: 'center' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 1px 0 var(--border-color), inset 0 -1px 0 var(--border-color)' }}>Nº Muestra</th>
                                                    <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 1px 0 var(--border-color), inset 0 -1px 0 var(--border-color)' }}>n = {n}</th>
                                                    <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 1px 0 var(--border-color), inset 0 -1px 0 var(--border-color)' }}>Valores</th>
                                                    <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 1px 0 var(--border-color), inset 0 -1px 0 var(--border-color)' }}><Latex formula="\bar{x}" /></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filasPaginadas.map((fila, i) => (
                                                    <tr key={fila.id}>
                                                        <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{fila.id}</td>
                                                        <td style={{ padding: '8px 10px' }}>{fila.elementos}</td>
                                                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{fila.valores}</td>
                                                        <td style={{ padding: '8px 10px' }}>{fila.media}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Controles de Paginación */}
                                    {totalPaginas > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px', fontSize: FS.sm }}>
                                            <button 
                                                disabled={paginaActual === 1}
                                                onClick={() => setPaginaActual(paginaActual - 1)}
                                                style={{ padding: '6px 12px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: paginaActual === 1 ? 'var(--header-bg, #f3f4f6)' : 'var(--bg-card, white)', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: paginaActual === 1 ? 'var(--text-muted)' : 'var(--text-color)', fontWeight: 600 }}
                                            >
                                                Anterior
                                            </button>
                                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                                Página {paginaActual} de {totalPaginas}
                                            </span>
                                            <button 
                                                disabled={paginaActual === totalPaginas}
                                                onClick={() => setPaginaActual(paginaActual + 1)}
                                                style={{ padding: '6px 12px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: paginaActual === totalPaginas ? 'var(--header-bg, #f3f4f6)' : 'var(--bg-card, white)', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', color: paginaActual === totalPaginas ? 'var(--text-muted)' : 'var(--text-color)', fontWeight: 600 }}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}

                                    {/* Nueva Tabla de Distribución Muestral de Medias */}
                                    {resDistMuestrales.distribucionMedias && (
                                        <div style={{ marginTop: '30px' }}>
                                            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                                                Distribución Muestral de Medias
                                            </h4>
                                            <div className="thin-scrollbar" style={{ overflowX: 'auto', background: 'var(--bg-card, white)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ padding: '6px 20px', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--header-bg, #f3f4f6)' }}>
                                                                <Latex formula="\bar{X}" />
                                                            </td>
                                                            {resDistMuestrales.distribucionMedias.map((d, i) => (
                                                                <td key={i} style={{ padding: '6px 20px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', borderRight: i < resDistMuestrales.distribucionMedias.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                    {d.media}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '8px 20px', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: 'var(--header-bg, #f3f4f6)' }}>
                                                                <Latex formula="P(\bar{X} = \bar{x}_i) = p_i" />
                                                            </td>
                                                            {resDistMuestrales.distribucionMedias.map((d, i) => (
                                                                <td key={i} style={{ padding: '8px 20px', fontSize: '14px', borderRight: i < resDistMuestrales.distribucionMedias.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                        <span style={{ padding: '0 5px' }}>{d.frecuencia}</span>
                                                                        <span style={{ borderTop: '1px solid currentColor', width: '100%', padding: '0 5px' }}>{d.total}</span>
                                                                    </div>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Conclusión y Cálculos Finales */}
                                    {resDistMuestrales.calculosFinales && (
                                        <div style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-card, white)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                                                Conclusión y Cálculos Finales
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px' }}>
                                                {/* Parámetros Poblacionales */}
                                                <div style={{ padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '15px', color: 'var(--text-color)' }}>
                                                        1. Parámetros Poblacionales (Datos Originales)
                                                    </div>
                                                    <div className="thin-scrollbar" style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', paddingBottom: '10px' }}>
                                                        <Latex formula={`\\text{Media Poblacional } (\\mu) = \\frac{\\sum x_i}{N} = \\frac{${resDistMuestrales.calculosFinales.poblacionOriginal.join(' + ')}}{${resDistMuestrales.calculosFinales.N}} = ${Number(resDistMuestrales.calculosFinales.mediaPoblacional).toFixed(2)}`} />
                                                    </div>
                                                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '15px 0' }} />
                                                    <div className="thin-scrollbar" style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', paddingBottom: '10px' }}>
                                                        <Latex formula={`\\text{Varianza Poblacional } (\\sigma^2) = \\frac{\\sum (x_i - \\mu)^2}{N}`} />
                                                        <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
                                                            <Latex formula={`= \\frac{${resDistMuestrales.calculosFinales.poblacionOriginal.map(v => `(${v} - ${Number(resDistMuestrales.calculosFinales.mediaPoblacional).toFixed(2)})^2`).join(' + ')}}{${resDistMuestrales.calculosFinales.N}} = ${Number(resDistMuestrales.calculosFinales.varianzaPoblacional).toFixed(2)}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>
                                                    2. Parámetros Muestrales
                                                </div>
                                                <div>
                                                    <Latex formula={`E(\\bar{X}) = \\sum_{i=1}^{${resDistMuestrales.distribucionMedias.length}} \\bar{x}_i p_i`} />
                                                    <div className="thin-scrollbar" style={{ padding: '10px 0 10px 20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                        <Latex formula={`= ${resDistMuestrales.distribucionMedias.map(d => `\\frac{${d.frecuencia}}{${d.total}}(${Number(d.media).toFixed(2)})`).join(' + ')} = ${Number(resDistMuestrales.calculosFinales.esperanzaMedia).toFixed(2)}`} />
                                                    </div>
                                                </div>
                                                <div style={{ color: 'var(--text-muted)' }}>
                                                    Obsérvese que: <Latex formula={`E(\\bar{X}) = \\mu = ${Number(resDistMuestrales.calculosFinales.mediaPoblacional).toFixed(2)}`} />
                                                </div>
                                                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '5px 0' }} />
                                                <div>
                                                    <Latex formula={`Var(\\bar{X}) = \\sum_{i=1}^{${resDistMuestrales.distribucionMedias.length}} (\\bar{x}_i - E(\\bar{X}))^2 p_i`} />
                                                    <div className="thin-scrollbar" style={{ padding: '10px 0 10px 20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                        <Latex formula={`= ${resDistMuestrales.distribucionMedias.map(d => `\\frac{${d.frecuencia}}{${d.total}}(${Number(d.media).toFixed(2)} - ${Number(resDistMuestrales.calculosFinales.esperanzaMedia).toFixed(2)})^2`).join(' + ')} = ${Number(resDistMuestrales.calculosFinales.varianzaMedia).toFixed(2)}`} />
                                                    </div>
                                                </div>
                                                <div style={{ color: 'var(--text-muted)' }}>
                                                    Obsérvese que: <Latex formula={`Var(\\bar{X}) = \\frac{\\sigma^2}{n} ${!resDistMuestrales.conReemplazo ? '\\left(\\frac{N-n}{N-1}\\right)' : ''} = \\frac{${Number(resDistMuestrales.calculosFinales.varianzaPoblacional).toFixed(2)}}{${resDistMuestrales.calculosFinales.n}} ${!resDistMuestrales.conReemplazo ? `\\left(\\frac{${resDistMuestrales.calculosFinales.N}-${resDistMuestrales.calculosFinales.n}}{${resDistMuestrales.calculosFinales.N}-1}\\right)` : ''} = ${Number(resDistMuestrales.calculosFinales.varianzaMedia).toFixed(2)}`} />
                                                </div>
                                                
                                                <div style={{ marginTop: '15px', padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--primary-color)', textAlign: 'center' }}>
                                                    <Latex formula={`\\bar{X} \\sim N(${Number(resDistMuestrales.calculosFinales.esperanzaMedia).toFixed(2)} ; ${Number(resDistMuestrales.calculosFinales.varianzaMedia).toFixed(2)})`} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
