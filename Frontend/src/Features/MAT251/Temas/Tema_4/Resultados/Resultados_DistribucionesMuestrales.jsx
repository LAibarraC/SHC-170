import React, { useState, useEffect, useRef } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import { calcularDistribucionMuestral } from '../../../Matematicas/logica_Tema1';
import { EditarDatos } from '../../../../../ui/iconos';
import Latex from '../../../../../components/excel/Latex';
import Skeleton from '../../../../../ui/Skeleton';

export default function Resultados_DistribucionesMuestrales({ varSeleccionada, filas, abrirEditor }) {
    const [poblacion, setPoblacion] = useState('');
    const [n, setN] = useState('');
    const [conReemplazo, setConReemplazo] = useState(true);
    const [parametroCalculo, setParametroCalculo] = useState('media');
    const [isOpenParamSelect, setIsOpenParamSelect] = useState(false);
    const paramSelectRef = useRef(null);
    const [resDistMuestrales, setResDistMuestrales] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [cargando, setCargando] = useState(false);
    const filasPorPagina = 50;

    // Cerrar el selector personalizado al hacer clic fuera
    useEffect(() => {
        const handler = (e) => {
            if (paramSelectRef.current && !paramSelectRef.current.contains(e.target)) {
                setIsOpenParamSelect(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
            const res = calcularDistribucionMuestral(poblacion, n, conReemplazo, parametroCalculo);
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
        <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', marginTop: '15px' }}>
            {/* ── DATOS Y EDITAR DATOS ── */}
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ ...labelStyle, margin: 0 }}>Datos:</span>
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

            {/* Controles */}
            <div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--bg-input)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={labelStyle}>Parámetro a Calcular:</label>
                        <div ref={paramSelectRef} style={{ position: 'relative', width: '100%', fontFamily: FONT }}>
                            <div
                                onClick={() => setIsOpenParamSelect(o => !o)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    height: '36px',
                                    boxSizing: 'border-box',
                                    background: 'var(--bg-card)',
                                    border: `1px solid ${isOpenParamSelect ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    borderRadius: RADIUS, 
                                    cursor: 'pointer',
                                    boxShadow: isOpenParamSelect ? '0 0 0 3px rgba(0,123,255,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s ease',
                                    color: 'var(--text-color)',
                                    userSelect: 'none',
                                }}
                            >
                                <span style={{ fontWeight: 400, fontSize: FS.sm }}>
                                    {parametroCalculo === 'media' ? 'Promedios (Normal)' : 'Varianzas (Chi-cuadrada)'}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ transform: isOpenParamSelect ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>

                            {isOpenParamSelect && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: RADIUS,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    zIndex: 1000,
                                    overflow: 'hidden',
                                    animation: 'fadeInDropdown 0.2s ease',
                                }}>
                                    <div 
                                        onClick={() => { setParametroCalculo('media'); setIsOpenParamSelect(false); }}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: FS.sm,
                                            cursor: 'pointer',
                                            background: parametroCalculo === 'media' ? 'var(--primary-color)' : 'transparent',
                                            color: parametroCalculo === 'media' ? '#fff' : 'var(--text-color)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { if (parametroCalculo !== 'media') e.target.style.background = 'transparent' }}
                                        onMouseLeave={(e) => { if (parametroCalculo !== 'media') e.target.style.background = 'transparent' }}
                                    >
                                        Promedios (Normal)
                                    </div>
                                    <div 
                                        onClick={() => { setParametroCalculo('varianza'); setIsOpenParamSelect(false); }}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: FS.sm,
                                            cursor: 'pointer',
                                            background: parametroCalculo === 'varianza' ? 'var(--primary-color)' : 'transparent',
                                            color: parametroCalculo === 'varianza' ? '#fff' : 'var(--text-color)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { if (parametroCalculo !== 'varianza') e.target.style.background = 'transparent' }}
                                        onMouseLeave={(e) => { if (parametroCalculo !== 'varianza') e.target.style.background = 'transparent' }}
                                    >
                                        Varianzas (Chi-cuadrada)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                        <label style={labelStyle}>Tamaño de la Muestra (n):</label>
                        <input 
                            type="number" 
                            value={n} 
                            onChange={e => setN(e.target.value)} 
                            min="1"
                            placeholder="Ej. 2"
                            style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)', boxSizing: 'border-box', height: '36px', background: 'var(--bg-card)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                        <label style={labelStyle}>Tipo de Muestreo:</label>
                        <div style={{ display: 'flex', position: 'relative', background: 'var(--bg-card)', padding: '2px', borderRadius: RADIUS, border: '1px solid var(--border-color)', height: '36px', boxSizing: 'border-box' }}>
                            {/* Animación del selector */}
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                bottom: '2px',
                                left: conReemplazo ? '2px' : '50%',
                                width: 'calc(50% - 2px)',
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

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <button 
                            onClick={ejecutar} 
                            disabled={cargando}
                            className="button_calcular btn-icon"
                            style={{ 
                                padding: '8px 25px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, height: '36px',
                                background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content'
                            }}
                        >
                            CALCULAR
                        </button>
                    </div>
                </div>
            </div>

            {/* Resultados */}
            {resDistMuestrales && (
                <div style={{ ...cardStyle }}>
                    {resDistMuestrales.error ? (
                        <div style={{ padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, border: '1px solid #f87171', fontWeight: 'bold', fontSize: FS.sm }}>
                            {resDistMuestrales.error}
                        </div>
                    ) : (
                        (() => {
                            const parametroCalculado = resDistMuestrales.calculosFinales?.parametroCalculo || 'media';
                            return (
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
                                    
                                    {resDistMuestrales.resultado?.length > 1000 ? (
                                        <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: RADIUS, border: '1px solid #ffeeba', fontWeight: 'bold', fontSize: FS.sm, textAlign: 'center' }}>
                                            Se han generado más de 1000 iteraciones ({resDistMuestrales.resultado.length}). Por protección de rendimiento, la tabla visual de subgrupos ha sido ocultada, pero el cálculo de parámetros muestrales de abajo se ha completado correctamente.
                                        </div>
                                    ) : (
                                        <div style={{ borderRadius: RADIUS, border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-card, white)' }}>
                                            <div className="thin-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                <table className="tabla-academica" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px', textAlign: 'center' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Nº Muestra</th>
                                                            <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>n = {n}</th>
                                                            <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>Valores</th>
                                                            <th style={{ padding: '12px 10px', position: 'sticky', top: 0, background: 'var(--header-bg, #f3f4f6)', zIndex: 10, boxShadow: 'inset 0 -1px 0 var(--border-color)' }}>
                                                                <Latex formula={parametroCalculado === 'media' ? '\\bar{x}' : 'S^2'} />
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filasPaginadas.map((fila, i) => (
                                                            <tr key={fila.id}>
                                                                <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{fila.id}</td>
                                                                <td style={{ padding: '8px 10px' }}>{fila.elementos}</td>
                                                                <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{fila.valores}</td>
                                                                <td style={{ padding: '8px 10px' }}>{parametroCalculado === 'media' ? fila.media : fila.varianza}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    
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

                                    {/* Nueva Tabla de Distribución Muestral */}
                                    {resDistMuestrales.distribucion && (
                                        <div style={{ marginTop: '30px' }}>
                                            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                                                Distribución Muestral de {parametroCalculado === 'media' ? 'Medias' : 'Varianzas'}
                                            </h4>
                                            <div className="thin-scrollbar" style={{ overflowX: 'auto', background: 'var(--bg-card, white)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ padding: '6px 20px', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--header-bg, #f3f4f6)' }}>
                                                                <Latex formula={parametroCalculado === 'media' ? "\\bar{X}" : "S^2"} />
                                                            </td>
                                                            {resDistMuestrales.distribucion.map((d, i) => (
                                                                <td key={i} style={{ padding: '6px 20px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', borderRight: i < resDistMuestrales.distribucion.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                    {d.valor}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '8px 20px', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: 'var(--header-bg, #f3f4f6)' }}>
                                                                <Latex formula={parametroCalculado === 'media' ? "P(\\bar{X} = \\bar{x}_i) = p_i" : "P(S^2 = s^2_i) = p_i"} />
                                                            </td>
                                                            {resDistMuestrales.distribucion.map((d, i) => (
                                                                <td key={i} style={{ padding: '8px 20px', fontSize: '14px', borderRight: i < resDistMuestrales.distribucion.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
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
                                        <div style={{ marginTop: '30px' }}>
                                            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                                                Conclusión y Cálculos Finales
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>
                                                    Parámetros Muestrales
                                                </div>
                                                
                                                {parametroCalculado === 'media' ? (
                                                    <>
                                                        <div style={{ padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                                            <div className="thin-scrollbar" style={{ padding: '10px 0 10px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                                <Latex formula={`\\begin{aligned} E(\\bar{X}) &= \\sum_{i=1}^{${resDistMuestrales.distribucion.length}} \\bar{x}_i p_i \\\\ &= ${resDistMuestrales.distribucion.map(d => `\\frac{${d.frecuencia}}{${d.total}}(${Number(d.valor).toFixed(2)})`).join(' + ')} = ${Number(resDistMuestrales.calculosFinales.esperanza).toFixed(2)} \\end{aligned}`} />
                                                            </div>
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', marginTop: '10px', marginBottom: '15px', textAlign: 'center' }}>
                                                            Obsérvese que: <Latex formula={`E(\\bar{X}) = \\mu = ${Number(resDistMuestrales.calculosFinales.mediaPoblacional).toFixed(2)}`} />
                                                        </div>

                                                        <div style={{ padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                                            <div className="thin-scrollbar" style={{ padding: '10px 0 10px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                                <Latex formula={`\\begin{aligned} Var(\\bar{X}) &= \\sum_{i=1}^{${resDistMuestrales.distribucion.length}} (\\bar{x}_i - E(\\bar{X}))^2 p_i \\\\ &= ${resDistMuestrales.distribucion.map(d => `\\frac{${d.frecuencia}}{${d.total}}(${Number(d.valor).toFixed(2)} - ${Number(resDistMuestrales.calculosFinales.esperanza).toFixed(2)})^2`).join(' + ')} = ${Number(resDistMuestrales.calculosFinales.varianzaDeDistribucion).toFixed(2)} \\end{aligned}`} />
                                                            </div>
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
                                                            Obsérvese que: <Latex formula={`Var(\\bar{X}) = \\frac{\\sigma^2}{n} ${!resDistMuestrales.calculosFinales.conReemplazo ? '\\left(\\frac{N-n}{N-1}\\right)' : ''} = \\frac{${Number(resDistMuestrales.calculosFinales.varianzaPoblacional).toFixed(2)}}{${resDistMuestrales.calculosFinales.n}} ${!resDistMuestrales.calculosFinales.conReemplazo ? `\\left(\\frac{${resDistMuestrales.calculosFinales.N}-${resDistMuestrales.calculosFinales.n}}{${resDistMuestrales.calculosFinales.N}-1}\\right)` : ''} = ${Number(resDistMuestrales.calculosFinales.varianzaDeDistribucion).toFixed(2)}`} />
                                                        </div>
                                                        
                                                        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                            <Latex formula={`\\bar{X} \\sim N(${Number(resDistMuestrales.calculosFinales.esperanza).toFixed(2)} ; ${Number(resDistMuestrales.calculosFinales.varianzaDeDistribucion).toFixed(2)})`} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{ padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                                                            <div className="thin-scrollbar" style={{ padding: '10px 0 10px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                                <Latex formula={`\\begin{aligned} E(S^2) &= \\sum_{i=1}^{${resDistMuestrales.distribucion.length}} s^2_i p_i \\\\ &= ${resDistMuestrales.distribucion.map(d => `\\frac{${d.frecuencia}}{${d.total}}(${Number(d.valor).toFixed(2)})`).join(' + ')} = ${Number(resDistMuestrales.calculosFinales.esperanza).toFixed(2)} \\end{aligned}`} />
                                                            </div>
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
                                                            Obsérvese que: <Latex formula={`E(S^2) = \\sigma^2 = ${Number(resDistMuestrales.calculosFinales.varianzaPoblacional).toFixed(2)}`} />
                                                        </div>
                                                        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--header-bg, #f3f4f6)', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                            <Latex formula={`\\frac{(${resDistMuestrales.calculosFinales.n}-1)S^2}{\\sigma^2} \\sim \\chi^2_{${resDistMuestrales.calculosFinales.n}-1}`} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    );
                })()
            )}
        </div>
    )}
</div>
    );
}
