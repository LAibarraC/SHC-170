import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts';
import { jStat } from 'jstat';
import MarcoWidgetMAT251 from '../../ui/MarcoWidgetMAT251';

const CustomKatexLabel = (props) => {
    const { viewBox, value, offsetY = 0, offsetX = 0 } = props;
    if (!viewBox) return null;
    const { x, y } = viewBox;
    
    return (
        <foreignObject x={x - 50 + offsetX} y={y - 30 + offsetY} width={100} height={30} style={{ overflow: 'visible' }}>
            <div 
                dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false }) }} 
                style={{ color: 'var(--text-main, #1e293b)', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }} 
            />
        </foreignObject>
    );
};

const SmartAnnotation = (props) => {
    const { viewBox, value } = props;
    if (!viewBox || viewBox.x === undefined || viewBox.y === undefined) return null;

    const cx = viewBox.x;
    const cy = viewBox.y;

    const toRight = cx < 400;

    const diagLen = 35;
    const midX = toRight ? cx + diagLen : cx - diagLen;
    let midY = cy - diagLen;

    if (midY < 20) {
        midY = cy + diagLen;
    }

    const escapeX = toRight ? 60 : -60;
    const horizLen = Math.max(20, Math.abs(escapeX) - diagLen);
    const lineEndX = toRight ? midX + horizLen : midX - horizLen;
    const lineEndY = midY;

    const boxWidth = 90;
    const boxHeight = 28;
    const boxX = toRight ? lineEndX : lineEndX - boxWidth;
    const boxY = lineEndY - (boxHeight / 2);

    return (
        <g style={{ pointerEvents: 'none' }}>
            <path
                d={`M ${cx},${cy} L ${midX},${midY} L ${lineEndX},${lineEndY}`}
                fill="none"
                stroke="var(--text-main, #3b82f6)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={cx} cy={cy} r={5} fill="var(--text-main, #3b82f6)" />

            <foreignObject x={boxX} y={boxY} width={boxWidth} height={boxHeight} style={{ overflow: 'visible' }}>
                <div style={{
                    color: 'var(--text-main, #1e293b)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: toRight ? 'flex-start' : 'flex-end',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    height: '100%',
                }}>
                    {value}
                </div>
            </foreignObject>
        </g>
    );
};

export default function GraficoFisher({ resultados }) {
    if (!resultados || resultados.v1 === undefined) return null;

    const { v1, v2, varPob1, varPob2, x1, x2, condicion, probFinal } = resultados;
    const tieneProbabilidad = probFinal !== undefined;

    const { datosGrafico, annotationData } = useMemo(() => {
        
        let targetMaxR = 5;
        if (tieneProbabilidad) {
            if (condicion === 'menor_que' || condicion === 'mayor_que') {
                targetMaxR = Math.max(targetMaxR, x1 * 1.5);
            } else if (condicion === 'entre') {
                targetMaxR = Math.max(targetMaxR, x2 * 1.5);
            }
        }
        
        const razonVarPobInv = varPob1 / varPob2; // R = F * (varPob1 / varPob2)
        const targetMaxF = targetMaxR / razonVarPobInv;
        
        // Determinar maxF real para la gráfica
        const meanF = v2 > 2 ? v2 / (v2 - 2) : 2;
        const sdF = v2 > 4 ? Math.sqrt( (2 * v2 * v2 * (v1 + v2 - 2)) / (v1 * (v2 - 2) * (v2 - 2) * (v2 - 4)) ) : 2;
        
        const graphMaxF = Math.max(targetMaxF, meanF + 4 * sdF, 5);

        const puntos = [];
        const numPuntos = 200;
        const paso = graphMaxF / numPuntos;

        let fillStart = -1;
        let fillEnd = -1;
        if (tieneProbabilidad) {
            if (condicion === 'menor_que') {
                fillStart = 0;
                fillEnd = x1;
            } else if (condicion === 'mayor_que') {
                fillStart = x1;
                fillEnd = targetMaxR * 10;
            } else if (condicion === 'entre') {
                fillStart = x1;
                fillEnd = x2;
            }
        }

        for (let i = 0; i <= numPuntos; i++) {
            // F value starts slightly above 0 to avoid Infinity in pdf for some v1, v2 combinations
            const FValue = i === 0 ? 0.0001 : i * paso;
            const RVal = FValue * razonVarPobInv; // R = S1^2 / S2^2
            const pdf = jStat.centralF.pdf(FValue, v1, v2);

            let fillY = 0;
            if (tieneProbabilidad && RVal >= fillStart && RVal <= fillEnd) {
                fillY = pdf;
            }

            puntos.push({
                x: RVal,
                FValue: FValue,
                y: pdf,
                fillY: fillY
            });
        }

        const annData = [];
        if (tieneProbabilidad) {
            const filledSegments = [];
            let currentSeg = [];
            for (let pt of puntos) {
                if (pt.fillY > 0) {
                    currentSeg.push(pt);
                } else if (currentSeg.length > 0) {
                    filledSegments.push(currentSeg);
                    currentSeg = [];
                }
            }
            if (currentSeg.length > 0) filledSegments.push(currentSeg);

            filledSegments.forEach(seg => {
                let sumX = 0, sumY = 0;
                seg.forEach(pt => { sumX += pt.x; sumY += pt.fillY; });
                const centroidX = sumX / seg.length;
                
                let closestY = 0;
                let minDiff = Infinity;
                for (let pt of seg) {
                    const diff = Math.abs(pt.x - centroidX);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestY = pt.fillY;
                    }
                }
                const yDot = Math.max(closestY / 2, 0.00001);

                annData.push({
                    x: centroidX,
                    y: yDot,
                    text: `${(probFinal * 100).toFixed(2)}%`
                });
            });
        }

        return { datosGrafico: puntos, annotationData: annData };
    }, [v1, v2, varPob1, varPob2, x1, x2, condicion, probFinal, tieneProbabilidad]);

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x) [Fisher]" anchoCompleto={true} alto="450px" id="grafico-fisher">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datosGrafico} margin={{ top: 45, right: 30, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            
                            <XAxis 
                                dataKey="x" 
                                type="number" 
                                domain={['dataMin', 'dataMax']}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fill: 'var(--text-main, #333333)', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickFormatter={(val) => Number.isInteger(val) ? val : val.toFixed(2)}
                                label={{ value: 'Razón de Varianzas Muestrales (S₁² / S₂²)', position: 'insideBottom', offset: -10, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />
                            
                            <YAxis 
                                hide
                                domain={[0, 'auto']}
                            />
                            
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value, name) => [value.toFixed(5), name === 'y' ? 'f(x)' : 'Área']}
                                labelFormatter={(label) => `S₁²/S₂² = ${label.toFixed(4)}`}
                            />

                            <Area 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fill="transparent" 
                                isAnimationActive={false}
                            />

                            {tieneProbabilidad && (
                                <Area 
                                    type="monotone" 
                                    dataKey="fillY" 
                                    stroke="none" 
                                    fill="rgba(59, 130, 246, 0.4)" 
                                    isAnimationActive={false}
                                />
                            )}

                            {/* Reference Lines para Cortes */}
                            {tieneProbabilidad && condicion === 'entre' && (
                                <>
                                    <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{x_1 = ${x1}}`} offsetY={-10} />} />
                                    <ReferenceLine x={x2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{x_2 = ${x2}}`} offsetY={-10} />} />
                                </>
                            )}
                            {tieneProbabilidad && (condicion === 'menor_que' || condicion === 'mayor_que') && (
                                <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{x = ${x1}}`} offsetY={-10} />} />
                            )}

                            {/* Anotaciones */}
                            {tieneProbabilidad && annotationData.map((ann, idx) => (
                                <ReferenceDot 
                                    key={idx} 
                                    x={ann.x} 
                                    y={ann.y} 
                                    r={0} 
                                    label={<SmartAnnotation value={ann.text} />} 
                                />
                            ))}

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MarcoWidgetMAT251>
    );
}
