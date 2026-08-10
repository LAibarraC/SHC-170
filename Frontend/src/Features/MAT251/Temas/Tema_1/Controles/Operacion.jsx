import React, { useState, useEffect, useRef } from 'react';
import { FONT, FS, RADIUS, OPERACIONES } from '../../../Principal/Constantes';

// Íconos SVG temáticos por valor de operación
const getIcon = (val) => {
    const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (val) {
        case 'conteo': return (
            <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
        );
        case 'probabilidad': return (
            <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
        );
        case 'simulador_total': return (
            <svg {...props}><path d="M4 10h16" /><path d="M4 14h16" /><path d="M12 4v16" /></svg>
        );
        case 'regla_adicion': return (
            <svg {...props}><circle cx="9" cy="12" r="5" /><circle cx="15" cy="12" r="5" /></svg>
        );
        case 'regla_multiplicacion': return (
            <svg {...props}><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><line x1="9" y1="12" x2="15" y2="12" /><polyline points="13 10 15 12 13 14" /></svg>
        );
        case 'muestreo': return (
            <svg {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
        );
        case 'distribuciones_muestrales': return (
            <svg {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
        );
        case 'dist_uniforme': return (
            <svg {...props}><line x1="3" y1="20" x2="21" y2="20" /><line x1="3" y1="4" x2="3" y2="20" /><rect x="6" y="10" width="12" height="10" /></svg>
        );
        case 'dist_continua': return (
            <svg {...props}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8" /><path d="M8 13h.01" /><path d="M12 13h.01" /><path d="M16 13h.01" /><path d="M8 17h.01" /><path d="M12 17h.01" /><path d="M16 17h.01" /></svg>
        );
        case 'dist_continua_v2': return (
            <svg {...props}><path d="M4 19h16" /><path d="M4 15h16" /><path d="M4 15v4" /><path d="M20 15v4" /><path d="M4 11v-4" /><path d="M20 11v-4" /><path d="M4 11h16" /><path d="M4 7h16" /></svg>
        );
        case 'dist_discreta': return (
            <svg {...props}><line x1="4" y1="20" x2="4" y2="4" /><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="14" width="3" height="6" /><rect x="11" y="9" width="3" height="11" /><rect x="16" y="5" width="3" height="15" /></svg>
        );
        case 'modelos_discretos': return (
            <svg {...props}><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="M3 15h6"/><path d="M3 18h6"/></svg>
        );
        case 'modelos_continuos': return (
            <svg {...props}><path d="M3 20h18"/><path d="M4 20c1.5-7 3-14 8-14s6.5 7 8 14"/></svg>
        );
        default: return null;
    }
};

// ─── ACCORDION SELECT AGRUPADO POR TEMAS ────────────────────────────────────
export default function Operacion({ operacion, handleOperacion }) {
    const [isOpen, setIsOpen] = useState(false);
    const [temaAbierto, setTemaAbierto] = useState(null);
    const selectRef = useRef(null);

    // Auto-expandir el tema que contiene la operación activa
    useEffect(() => {
        OPERACIONES.forEach((t, idx) => {
            if (t.operaciones.find(o => o.value === operacion)) {
                setTemaAbierto(idx);
            }
        });
    }, [operacion]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handler = (e) => {
            if (selectRef.current && !selectRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Etiqueta de la operación seleccionada
    let selectedLabel = 'Seleccionar operación...';
    OPERACIONES.forEach(t => {
        const found = t.operaciones.find(o => o.value === operacion);
        if (found) selectedLabel = found.label;
    });

    const toggleTema = (idx) => setTemaAbierto(p => p === idx ? null : idx);

    return (
        <div ref={selectRef} style={{ position: 'relative', width: '100%', marginBottom: '15px', fontFamily: FONT }}>

            {/* ── TRIGGER ── */}
            <div
                onClick={() => setIsOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: RADIUS, cursor: 'pointer',
                    boxShadow: isOpen ? '0 0 0 3px rgba(0,123,255,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-color)',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--primary-color)', display: 'flex' }}>{getIcon(operacion)}</span>
                    <span style={{ fontWeight: 500, fontSize: FS.sm }}>{selectedLabel}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>

            {/* ── PANEL ACCORDION FLOTANTE ── */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: RADIUS,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeInDropdown 0.2s ease',
                    maxHeight: '440px',
                    overflowY: 'auto',
                }}>
                    {OPERACIONES.map((t, idx) => {
                        const expanded = temaAbierto === idx;
                        const hasOps = t.operaciones.length > 0;
                        const activeHere = t.operaciones.some(o => o.value === operacion);

                        return (
                            <div key={t.tema}>
                                {/* ── Cabecera del Tema ── */}
                                <div
                                    onClick={() => hasOps && toggleTema(idx)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '6px 12px',
                                        background: expanded
                                            ? 'var(--primary-color)'
                                            : activeHere
                                                ? 'rgba(0,123,255,0.07)'
                                                : 'var(--bg-body, #f8fafc)',
                                        color: expanded ? '#fff' : activeHere ? 'var(--primary-color)' : 'var(--text-muted)',
                                        cursor: hasOps ? 'pointer' : 'default',
                                        borderBottom: '1px solid var(--border-color)',
                                        transition: 'background 0.2s, color 0.2s',
                                        userSelect: 'none',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', opacity: 0.7 }}>
                                            {t.tema}
                                        </span>
                                        <span style={{ fontSize: FS.xs, fontWeight: 700 }}>
                                            {t.titulo}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '10px' }}>
                                        {hasOps && (
                                            <span style={{
                                                fontSize: '0.68rem', padding: '1px 7px',
                                                borderRadius: '999px',
                                                background: expanded ? 'rgba(255,255,255,0.25)' : 'rgba(0,123,255,0.12)',
                                                color: expanded ? '#fff' : 'var(--primary-color)',
                                                fontWeight: 700,
                                            }}>
                                                {t.operaciones.length}
                                            </span>
                                        )}
                                        {!hasOps && (
                                            <span style={{
                                                fontSize: '0.65rem', padding: '2px 7px',
                                                borderRadius: '999px',
                                                background: 'rgba(148,163,184,0.15)',
                                                color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em',
                                            }}>
                                                Próximamente
                                            </span>
                                        )}
                                        {hasOps && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', opacity: 0.8 }}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                {/* ── Operaciones hijas ── */}
                                {expanded && hasOps && (
                                    <div style={{ animation: 'expandBody 0.2s ease' }}>
                                        {t.operaciones.map((op, opIdx) => {
                                            const active = operacion === op.value;
                                            return (
                                                <div
                                                    key={op.value}
                                                    onClick={() => { handleOperacion(op.value); setIsOpen(false); }}
                                                    onMouseEnter={e => {
                                                        if (!active) {
                                                            e.currentTarget.style.background = 'rgba(0,123,255,0.08)';
                                                            e.currentTarget.style.color = 'var(--primary-color)';
                                                        }
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!active) {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = 'var(--text-color)';
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '8px 12px 8px 20px',
                                                        cursor: 'pointer',
                                                        background: active ? 'rgba(0,123,255,0.05)' : 'transparent',
                                                        color: active ? 'var(--primary-color)' : 'var(--text-color)',
                                                        fontWeight: active ? 600 : 400,
                                                        borderBottom: opIdx < t.operaciones.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                        transition: 'all 0.2s ease',
                                                        userSelect: 'none',
                                                    }}
                                                >
                                                    <span style={{ opacity: active ? 1 : 0.5, display: 'flex', flexShrink: 0 }}>
                                                        {getIcon(op.value)}
                                                    </span>
                                                    <span style={{ fontSize: FS.xs }}>{op.label}</span>
                                                    {active && (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                            style={{ marginLeft: 'auto', color: 'var(--primary-color)', flexShrink: 0 }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fadeInDropdown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes expandBody {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
