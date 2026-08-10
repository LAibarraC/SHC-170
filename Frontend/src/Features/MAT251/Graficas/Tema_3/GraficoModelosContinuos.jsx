import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import MarcoWidgetMAT251 from '../../ui/MarcoWidgetMAT251';

const CustomKatexLabel = (props) => {
    const { viewBox, value } = props;
    if (!viewBox) return null;
    const { x, y } = viewBox;
    
    return (
        <foreignObject x={x - 50} y={y - 30} width={100} height={30} style={{ overflow: 'visible' }}>
            <div 
                dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false }) }} 
                style={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }} 
            />
        </foreignObject>
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

    return (
        <MarcoWidgetMAT251 titulo="Gráfica de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px" id="grafico-area-tema3">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datos} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            
                                <XAxis 
                                    dataKey="x" 
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
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
                                    type="step" 
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

                                if (tipo === 'menor' || tipo === 'menor_igual' || tipo === 'mayor' || tipo === 'mayor_igual') {
                                    if (valX !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="line1" x={valX} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`\\mathbf{X} ${getOperador(tipo)} ${valX}`} />} />
                                        );
                                    }
                                } else if (tipo === 'entre' || tipo === 'intervalo' || tipo === 'exterior') {
                                    if (valX !== undefined && valX2 !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="line1" x={valX} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`X_1 = ${valX}`} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="line2" x={valX2} stroke="#f97316" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`X_2 = ${valX2}`} />} />
                                        );
                                    }
                                } else if (tipo === 'suma_intervalos' && condicion.intervals) {
                                    condicion.intervals.forEach((intv, idx) => {
                                        const min = parseFloat(intv.min);
                                        const max = parseFloat(intv.max);
                                        if (!isNaN(min) && !isNaN(max)) {
                                            refs.push(<ReferenceLine key={`min-${idx}`} x={min} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`x_{${idx*2+1}}`} />} />);
                                            refs.push(<ReferenceLine key={`max-${idx}`} x={max} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={<CustomKatexLabel value={`x_{${idx*2+2}}`} />} />);
                                        }
                                    });
                                } else if (tipo === 'inversa_menor' || tipo === 'inversa_mayor') {
                                    if (resultados?.c !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="lineC" x={resultados.c} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c = ${resultados.c.toFixed(4)}`} />} />
                                        );
                                    }
                                } else if (tipo === 'inversa_exterior') {
                                    if (resultados?.c1 !== undefined && resultados?.c2 !== undefined) {
                                        refs.push(
                                            <ReferenceLine key="lineC1" x={resultados.c1} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c_1 = ${resultados.c1.toFixed(4)}`} />} />
                                        );
                                        refs.push(
                                            <ReferenceLine key="lineC2" x={resultados.c2} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3}
                                                label={<CustomKatexLabel value={`c_2 = ${resultados.c2.toFixed(4)}`} />} />
                                        );
                                    }
                                }
                                return refs;
                            })()}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MarcoWidgetMAT251>
    );
}
