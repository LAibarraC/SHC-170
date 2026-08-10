import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { puntualBinomial, puntualPoisson, puntualHipergeometrica } from '../../../Matematicas/logica_Tema3';

export default function ModalProcedimientoModelos({ modelo, params, condicion, momento, onClose }) {
    const latexRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    useEffect(() => {
        if (!latexRef.current) return;

        let htmlContent = "";
        const { tipo, valorX, valorB } = condicion;
        const renderMath = (math) => {
            const rendered = katex.renderToString(math, { throwOnError: false, displayMode: true });
            return `<div style="border: 1px dashed #cbd5e1; padding: 8px 15px; border-radius: 6px; background-color: #ffffff; margin-top: 8px; overflow-x: auto;">${rendered}</div>`;
        };

        const styleTitle = "display: block; margin-bottom: 10px; color: #1e293b; font-weight: 500; text-align: left; font-size: 0.9em;";
        const styleContainer = "margin-bottom: 25px;";

        if (momento === 'esperanza') {
            let formBase = "";
            let sust = "";
            let res = 0;
            if (modelo === 'Bernoulli') {
                formBase = "E(X) = p";
                sust = `E(X) = ${params.p}`;
                res = params.p;
            } else if (modelo === 'Binomial') {
                formBase = "E(X) = n \\cdot p";
                sust = `E(X) = ${params.n} \\cdot ${params.p}`;
                res = params.n * params.p;
            } else if (modelo === 'Poisson') {
                formBase = "E(X) = \\lambda";
                sust = `E(X) = ${params.lambda}`;
                res = params.lambda;
            } else if (modelo === 'Hipergeometrica') {
                formBase = "E(X) = n \\cdot \\frac{K}{N}";
                sust = `E(X) = ${params.n} \\cdot \\frac{${params.K}}{${params.N}}`;
                res = params.n * (params.K / params.N);
            } else if (modelo === 'uniforme' || modelo === 'Uniforme') {
                formBase = "E(X) = \\frac{a + b}{2}";
                sust = `E(X) = \\frac{${params.a} + ${params.b}}{2}`;
                res = (params.a + params.b) / 2;
            }
            htmlContent = `
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">1. Fórmula Teórica:</strong>
                    ${renderMath(formBase)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">2. Sustituyendo valores:</strong>
                    ${renderMath(sust)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">3. Resultado Puntual:</strong>
                    ${renderMath(`E(X) = ${res.toFixed(4)}`)}
                </div>
            `;
        } else if (momento === 'varianza') {
            let formBase = "";
            let sust = "";
            let res = 0;
            if (modelo === 'Bernoulli') {
                formBase = "V(X) = p \\cdot (1 - p)";
                sust = `V(X) = ${params.p} \\cdot (1 - ${params.p})`;
                res = params.p * (1 - params.p);
            } else if (modelo === 'Binomial') {
                formBase = "V(X) = n \\cdot p \\cdot (1 - p)";
                sust = `V(X) = ${params.n} \\cdot ${params.p} \\cdot (1 - ${params.p})`;
                res = params.n * params.p * (1 - params.p);
            } else if (modelo === 'Poisson') {
                formBase = "V(X) = \\lambda";
                sust = `V(X) = ${params.lambda}`;
                res = params.lambda;
            } else if (modelo === 'Hipergeometrica') {
                formBase = "V(X) = n \\cdot \\frac{K}{N} \\cdot \\frac{N-K}{N} \\cdot \\frac{N-n}{N-1}";
                sust = `V(X) = ${params.n} \\cdot \\frac{${params.K}}{${params.N}} \\cdot \\frac{${params.N}-${params.K}}{${params.N}} \\cdot \\frac{${params.N}-${params.n}}{${params.N}-1}`;
                res = params.n * (params.K / params.N) * ((params.N - params.K) / params.N) * ((params.N - params.n) / (params.N - 1));
            } else if (modelo === 'uniforme' || modelo === 'Uniforme') {
                formBase = "V(X) = \\frac{(b - a)^2}{12}";
                sust = `V(X) = \\frac{(${params.b} - ${params.a})^2}{12}`;
                res = Math.pow(params.b - params.a, 2) / 12;
            }
            htmlContent = `
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">1. Fórmula Teórica:</strong>
                    ${renderMath(formBase)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">2. Sustituyendo valores:</strong>
                    ${renderMath(sust)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">3. Resultado Puntual:</strong>
                    ${renderMath(`V(X) = ${res.toFixed(4)}`)}
                </div>
            `;
        } else if (momento === 'desviacion') {
            let varVal = 0;
            if (modelo === 'Bernoulli') varVal = params.p * (1 - params.p);
            if (modelo === 'Binomial') varVal = params.n * params.p * (1 - params.p);
            if (modelo === 'Poisson') varVal = params.lambda;
            if (modelo === 'Hipergeometrica') varVal = params.n * (params.K / params.N) * ((params.N - params.K) / params.N) * ((params.N - params.n) / (params.N - 1));
            if (modelo === 'uniforme' || modelo === 'Uniforme') varVal = Math.pow(params.b - params.a, 2) / 12;
            
            htmlContent = `
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">1. Fórmula Teórica:</strong>
                    ${renderMath(`\\sigma = \\sqrt{V(X)}`)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">2. Sustituyendo valores:</strong>
                    ${renderMath(`\\sigma = \\sqrt{${varVal.toFixed(4)}}`)}
                </div>
                <div style="${styleContainer}">
                    <strong style="${styleTitle}">3. Resultado Puntual:</strong>
                    ${renderMath(`\\sigma = ${Math.sqrt(varVal).toFixed(4)}`)}
                </div>
            `;
        } else {
            // Fórmulas teóricas base para la Probabilidad
            const formBernoulli = `P(X=x) = p^x (1-p)^{1-x}`;
            const formBinomial = `P(X=x) = \\binom{n}{x} p^x (1-p)^{n-x}`;
            const formPoisson = `P(X=x) = \\frac{e^{-\\lambda} \\lambda^x}{x!}`;
            const formHiper = `P(X=x) = \\frac{\\binom{K}{x} \\binom{N-K}{n-x}}{\\binom{N}{n}}`;
            const formUniforme = `f(x) = \\frac{1}{b - a} \\quad P(c \\leq X \\leq d) = \\int_{c}^{d} \\frac{1}{b - a} dx = \\frac{d - c}{b - a}`;

            let formulaBase = "";
            let sustitucionEjemplo = "";
            let resultadoEjemplo = 0;

            const xShow = tipo === 'intervalo' ? valorX : valorX;

            if (modelo === 'Bernoulli') {
                formulaBase = formBernoulli;
                sustitucionEjemplo = `P(X=${xShow}) = (${params.p})^{${xShow}} (1-${params.p})^{1-${xShow}}`;
                resultadoEjemplo = xShow === 1 ? params.p : (xShow === 0 ? 1 - params.p : 0);
            } else if (modelo === 'Binomial') {
                formulaBase = formBinomial;
                sustitucionEjemplo = `P(X=${xShow}) = \\binom{${params.n}}{${xShow}} (${params.p})^{${xShow}} (1-${params.p})^{${params.n}-${xShow}}`;
                resultadoEjemplo = puntualBinomial(params.n, params.p, xShow);
            } else if (modelo === 'Poisson') {
                formulaBase = formPoisson;
                sustitucionEjemplo = `P(X=${xShow}) = \\frac{e^{-${params.lambda}} (${params.lambda})^{${xShow}}}{${xShow}!}`;
                resultadoEjemplo = puntualPoisson(params.lambda, xShow);
            } else if (modelo === 'Hipergeometrica') {
                formulaBase = formHiper;
                sustitucionEjemplo = `P(X=${xShow}) = \\frac{\\binom{${params.K}}{${xShow}} \\binom{${params.N}-${params.K}}{${params.n}-${xShow}}}{\\binom{${params.N}}{${params.n}}}`;
                resultadoEjemplo = puntualHipergeometrica(params.N, params.K, params.n, xShow);
            } else if (modelo === 'uniforme' || modelo === 'Uniforme') {
                formulaBase = formUniforme;
                
                let valC = 0, valD = 0;
                
                if (tipo.includes('menor')) {
                    valC = params.a;
                    valD = Math.min(valorX, params.b);
                } else if (tipo.includes('mayor')) {
                    valC = Math.max(valorX, params.a);
                    valD = params.b;
                } else if (tipo.includes('intervalo')) {
                    valC = Math.max(valorX, params.a);
                    valD = Math.min(valorB, params.b);
                }

                if (valC >= valD) {
                    sustitucionEjemplo = `P(${valC} \\leq X \\leq ${valD}) = 0 \\quad (\\text{Fuera de rango})`;
                    resultadoEjemplo = 0;
                } else {
                    sustitucionEjemplo = `P(${valC} \\leq X \\leq ${valD}) = \\int_{${valC}}^{${valD}} \\frac{1}{${params.b} - ${params.a}} dx = \\frac{${valD} - ${valC}}{${params.b} - ${params.a}}`;
                    resultadoEjemplo = (valD - valC) / (params.b - params.a);
                }
            }

            if (modelo === 'uniforme' || modelo === 'Uniforme') {
                htmlContent = `
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">1. Función de Densidad e Integral:</strong>
                        ${renderMath(formulaBase)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">2. Sustituyendo los límites solicitados ajustados al soporte $[a, b]$:</strong>
                        ${renderMath(sustitucionEjemplo)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">3. Probabilidad Resultante:</strong>
                        ${renderMath(`P = ${resultadoEjemplo.toFixed(4)}`)}
                    </div>
                    <div style="font-size: 0.9em; color: #64748b; font-style: italic; text-align: center;">
                        * Recuerde que para variables continuas $P(X = x) = 0$ y que los límites se restringen al soporte matemático definido.
                    </div>
                `;
            } else if (tipo === 'exacta') {
                htmlContent = `
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">1. Fórmula Teórica (${modelo}):</strong>
                        ${renderMath(formulaBase)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">2. Sustituyendo valores (x=${xShow}):</strong>
                        ${renderMath(sustitucionEjemplo)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">3. Resultado Puntual:</strong>
                        ${renderMath(`P(X=${xShow}) = ${resultadoEjemplo.toFixed(4)}`)}
                    </div>
                `;
            } else {
                let sumatoriaText = "";
                if (tipo === 'menor_igual') sumatoriaText = `P(X \\leq ${valorX}) = \\sum_{x=0}^{${valorX}} P(x)`;
                if (tipo === 'mayor_igual') sumatoriaText = `P(X \\geq ${valorX}) = \\sum_{x=${valorX}}^{\\text{max}} P(x)`;
                if (tipo === 'intervalo') sumatoriaText = `P(${valorX} \\leq X \\leq ${valorB}) = \\sum_{x=${valorX}}^{${valorB}} P(x)`;

                htmlContent = `
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">1. Fórmula Puntual Base:</strong>
                        ${renderMath(formulaBase)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">2. Lógica Acumulada solicitada:</strong>
                        ${renderMath(sumatoriaText)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">3. Ejemplo de un término (x=${xShow}):</strong>
                        ${renderMath(`${sustitucionEjemplo} \\approx ${resultadoEjemplo.toFixed(4)}`)}
                    </div>
                    <div style="font-size: 0.9em; color: #64748b; font-style: italic; text-align: center;">
                        * Se repite el paso 3 para cada valor en el rango y se suman.
                    </div>
                `;
            }
        }

        latexRef.current.innerHTML = htmlContent;

    }, [modelo, params, condicion, momento]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={onClose}>
            <div style={{ background: 'white', borderRadius: '8px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: 'absolute', top: '15px', right: '15px', 
                        background: 'transparent', border: 'none', borderRadius: '50%', 
                        width: '32px', height: '32px', color: '#64748b', 
                        cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        padding: 0, transition: 'background-color 0.2s, color 0.2s' 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                    aria-label="Cerrar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h3 style={{ color: '#1e3a8a', fontSize: '1.25rem', marginTop: 0, marginBottom: '5px', paddingRight: '40px' }}>
                    Procedimiento: {momento === 'esperanza' ? 'Esperanza Matemática' : momento === 'varianza' ? 'Varianza' : momento === 'desviacion' ? 'Desviación Estándar' : `Probabilidad ${modelo}`}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 0, marginBottom: '25px' }}>
                    Visualización de la fórmula teórica y reemplazo paso a paso.
                </p>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', minHeight: '150px', overflowX: 'auto' }}>
                    <div ref={latexRef} style={{ fontSize: '1.1em', color: '#1e293b' }}></div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Entendido</button>
                </div>
            </div>
        </div>
    );
}
