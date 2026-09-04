import React from 'react';
import { overlayStyle, modalBoxStyle, FS, RADIUS } from '../../../Principal/Constantes';

export default function ModalEventosModify({ modalEvento, setModalEvento, statsEventos, statsEventosPorColumna, eventoFavorable, setEventoFavorable, setResProbabilidad, titulo, mostrarFrecuencia = true }) {
    const [filtro, setFiltro] = React.useState('');

    if (!modalEvento) return null;

    const eventosFiltrados = statsEventos.filter(e => e.valor.toLowerCase().includes(filtro.toLowerCase()));

    const seleccionarTodosVisibles = () => {
        const nuevosValores = statsEventosPorColumna
            ? statsEventosPorColumna.flatMap(col => col.eventos.filter(e => e.valor.toLowerCase().includes(filtro.toLowerCase())).map(e => e.valor))
            : eventosFiltrados.map(e => e.valor);
        const combinados = Array.from(new Set([...eventoFavorable, ...nuevosValores]));
        setEventoFavorable(combinados);
        setResProbabilidad(null);
    };

    const deseleccionarTodosVisibles = () => {
        const valoresAEliminar = statsEventosPorColumna
            ? statsEventosPorColumna.flatMap(col => col.eventos.filter(e => e.valor.toLowerCase().includes(filtro.toLowerCase())).map(e => e.valor))
            : eventosFiltrados.map(e => e.valor);
        const filtrados = eventoFavorable.filter(v => !valoresAEliminar.includes(v));
        setEventoFavorable(filtrados);
        setResProbabilidad(null);
    };

    const toggleValor = (valor) => {
        setEventoFavorable(prev =>
            prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor]
        );
        setResProbabilidad(null);
    };

    // ── Componente de item reutilizable ──────────────────────────────────────────
    const EventoItem = ({ valor, count }) => {
        const isSelected = eventoFavorable.includes(valor);
        return (
            <label
                style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.15s', gap: '14px',
                    background: isSelected ? 'rgba(33, 115, 70, 0.08)' : 'transparent'
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'var(--bg-input)')}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                onClick={() => toggleValor(valor)}
            >
                {/* Checkbox custom */}
                <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--primary-color)' : 'var(--bg-card)',
                    transition: 'all 0.2s'
                }}>
                    {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </div>
                {/* Texto */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: FS.sm, color: isSelected ? 'var(--primary-color)' : 'var(--text-main)' }}>
                        {valor}
                    </div>
                    {mostrarFrecuencia && (
                        <div style={{ fontSize: FS.xs, color: 'var(--text-muted)', marginTop: '1px' }}>
                            Aparece <strong>{count}</strong> {count === 1 ? 'vez' : 'veces'}
                        </div>
                    )}
                </div>
            </label>
        );
    };

    // ── Vista agrupada por columna (lado a lado) ────────────────────────────────
    const renderAgrupado = () => {
        const grupos = statsEventosPorColumna
            .map(({ nombre, eventos }) => ({
                nombre,
                grupo: eventos.filter(e => e.valor.toLowerCase().includes(filtro.toLowerCase()))
            }))
            .filter(({ grupo }) => grupo.length > 0);

        return (
            <div style={{ display: 'flex', gap: '0', width: '100%', overflow: 'hidden' }}>
                {grupos.map(({ nombre, grupo }, colIdx) => (
                    <div key={nombre} style={{
                        flex: 1,
                        minWidth: 0,
                        borderRight: colIdx < grupos.length - 1 ? '2px solid var(--primary-color)' : 'none',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Encabezado de columna */}
                        <div style={{
                            padding: '8px 12px',
                            background: 'var(--primary-color)',
                            color: 'white',
                            fontSize: FS.xs,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.7px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            flexShrink: 0
                        }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="9" y1="9" x2="9" y2="21"></line>
                            </svg>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{nombre}</span>
                            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.68rem', flexShrink: 0 }}>
                                {grupo.length}
                            </span>
                        </div>
                        {/* Items de la columna */}
                        {grupo.map(({ valor, count }) => (
                            <EventoItem key={valor} valor={valor} count={count} />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={overlayStyle} onClick={() => setModalEvento(false)}>
            <div style={{ ...modalBoxStyle, maxWidth: statsEventosPorColumna ? '680px' : '440px', padding: '24px', width: '95vw' }} onClick={(e) => e.stopPropagation()}>

                {/* Cabecera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {titulo || 'Evento Favorable (A)'}
                    </h3>
                    <button onClick={() => setModalEvento(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Aviso de agrupación por columna */}
                {statsEventosPorColumna && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', background: 'rgba(33,115,70,0.07)', border: '1px solid rgba(33,115,70,0.2)', borderRadius: RADIUS, padding: '8px 12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span style={{ fontSize: FS.xs, color: 'var(--text-muted)' }}>
                            Valores agrupados por <strong>columna de datos</strong>.
                        </span>
                    </div>
                )}

                {/* Descripción cuando es lista simple */}
                {!statsEventosPorColumna && (
                    <p style={{ fontSize: FS.sm, color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
                        Selecciona uno o varios valores que definen este evento.
                    </p>
                )}

                {/* Buscador */}
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        placeholder="Filtrar por texto..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        style={{
                            width: '100%', padding: '9px 12px', borderRadius: RADIUS,
                            border: '1px solid var(--border-color)', fontSize: FS.sm,
                            outline: 'none', boxSizing: 'border-box',
                            background: 'var(--bg-input)', color: 'var(--text-main)'
                        }}
                    />
                    {filtro && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button onClick={seleccionarTodosVisibles} style={{ flex: 1, padding: '6px', fontSize: FS.xs, background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer' }}>
                                Seleccionar visibles
                            </button>
                            <button onClick={deseleccionarTodosVisibles} style={{ flex: 1, padding: '6px', fontSize: FS.xs, background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: RADIUS, cursor: 'pointer' }}>
                                Deseleccionar visibles
                            </button>
                        </div>
                    )}
                </div>

                {/* Lista de eventos */}
                <div style={{ maxHeight: '360px', overflowY: 'auto', overflowX: 'hidden', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
                    {statsEventosPorColumna
                        ? renderAgrupado()
                        : eventosFiltrados.map(({ valor, count }) => (
                            <EventoItem key={valor} valor={valor} count={count} />
                        ))
                    }
                </div>

                {/* Botón confirmar */}
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={() => setModalEvento(false)}
                        style={{
                            width: '100%', background: 'var(--primary-color)', color: 'white',
                            padding: '11px', borderRadius: RADIUS, fontWeight: 600,
                            fontSize: FS.base, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Confirmar Selección
                    </button>
                </div>
            </div>
        </div>
    );
}
