import React, { useState, useRef, useEffect } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import { IconoCalculadora } from '../../../../../ui/iconos';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const formulasPDF = {
    'normal': "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
    'estandar': "f(z) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{z^2}{2}}",
    'chi-cuadrado': "f(x) = \\frac{1}{2^{k/2}\\Gamma(k/2)} x^{\\frac{k}{2} - 1} e^{-\\frac{x}{2}}",
    'fisher': "f(x) = \\frac{\\Gamma\\left(\\frac{n+m}{2}\\right) \\left(\\frac{n}{m}\\right)^{n/2}}{\\Gamma\\left(\\frac{n}{2}\\right)\\Gamma\\left(\\frac{m}{2}\\right)} \\frac{x^{\\frac{n}{2}-1}}{\\left(1+\\frac{n}{m}x\\right)^{(n+m)/2}}"
};

const coloresPalette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export default function ControlDistribucionContinua_v2({ onCalcular }) {
    const [distribucion, setDistribucion] = useState('normal');
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // MODO B
    const [modoComparacion, setModoComparacion] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            if (selectRef.current && !selectRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const opciones = [
        { value: 'normal', label: <span>Normal</span> },
        { value: 'estandar', label: <span>Normal Estándar</span> },
        { value: 'chi-cuadrado', label: <span>Chi-Cuadrado (<InlineMath math="\chi^2" />)</span> },
        { value: 'fisher', label: <span><InlineMath math="F" /> de Fisher</span> }
    ];
    
    // Parámetros Modo A
    const [mu, setMu] = useState('');
    const [sigma, setSigma] = useState('');
    const [k, setK] = useState('');
    const [d1, setD1] = useState('');
    const [d2, setD2] = useState('10');

    const [haComparado, setHaComparado] = useState(false);

    useEffect(() => {
        setHaComparado(false);
        if (typeof onCalcular === 'function') onCalcular(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distribucion, modoComparacion]);

    // Parámetros Modo B
    const [curvasMultiples, setCurvasMultiples] = useState([
        { id: Date.now(), params: { mu: '', sigma: '', k: '', d1: '', d2: '' }, color: coloresPalette[0] }
    ]);

    const agregarCurva = () => {
        const colorIdx = curvasMultiples.length % coloresPalette.length;
        setCurvasMultiples([...curvasMultiples, { id: Date.now(), params: { mu: '', sigma: '', k: '', d1: '', d2: '' }, color: coloresPalette[colorIdx] }]);
    };

    const eliminarCurva = (id) => {
        if (curvasMultiples.length > 1) {
            setCurvasMultiples(curvasMultiples.filter(c => c.id !== id));
        }
    };

    const updateCurvaParam = (id, field, value) => {
        setCurvasMultiples(curvasMultiples.map(c => c.id === id ? { ...c, params: { ...c.params, [field]: value } } : c));
    };

    useEffect(() => {
        if (modoComparacion && haComparado) {
            onCalcular(distribucion, { modoB: true, multiples: curvasMultiples });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curvasMultiples]);

    const handleCalcular = () => {
        if (!modoComparacion) {
            let params = {};
            if (distribucion === 'normal') params = { mu, sigma };
            if (distribucion === 'chi-cuadrado') params = { k };
            if (distribucion === 'fisher') params = { d1, d2 };
            onCalcular(distribucion, params);
        } else {
            setHaComparado(true);
            onCalcular(distribucion, { modoB: true, multiples: curvasMultiples });
        }
    };

    const renderInputsModoA = () => (
        <>
            {distribucion === 'normal' && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                        <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Media (<InlineMath math="\mu" />):</label>
                        <input type="number" value={mu} onChange={e => setMu(e.target.value)} style={{ flex: 1, width: '100%', minWidth: 0, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                        <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Desviación Estándar (<InlineMath math="\sigma" />):</label>
                        <input type="number" value={sigma} onChange={e => setSigma(e.target.value)} min="0" step="any" style={{ flex: 1, width: '100%', minWidth: 0, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm }} />
                    </div>
                </div>
            )}

            {distribucion === 'estandar' && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg-color)', borderRadius: RADIUS, fontSize: FS.xs, color: 'var(--text-muted)' }}>
                    La distribución Normal Estándar tiene automáticamente una Media (<InlineMath math="\mu=0" />) y Desviación Estándar (<InlineMath math="\sigma=1" />). No requiere parámetros adicionales.
                </div>
            )}

            {distribucion === 'chi-cuadrado' && (
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Grados de Libertad (<InlineMath math="k" />):</label>
                    <input type="number" value={k} onChange={e => setK(e.target.value)} min="1" step="1" style={{ flex: 1, width: '100%', minWidth: 0, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm }} />
                </div>
            )}

            {distribucion === 'fisher' && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                        <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Grados de Libertad (<InlineMath math="n" />):</label>
                        <input type="number" value={d1} onChange={e => setD1(e.target.value)} min="1" step="1" style={{ flex: 1, width: '100%', minWidth: 0, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                        <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Grados de Libertad (<InlineMath math="m" />):</label>
                        <input type="number" value={d2} onChange={e => setD2(e.target.value)} min="1" step="1" style={{ flex: 1, width: '100%', minWidth: 0, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm }} />
                    </div>
                </div>
            )}
        </>
    );

    const renderInputsModoB = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {distribucion === 'estandar' ? (
                <div style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: RADIUS, fontSize: FS.xs, color: 'var(--text-muted)' }}>
                    La Normal Estándar no admite parámetros. La comparación múltiple no aplica.
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {curvasMultiples.map((curva, index) => (
                        <div key={curva.id} style={{ flex: '1 1 calc(50% - 10px)', minWidth: '220px', boxSizing: 'border-box', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-color)', padding: '10px', borderRadius: RADIUS, border: `1px solid ${curva.color}55`, borderLeft: `4px solid ${curva.color}` }}>
                            <span style={{ fontSize: FS.xs, fontWeight: 'bold', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>#{index + 1}</span>
                            
                            {distribucion === 'normal' && (
                                <>
                                    <input type="number" placeholder="Media (μ)" value={curva.params.mu} onChange={e => updateCurvaParam(curva.id, 'mu', e.target.value)} style={{ flex: 1, minWidth: 0, padding: '6px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.xs }} />
                                    <input type="number" placeholder="Desv (σ)" value={curva.params.sigma} onChange={e => updateCurvaParam(curva.id, 'sigma', e.target.value)} min="0" step="any" style={{ flex: 1, minWidth: 0, padding: '6px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.xs }} />
                                </>
                            )}
                            
                            {distribucion === 'chi-cuadrado' && (
                                <input type="number" placeholder="Grados (k)" value={curva.params.k} onChange={e => updateCurvaParam(curva.id, 'k', e.target.value)} min="1" step="1" style={{ flex: 1, minWidth: 0, padding: '6px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.xs }} />
                            )}

                            {distribucion === 'fisher' && (
                                <>
                                    <input type="number" placeholder="Grados (n)" value={curva.params.d1} onChange={e => updateCurvaParam(curva.id, 'd1', e.target.value)} min="1" step="1" style={{ flex: 1, minWidth: 0, padding: '6px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.xs }} />
                                    <input type="number" placeholder="Grados (m)" value={curva.params.d2} onChange={e => updateCurvaParam(curva.id, 'd2', e.target.value)} min="1" step="1" style={{ flex: 1, minWidth: 0, padding: '6px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.xs }} />
                                </>
                            )}

                            <button onClick={() => eliminarCurva(curva.id)} disabled={curvasMultiples.length === 1} style={{ flexShrink: 0, background: 'transparent', border: 'none', color: curvasMultiples.length === 1 ? '#ccc' : '#ef4444', cursor: curvasMultiples.length === 1 ? 'default' : 'pointer', padding: '5px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {distribucion !== 'estandar' && (
                <button onClick={agregarCurva} style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'center', background: 'transparent', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', padding: '8px 25px', borderRadius: RADIUS, cursor: 'pointer', fontSize: FS.xs, fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,123,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Agregar Curva
                </button>
            )}
        </div>
    );

    return (
        <div style={{ ...cardStyle, fontFamily: FONT, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: 'var(--primary-color)', margin: 0, fontSize: FS.md }}>
                    Parámetros Teóricos
                </h4>
                
                {/* Selector de Modos (Toggle) */}
                <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button 
                        onClick={() => setModoComparacion(false)}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: !modoComparacion ? 'var(--primary-color)' : 'transparent', color: !modoComparacion ? 'white' : 'var(--text-muted)' }}
                    >
                        Cálculo Individual
                    </button>
                    <button 
                        onClick={() => setModoComparacion(true)}
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: modoComparacion ? '#10b981' : 'transparent', color: modoComparacion ? 'white' : 'var(--text-muted)' }}
                    >
                        Comparación Múltiple
                    </button>
                </div>
            </div>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ flex: 1 }} ref={selectRef}>
                    <label style={labelStyle}>Distribución Clásica:</label>
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'var(--bg-input, #fff)',
                                border: `1px solid ${isOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                borderRadius: RADIUS, cursor: 'pointer',
                                boxShadow: isOpen ? '0 0 0 3px rgba(0,123,255,0.15)' : 'none',
                                transition: 'all 0.2s ease',
                                color: 'var(--text-main)',
                                userSelect: 'none',
                                fontSize: FS.sm
                            }}
                        >
                            <span>{opciones.find(o => o.value === distribucion)?.label}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>

                        {isOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                background: 'var(--bg-card, #fff)',
                                border: '1px solid var(--border-color)',
                                borderRadius: RADIUS,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                overflow: 'hidden',
                                animation: 'fadeInDropdown 0.2s ease'
                            }}>
                                {opciones.map(op => {
                                    const active = op.value === distribucion;
                                    return (
                                        <div
                                            key={op.value}
                                            onClick={() => { setDistribucion(op.value); setIsOpen(false); }}
                                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,123,255,0.08)' }}
                                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                background: active ? 'rgba(0,123,255,0.05)' : 'transparent',
                                                color: active ? 'var(--primary-color)' : 'var(--text-main)',
                                                fontWeight: active ? 600 : 400,
                                                fontSize: FS.sm,
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            {op.label}
                                            {active && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ flex: 1.2, background: 'var(--header-bg, #f3f4f6)', color: 'var(--text-main)', padding: '10px', borderRadius: RADIUS, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto' }}>
                    <BlockMath math={formulasPDF[distribucion]} />
                </div>
            </div>

            {modoComparacion ? renderInputsModoB() : renderInputsModoA()}

            {!modoComparacion || (modoComparacion && !haComparado) ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                        onClick={handleCalcular} 
                        style={{ 
                            padding: '10px 24px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, 
                            background: modoComparacion ? '#10b981' : 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <IconoCalculadora />
                        {modoComparacion ? 'COMPARAR CURVAS' : 'CALCULAR'}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
