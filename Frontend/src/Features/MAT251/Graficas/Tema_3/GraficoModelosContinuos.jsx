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

export default function GraficoModelosContinuos({ datos, condicion, resultados, modelo }) {
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
    
    if (modelo === 'Uniforme') {
        const puntosMayorCero = datos.filter(d => d.y > 0);
        if (puntosMayorCero.length > 0) {
            const a = puntosMayorCero[0].x;
            const b = puntosMayorCero[puntosMayorCero.length - 1].x;
            customTicks.push(a);
            customTicks.push(b);
            
            const rango = b - a;
            if (rango > 0) {
                const paso = rango / 5;
                for (let i = 1; i <= 4; i++) {
                    customTicks.push(Math.round((a + i * paso) * 10000) / 10000);
                }
            }
        }
    } else if (modelo === 'ChiCuadrado' || modelo === 'FFisher') {
        const rango = maxX - minX;
        const paso = rango / 8;
        for (let i = 0; i <= 8; i++) {
            const tickEstandar = Math.round((minX + i * paso) * 10000) / 10000;
            if (tickEstandar >= 0) customTicks.push(tickEstandar);
        }
    } else {
        if (estimatedSigma > 0) {
            for (let i = -4; i <= 4; i++) {
                // Redondeamos ligeramente para evitar problemas de precisión en javascript
                const tickEstandar = Math.round((peakX + i * estimatedSigma) * 10000) / 10000;
                customTicks.push(tickEstandar);
            }
        } else {
            customTicks.push(minX, peakX, maxX);
        }
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

    // Calcular punteros inteligentes para los porcentajes de cada región
    const annotationDataArray = React.useMemo(() => {
        if (!resultados || resultados.probabilidadFinal === undefined || resultados.probabilidadFinal === null || resultados.probabilidadFinal <= 0) return [];
        
        const pTotal = resultados.probabilidadFinal;

        const puntosSombreados = datos.filter(d => d.fillY > 0);
        if (puntosSombreados.length === 0) return [];
        
        const segments = [];
        let cur = [];
        for (let i = 0; i < datos.length; i++) {
            if (datos[i].fillY > 0) cur.push(datos[i]);
            else if (cur.length > 0) { segments.push(cur); cur = []; }
        }
        if (cur.length > 0) segments.push(cur);

        if (segments.length === 0) return [];

        const calculateArea = (seg) => {
            let area = 0;
            for (let i = 1; i < seg.length; i++) {
                area += ((seg[i].fillY + seg[i-1].fillY) / 2) * (seg[i].x - seg[i-1].x);
            }
            return Math.max(area, 0);
        };

        const totalArea = segments.reduce((sum, seg) => sum + calculateArea(seg), 0);

        return segments.map(seg => {
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

            let segProb = pTotal;
            if (totalArea > 0 && segments.length > 1) {
                segProb = (calculateArea(seg) / totalArea) * pTotal;
            }

            return {
                x: centroidX,
                y: yDot,
                text: `${(segProb * 100).toFixed(2)}%`
            };
        });
    }, [datos, resultados]);

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px" id="grafico-area-tema3">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', position: 'relative' }}>
                    {condicion && (condicion.tipo === 'exterior' || condicion.tipo === 'suma_intervalos' || condicion.tipo === 'inversa_exterior') && resultados?.probabilidadFinal > 0 && (
                        <div style={{ position: 'absolute', top: '15px', right: '25px', fontWeight: 'bold', fontSize: '13px', color: '#334155', background: '#ffffff', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            Total: {(resultados.probabilidadFinal * 100).toFixed(2)}%
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datos} margin={{ top: 45, right: 30, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            
                                <XAxis 
                                    dataKey="x" 
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    ticks={finalTicks}
                                    padding={{ left: 20, right: 20 }}
                                    tick={{ fill: 'var(--text-main, #333333)', fontSize: 12, fontWeight: 600 }}
                                    axisLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                    tickLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                    tickFormatter={(val) => {
                                        if (val === 0) return '0';
                                        if (Math.abs(val) < 0.001) return val.toExponential(2);
                                        return parseFloat(val.toFixed(2)).toString();
                                    }}
                                    label={{ value: modelo === 'NormalEstandar' ? 'Valor (z)' : (modelo === 'ChiCuadrado' ? 'Valor (χ²)' : (modelo === 'FFisher' ? 'Valor (F)' : (modelo === 'TStudent' ? 'Valor (t)' : 'Valor (x)'))), position: 'insideBottom', offset: -10, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                                />
                            
                            <YAxis 
                                padding={{ top: 30 }}
                                tick={{ fill: 'var(--text-main, #333333)', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickLine={{ stroke: 'var(--text-main, #333333)', strokeWidth: 2 }}
                                tickFormatter={(val) => {
                                    if (val === 0) return '0';
                                    if (Math.abs(val) < 0.001) return val.toExponential(2);
                                    return parseFloat(val.toFixed(4)).toString();
                                }}
                                label={{ value: 'Densidad f(x)', angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--text-main, #333333)', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
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
                                                label={<CustomKatexLabel value={`\\boldsymbol{${modelo === 'NormalEstandar' ? 'Z' : (modelo === 'ChiCuadrado' ? '\\chi^2' : (modelo === 'FFisher' ? 'F' : (modelo === 'TStudent' ? 'T' : 'X')))} ${getOperador(tipo)} ${valX}}`} />} />
                                        );
                                    }
                                } else if (tipo === 'entre' || tipo === 'intervalo' || tipo === 'exterior') {
                                    if (valX !== undefined && valX2 !== undefined) {
                                        let offX1 = 0; let offX2 = 0;
                                        if (Math.abs(valX2 - valX) < umbralChoque) { offX1 = -45; offX2 = 45; }
                                        refs.push(
                                            <ReferenceLine key="line1" x={valX} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\boldsymbol{${modelo === 'NormalEstandar' ? 'Z' : (modelo === 'ChiCuadrado' ? '\\chi^2' : (modelo === 'FFisher' ? 'F' : (modelo === 'TStudent' ? 'T' : 'X')))}_1 = ${valX}}`} offsetX={offX1} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="line2" x={valX2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\boldsymbol{${modelo === 'NormalEstandar' ? 'Z' : (modelo === 'ChiCuadrado' ? '\\chi^2' : (modelo === 'FFisher' ? 'F' : (modelo === 'TStudent' ? 'T' : 'X')))}_2 = ${valX2}}`} offsetX={offX2} />} />
                                        );
                                    }
                                } else if (tipo === 'suma_intervalos' && condicion.intervals) {
                                    condicion.intervals.forEach((intv, idx) => {
                                        const min = parseFloat(intv.min);
                                        const max = parseFloat(intv.max);
                                        if (!isNaN(min) && !isNaN(max)) {
                                            refs.push(<ReferenceLine key={`min-${idx}`} x={min} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`\\boldsymbol{${modelo === 'NormalEstandar' ? 'z' : (modelo === 'ChiCuadrado' ? '\\chi^2' : (modelo === 'FFisher' ? 'F' : (modelo === 'TStudent' ? 'T' : 'x')))}_{${idx*2+1}}}`} />} />);
                                            refs.push(<ReferenceLine key={`max-${idx}`} x={max} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`\\boldsymbol{${modelo === 'NormalEstandar' ? 'z' : (modelo === 'ChiCuadrado' ? '\\chi^2' : (modelo === 'FFisher' ? 'F' : (modelo === 'TStudent' ? 'T' : 'x')))}_{${idx*2+2}}}`} />} />);
                                        }
                                    });
                                } else if (tipo === 'inversa_menor' || tipo === 'inversa_mayor') {
                                    if (resultados?.c !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="lineC" x={resultados.c} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\boldsymbol{c = ${resultados.c.toFixed(4)}}`} />} />
                                        );
                                    }
                                } else if (tipo === 'inversa_exterior' || tipo === 'inversa_entre') {
                                    if (resultados?.c1 !== undefined && resultados?.c2 !== undefined) {
                                        let offX1 = 0; let offX2 = 0;
                                        if (Math.abs(resultados.c2 - resultados.c1) < umbralChoque) { offX1 = -45; offX2 = 45; }
                                        refs.push(
                                            <ReferenceLine key="lineC1" x={resultados.c1} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\boldsymbol{c_1 = ${resultados.c1.toFixed(4)}}`} offsetX={offX1} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="lineC2" x={resultados.c2} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\boldsymbol{c_2 = ${resultados.c2.toFixed(4)}}`} offsetX={offX2} />} />
                                        );
                                    }
                                }
                                return refs;
                            })()}
                            
                            {annotationDataArray.map((ann, idx) => (
                                <ReferenceDot 
                                    key={`ann-${idx}`}
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
