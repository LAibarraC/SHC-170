import React from 'react';
import '../../../styles/Temas/Tema3.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { IconoProcedimiento } from '../../../ui/Iconos';
import { jStat } from 'jstat';

export default function Resultados_ModelosContinuos({ resultados, modelo, condicion, params, onOpenProcedimiento }) {
    if (!resultados) return null;

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const formatNum = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '-';
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    const [mostrarPasos, setMostrarPasos] = React.useState(true);

    let formulasEsperanza = [];
    let formulasVarianza = [];
    let formulasDesviacion = [];

    if (params) {
        if (modelo === 'uniforme' || modelo === 'Uniforme') {
            formulasEsperanza = [
                `E(X) = \\frac{a + b}{2}`,
                `E(X) = \\frac{${params.a} + ${params.b}}{2}`
            ];
            formulasVarianza = [
                `V(X) = \\frac{(b - a)^2}{12}`,
                `V(X) = \\frac{(${params.b} - ${params.a})^2}{12}`
            ];
            formulasDesviacion = [
                `\\sigma = \\sqrt{V(X)}`,
                `\\sigma = \\sqrt{${((params.b - params.a) ** 2 / 12).toFixed(2)}}`
            ];
        } else if (modelo === 'Normal') {
            formulasEsperanza = [
                `E(X) = \\mu`,
                `E(X) = ${params.mu}`
            ];
            formulasVarianza = [
                `V(X) = \\sigma^2`,
                `V(X) = ${params.sigma}^2`
            ];
            formulasDesviacion = [
                `\\sigma = \\sqrt{V(X)}`,
                `\\sigma = \\sqrt{${(params.sigma ** 2).toFixed(2)}}`
            ];
        }
    }

    return (
        <div className="tema3-card" style={{ marginTop: '20px' }}>
            <h3 className="tema3-title" style={{ borderBottom: 'none', marginBottom: '15px', textAlign: 'center', color: '#0f172a' }}>
                Resultados {modelo}
            </h3>

            {(resultados.probabilidadFinal !== null || resultados.c !== undefined || resultados.c1 !== undefined) && (
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid #bfdbfe', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                            {resultados.c !== undefined || resultados.c1 !== undefined ? (
                                <>Valor Calculado {renderLatex('c')}</>
                            ) : (
                                <>Probabilidad Calculada {renderLatex('P(X)')}</>
                            )}
                        </div>
                    </div>
                    
                    {resultados.c1 !== undefined && resultados.c2 !== undefined ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>
                                <span style={{ fontSize: '1rem', marginRight: '5px' }}>c₁ =</span>{formatNum(resultados.c1)}
                            </div>
                            <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>
                                <span style={{ fontSize: '1rem', marginRight: '5px' }}>c₂ =</span>{formatNum(resultados.c2)}
                            </div>
                        </div>
                    ) : resultados.c !== undefined ? (
                        <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>
                            <span style={{ fontSize: '1rem', marginRight: '5px' }}>c =</span>{formatNum(resultados.c)}
                        </div>
                    ) : (
                        <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>
                            {formatNum(resultados.probabilidadFinal)} <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>({(resultados.probabilidadFinal * 100).toFixed(2)}%)</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Esperanza {renderLatex('E(X)')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.esperanza)}
                    </div>
                    {formulasEsperanza.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {formulasEsperanza.map((form, idx) => (
                                <div key={idx} style={{ color: '#0f172a', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Varianza {renderLatex('V(X)')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.varianza)}
                    </div>
                    {formulasVarianza.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {formulasVarianza.map((form, idx) => (
                                <div key={idx} style={{ color: '#0f172a', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Desviación {renderLatex('\\sigma')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.desviacion !== undefined ? resultados.desviacion : Math.sqrt(resultados.varianza))}
                    </div>
                    {formulasDesviacion.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {formulasDesviacion.map((form, idx) => (
                                <div key={idx} style={{ color: '#0f172a', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modelo === 'Normal' && condicion && params && condicion.tipo && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
                    <button
                        onClick={() => setMostrarPasos(!mostrarPasos)}
                        style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: '#2563eb',
                            border: '1px solid #2563eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2563eb'; }}
                    >
                        {mostrarPasos ? 'Ocultar Resolución Paso a Paso' : 'Ver Resolución Paso a Paso'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: mostrarPasos ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>

                    {mostrarPasos && (
                        <div style={{ marginTop: '15px', padding: '20px', textAlign: 'left', color: '#334155', width: '100%', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h5 style={{ color: '#2563eb', margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 'bold' }}>Resolución Matemática Paso a Paso</h5>

                            {/* Paso 1 */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', color: '#0f172a' }}>Paso 1: {condicion.tipo.includes('inversa') ? 'Tipificación a Normal Estándar Z (Inversa)' : 'Fórmula de Estandarización'}</div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#ffffff' }}>
                                    <div style={{ fontSize: '1.1rem' }}>
                                        {condicion.tipo.includes('inversa') ? renderLatex("Z = \\Phi^{-1}(p) \\Rightarrow c = \\mu + Z \\cdot \\sigma") : renderLatex("Z = \\frac{X - \\mu}{\\sigma}")}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        Datos: {renderLatex(`\\mu = ${params.mu}`)}, {renderLatex(`\\sigma = ${params.sigma}`)}
                                    </div>
                                </div>
                            </div>

                            {/* Paso 2 */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', color: '#0f172a' }}>Paso 2: {condicion.tipo.includes('inversa') ? 'Sustituyendo los valores para Z' : 'Calcular el valor de Z'}</div>
                                <div style={{ padding: '15px', borderRadius: '8px', fontSize: '1.1rem', border: '1px dashed #cbd5e1', background: '#ffffff', overflowX: 'auto' }}>
                                    {condicion.tipo === 'suma_intervalos' && Array.isArray(condicion.intervals) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {condicion.intervals.map((inv, idx) => (
                                                <React.Fragment key={idx}>
                                                    <div>{renderLatex(`Z_{${idx * 2 + 1}} = \\frac{${inv.min} - ${params.mu}}{${params.sigma}} = ${((inv.min - params.mu) / params.sigma).toFixed(2)}`)}</div>
                                                    <div>{renderLatex(`Z_{${idx * 2 + 2}} = \\frac{${inv.max} - ${params.mu}}{${params.sigma}} = ${((inv.max - params.mu) / params.sigma).toFixed(2)}`)}</div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ) : condicion.tipo === 'exterior' || condicion.tipo === 'entre' || condicion.tipo === 'intervalo' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>{renderLatex(`Z_1 = \\frac{${condicion.valX ?? condicion.valorX ?? 0} - ${params.mu}}{${params.sigma}} = ${((Number(condicion.valX ?? condicion.valorX ?? 0) - params.mu) / params.sigma).toFixed(2)}`)}</div>
                                            <div>{renderLatex(`Z_2 = \\frac{${condicion.valX2 ?? condicion.valorB ?? 0} - ${params.mu}}{${params.sigma}} = ${((Number(condicion.valX2 ?? condicion.valorB ?? 0) - params.mu) / params.sigma).toFixed(2)}`)}</div>
                                        </div>
                                    ) : condicion.tipo.includes('inversa') ? (
                                        condicion.tipo === 'inversa_menor' ? renderLatex(`\\Phi^{-1}(${condicion.valP}) \\approx ${jStat.normal.inv(condicion.valP, 0, 1).toFixed(2)} \\Rightarrow c = ${params.mu} + (${jStat.normal.inv(condicion.valP, 0, 1).toFixed(2)})(${params.sigma})`) :
                                        condicion.tipo === 'inversa_mayor' ? renderLatex(`\\Phi^{-1}(1 - ${condicion.valP}) \\approx ${jStat.normal.inv(1 - condicion.valP, 0, 1).toFixed(2)} \\Rightarrow c = ${params.mu} + (${jStat.normal.inv(1 - condicion.valP, 0, 1).toFixed(2)})(${params.sigma})`) :
                                        renderLatex(`Z_1 \\approx ${jStat.normal.inv((condicion.valP || 0) / 2, 0, 1).toFixed(2)}, Z_2 \\approx ${jStat.normal.inv(1 - (condicion.valP || 0) / 2, 0, 1).toFixed(2)} \\Rightarrow c_1 = ${params.mu} + Z_1\\sigma, c_2 = ${params.mu} + Z_2\\sigma`)
                                    ) : (
                                        renderLatex(`Z = \\frac{${condicion.valX ?? condicion.valorX ?? 0} - ${params.mu}}{${params.sigma}} = ${((Number(condicion.valX ?? condicion.valorX ?? 0) - params.mu) / params.sigma).toFixed(2)}`)
                                    )}
                                </div>
                            </div>

                            {/* Paso 3 */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', color: '#0f172a' }}>Paso 3: Planteamiento de la Integral</div>
                                <div style={{ padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ fontSize: '1.2rem', textAlign: 'center', margin: '10px 0' }}>
                                        {renderLatex("P(Z \\le z_0) = \\frac{1}{\\sqrt{2\\pi}} \\int_{-\\infty}^{z_0} e^{-\\frac{x^2}{2}} dx")}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#64748b' }}>
                                        Nota: Esta integral no tiene solución algebraica. El valor de {resultados.probabilidadFinal?.toFixed(2)} se obtiene buscando el valor de Z en la Tabla de la Normal Estándar o mediante aproximación computacional.
                                    </div>
                                    <div>
                                        <button style={{ padding: '6px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }} onClick={() => alert("Tabla Z no disponible en esta vista.")}>
                                            Ver en Tabla Z
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Paso 4 */}
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', color: '#0f172a' }}>Paso 4: {condicion.tipo.includes('inversa') ? 'Valor Límite Calculado (c)' : 'Calcular la Probabilidad Final'}</div>
                                <div style={{ padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#ffffff', fontSize: '1.2rem' }}>
                                    {condicion.tipo.includes('inversa') ? (
                                        <div style={{ fontWeight: 'bold' }}>
                                            {condicion.tipo === 'inversa_exterior' ? renderLatex(`c_1 = ${params.mu + jStat.normal.inv((condicion.valP || 0) / 2, 0, 1) * params.sigma}, c_2 = ${params.mu + jStat.normal.inv(1 - (condicion.valP || 0) / 2, 0, 1) * params.sigma}`) : (
                                                <>
                                                    {renderLatex(`c = ${resultados.c?.toFixed(2) || 0}`)}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div>
                                                {condicion.tipo === 'suma_intervalos' && Array.isArray(condicion.intervals) ? 
                                                    renderLatex(`${condicion.intervals.map(i => `P(${i.min} < X < ${i.max})`).join(' + ')} = ${condicion.intervals.map((inv, idx) => `P(${((inv.min - params.mu) / params.sigma).toFixed(2)} < Z < ${((inv.max - params.mu) / params.sigma).toFixed(2)})`).join(' + ')}`) 
                                                : condicion.tipo === 'exterior' || condicion.tipo === 'entre' || condicion.tipo === 'intervalo' ? 
                                                    renderLatex(`P(${condicion.valX ?? condicion.valorX ?? 0} ${condicion.tipo === 'exterior' ? '>' : '<'} X ${condicion.tipo === 'exterior' ? '>' : '<'} ${condicion.valX2 ?? condicion.valorB ?? 0}) = P(${((Number(condicion.valX ?? condicion.valorX ?? 0) - params.mu) / params.sigma).toFixed(2)} ${condicion.tipo === 'exterior' ? '>' : '<'} Z ${condicion.tipo === 'exterior' ? '>' : '<'} ${((Number(condicion.valX2 ?? condicion.valorB ?? 0) - params.mu) / params.sigma).toFixed(2)})`)
                                                : condicion.tipo.includes('mayor') ?
                                                    renderLatex(`P(X > ${condicion.valX ?? condicion.valorX ?? 0}) = P(Z > ${((Number(condicion.valX ?? condicion.valorX ?? 0) - params.mu) / params.sigma).toFixed(2)})`)
                                                :
                                                    renderLatex(`P(X < ${condicion.valX ?? condicion.valorX ?? 0}) = P(Z < ${((Number(condicion.valX ?? condicion.valorX ?? 0) - params.mu) / params.sigma).toFixed(2)})`)
                                                }
                                            </div>
                                            <div style={{ color: '#2563eb' }}>
                                                {renderLatex(`= ${resultados.probabilidadFinal?.toFixed(2)}`)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
