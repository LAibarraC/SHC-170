import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts';
import { jStat } from 'jstat';
import MarcoWidgetMAT251 from '../../ui/MarcoWidgetMAT251';
import { cardStyle, FS, RADIUS } from '../../Principal/Constantes';

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

export default function GraficoChiCuadrada({ resultados }) {
    if (!resultados || resultados.k === undefined) return null;

    const { k, varPob, x1, x2, condicion, probFinal } = resultados;
    const tieneProbabilidad = probFinal !== undefined;

    const formatLatexNum = (num) => {
        return num.toLocaleString('es-ES', { maximumFractionDigits: 4 }).replace(',', '{,}');
    };

    const { datosGrafico, annotationData } = useMemo(() => {
        // Rango del eje X para la Chi-Cuadrada
        const mean = k;
        const sd = Math.sqrt(2 * k);
        const maxVal = Math.max(mean + 4 * sd, 20); 
        
        const puntos = [];
        const numPuntos = 200;
        const paso = maxVal / numPuntos;

        // Límites
        let fillStart = -1;
        let fillEnd = -1;
        if (tieneProbabilidad) {
            if (condicion === 'menor_que') {
                fillStart = 0;
                fillEnd = x1;
            } else if (condicion === 'mayor_que') {
                fillStart = x1;
                fillEnd = maxVal * 2; // Suficiente
            } else if (condicion === 'entre') {
                fillStart = x1;
                fillEnd = x2;
            }
        }

        for (let i = 0; i <= numPuntos; i++) {
            const chiValue = i * paso;
            const xVal = (chiValue * varPob) / k;
            const pdf = jStat.chisquare.pdf(chiValue, k);

            let fillY = 0;
            if (tieneProbabilidad && xVal >= fillStart && xVal <= fillEnd) {
                fillY = pdf;
            }

            puntos.push({
                x: xVal,
                chiValue: chiValue,
                y: pdf,
                fillY: fillY
            });
        }

        // Calcular centroide para la anotación del área
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
    }, [k, varPob, x1, x2, condicion, probFinal, tieneProbabilidad]);

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px" id="grafico-chi-cuadrada">
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
                                tickFormatter={(val) => Number.isInteger(val) ? val : val.toFixed(1)}
                                label={{ value: 'Varianza Muestral (S²)', position: 'insideBottom', offset: -10, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />
                            
                            <YAxis 
                                hide
                                domain={[0, 'auto']}
                            />
                            
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value, name) => [value.toFixed(5), name === 'y' ? 'f(x)' : 'Área']}
                                labelFormatter={(label) => `S² = ${label.toFixed(4)}`}
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
                                    <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{S_1^2 = ${x1}}`} offsetY={-10} />} />
                                    <ReferenceLine x={x2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{S_2^2 = ${x2}}`} offsetY={-10} />} />
                                </>
                            )}
                            {tieneProbabilidad && (condicion === 'menor_que' || condicion === 'mayor_que') && (
                                <ReferenceLine x={x1} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3} label={<CustomKatexLabel value={`\\boldsymbol{S^2 = ${x1}}`} offsetY={-10} />} />
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
