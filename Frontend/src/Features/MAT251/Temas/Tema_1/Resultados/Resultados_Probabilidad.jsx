import React, { useState, useEffect } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import GraficosProbabilidad from '../../../Graficas/Tema_1/GraficosEstadisticos';

import { IconoCalculadora, EditarDatos, ModificarSeleccion, IconoAlerta } from '../../../../../ui/iconos';


export default function ResultadosProbabilidad({
    statsDatos, abrirEditor, valoresUnicos, statsEventos, setModalEvento,
    eventoFavorable, ejecutar, resProbabilidad, formulaProbRef, inputDatos,
    tipo = 'clasica',
    eventoCondicion = [], setModalCondicion = () => { }
}) {
    const isFrec = tipo === 'frecuentista';
    const isCond = tipo === 'condicional';

    const getLabels = () => {
        if (isCond) {
            return {
                numerador: "Casos de Intersección n(A ∩ B)",
                denominador: "Casos de la Condición n(B)",
                tarjetaNumerador: "Intersección n(A∩B)",
                tarjetaDenominador: "Condición n(B)"
            };
        }
        if (isFrec) {
            return {
                numerador: "Frecuencia de Éxitos (f)",
                denominador: "Total de Experimentos / Observaciones (n)",
                tarjetaNumerador: "Frecuencia f(A)",
                tarjetaDenominador: "Total n"
            };
        }
        return {
            numerador: "Casos Favorables n(A)",
            denominador: "Total de Casos Posibles (N)",
            tarjetaNumerador: "Casos n(A)",
            tarjetaDenominador: "Total N"
        };
    };

    const labels = getLabels();

    const [inputMode, setInputMode] = useState('matriz'); // 'matriz' | 'manual'
    const [manualN, setManualN] = useState('');
    const [manualF, setManualF] = useState('');

    const nVal = parseFloat(manualN) || 0;
    const fVal = parseFloat(manualF) || 0;

    let errorManual = '';
    if (manualN === '' && manualF === '') {
        // Sin error inicial si están vacíos
    } else if (nVal <= 0) {
        errorManual = `${labels.denominador} debe ser mayor a 0.`;
    } else if (fVal < 0) {
        errorManual = `${labels.numerador} no puede ser menor a 0.`;
    } else if (fVal > nVal) {
        errorManual = `${labels.numerador} no puede ser mayor que ${labels.denominador}.`;
    }

    const activeRes = (() => {
        if (inputMode === 'manual') {
            if (errorManual || nVal <= 0) {
                return {
                    casosFavorables: fVal,
                    casosTotales: nVal,
                    probabilidadDecimal: '0.0000',
                    probabilidadPorcentaje: '0.00',
                    arrFiltrado: []
                };
            }
            const pDec = fVal / nVal;
            return {
                casosFavorables: fVal,
                casosTotales: nVal,
                probabilidadDecimal: pDec.toFixed(4),
                probabilidadPorcentaje: (pDec * 100).toFixed(2),
                arrFiltrado: []
            };
        }
        return resProbabilidad;
    })();

    // Renderizar KaTeX localmente para modo manual y modo matriz
    useEffect(() => {
        if (formulaProbRef.current && activeRes) {
            let latex = '';
            if (inputMode === 'manual') {
                if (isCond) {
                    latex = `P(A|B)=\\dfrac{n(A \\cap B)}{n(B)}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                } else if (isFrec) {
                    latex = `P(A)=\\dfrac{f}{n}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                } else {
                    latex = `P(A)=\\dfrac{n(A)}{N}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                }
            } else {
                if (isFrec) {
                    latex = `P(A)=\\dfrac{f}{n}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                } else if (isCond) {
                    latex = `P(A|B)=\\dfrac{n(A \\cap B)}{n(B)}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                } else if (tipo === 'total') {
                    latex = `P(A) = \\sum_{i} P(A|B_i)P(B_i) = ${activeRes.probabilidadDecimal}`;
                } else {
                    latex = `P(A)=\\dfrac{n(A)}{N}=\\dfrac{${activeRes.casosFavorables}}{${activeRes.casosTotales}}=${activeRes.probabilidadDecimal}`;
                }
            }
            try {
                katex.render(latex, formulaProbRef.current, { throwOnError: false, displayMode: true });
            } catch (e) {
                console.error("Error al renderizar KaTeX:", e);
            }
        }
    }, [activeRes, inputMode, tipo, formulaProbRef, isFrec, isCond]);

    return (
        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column' }}>
            {/* SELECTOR DE MODO DE ENTRADA */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <button
                        type="button"
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

            <div style={{ ...cardStyle, marginBottom: '12px' }}>
                {inputMode === 'manual' ? (
                    /* INTERFAZ PARA MODO MANUAL */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontSize: FS.sm, fontWeight: 700, color: 'var(--primary-color)' }}>Datos del Ejercicio (Ingreso Manual)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>{labels.numerador}:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={manualF}
                                    onChange={(e) => setManualF(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: RADIUS,
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-color)',
                                        fontSize: FS.sm,
                                        outline: 'none',
                                        fontFamily: FONT
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>{labels.denominador}:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={manualN}
                                    onChange={(e) => setManualN(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: RADIUS,
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-color)',
                                        fontSize: FS.sm,
                                        outline: 'none',
                                        fontFamily: FONT
                                    }}
                                />
                            </div>
                        </div>
                        {errorManual && (
                            <div style={{ color: '#ef4444', fontSize: FS.xs, fontWeight: 600, marginTop: '-5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IconoAlerta width="14" height="14" />
                                {errorManual}
                            </div>
                        )}
                    </div>
                ) : (
                    /* INTERFAZ PARA MODO MATRIZ */
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                                <span style={{ ...labelStyle, margin: 0 }}>{isFrec ? 'Datos Históricos (Observaciones):' : 'Espacio Muestral:'}</span>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                                    <small title="Datos provenientes de variables externas" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Cargados: <strong style={{ color: 'var(--primary-color)' }}>{statsDatos.cargados}</strong>
                                    </small>
                                    <small title="Datos ingresados manualmente" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Agregados: <strong style={{ color: '#3b82f6' }}>{statsDatos.agregados}</strong>
                                    </small>
                                    <small title="Total de datos válidos" style={{ color: 'var(--text-muted)', fontSize: FS.xs, cursor: 'help' }}>
                                        Total: <strong>{statsDatos.total}</strong>
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

                        {/* Contenedor Responsivo para Eventos A y B */}
                        <div style={{ display: 'grid', gridTemplateColumns: isCond ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', gap: '12px', marginBottom: '12px', alignItems: 'stretch' }}>
                            {/* Evento Condicion (Solo Condicional) */}
                            {isCond && (
                                <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                                    <label style={labelStyle}>Condición Dada (Evento B):</label>
                                    {statsEventos.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                                            <button
                                                onClick={() => setModalCondicion(true)}
                                                style={{
                                                    width: 'fit-content',
                                                    alignSelf: 'center',
                                                    padding: '5px 20px',
                                                    background: 'var(--primary-color)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: RADIUS,
                                                    fontSize: FS.sm,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                                            >
                                                <ModificarSeleccion />
                                                {eventoCondicion.length > 0 ? 'Modificar Condición' : 'Configurar Evento B'}
                                            </button>

                                            {eventoCondicion.length > 0 ? (
                                                <div style={{ background: 'rgba(33, 115, 70, 0.03)', padding: '12px', borderRadius: RADIUS, border: '1.5px solid var(--primary-color)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', flexGrow: 1 }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Eventos B ({eventoCondicion.length}):
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {eventoCondicion.map(v => (
                                                            <span key={v} style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(33, 115, 70, 0.1)', padding: '3px 12px', borderRadius: '5px', border: '1px solid rgba(33, 115, 70, 0.2)' }}>
                                                                {v}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '10px', border: '1px dashed var(--border-color)', borderRadius: RADIUS, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: FS.xs }}>
                                                        Ningún evento B seleccionado.
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: FS.sm, flexGrow: 1 }}>Primero agrega datos al espacio muestral.</p>
                                    )}
                                </div>
                            )}

                            {/* Evento Favorable*/}
                            <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>{(isCond || isFrec) ? 'Evento de Interés (A):' : 'Evento Favorable (A):'}</label>
                                {statsEventos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                                        <button
                                            onClick={() => setModalEvento(true)}
                                            style={{
                                                width: 'fit-content',
                                                alignSelf: 'center',
                                                padding: '5px 20px',
                                                background: 'var(--primary-color)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: RADIUS,
                                                fontSize: FS.sm,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                                        >
                                            <ModificarSeleccion />
                                            {eventoFavorable.length > 0 ? 'Modificar Selección' : (isCond ? 'Configurar Evento A' : isFrec ? 'Configurar Evento de Interés' : 'Configurar Eventos Favorables')}
                                        </button>

                                        {eventoFavorable.length > 0 ? (
                                            <div style={{ background: 'rgba(33, 115, 70, 0.03)', padding: '12px', borderRadius: RADIUS, border: '1.5px solid var(--primary-color)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', flexGrow: 1 }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Eventos Seleccionados ({eventoFavorable.length}):
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {eventoFavorable.map(v => (
                                                        <span key={v} style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(33, 115, 70, 0.1)', padding: '3px 12px', borderRadius: '5px', border: '1px solid rgba(33, 115, 70, 0.2)' }}>
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '10px', border: '1px dashed var(--border-color)', borderRadius: RADIUS, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <small style={{ color: 'var(--text-muted)', fontSize: FS.xs }}>
                                                    Ningún evento seleccionado aún.
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: FS.sm, flexGrow: 1 }}>Primero agrega datos al espacio muestral.</p>
                                )}
                            </div>
                        </div>

                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                            <button
                                onClick={ejecutar}
                                className="button_calcular btn-icon"
                                style={{
                                    width: 'fit-content',
                                    alignSelf: 'center',
                                    padding: '5px 35px',
                                    borderRadius: RADIUS,
                                    fontSize: FS.md,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <IconoCalculadora />
                                CALCULAR
                            </button>
                        </div>
                    </>
                )}

                {/* Resultado Math*/}
                {activeRes && (
                    <div style={{ marginTop: '20px' }}>
                        <div ref={formulaProbRef} style={{ overflowX: 'auto' }} />
                        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                            {[
                                { label: (isCond || isFrec) ? 'Evento (A)' : 'Eventos (A)', val: inputMode === 'manual' ? 'Manual (A)' : eventoFavorable.join(', ') },
                                { label: labels.tarjetaNumerador, val: activeRes.casosFavorables },
                                { label: labels.tarjetaDenominador, val: activeRes.casosTotales },
                                { label: 'Decimal', val: activeRes.probabilidadDecimal },
                                { label: 'Porcentaje', val: `${activeRes.probabilidadPorcentaje}%` },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: FS.xs, color: 'var(--text-muted)' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0', fontWeight: 700, color: 'var(--primary-color)', fontSize: FS.md }}>{val}</p>
                                </div>
                            ))}
                        </div>
                        <GraficosProbabilidad
                            resProbabilidad={activeRes}
                            datosArray={inputMode === 'manual' ? [] : (activeRes.arrFiltrado || inputDatos.split(',').map(d => d.trim()).filter(Boolean))}
                            isCond={isCond}
                            eventoFavorable={inputMode === 'manual' ? [] : eventoFavorable}
                            eventoCondicion={inputMode === 'manual' ? [] : eventoCondicion}
                            isManual={inputMode === 'manual'}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}