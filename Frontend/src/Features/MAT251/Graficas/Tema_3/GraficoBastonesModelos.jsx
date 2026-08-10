import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    ReferenceArea,
    LabelList,
    Label,
    Line,
    Area
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

export default function GraficoBastonesModelos({ datos, condicion, resultados }) {
    if (!datos || datos.length === 0) return null;

    // Detectar si es el modelo de Bernoulli por la forma de sus datos
    const esBernoulli = datos.length === 2 && datos[0].x === 0 && datos[1].x === 1;

    // --- Lógica de Recorte Dinámico del Eje X ---
    const esperanza = resultados && resultados.esperanza !== undefined ? resultados.esperanza : null;
    const desviacion = resultados && resultados.desviacion !== undefined ? resultados.desviacion : null;

    const epsilon = 0.0001;
    let minX_idx = 0;
    let maxX_idx = datos.length - 1;

    for (let i = 0; i < datos.length; i++) {
        if (datos[i].p > epsilon) {
            minX_idx = i;
            break;
        }
    }

    for (let i = datos.length - 1; i >= 0; i--) {
        if (datos[i].p > epsilon) {
            maxX_idx = i;
            break;
        }
    }

    if (minX_idx > maxX_idx) {
        minX_idx = 0;
        maxX_idx = datos.length - 1;
    }

    // Función para determinar si una barra debe estar resaltada (cae en la condición)
    const isResaltado = (x) => {
        if (!condicion) return false;
        const { tipo, valorX, valorB } = condicion;
        if (tipo === 'exacta') return x === valorX;
        if (tipo === 'menor_igual') return x <= valorX;
        if (tipo === 'mayor_igual') return x >= valorX;
        if (tipo === 'intervalo') return x >= valorX && x <= valorB;
        if (tipo === 'menor_estricto') return x < valorX;
        if (tipo === 'mayor_estricto') return x > valorX;
        if (tipo === 'intervalo_estricto') return x > valorX && x < valorB;
        return false;
    };

    // Función para extender el área naranja hasta las líneas de referencia
    const isEnRangoArea = (x) => {
        if (!condicion) return false;
        const { tipo, valorX, valorB } = condicion;
        if (tipo === 'exacta') return x === valorX;
        
        // El área siempre se dibuja hasta los límites dados por el usuario
        if (tipo === 'menor_igual' || tipo === 'menor_estricto') return x <= valorX;
        if (tipo === 'mayor_igual' || tipo === 'mayor_estricto') return x >= valorX;
        if (tipo === 'intervalo' || tipo === 'intervalo_estricto') return x >= valorX && x <= valorB;
        
        return false;
    };

    const minRecorte = Math.max(0, minX_idx - 2);
    const maxRecorte = Math.min(datos.length - 1, maxX_idx + 10);

    const datosRecortados = datos.slice(minRecorte, maxRecorte + 1).map(d => ({
        ...d,
        p_linea: condicion && condicion.tipo !== 'exacta' && condicion.valorX !== undefined ? (isEnRangoArea(d.x) ? d.p : null) : null
    }));

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const p = payload[0].value;
            return (
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>x = {label}</p>
                    <p style={{ margin: 0, color: '#3b82f6' }}>P(x) = {p.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <MarcoWidgetMAT251 titulo="Gráfico de Bastones P(X = x)" anchoCompleto={true} alto="450px" id="grafico-bastones-tema3">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={datosRecortados}
                            margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                            barCategoryGap={esBernoulli ? '15%' : '10%'}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />



                            <XAxis
                                dataKey="x"
                                type={esBernoulli ? "category" : "number"}
                                domain={esBernoulli ? undefined : ['dataMin', 'dataMax']}
                                padding={esBernoulli ? { left: 40, right: 40 } : { left: 20, right: 20 }}
                                ticks={datosRecortados.map(d => d.x)}
                                tick={{ fill: '#333333', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: '#333333', strokeWidth: 2 }}
                                tickLine={{ stroke: '#333333', strokeWidth: 2 }}
                                label={{ value: 'Valor (x)', position: 'insideBottom', offset: -10, fill: '#333333', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />

                            <YAxis
                                domain={esBernoulli ? [0, 1] : [0, 'auto']}
                                padding={{ top: 30 }}
                                tick={{ fill: '#333333', fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: '#333333', strokeWidth: 2 }}
                                tickLine={{ stroke: '#333333', strokeWidth: 2 }}
                                label={{ value: 'Probabilidad P(x)', angle: -90, position: 'insideLeft', offset: 15, fill: '#333333', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle' }}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            {/* Reference lines moved to the bottom so they draw on top */}

                            {/* El gráfico de bastones se simula con barras muy delgadas, pero para Bernoulli es un histograma */}
                            <Bar 
                                dataKey="p" 
                                fill="#3b82f6" 
                                stroke={esBernoulli ? "#1e293b" : "none"}
                                {...(esBernoulli ? {} : { barSize: 15, radius: [0, 0, 0, 0] })}
                            >
                                {datosRecortados.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="#3b82f6"
                                        fillOpacity={isResaltado(entry.x) ? 0.4 : 1}
                                    />
                                ))}
                            </Bar>

                            {/* Línea envolvente (envelope) para mostrar la forma de la distribución (excepto en Bernoulli) */}
                            {!esBernoulli && (
                                <>
                                    <Area
                                        type="linear"
                                        dataKey="p_linea"
                                        fill="#f97316"
                                        fillOpacity={0.25}
                                        stroke="none"
                                        isAnimationActive={false}
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="p_linea"
                                        stroke="#334155"
                                        strokeWidth={1}
                                        dot={false}
                                        isAnimationActive={false}
                                        connectNulls={false}
                                    />
                                </>
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
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </MarcoWidgetMAT251>
    );
}
