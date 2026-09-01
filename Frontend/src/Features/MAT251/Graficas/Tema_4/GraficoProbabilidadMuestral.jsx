import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts';
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

export default function GraficoProbabilidadMuestral({ resultados }) {
    if (!resultados || resultados.mu === undefined || resultados.SE === undefined) return null;

    const { SE, mu, x1, x2, condicion, probFinal } = resultados;
    const tieneProbabilidad = probFinal !== undefined;

    // Generación de datos
    const { datosGrafico, customTicks, annotationData } = useMemo(() => {
        const datos = [];
        const numPoints = 200;
        const minX = mu - 4 * SE;
        const maxX = mu + 4 * SE;
        const step = (maxX - minX) / numPoints;

        let curSegment = [];
        const segments = [];

        for (let i = 0; i <= numPoints; i++) {
            const x = minX + i * step;
            // PDF Normal
            const exponent = -0.5 * Math.pow((x - mu) / SE, 2);
            const y = (1 / (SE * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

            let fillY = 0;
            if (tieneProbabilidad) {
                if (condicion === 'menor_que' && x <= x1) {
                    fillY = y;
                } else if (condicion === 'mayor_que' && x >= x1) {
                    fillY = y;
                } else if (condicion === 'entre' && x >= x1 && x <= x2) {
                    fillY = y;
                }
            }

            datos.push({ x, y, fillY });

            if (fillY > 0) {
                curSegment.push({ x, fillY });
            } else if (curSegment.length > 0) {
                segments.push(curSegment);
                curSegment = [];
            }
        }
        if (curSegment.length > 0) segments.push(curSegment);

        // Custom Ticks para el eje X
        let ticks = [mu - 3*SE, mu - 2*SE, mu - SE, mu, mu + SE, mu + 2*SE, mu + 3*SE];
        if (tieneProbabilidad) {
            if (condicion === 'entre') {
                ticks.push(x1, x2);
            } else if (condicion) {
                ticks.push(x1);
            }
        }
        
        ticks = [...new Set(ticks.map(t => Math.round(t * 1000) / 1000))].sort((a, b) => a - b);

        // Annotation Data
        const annData = segments.map(seg => {
            let sumXY = 0;
            let sumY = 0;
            for (let pt of seg) {
                sumXY += pt.x * pt.fillY;
                sumY += pt.fillY;
            }
            const centroidX = sumY > 0 ? sumXY / sumY : seg[Math.floor(seg.length / 2)].x;

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

            return {
                x: centroidX,
                y: yDot,
                text: tieneProbabilidad ? `${(probFinal * 100).toFixed(2)}%` : ''
            };
        });

        return { datosGrafico: datos, customTicks: ticks, annotationData: annData };
    }, [mu, SE, x1, x2, condicion, probFinal, tieneProbabilidad]);

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px" id="grafico-normal-muestral">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datosGrafico} margin={{ top: 45, right: 30, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            
                            <XAxis 
                                dataKey="x" 
                                type="number" 
                                domain={['dataMin', 'dataMax']}
                                ticks={customTicks}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fill: 'var(--text-main, #333333)', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickFormatter={(val) => Number.isInteger(val) ? val : val.toFixed(1)}
                                label={{ value: 'Valor (x)', position: 'insideBottom', offset: -10, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />
                            
                            <YAxis 
                                padding={{ top: 30 }}
                                tick={{ fill: 'var(--text-main, #333333)', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickFormatter={(val) => val === 0 ? '0' : val.toFixed(3)}
                                label={{ value: 'Densidad f(x)', angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />
                            
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value, name) => [value.toFixed(5), name === 'y' ? 'f(x)' : 'Área']}
                                labelFormatter={(label) => `x = ${label.toFixed(4)}`}
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
                                    <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{X_1 = ${x1}}`} offsetY={-10} />} />
                                    <ReferenceLine x={x2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{X_2 = ${x2}}`} offsetY={-10} />} />
                                </>
                            )}
                            {tieneProbabilidad && (condicion === 'menor_que' || condicion === 'mayor_que') && (
                                <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{X = ${x1}}`} offsetY={-10} />} />
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
