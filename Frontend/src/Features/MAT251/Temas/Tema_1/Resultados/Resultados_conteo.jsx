import React, { useState, useEffect, useRef } from 'react';
import { FS, RADIUS } from '../../../Principal/Constantes';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function ResultadosConteo({ resConteo, hayResultado }) {
    const formulaPermRef = useRef(null);
    const formulaCombRef = useRef(null);

    const [limitePerm, setLimitePerm] = useState(100);
    const [limiteComb, setLimiteComb] = useState(100);

    useEffect(() => {
        if (resConteo) {
            setLimitePerm(100);
            setLimiteComb(100);
            const { n, r, permutacion, combinacion } = resConteo;
            if (formulaPermRef.current) {
                const latexP = `P(${n},\\,${r})=\\dfrac{${n}!}{(${n}-${r})!}=${permutacion.resultado.toLocaleString()}`;
                katex.render(latexP, formulaPermRef.current, { throwOnError: false, displayMode: true });
            }
            if (formulaCombRef.current) {
                const latexC = `C(${n},\\,${r})=\\dfrac{${n}!}{${r}!(${n}-${r})!}=${combinacion.resultado.toLocaleString()}`;
                katex.render(latexC, formulaCombRef.current, { throwOnError: false, displayMode: true });
            }
        }
    }, [resConteo]);

    if (!hayResultado && !resConteo) {
        return (
            <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: FS.base }}>
                Configura los parámetros a la izquierda y presiona <strong>CALCULAR</strong>.
            </p>
        );
    }
    if (!resConteo) return null;

    const { permutacion, combinacion, n } = resConteo;

    const renderPanel = (titulo, datos, ref, color, limite, setLimite) => (
        <div style={{ flex: '1 1 290px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: RADIUS, background: 'var(--bg-card)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
            <div style={{ background: color, color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: FS.md }}>
                {titulo}
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div ref={ref} style={{ overflowX: 'auto', marginBottom: '10px', color: 'var(--text-main)' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: FS.sm, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                        {datos.explicacion}
                    </p>
                </div>

                <div style={{ marginTop: '15px', padding: '15px', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: RADIUS, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: FS.sm, fontWeight: 600 }}>Total Posibles</p>
                    <p style={{ margin: '5px 0 0', fontSize: '2rem', fontWeight: 700, color: color }}>
                        {datos.resultado.toLocaleString()}
                    </p>
                </div>

                {datos.elementos && datos.elementos.length > 0 && n <= 10 && (() => {
                    const maxRender = limite;
                    const itemsToRender = datos.elementos.slice(0, maxRender);
                    const totalElements = datos.elementos.length;
                    const extraCount = totalElements - maxRender;

                    return (
                        <div style={{ marginTop: '20px' }}>
                            <p style={{ margin: '0 0 10px', color: 'var(--text-main)', fontSize: FS.sm, borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                                Visualización de Elementos <strong style={{ color: 'var(--text-main)', fontSize: '0.9em' }}>({totalElements})</strong>:
                            </p>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: RADIUS, background: 'var(--bg-body)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                                    {itemsToRender.map((el, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <strong style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.8rem', minWidth: '24px', textAlign: 'right' }}>
                                                {idx + 1}.
                                            </strong>
                                            <span style={{
                                                display: 'inline-block',
                                                fontFamily: 'monospace',
                                                fontSize: '0.72rem',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                backgroundColor: 'var(--bg-input)',
                                                border: '1px dashed var(--text-variable)',
                                                color: 'var(--text-main)',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                                textAlign: 'center'
                                            }}>
                                                {el}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {extraCount > 0 && (
                                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                        <button
                                            onClick={() => setLimite(prev => prev + 50)}
                                            style={{
                                                display: 'inline-block',
                                                fontFamily: 'monospace',
                                                fontSize: '0.72rem',
                                                fontWeight: 'bold',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--primary-color)',
                                                color: '#fff',
                                                border: 'none',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            + Ver 50 más ({extraCount} restantes)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    return (
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {renderPanel('PERMUTACIONES (Importa el orden)', permutacion, formulaPermRef, '#d32f2f', limitePerm, setLimitePerm)}
            {renderPanel('COMBINACIONES (No importa el orden)', combinacion, formulaCombRef, '#1976d2', limiteComb, setLimiteComb)}
        </div>
    );
}