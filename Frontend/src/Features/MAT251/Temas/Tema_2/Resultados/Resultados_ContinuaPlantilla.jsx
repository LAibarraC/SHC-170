import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Resultados_ContinuaPlantilla({ resultados }) {
    if (!resultados) return null;

    if (resultados.error) {
        return (
            <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>
                {resultados.error}
            </div>
        );
    }

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const { tipoFuncion, a, b, n, c, k, EX, EX2, VarX, Desv } = resultados; 

    return (
        <div style={{ background: 'transparent', color: 'var(--text-main, #1e293b)', padding: '10px 0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: 600, margin: '0 0 15px 0' }}>
                Resultados y Desarrollo
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                
                {/* 1. Constante k y Función */}
                <div style={{ background: 'var(--bg-input, #f8fafc)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', gridColumn: '1 / -1' }}>
                    <h5 style={{ margin: '0 0 15px 0', color: 'var(--primary-color, #3b82f6)', fontSize: '0.95rem' }}>1. Función de Densidad y Constante</h5>
                    
                    {tipoFuncion === 'uniforme' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`f(x) = \\frac{1}{b - a}`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`f(x) = \\frac{1}{${b} - ${a}} = ${k.toFixed(4)}`)}
                            </div>
                        </>
                    ) : tipoFuncion === 'exponencial' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`\\int_{0}^{\\infty} k \\cdot e^{-cx} dx = 1`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`\\int_{0}^{\\infty} k \\cdot e^{-${c}x} dx = 1 \\implies k = ${c}`)}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {renderLatex(`k = ${k.toFixed(4)}`)}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '1rem' }}>
                                {renderLatex(`f(x) = ${k.toFixed(4)} e^{-${c}x}`)}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`\\int_{a}^{b} k x^{${n}} dx = 1`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`\\int_{${a}}^{${b}} k x^{${n}} dx = 1 \\implies k \\left[ \\frac{x^{${n + 1}}}{${n + 1}} \\right]_{${a}}^{${b}} = 1`)}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {renderLatex(`k = ${k.toFixed(4)}`)}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '1rem' }}>
                                {renderLatex(`f(x) = ${k.toFixed(4)} x^{${n}}`)}
                            </div>
                        </>
                    )}
                </div>

                {/* 2. Esperanza E(X) */}
                <div style={{ background: 'var(--bg-input, #f8fafc)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <h5 style={{ margin: '0 0 15px 0', color: 'var(--primary-color, #3b82f6)', fontSize: '0.95rem' }}>2. Esperanza E(X)</h5>
                    
                    {tipoFuncion === 'uniforme' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\frac{a + b}{2}`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\frac{${a} + ${b}}{2}`)}
                            </div>
                        </>
                    ) : tipoFuncion === 'exponencial' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\int_{0}^{\\infty} x \\cdot f(x) dx`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\frac{1}{c} = \\frac{1}{${c}}`)}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\int_{a}^{b} x \\cdot f(x) dx`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X) = \\int_{${a}}^{${b}} ${k.toFixed(4)} x^{${n + 1}} dx`)}
                            </div>
                        </>
                    )}
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {renderLatex(`E(X) = ${EX.toFixed(4)}`)}
                    </div>
                </div>

                {/* 3. Varianza Var(X) */}
                <div style={{ background: 'var(--bg-input, #f8fafc)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <h5 style={{ margin: '0 0 15px 0', color: 'var(--primary-color, #3b82f6)', fontSize: '0.95rem' }}>3. Varianza Var(X)</h5>
                    
                    {tipoFuncion === 'uniforme' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = \\frac{(b - a)^2}{12}`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = \\frac{(${b} - ${a})^2}{12}`)}
                            </div>
                        </>
                    ) : tipoFuncion === 'exponencial' ? (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = E(X^2) - [E(X)]^2`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = \\frac{1}{c^2} = \\frac{1}{${c}^2}`)}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`E(X^2) = \\int_{a}^{b} x^2 \\cdot f(x) dx = ${EX2.toFixed(4)}`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = E(X^2) - [E(X)]^2`)}
                            </div>
                            <div style={{ marginBottom: '10px', fontSize: '1rem' }}>
                                {renderLatex(`Var(X) = ${EX2.toFixed(4)} - (${EX.toFixed(4)})^2`)}
                            </div>
                        </>
                    )}
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {renderLatex(`Var(X) = ${VarX.toFixed(4)}`)}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                        {renderLatex(`\\sigma = \\sqrt{Var(X)} = ${Desv.toFixed(4)}`)}
                    </div>
                </div>

            </div>
        </div>
    );
}
