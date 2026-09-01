import React from 'react';
import '../../../styles/Temas/Tema3.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { IconoProcedimiento } from '../../../ui/Iconos';

export default function Resultados_ModelosDiscretos({ resultados, modelo, params, condicion, onOpenProcedimiento }) {
    if (!resultados) return null;

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const formatSmart = (num, minDecimals = 2, maxDecimals = 10) => {
        if (typeof num !== 'number' || isNaN(num)) return '-';
        if (num === 0) return (0).toFixed(minDecimals);
        
        if (Number.isInteger(num) && minDecimals === 2) return num.toString();

        const absNum = Math.abs(num);
        let zeros = -Math.floor(Math.log10(absNum));
        
        if (zeros <= minDecimals - 1) {
            return num.toFixed(minDecimals);
        }
        
        let decimalPlaces = zeros + 1;
        if (decimalPlaces > maxDecimals) decimalPlaces = maxDecimals;
        
        return num.toFixed(decimalPlaces);
    };

    const renderResolucionDiscreta = () => {
        if (!condicion || !params || !condicion.tipo) return null;
        
        let alignedStr = '';
        const { tipo, valorX, valorB } = condicion;
        const pFinal = typeof resultados.probabilidadFinal === 'number' ? formatSmart(resultados.probabilidadFinal, 4) : resultados.probabilidadFinal;

        const getFormulaX = (x) => {
            if (modelo === 'Bernoulli') {
                return `(${params.p})^{${x}}(1 - ${params.p})^{1 - ${x}}`;
            } else if (modelo === 'Binomial') {
                return `\\binom{${params.n}}{${x}}(${params.p})^{${x}}(1 - ${params.p})^{${params.n} - ${x}}`;
            } else if (modelo === 'Poisson') {
                return `\\frac{e^{-${params.lambda}} ${params.lambda}^{${x}}}{${x}!}`;
            } else if (modelo === 'Hipergeometrica') {
                return `\\frac{\\binom{${params.K}}{${x}} \\binom{${params.N} - ${params.K}}{${params.n} - ${x}}}{\\binom{${params.N}}{${params.n}}}`;
            }
            return '';
        };

        if (tipo === 'exacta') {
            alignedStr = `\\begin{aligned} P(X = ${valorX}) &= ${getFormulaX(valorX)} \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'menor_igual') {
            alignedStr = `\\begin{aligned} P(X \\le ${valorX}) &= \\sum_{x=0}^{${valorX}} P(X=x) \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'mayor_igual') {
            alignedStr = `\\begin{aligned} P(X \\ge ${valorX}) &= 1 - P(X \\le ${valorX - 1}) \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'menor_estricto') {
            alignedStr = `\\begin{aligned} P(X < ${valorX}) &= P(X \\le ${valorX - 1}) \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'mayor_estricto') {
            alignedStr = `\\begin{aligned} P(X > ${valorX}) &= 1 - P(X \\le ${valorX}) \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'intervalo') {
            alignedStr = `\\begin{aligned} P(${valorX} \\le X \\le ${valorB}) &= \\sum_{x=${valorX}}^{${valorB}} P(X=x) \\\\ &= ${pFinal} \\end{aligned}`;
        } else if (tipo === 'intervalo_estricto') {
            alignedStr = `\\begin{aligned} P(${valorX} < X < ${valorB}) &= P(${valorX + 1} \\le X \\le ${valorB - 1}) \\\\ &= ${pFinal} \\end{aligned}`;
        }

        return (
            <div style={{ color: 'var(--text-main, #334155)', fontSize: '1rem', margin: '10px 0', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                {renderLatex(alignedStr)}
            </div>
        );
    };

    let formulaEsperanza = "";
    let formulaVarianza = "";
    let formulaDesviacion = "";
    
    let tooltipEsperanza = "";
    let tooltipVarianza = "";
    let tooltipDesviacion = "";
    
    if (params) {
        const vFormatted = resultados && typeof resultados.varianza === 'number' ? formatSmart(resultados.varianza, 2) : '';
        if (modelo === 'Bernoulli') {
            formulaEsperanza = `E(X) = ${params.p}`;
            formulaVarianza = `V(X) = ${params.p}(1 - ${params.p})`;
            formulaDesviacion = `\\sigma = \\sqrt{${vFormatted}}`;
            
            tooltipEsperanza = `E(X) = p`;
            tooltipVarianza = `V(X) = p(1 - p)`;
            tooltipDesviacion = `\\sigma = \\sqrt{V(X)}`;
        } else if (modelo === 'Binomial') {
            formulaEsperanza = `E(X) = ${params.n} \\cdot ${params.p}`;
            formulaVarianza = `V(X) = ${params.n} \\cdot ${params.p}(1 - ${params.p})`;
            formulaDesviacion = `\\sigma = \\sqrt{${vFormatted}}`;
            
            tooltipEsperanza = `E(X) = n \\cdot p`;
            tooltipVarianza = `V(X) = n \\cdot p(1 - p)`;
            tooltipDesviacion = `\\sigma = \\sqrt{V(X)}`;
        } else if (modelo === 'Poisson') {
            formulaEsperanza = `E(X) = ${params.lambda}`;
            formulaVarianza = `V(X) = ${params.lambda}`;
            formulaDesviacion = `\\sigma = \\sqrt{${params.lambda}}`;
            
            tooltipEsperanza = `E(X) = \\lambda`;
            tooltipVarianza = `V(X) = \\lambda`;
            tooltipDesviacion = `\\sigma = \\sqrt{\\lambda}`;
        } else if (modelo === 'Hipergeometrica') {
            formulaEsperanza = `E(X) = ${params.n} \\cdot \\frac{${params.K}}{${params.N}}`;
            formulaVarianza = `V(X) = ${params.n} \\cdot \\frac{${params.K}}{${params.N}} \\left(1 - \\frac{${params.K}}{${params.N}}\\right) \\frac{${params.N} - ${params.n}}{${params.N} - 1}`;
            formulaDesviacion = `\\sigma = \\sqrt{${vFormatted}}`;
            
            tooltipEsperanza = `E(X) = n \\cdot \\frac{K}{N}`;
            tooltipVarianza = `V(X) = n \\cdot \\frac{K}{N} \\left(1 - \\frac{K}{N}\\right) \\frac{N - n}{N - 1}`;
            tooltipDesviacion = `\\sigma = \\sqrt{V(X)}`;
        }
    }

    return (
        <div className="tema3-card" style={{ marginTop: '20px' }}>


            <div style={{ backgroundColor: 'var(--bg-input, #eff6ff)', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid var(--border-color, #bfdbfe)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', fontWeight: 600 }}>Probabilidad Calculada {renderLatex('P(X)')}</div>
                </div>

                {renderResolucionDiscreta()}

                <div style={{ fontSize: '1.5rem', color: 'var(--text-main, #0f172a)', fontWeight: 800 }}>
                    {formatSmart(resultados.probabilidadFinal, 4)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted, #475569)', fontWeight: 600 }}>({formatSmart(resultados.probabilidadFinal * 100, 2)}%)</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                            Esperanza{' '}
                            <span className="t3-tooltip-wrap" style={{ borderBottom: '1px dashed #94a3b8', cursor: 'help', paddingBottom: '1px' }}>
                                {renderLatex('E(X)')}
                                <div className="t3-tooltip-box">
                                    <div style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.9, fontWeight: 'normal' }}>Fórmula general:</div>
                                    <div className="t3-tooltip-math">{renderLatex(tooltipEsperanza)}</div>
                                </div>
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #334155)', fontWeight: 700 }}>
                        {formatSmart(resultados.esperanza, 2)}
                    </div>
                    {formulaEsperanza && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #0f172a)', marginTop: '6px', fontWeight: 500 }}>
                            {renderLatex(formulaEsperanza)}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                            Varianza{' '}
                            <span className="t3-tooltip-wrap" style={{ borderBottom: '1px dashed #94a3b8', cursor: 'help', paddingBottom: '1px' }}>
                                {renderLatex('V(X)')}
                                <div className="t3-tooltip-box">
                                    <div style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.9, fontWeight: 'normal' }}>Fórmula general:</div>
                                    <div className="t3-tooltip-math">{renderLatex(tooltipVarianza)}</div>
                                </div>
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #334155)', fontWeight: 700 }}>
                        {formatSmart(resultados.varianza, 2)}
                    </div>
                    {formulaVarianza && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #0f172a)', marginTop: '6px', fontWeight: 500 }}>
                            {renderLatex(formulaVarianza)}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, padding: '8px', background: 'var(--bg-input, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                            Desviación{' '}
                            <span className="t3-tooltip-wrap" style={{ borderBottom: '1px dashed #94a3b8', cursor: 'help', paddingBottom: '1px' }}>
                                {renderLatex('\\sigma')}
                                <div className="t3-tooltip-box">
                                    <div style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.9, fontWeight: 'normal' }}>Fórmula general:</div>
                                    <div className="t3-tooltip-math">{renderLatex(tooltipDesviacion)}</div>
                                </div>
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-main, #334155)', fontWeight: 700 }}>
                        {formatSmart(resultados.desviacion, 2)}
                    </div>
                    {formulaDesviacion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #0f172a)', marginTop: '6px', fontWeight: 500 }}>
                            {renderLatex(formulaDesviacion)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
