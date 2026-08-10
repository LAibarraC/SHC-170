import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { puntualBinomial, puntualPoisson, puntualHipergeometrica } from '../../../Matematicas/logica_Tema3';
import { jStat } from 'jstat';

export default function ModalProcedimientoModelos({ modelo, params, condicion, momento, onClose }) {
    const latexRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    useEffect(() => {
        if (!latexRef.current) return;

        let htmlContent = "";
        const { tipo, valorX, valorB, valX, valX2, valP, intervals } = condicion || {};
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
            } else if (modelo === 'Normal') {
                formBase = "E(X) = \\mu";
                sust = `E(X) = ${params.mu}`;
                res = params.mu;
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
            } else if (modelo === 'Normal') {
                formBase = "V(X) = \\sigma^2";
                sust = `V(X) = ${params.sigma}^2`;
                res = Math.pow(params.sigma, 2);
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
            if (modelo === 'Normal') varVal = Math.pow(params.sigma, 2);
            
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
            const formNormal = `Z = \\frac{x - \\mu}{\\sigma} \\quad \\rightarrow \\quad P(X \\leq x) = P\\left(Z \\leq \\frac{x - \\mu}{\\sigma}\\right) = \\Phi(Z)`;

            let formulaBase = "";
            let sustitucionEjemplo = "";
            let resultadoEjemplo = 0;

            const xShow = tipo === 'intervalo' ? (valX ?? valorX) : (valX ?? valorX);

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
                let cX = Number(valX ?? valorX);
                let cX2 = Number(valX2 ?? valorB);

                if (tipo.includes('inversa')) {
                    formulaBase = `P = \\int_{a}^{c} f(x) dx \\Rightarrow c = a + p \\cdot (b - a)`;
                    if (tipo === 'inversa_menor') {
                        sustitucionEjemplo = `P(X < c) = ${valP} \\Rightarrow c = ${params.a} + ${valP} \\cdot (${params.b} - ${params.a})`;
                        resultadoEjemplo = params.a + valP * (params.b - params.a);
                    } else if (tipo === 'inversa_mayor') {
                        sustitucionEjemplo = `P(X > c) = ${valP} \\Rightarrow c = ${params.b} - ${valP} \\cdot (${params.b} - ${params.a})`;
                        resultadoEjemplo = params.b - valP * (params.b - params.a);
                    } else if (tipo === 'inversa_exterior') {
                        sustitucionEjemplo = `P(X < c_1) = \\frac{${valP}}{2}, P(X > c_2) = \\frac{${valP}}{2}`;
                        resultadoEjemplo = valP; // Not a single result here, just for show
                    }
                } else if (tipo === 'exterior') {
                    let p1 = Math.max(0, Math.min(cX, params.b) - params.a) / (params.b - params.a);
                    let p2 = Math.max(0, params.b - Math.max(cX2, params.a)) / (params.b - params.a);
                    sustitucionEjemplo = `P(X < ${cX}) + P(X > ${cX2}) = \\frac{${Math.min(cX, params.b)} - ${params.a}}{${params.b} - ${params.a}} + \\frac{${params.b} - ${Math.max(cX2, params.a)}}{${params.b} - ${params.a}}`;
                    resultadoEjemplo = p1 + p2;
                } else if (tipo === 'suma_intervalos') {
                    sustitucionEjemplo = `\\text{Suma de } ${intervals?.length || 0} \\text{ intervalos integrados sobre f(x)}`;
                    resultadoEjemplo = 0; // Simplified for modal
                } else {
                    let valC = 0, valD = 0;
                    if (tipo.includes('menor')) {
                        valC = params.a;
                        valD = Math.min(cX, params.b);
                    } else if (tipo.includes('mayor')) {
                        valC = Math.max(cX, params.a);
                        valD = params.b;
                    } else if (tipo.includes('intervalo') || tipo.includes('entre')) {
                        valC = Math.max(cX, params.a);
                        valD = Math.min(cX2, params.b);
                    }

                    if (valC >= valD) {
                        sustitucionEjemplo = `P(${valC} \\leq X \\leq ${valD}) = 0 \\quad (\\text{Fuera de rango})`;
                        resultadoEjemplo = 0;
                    } else {
                        sustitucionEjemplo = `P(${valC} \\leq X \\leq ${valD}) = \\int_{${valC}}^{${valD}} \\frac{1}{${params.b} - ${params.a}} dx = \\frac{${valD} - ${valC}}{${params.b} - ${params.a}}`;
                        resultadoEjemplo = (valD - valC) / (params.b - params.a);
                    }
                }
            } else if (modelo === 'Normal') {
                formulaBase = formNormal;
                let cX = Number(valX ?? valorX);
                let cX2 = Number(valX2 ?? valorB);
                
                if (tipo.includes('inversa')) {
                    formulaBase = `Z = \\Phi^{-1}(p) \\Rightarrow c = \\mu + Z \\cdot \\sigma`;
                    if (tipo === 'inversa_menor') {
                        const z = jStat.normal.inv(valP, 0, 1);
                        const c = params.mu + z * params.sigma;
                        sustitucionEjemplo = `\\Phi^{-1}(${valP}) \\approx ${z.toFixed(4)} \\Rightarrow c = ${params.mu} + (${z.toFixed(4)})(${params.sigma})`;
                        resultadoEjemplo = c;
                    } else if (tipo === 'inversa_mayor') {
                        const z = jStat.normal.inv(1 - valP, 0, 1);
                        const c = params.mu + z * params.sigma;
                        sustitucionEjemplo = `\\Phi^{-1}(1 - ${valP}) \\approx ${z.toFixed(4)} \\Rightarrow c = ${params.mu} + (${z.toFixed(4)})(${params.sigma})`;
                        resultadoEjemplo = c;
                    } else if (tipo === 'inversa_exterior') {
                        const z1 = jStat.normal.inv(valP / 2, 0, 1);
                        const z2 = jStat.normal.inv(1 - valP / 2, 0, 1);
                        sustitucionEjemplo = `Z_1 \\approx ${z1.toFixed(4)}, Z_2 \\approx ${z2.toFixed(4)} \\Rightarrow c_1 = ${params.mu} + Z_1\\sigma, c_2 = ${params.mu} + Z_2\\sigma`;
                        resultadoEjemplo = valP;
                    }
                } else if (tipo === 'exterior') {
                    const zX1 = (cX - params.mu) / params.sigma;
                    const zX2 = (cX2 - params.mu) / params.sigma;
                    const p1 = jStat.normal.cdf(cX, params.mu, params.sigma);
                    const p2 = 1 - jStat.normal.cdf(cX2, params.mu, params.sigma);
                    sustitucionEjemplo = `P(X < ${cX}) + P(X > ${cX2}) = \\Phi(${zX1.toFixed(4)}) + (1 - \\Phi(${zX2.toFixed(4)}))`;
                    resultadoEjemplo = p1 + p2;
                } else if (tipo === 'suma_intervalos') {
                    sustitucionEjemplo = `\\text{Suma de las áreas bajo la curva Normal tipificada para } ${intervals?.length || 0} \\text{ intervalos}`;
                    resultadoEjemplo = 0;
                } else {
                    const zX = (cX - params.mu) / params.sigma;
                    const pX = jStat.normal.cdf(cX, params.mu, params.sigma);

                    if (tipo.includes('menor')) {
                        sustitucionEjemplo = `P(X \\leq ${cX}) = P\\left(Z \\leq \\frac{${cX} - ${params.mu}}{${params.sigma}}\\right) = P(Z \\leq ${zX.toFixed(4)})`;
                        resultadoEjemplo = pX;
                    } else if (tipo.includes('mayor')) {
                        sustitucionEjemplo = `P(X \\geq ${cX}) = 1 - P\\left(Z \\leq \\frac{${cX} - ${params.mu}}{${params.sigma}}\\right) = 1 - P(Z \\leq ${zX.toFixed(4)})`;
                        resultadoEjemplo = 1 - pX;
                    } else if (tipo.includes('intervalo') || tipo.includes('entre')) {
                        const zB = (cX2 - params.mu) / params.sigma;
                        const pB = jStat.normal.cdf(cX2, params.mu, params.sigma);
                        sustitucionEjemplo = `P(${cX} \\leq X \\leq ${cX2}) = P\\left(\\frac{${cX} - ${params.mu}}{${params.sigma}} \\leq Z \\leq \\frac{${cX2} - ${params.mu}}{${params.sigma}}\\right) = \\Phi(${zB.toFixed(4)}) - \\Phi(${zX.toFixed(4)})`;
                        resultadoEjemplo = pB - pX;
                    }
                }
            }

            if (modelo === 'uniforme' || modelo === 'Uniforme') {
                htmlContent = `
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">1. Función de Densidad e Integral (o Inversa):</strong>
                        ${renderMath(formulaBase)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">2. Sustituyendo los parámetros ($a=${params.a}, b=${params.b}$):</strong>
                        ${renderMath(sustitucionEjemplo)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">3. ${tipo.includes('inversa') ? 'Valor Límite Calculado (c)' : 'Probabilidad Resultante'}:</strong>
                        ${renderMath(tipo.includes('inversa') && !tipo.includes('exterior') ? `c = ${resultadoEjemplo.toFixed(4)}` : `P = ${resultadoEjemplo.toFixed(4)}`)}
                    </div>
                    <div style="font-size: 0.9em; color: #64748b; font-style: italic; text-align: center;">
                        * Recuerde que para variables continuas $P(X = x) = 0$ y que los límites se restringen al soporte matemático definido.
                    </div>
                `;
            } else if (modelo === 'Normal') {
                htmlContent = `
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">1. Tipificación a Normal Estándar Z (o Inversa Z):</strong>
                        ${renderMath(formulaBase)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">2. Sustituyendo los valores para Z:</strong>
                        ${renderMath(sustitucionEjemplo)}
                    </div>
                    <div style="${styleContainer}">
                        <strong style="${styleTitle}">3. ${tipo.includes('inversa') ? 'Valor Límite Calculado (c)' : 'Probabilidad Resultante'}:</strong>
                        ${renderMath(tipo.includes('inversa') && !tipo.includes('exterior') ? `c = ${resultadoEjemplo.toFixed(4)}` : `P = ${resultadoEjemplo.toFixed(4)}`)}
                    </div>
                    <div style="font-size: 0.9em; color: #64748b; font-style: italic; text-align: center;">
                        * Recuerde que para variables continuas $P(X = x) = 0$.
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
