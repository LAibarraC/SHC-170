import React from 'react';
import '../../../styles/Temas/Tema3.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { jStat } from 'jstat';

export default function Resultados_ModelosContinuos({ resultados, modelo, condicion, params }) {
    if (!resultados) return null;

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const TooltipZ = () => (
        <span className="t3-tooltip-wrap">
            <span dangerouslySetInnerHTML={{ __html: katex.renderToString('Z', { throwOnError: false }) }} />
            <div className="t3-tooltip-box">
                <span>Variable Normal Estándar</span>
                <div className="t3-tooltip-math">
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString('Z = \\dfrac{X - \\mu}{\\sigma}', { throwOnError: false }) }} />
                </div>
            </div>
        </span>
    );

    // Post-procesa HTML de KaTeX: tooltip solo en la PRIMERA Z
    const zTooltipInner =
        `<span class="t3-tooltip-box">Variable Normal Estándar` +
        `<div class="t3-tooltip-math">${katex.renderToString('Z = \\dfrac{X-\\mu}{\\sigma}', { throwOnError: false })}</div></span>`;

    const injectZTooltip = (html) => {
        const marker = '>Z</span>';
        const closeIdx = html.indexOf(marker);
        if (closeIdx === -1) return html;
        // Buscar el < de apertura del span que contiene Z
        let openIdx = closeIdx;
        while (openIdx > 0 && html[openIdx] !== '<') openIdx--;
        const fullSpanEnd = closeIdx + marker.length;
        return (
            html.slice(0, openIdx) +
            `<span class="t3-tooltip-wrap" style="position:relative;display:inline;text-decoration:underline dashed #94a3b8 1px;text-underline-offset:3px;cursor:help">` +
            zTooltipInner +
            html.slice(openIdx, fullSpanEnd) +
            `</span>` +
            html.slice(fullSpanEnd)
        );
    };

    const formatNum = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '-';
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    // Genera la resolución para Normal usando ambiente aligned de LaTeX
    const renderResolucionNormal = () => {
        if (!condicion || !params || !condicion.tipo) return null;
        const { mu, sigma } = params;
        const tipo = condicion.tipo;

        const Z = (x) => ((x - mu) / sigma).toFixed(2);
        const Phi = (z) => jStat.normal.cdf(z, 0, 1);

        let alignedStr = '';

        if (tipo === 'menor_igual' || tipo === 'menor') {
            const x = condicion.valX;
            const z = Z(x);
            const prob = Phi(parseFloat(z));
            alignedStr = `\\begin{aligned}
                            P(X \\le ${x}) &= P\\!\\left(Z \\le \\tfrac{${x} - ${mu}}{${sigma}}\\right) \\\\
                            &= P(Z \\le ${z}) = ${prob.toFixed(4)}
                            \\end{aligned}`;
        } else if (tipo === 'mayor_igual' || tipo === 'mayor') {
            const x = condicion.valX;
            const z = Z(x);
            const probMenor = Phi(parseFloat(z));
            const prob = (1 - probMenor);
            alignedStr = `\\begin{aligned}
                            P(X > ${x}) &= P\\!\\left(Z > \\tfrac{${x} - ${mu}}{${sigma}}\\right) = P(Z > ${z}) \\\\
                            &= 1 - P(Z \\le ${z}) \\\\
                            &= 1 - ${probMenor.toFixed(4)} = ${prob.toFixed(4)}
                            \\end{aligned}`;
        } else if (tipo === 'entre' || tipo === 'intervalo') {
            const x1 = condicion.valX;
            const x2 = condicion.valX2;
            const z1 = Z(x1);
            const z2 = Z(x2);
            const v1 = Phi(parseFloat(z1));
            const v2 = Phi(parseFloat(z2));
            const prob = v2 - v1;
            alignedStr = `\\begin{aligned}
                            P(${x1} \\le X \\le ${x2}) &= P\\!\\left(\\tfrac{${x1} - ${mu}}{${sigma}} \\le Z \\le \\tfrac{${x2} - ${mu}}{${sigma}}\\right) \\\\
                            &= P(${z1} \\le Z \\le ${z2}) \\\\
                            &= P(Z \\le ${z2}) - P(Z \\le ${z1}) \\\\
                            &= ${v2.toFixed(4)} - ${v1.toFixed(4)} = ${prob.toFixed(4)}
                            \\end{aligned}`;
        } else if (tipo === 'exterior') {
            const x1 = condicion.valX;
            const x2 = condicion.valX2;
            const z1 = Z(x1);
            const z2 = Z(x2);
            const v1 = Phi(parseFloat(z1));
            const v2 = Phi(parseFloat(z2));
            const probEntre = v2 - v1;
            const prob = 1 - probEntre;
            alignedStr = `\\begin{aligned}
                        P(${x1} > X > ${x2}) &= P\\!\\left(\\tfrac{${x1} - ${mu}}{${sigma}} > Z > \\tfrac{${x2} - ${mu}}{${sigma}}\\right) \\\\
                        &= P(${z1} > Z > ${z2}) \\\\
                        &= 1 - [P(Z \\le ${z2}) - P(Z \\le ${z1})] \\\\
                        &= 1 - [${v2.toFixed(4)} - ${v1.toFixed(4)}] = ${prob.toFixed(4)}
                        \\end{aligned}`;
        } else if (tipo === 'suma_intervalos' && Array.isArray(condicion.intervals)) {
            const tipLine = condicion.intervals.map(inv =>
                `\\tfrac{${inv.min}-${mu}}{${sigma}}=${Z(inv.min)}`
            ).join(';\\quad ');
            const sumLabels = condicion.intervals.map(inv =>
                `P(${Z(inv.min)} \\le Z \\le ${Z(inv.max)})`
            ).join(' + ');
            const sumVals = condicion.intervals.map(inv => {
                const z1 = parseFloat(Z(inv.min));
                const z2 = parseFloat(Z(inv.max));
                return (Phi(z2) - Phi(z1)).toFixed(4);
            }).join(' + ');
            const totalProb = condicion.intervals.reduce((acc, inv) => {
                return acc + (Phi(parseFloat(Z(inv.max))) - Phi(parseFloat(Z(inv.min))));
            }, 0);
            const firstLabel = condicion.intervals.map(inv => `P(${inv.min} \\le X \\le ${inv.max})`).join(' + ');
            alignedStr = `\\begin{aligned}
                            &\\text{Tipificando: } ${tipLine} \\\\
                            ${firstLabel} &= ${sumLabels} \\\\
                            &= ${sumVals} = ${totalProb.toFixed(4)}
                            \\end{aligned}`;
        } else if (tipo === 'inversa_menor') {
            const p = condicion.valP;
            const z = jStat.normal.inv(p, 0, 1).toFixed(4);
            const c = (mu + parseFloat(z) * sigma).toFixed(4);
            alignedStr = `\\begin{aligned}
                            P(X \\le c) &= ${p} \\Rightarrow Z \\approx ${z} \\\\
                            c &= \\mu + Z \\cdot \\sigma = ${mu} + (${z})(${sigma}) = ${c}
                            \\end{aligned}`;
        } else if (tipo === 'inversa_mayor') {
            const p = condicion.valP;
            const z = jStat.normal.inv(1 - p, 0, 1).toFixed(4);
            const c = (mu + parseFloat(z) * sigma).toFixed(4);
            alignedStr = `\\begin{aligned}
                            P(X > c) &= ${p} \\Rightarrow P(X \\le c) = 1 - ${p} = ${(1 - p).toFixed(4)} \\\\
                            Z &\\approx ${z} \\\\
                            c &= ${mu} + (${z})(${sigma}) = ${c}
                            \\end{aligned}`;
        } else if (tipo === 'inversa_exterior') {
            const p = condicion.valP;
            const z1 = jStat.normal.inv(p / 2, 0, 1).toFixed(4);
            const z2 = jStat.normal.inv(1 - p / 2, 0, 1).toFixed(4);
            const c1 = (mu + parseFloat(z1) * sigma).toFixed(4);
            const c2 = (mu + parseFloat(z2) * sigma).toFixed(4);
            alignedStr = `\\begin{aligned}
                            P(c_1 > X > c_2) &= ${p} \\\\
                            Z_1 \\approx ${z1} &,\\quad Z_2 \\approx ${z2} \\\\
                            c_1 &= ${mu} + (${z1})(${sigma}) = ${c1} \\\\
                            c_2 &= ${mu} + (${z2})(${sigma}) = ${c2}
                            \\end{aligned}`;
        } else if (tipo === 'inversa_entre') {
            const p = condicion.valP;
            const z1 = jStat.normal.inv((1 - p) / 2, 0, 1).toFixed(4);
            const z2 = jStat.normal.inv(1 - (1 - p) / 2, 0, 1).toFixed(4);
            const c1 = (mu + parseFloat(z1) * sigma).toFixed(4);
            const c2 = (mu + parseFloat(z2) * sigma).toFixed(4);
            alignedStr = `\\begin{aligned}
                            P(c_1 \\le X \\le c_2) &= ${p} \\\\
                            Z_1 \\approx ${z1} &,\\quad Z_2 \\approx ${z2} \\\\
                            c_1 &= ${mu} + (${z1})(${sigma}) = ${c1} \\\\
                            c_2 &= ${mu} + (${z2})(${sigma}) = ${c2}
                            \\end{aligned}`;
        }

        if (!alignedStr) return null;

        return (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', fontSize: '0.95rem' }}>
                <span dangerouslySetInnerHTML={{ __html: injectZTooltip(katex.renderToString(alignedStr, { throwOnError: false, displayMode: false })) }} />
            </div>
        );
    };

    const renderResolucionNormalEstandar = () => {
        const tipo = condicion.tipo;
        const Phi = (z) => jStat.normal.cdf(z, 0, 1);
        let alignedStr = '';

        if (tipo === 'menor_igual' || tipo === 'menor') {
            const z = parseFloat(condicion.valX).toFixed(2);
            alignedStr = `\\begin{aligned} P(Z \\le ${z}) = ${Phi(parseFloat(z)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'mayor_igual' || tipo === 'mayor') {
            const z = parseFloat(condicion.valX).toFixed(2);
            const p = Phi(parseFloat(z));
            alignedStr = `\\begin{aligned} P(Z > ${z}) &= 1 - P(Z \\le ${z}) \\\\ &= 1 - ${p.toFixed(4)} = ${(1 - p).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'entre' || tipo === 'intervalo') {
            const z1 = parseFloat(condicion.valX).toFixed(2);
            const z2 = parseFloat(condicion.valX2).toFixed(2);
            const v1 = Phi(parseFloat(z1));
            const v2 = Phi(parseFloat(z2));
            alignedStr = `\\begin{aligned} P(${z1} \\le Z \\le ${z2}) &= P(Z \\le ${z2}) - P(Z \\le ${z1}) \\\\ &= ${v2.toFixed(4)} - ${v1.toFixed(4)} = ${(v2 - v1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'exterior') {
            const z1 = parseFloat(condicion.valX).toFixed(2);
            const z2 = parseFloat(condicion.valX2).toFixed(2);
            const v1 = Phi(parseFloat(z1));
            const v2 = Phi(parseFloat(z2));
            alignedStr = `\\begin{aligned} P(${z1} > Z > ${z2}) &= 1 - P(${z1} \\le Z \\le ${z2}) \\\\ &= 1 - [${v2.toFixed(4)} - ${v1.toFixed(4)}] = ${(1 - (v2 - v1)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'suma_intervalos' && Array.isArray(condicion.intervals)) {
            const sumLabels = condicion.intervals.map(inv => `P(${parseFloat(inv.min).toFixed(2)} \\le Z \\le ${parseFloat(inv.max).toFixed(2)})`).join(' + ');
            const sumVals = condicion.intervals.map(inv => (Phi(parseFloat(inv.max)) - Phi(parseFloat(inv.min))).toFixed(4)).join(' + ');
            const totalProb = condicion.intervals.reduce((acc, inv) => acc + (Phi(parseFloat(inv.max)) - Phi(parseFloat(inv.min))), 0);
            alignedStr = `\\begin{aligned} \\text{Suma} &= ${sumLabels} \\\\ &= ${sumVals} = ${totalProb.toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_menor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(Z \\le c) &= ${p} \\Rightarrow c \\approx ${jStat.normal.inv(p, 0, 1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_mayor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(Z > c) &= ${p} \\Rightarrow P(Z \\le c) = ${(1 - p).toFixed(4)} \\\\ c &\\approx ${jStat.normal.inv(1 - p, 0, 1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_exterior') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 > Z > c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.normal.inv(p / 2, 0, 1).toFixed(4)} \\\\ c_2 &\\approx ${jStat.normal.inv(1 - p / 2, 0, 1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_entre') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 \\le Z \\le c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.normal.inv((1-p)/2, 0, 1).toFixed(4)} \\\\ c_2 &\\approx ${jStat.normal.inv(1 - (1-p)/2, 0, 1).toFixed(4)} \\end{aligned}`;
        }

        if (!alignedStr) return null;
        return (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', fontSize: '0.95rem' }}>
                <span dangerouslySetInnerHTML={{ __html: injectZTooltip(katex.renderToString(alignedStr, { throwOnError: false, displayMode: false })) }} />
            </div>
        );
    };

    const renderResolucionChiCuadrado = () => {
        const tipo = condicion.tipo;
        const k = params.k;
        const F = (x) => jStat.chisquare.cdf(x, k);
        let alignedStr = '';

        if (tipo === 'menor_igual' || tipo === 'menor') {
            const x = parseFloat(condicion.valX).toFixed(2);
            alignedStr = `\\begin{aligned} P(\\chi^2 \\le ${x}) = ${F(parseFloat(x)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'mayor_igual' || tipo === 'mayor') {
            const x = parseFloat(condicion.valX).toFixed(2);
            const p = F(parseFloat(x));
            alignedStr = `\\begin{aligned} P(\\chi^2 > ${x}) &= 1 - P(\\chi^2 \\le ${x}) \\\\ &= 1 - ${p.toFixed(4)} = ${(1 - p).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'entre' || tipo === 'intervalo') {
            const x1 = parseFloat(condicion.valX).toFixed(2);
            const x2 = parseFloat(condicion.valX2).toFixed(2);
            const v1 = F(parseFloat(x1));
            const v2 = F(parseFloat(x2));
            alignedStr = `\\begin{aligned} P(${x1} \\le \\chi^2 \\le ${x2}) &= P(\\chi^2 \\le ${x2}) - P(\\chi^2 \\le ${x1}) \\\\ &= ${v2.toFixed(4)} - ${v1.toFixed(4)} = ${(v2 - v1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'exterior') {
            const x1 = parseFloat(condicion.valX).toFixed(2);
            const x2 = parseFloat(condicion.valX2).toFixed(2);
            const v1 = F(parseFloat(x1));
            const v2 = F(parseFloat(x2));
            alignedStr = `\\begin{aligned} P(${x1} > \\chi^2 > ${x2}) &= 1 - P(${x1} \\le \\chi^2 \\le ${x2}) \\\\ &= 1 - [${v2.toFixed(4)} - ${v1.toFixed(4)}] = ${(1 - (v2 - v1)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'suma_intervalos' && Array.isArray(condicion.intervals)) {
            const sumLabels = condicion.intervals.map(inv => `P(${parseFloat(inv.min).toFixed(2)} \\le \\chi^2 \\le ${parseFloat(inv.max).toFixed(2)})`).join(' + ');
            const sumVals = condicion.intervals.map(inv => (F(parseFloat(inv.max)) - F(parseFloat(inv.min))).toFixed(4)).join(' + ');
            const totalProb = condicion.intervals.reduce((acc, inv) => acc + (F(parseFloat(inv.max)) - F(parseFloat(inv.min))), 0);
            alignedStr = `\\begin{aligned} \\text{Suma} &= ${sumLabels} \\\\ &= ${sumVals} = ${totalProb.toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_menor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(\\chi^2 \\le c) &= ${p} \\Rightarrow c \\approx ${jStat.chisquare.inv(p, k).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_mayor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(\\chi^2 > c) &= ${p} \\Rightarrow P(\\chi^2 \\le c) = ${(1 - p).toFixed(4)} \\\\ c &\\approx ${jStat.chisquare.inv(1 - p, k).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_exterior') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 > \\chi^2 > c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.chisquare.inv(p / 2, k).toFixed(4)} \\\\ c_2 &\\approx ${jStat.chisquare.inv(1 - p / 2, k).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_entre') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 \\le \\chi^2 \\le c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.chisquare.inv((1-p)/2, k).toFixed(4)} \\\\ c_2 &\\approx ${jStat.chisquare.inv(1 - (1-p)/2, k).toFixed(4)} \\end{aligned}`;
        }

        if (!alignedStr) return null;
        return (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', fontSize: '0.95rem' }}>
                <span dangerouslySetInnerHTML={{ __html: injectZTooltip(katex.renderToString(alignedStr, { throwOnError: false, displayMode: false })) }} />
            </div>
        );
    };

    const renderResolucionFFisher = () => {
        const tipo = condicion.tipo;
        const v1 = params.v1;
        const v2 = params.v2;
        const F_dist = (x) => jStat.centralF.cdf(x, v1, v2);
        let alignedStr = '';

        if (tipo === 'menor_igual' || tipo === 'menor') {
            const x = parseFloat(condicion.valX).toFixed(2);
            alignedStr = `\\begin{aligned} P(F \\le ${x}) = ${F_dist(parseFloat(x)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'mayor_igual' || tipo === 'mayor') {
            const x = parseFloat(condicion.valX).toFixed(2);
            const p = F_dist(parseFloat(x));
            alignedStr = `\\begin{aligned} P(F > ${x}) &= 1 - P(F \\le ${x}) \\\\ &= 1 - ${p.toFixed(4)} = ${(1 - p).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'entre' || tipo === 'intervalo') {
            const x1 = parseFloat(condicion.valX).toFixed(2);
            const x2 = parseFloat(condicion.valX2).toFixed(2);
            const v_1 = F_dist(parseFloat(x1));
            const v_2 = F_dist(parseFloat(x2));
            alignedStr = `\\begin{aligned} P(${x1} \\le F \\le ${x2}) &= P(F \\le ${x2}) - P(F \\le ${x1}) \\\\ &= ${v_2.toFixed(4)} - ${v_1.toFixed(4)} = ${(v_2 - v_1).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'exterior') {
            const x1 = parseFloat(condicion.valX).toFixed(2);
            const x2 = parseFloat(condicion.valX2).toFixed(2);
            const v_1 = F_dist(parseFloat(x1));
            const v_2 = F_dist(parseFloat(x2));
            alignedStr = `\\begin{aligned} P(${x1} > F > ${x2}) &= 1 - P(${x1} \\le F \\le ${x2}) \\\\ &= 1 - [${v_2.toFixed(4)} - ${v_1.toFixed(4)}] = ${(1 - (v_2 - v_1)).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'suma_intervalos' && Array.isArray(condicion.intervals)) {
            const sumLabels = condicion.intervals.map(inv => `P(${parseFloat(inv.min).toFixed(2)} \\le F \\le ${parseFloat(inv.max).toFixed(2)})`).join(' + ');
            const sumVals = condicion.intervals.map(inv => (F_dist(parseFloat(inv.max)) - F_dist(parseFloat(inv.min))).toFixed(4)).join(' + ');
            const totalProb = condicion.intervals.reduce((acc, inv) => acc + (F_dist(parseFloat(inv.max)) - F_dist(parseFloat(inv.min))), 0);
            alignedStr = `\\begin{aligned} \\text{Suma} &= ${sumLabels} \\\\ &= ${sumVals} = ${totalProb.toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_menor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(F \\le c) &= ${p} \\Rightarrow c \\approx ${jStat.centralF.inv(p, v1, v2).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_mayor') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(F > c) &= ${p} \\Rightarrow P(F \\le c) = ${(1 - p).toFixed(4)} \\\\ c &\\approx ${jStat.centralF.inv(1 - p, v1, v2).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_exterior') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 > F > c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.centralF.inv(p / 2, v1, v2).toFixed(4)} \\\\ c_2 &\\approx ${jStat.centralF.inv(1 - p / 2, v1, v2).toFixed(4)} \\end{aligned}`;
        } else if (tipo === 'inversa_entre') {
            const p = condicion.valP;
            alignedStr = `\\begin{aligned} P(c_1 \\le F \\le c_2) &= ${p} \\\\ c_1 &\\approx ${jStat.centralF.inv((1-p)/2, v1, v2).toFixed(4)} \\\\ c_2 &\\approx ${jStat.centralF.inv(1 - (1-p)/2, v1, v2).toFixed(4)} \\end{aligned}`;
        }

        if (!alignedStr) return null;
        return (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center', fontSize: '0.95rem' }}>
                <span dangerouslySetInnerHTML={{ __html: injectZTooltip(katex.renderToString(alignedStr, { throwOnError: false, displayMode: false })) }} />
            </div>
        );
    };

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
            {(resultados.probabilidadFinal !== null || resultados.c !== undefined || resultados.c1 !== undefined) && (
                <div style={{ backgroundColor: 'var(--bg-input, #eff6ff)', padding: '6px 10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid var(--border-color, #bfdbfe)' }}>
                    {/* 1) Título */}
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #213547)', fontWeight: 'bold', marginBottom: '8px', marginTop:'2px' }}>
                        {resultados.c !== undefined || resultados.c1 !== undefined ? (
                            <>Valor Calculado {renderLatex('c')}</>
                        ) : (
                            <>Probabilidad Calculada {renderLatex(modelo === 'NormalEstandar' ? 'P(Z)' : (modelo === 'ChiCuadrado' ? 'P(\\chi^2)' : (modelo === 'FFisher' ? 'P(F)' : (modelo === 'TStudent' ? 'P(T)' : 'P(X)'))))}</>
                        )}
                    </div>

                    {/* 2) Resolución en el medio (solo Normal) */}
                    {modelo === 'Normal' && condicion && params && condicion.tipo && renderResolucionNormal()}
                    {modelo === 'NormalEstandar' && condicion && params && condicion.tipo && renderResolucionNormalEstandar()}
                    {modelo === 'ChiCuadrado' && condicion && params && condicion.tipo && renderResolucionChiCuadrado()}
                    {modelo === 'FFisher' && condicion && params && condicion.tipo && renderResolucionFFisher()}

                    {/* 3) Valor / porcentaje al final */}
                    <div style={{ marginTop: (modelo === 'Normal' || modelo === 'NormalEstandar' || modelo === 'ChiCuadrado' || modelo === 'FFisher') && condicion && params && condicion.tipo ? '6px' : '0' }}>
                        {resultados.c1 !== undefined && resultados.c2 !== undefined ? (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                <div style={{ fontSize: '1.5rem', color: 'var(--text-main, #213547)', fontWeight: 800 }}>
                                    <span style={{ fontSize: '1rem', marginRight: '5px' }}>c₁ =</span>{formatNum(resultados.c1)}
                                </div>
                                <div style={{ fontSize: '1.5rem', color: 'var(--text-main, #213547)', fontWeight: 800 }}>
                                    <span style={{ fontSize: '1rem', marginRight: '5px' }}>c₂ =</span>{formatNum(resultados.c2)}
                                </div>
                            </div>
                        ) : resultados.c !== undefined ? (
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-main, #213547)', fontWeight: 800 }}>
                                <span style={{ fontSize: '1rem', marginRight: '5px' }}>c =</span>{formatNum(resultados.c)}
                            </div>
                        ) : (
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-main, #213547)', fontWeight: 800 }}>
                                {typeof resultados.probabilidadFinal === 'number' ? resultados.probabilidadFinal.toFixed(4) : '-'} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted, #475569)', fontWeight: 600 }}>({(resultados.probabilidadFinal * 100).toFixed(2)}%)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Esperanza {renderLatex('E(X)')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #213547)', fontWeight: 700 }}>
                        {formatNum(resultados.esperanza)}
                    </div>
                    {formulasEsperanza.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-card, #ffffff)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color, #cbd5e1)' }}>
                            {formulasEsperanza.map((form, idx) => (
                                <div key={idx} style={{ color: 'var(--text-main, #213547)', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Varianza {renderLatex('V(X)')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #213547)', fontWeight: 700 }}>
                        {formatNum(resultados.varianza)}
                    </div>
                    {formulasVarianza.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-card, #ffffff)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color, #cbd5e1)' }}>
                            {formulasVarianza.map((form, idx) => (
                                <div key={idx} style={{ color: 'var(--text-main, #213547)', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Desviación {renderLatex('\\sigma')}</div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #213547)', fontWeight: 700 }}>
                        {formatNum(resultados.desviacion !== undefined ? resultados.desviacion : Math.sqrt(resultados.varianza))}
                    </div>
                    {formulasDesviacion.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-card, #ffffff)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color, #cbd5e1)' }}>
                            {formulasDesviacion.map((form, idx) => (
                                <div key={idx} style={{ color: 'var(--text-main, #213547)', fontWeight: 500 }}>{renderLatex(form)}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

