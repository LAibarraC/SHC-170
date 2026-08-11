import React from 'react';
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
                style={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }} 
            />
        </foreignObject>
    );
};

const SmartAnnotation = (props) => {
    const { viewBox, value } = props;
    if (!viewBox || viewBox.x === undefined || viewBox.y === undefined) return null;

    const cx = viewBox.x;
    const cy = viewBox.y;

    // Decisión verdaderamente inteligente basada en los píxeles reales del SVG
    // Si está muy a la derecha (ej. > 450px), lo mandamos a la izquierda para que no se corte
    const toRight = cx < 400;

    const diagLen = 35;
    const midX = toRight ? cx + diagLen : cx - diagLen;
    let midY = cy - diagLen;

    // Si el texto se va a salir por el techo del gráfico, invertimos la diagonal hacia abajo
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
                stroke="#3b82f6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={cx} cy={cy} r={5} fill="#3b82f6" />

            <foreignObject x={boxX} y={boxY} width={boxWidth} height={boxHeight} style={{ overflow: 'visible' }}>
                <div style={{
                    color: '#1e293b',
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

const getOperador = (tipo) => {
    switch (tipo) {
        case 'mayor':
        case 'mayor_igual': 
        case 'mayor_estricto': return '\\boldsymbol{\\ge}';
        case 'menor':
        case 'menor_igual': 
        case 'menor_estricto': return '\\boldsymbol{\\le}';
        default: return '\\boldsymbol{=}';
    }
};

export default function GraficoModelosContinuos({ datos, condicion, resultados }) {
    if (!datos || datos.length === 0) return null;

    // --- Calcular los valores exactos que queremos mostrar en el eje X ---
    const customTicks = [];
    
    // 1. Encontrar el centro (la media en la Normal)
    let peakX = 0;
    let max_y = -1;
    datos.forEach(d => {
        if(d.y > max_y) { max_y = d.y; peakX = d.x; }
    });
    
    // Generar ticks estándar para no perder los números base del eje X
    const minX = datos[0].x;
    const maxX = datos[datos.length - 1].x;
    const estimatedSigma = (maxX - minX) / 8; // El dominio en la normal es approx mu +/- 4 sigma
    
    if (estimatedSigma > 0) {
        for (let i = -4; i <= 4; i++) {
            // Redondeamos ligeramente para evitar problemas de precisión en javascript
            const tickEstandar = Math.round((peakX + i * estimatedSigma) * 10000) / 10000;
            customTicks.push(tickEstandar);
        }
    } else {
        customTicks.push(minX, peakX, maxX);
    }

    // 2. Extraer todos los valores límite de las condiciones
    if (condicion && condicion.tipo) {
        const valX = condicion.valX !== undefined ? condicion.valX : condicion.valorX;
        const valX2 = condicion.valX2 !== undefined ? condicion.valX2 : condicion.valorB;
        if (valX !== undefined) customTicks.push(Number(valX));
        if (valX2 !== undefined && ['entre', 'intervalo', 'exterior'].includes(condicion.tipo)) {
            customTicks.push(Number(valX2));
        }
        if (condicion.tipo === 'suma_intervalos' && condicion.intervals) {
            condicion.intervals.forEach(i => {
                if (i.min !== undefined && i.min !== '') customTicks.push(Number(i.min));
                if (i.max !== undefined && i.max !== '') customTicks.push(Number(i.max));
            });
        }
    }
    
    // 3. Extraer resultados de inversas
    if (resultados) {
        if (resultados.c !== undefined) customTicks.push(resultados.c);
        if (resultados.c1 !== undefined) customTicks.push(resultados.c1);
        if (resultados.c2 !== undefined) customTicks.push(resultados.c2);
    }

    // Filtrar duplicados y ordenar de menor a mayor
    const finalTicks = [...new Set(customTicks)].sort((a,b) => a - b);

    // Calcular puntero inteligente para el porcentaje
    const annotationData = React.useMemo(() => {
        if (!resultados || resultados.probabilidadFinal === undefined || resultados.probabilidadFinal === null || resultados.probabilidadFinal <= 0) return null;
        
        const p = resultados.probabilidadFinal;

        const puntosSombreados = datos.filter(d => d.fillY > 0);
        if (puntosSombreados.length === 0) return null;
        
        const segments = [];
        let cur = [];
        for (let i = 0; i < datos.length; i++) {
            if (datos[i].fillY > 0) cur.push(datos[i]);
            else if (cur.length > 0) { segments.push(cur); cur = []; }
        }
        if (cur.length > 0) segments.push(cur);

        if (segments.length === 0) return null;

        segments.sort((a, b) => b.length - a.length);
        const bestSegment = segments[0];

        // Calcular el Centro de Masa (Centroide) matemático del área sombreada
        let sumXY = 0;
        let sumY = 0;
        for (let pt of bestSegment) {
            sumXY += pt.x * pt.fillY;
            sumY += pt.fillY;
        }
        const centroidX = sumY > 0 ? sumXY / sumY : bestSegment[Math.floor(bestSegment.length / 2)].x;

        // Encontrar la altura (Y) correspondiente a ese punto X exacto
        let closestY = 0;
        let minDiff = Infinity;
        for (let pt of bestSegment) {
            const diff = Math.abs(pt.x - centroidX);
            if (diff < minDiff) {
                minDiff = diff;
                closestY = pt.fillY;
            }
        }

        // Lo colocamos a la mitad de la altura de la curva en ese punto X
        // para que quede centrado verticalmente dentro de la "montaña", igual que en el Tema 2
        const yDot = Math.max(closestY / 2, 0.00001);

        return {
            x: centroidX,
            y: yDot,
            text: `${(p * 100).toFixed(2)}%`
        };
    }, [datos, resultados]);

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px" id="grafico-area-tema3">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datos} margin={{ top: 45, right: 30, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            
                                <XAxis 
                                    dataKey="x" 
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    ticks={finalTicks}
                                    padding={{ left: 20, right: 20 }}
                                    tick={{ fill: '#333333', fontSize: 12, fontWeight: 600 }}
                                    axisLine={{ stroke: '#333333', strokeWidth: 2 }}
                                    tickLine={{ stroke: '#333333', strokeWidth: 2 }}
                                    tickFormatter={(val) => Number.isInteger(val) ? val.toString() : val.toFixed(2)}
                                    label={{ value: 'Valor (x)', position: 'insideBottom', offset: -10, fill: '#333333', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                                />
                            
                            <YAxis 
                                padding={{ top: 30 }}
                                tick={{ fill: '#333333', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: '#333333', strokeWidth: 2 }}
                                tickLine={{ stroke: '#333333', strokeWidth: 2 }}
                                tickFormatter={(val) => Number.isInteger(val) ? val.toString() : val.toFixed(2)}
                                label={{ value: 'Densidad f(x)', angle: -90, position: 'insideLeft', offset: 15, fill: '#333333', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />
                            
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value, name) => [value.toFixed(6), name === 'y' ? 'f(x)' : 'P']}
                                labelFormatter={(label) => `x = ${Number(label).toFixed(4)}`}
                            />
                            
                            <Area 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#3b82f6" 
                                fill="transparent"
                                strokeWidth={3}
                                isAnimationActive={false}
                            />
                            
                            {condicion && (
                                <Area 
                                    type="monotone" 
                                    dataKey="fillY" 
                                    stroke="none" 
                                    fill="rgba(59, 130, 246, 0.4)" 
                                    isAnimationActive={false}
                                />
                            )}

                            {(() => {
                                if (!condicion || !condicion.tipo) return null;
                                const tipo = condicion.tipo;
                                const refs = [];
                                
                                const valX = condicion.valX !== undefined ? condicion.valX : condicion.valorX;
                                const valX2 = condicion.valX2 !== undefined ? condicion.valX2 : condicion.valorB;

                                const umbralChoque = (maxX - minX) * 0.15;

                                if (tipo === 'menor' || tipo === 'menor_igual' || tipo === 'mayor' || tipo === 'mayor_igual') {
                                    if (valX !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="line1" x={valX} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\mathbf{X} ${getOperador(tipo)} ${valX}`} />} />
                                        );
                                    }
                                } else if (tipo === 'entre' || tipo === 'intervalo' || tipo === 'exterior') {
                                    if (valX !== undefined && valX2 !== undefined) {
                                        const choque = Math.abs(valX2 - valX) < umbralChoque;
                                        refs.push(
                                            <ReferenceLine key="line1" x={valX} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`X_1 = ${valX}`} offsetY={choque ? -5 : 0} offsetX={choque ? -15 : 0} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="line2" x={valX2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`X_2 = ${valX2}`} offsetY={choque ? -25 : 0} offsetX={choque ? 15 : 0} />} />
                                        );
                                    }
                                } else if (tipo === 'suma_intervalos' && condicion.intervals) {
                                    condicion.intervals.forEach((intv, idx) => {
                                        const min = parseFloat(intv.min);
                                        const max = parseFloat(intv.max);
                                        if (!isNaN(min) && !isNaN(max)) {
                                            const choque = Math.abs(max - min) < umbralChoque;
                                            refs.push(<ReferenceLine key={`min-${idx}`} x={min} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`x_{${idx*2+1}}`} offsetY={choque ? -5 : 0} offsetX={choque ? -15 : 0} />} />);
                                            refs.push(<ReferenceLine key={`max-${idx}`} x={max} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`x_{${idx*2+2}}`} offsetY={choque ? -25 : 0} offsetX={choque ? 15 : 0} />} />);
                                        }
                                    });
                                } else if (tipo === 'inversa_menor' || tipo === 'inversa_mayor') {
                                    if (resultados?.c !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="lineC" x={resultados.c} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c = ${resultados.c.toFixed(4)}`} />} />
                                        );
                                    }
                                } else if (tipo === 'inversa_exterior' || tipo === 'inversa_entre') {
                                    if (resultados?.c1 !== undefined && resultados?.c2 !== undefined) {
                                        const choque = Math.abs(resultados.c2 - resultados.c1) < umbralChoque;
                                        refs.push(
                                            <ReferenceLine key="lineC1" x={resultados.c1} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c_1 = ${resultados.c1.toFixed(4)}`} offsetY={choque ? -5 : 0} offsetX={choque ? -15 : 0} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="lineC2" x={resultados.c2} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c_2 = ${resultados.c2.toFixed(4)}`} offsetY={choque ? -25 : 0} offsetX={choque ? 15 : 0} />} />
                                        );
                                    }
                                }
                                return refs;
                            })()}
                            
                            {annotationData && (
                                <ReferenceDot 
                                    x={annotationData.x} 
                                    y={annotationData.y} 
                                    r={0} 
                                    label={<SmartAnnotation value={annotationData.text} />} 
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MarcoWidgetMAT251>
    );
}
