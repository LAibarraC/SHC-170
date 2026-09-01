import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Resultados_DistribucionDiscreta({ resultados }) {
    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const cardStyle = {
        background: 'transparent',
        color: 'var(--text-main, #1e293b)',
        padding: '10px 0',
        height: '100%',
        boxSizing: 'border-box'
    };

    if (!resultados) return null;

    if (resultados.error) {
        return (
            <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.8, color: '#ef4444' }}>
                    <p>{resultados.error}</p>
                </div>
            </div>
        );
    }

    // Desgloses visuales a partir de resultados.datos
    const desgloseEX = resultados.datos.map(d => `(${d.x} \\times ${parseFloat(d.p.toFixed(4))})`).join(' + ');
    const esperanzaX2 = resultados.datos.reduce((acc, d) => acc + (d.x ** 2) * d.p, 0);
    const desgloseVar = `${esperanzaX2.toFixed(4)} - (${resultados.esperanza.toFixed(4)})^2`;

    return (
        <div style={cardStyle}>
            <h3 style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: 600, margin: '0 0 15px 0' }}>
                Resultados y Desarrollo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto', paddingRight: '10px' }}>

                {/* Tabla de Distribución (Solo si viene de Datos Brutos con Frecuencias) */}
                {resultados.datos.some(d => d.f !== undefined) && (
                    <div style={{ padding: '15px', background: 'var(--bg-input, #f8fafc)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #1e293b)' }}>Distribución de Probabilidad</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem', backgroundColor: 'var(--bg-card, #fff)' }}>
                                <thead style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)' }}>
                                    <tr>
                                        <th style={{ padding: '8px', color: 'var(--text-main, #0f172a)', fontWeight: 600, border: '1px solid var(--border-color, #cbd5e1)' }}>{renderLatex('x_i')}</th>
                                        <th style={{ padding: '8px', color: 'var(--text-main, #0f172a)', fontWeight: 600, border: '1px solid var(--border-color, #cbd5e1)' }}>Frec.</th>
                                        <th style={{ padding: '8px', color: 'var(--text-main, #0f172a)', fontWeight: 600, border: '1px solid var(--border-color, #cbd5e1)' }}>{renderLatex('P(X = x_i)')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultados.datos.map((d, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '8px', border: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-main)' }}>{d.x}</td>
                                            <td style={{ padding: '8px', border: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-main)' }}>{d.f}</td>
                                            <td style={{ padding: '8px', border: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-main)' }}>{parseFloat(d.p.toFixed(4))}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-main, #0f172a)' }}>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-color, #cbd5e1)' }}>Total</td>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-color, #cbd5e1)' }}>{resultados.datos.reduce((acc, d) => acc + d.f, 0)}</td>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-color, #cbd5e1)' }}>{parseFloat(resultados.datos.reduce((acc, d) => acc + d.p, 0).toFixed(4))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* Esperanza Matemática */}
                <div style={{ padding: '15px', background: 'var(--bg-input, #f8fafc)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #1e293b)' }}>Esperanza Matemática E(X)</h4>
                    <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                        {renderLatex(`E(X) = \\sum x_i \\cdot P(X = x_i)`)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '10px' }}>
                        {renderLatex(`E(X) = ${desgloseEX}`)}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main, #1e293b)' }}>
                        {renderLatex(`E(X) = ${resultados.esperanza.toFixed(4)}`)}
                    </div>
                </div>

                {/* Varianza y Desviación */}
                <div style={{ padding: '15px', background: 'var(--bg-input, #f8fafc)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #1e293b)' }}>Varianza</h4>
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                {renderLatex(`Var(X) = E(X^2) - [E(X)]^2`)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '10px' }}>
                                {renderLatex(`Var(X) = ${desgloseVar}`)}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main, #1e293b)' }}>
                                {renderLatex(`Var(X) = ${resultados.varianza.toFixed(4)}`)}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #1e293b)' }}>Desviación Estándar</h4>
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                {renderLatex(`\\sigma = \\sqrt{Var(X)}`)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '10px' }}>
                                {renderLatex(`\\sigma = \\sqrt{${resultados.varianza.toFixed(4)}}`)}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main, #1e293b)' }}>
                                {renderLatex(`\\sigma = ${resultados.desviacion.toFixed(4)}`)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asimetría y Curtosis */}
                <div style={{ padding: '15px', background: 'var(--bg-input, #f8fafc)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main, #1e293b)' }}>Forma de la Distribución</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>Asimetría (Sesgo)</div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                                {renderLatex(`\\gamma_1 = \\frac{\\sum (x_i - \\mu)^3 \\cdot P(x_i)}{\\sigma^3}`)}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main, #1e293b)' }}>
                                {renderLatex(`\\gamma_1 = ${resultados.asimetria.toFixed(4)}`)}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>Curtosis</div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                                {renderLatex(`\\gamma_2 = \\frac{\\sum(x_i-\\mu)^4 \\cdot P(x_i)}{\\sigma^4} - 3`)}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main, #1e293b)' }}>
                                {renderLatex(`\\gamma_2 = ${resultados.curtosis.toFixed(4)}`)}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
