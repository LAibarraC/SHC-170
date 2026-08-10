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
        case 'mayor_igual': return '\\boldsymbol{\\ge}';
        case 'menor_igual': return '\\boldsymbol{\\le}';
        case 'mayor_estricto': return '\\boldsymbol{>}';
        case 'menor_estricto': return '\\boldsymbol{<}';
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

                            {condicion && condicion.valorX !== undefined && (
                                <>
                                    <ReferenceLine
                                        x={condicion.valorX}
                                        stroke="#f97316"
                                        strokeDasharray="4 4"
                                        strokeWidth={3}
                                        label={<CustomKatexLabel value={condicion.tipo.includes('intervalo') ? `\\mathbf{X} \\boldsymbol{=} ${condicion.valorX}` : `\\mathbf{X} ${getOperador(condicion.tipo)} ${condicion.valorX}`} />}
                                    />
                                    {condicion.tipo.includes('intervalo') && condicion.valorB !== undefined && (
                                        <ReferenceLine
                                            x={condicion.valorB}
                                            stroke="#f97316"
                                            strokeDasharray="4 4"
                                            strokeWidth={3}
                                            label={<CustomKatexLabel value={`X = ${condicion.valorB}`} />}
                                        />
                                    )}
                                </>
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MarcoWidgetMAT251>
    );
}
