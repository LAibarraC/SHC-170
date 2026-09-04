import React from 'react';
import { FONT, FS, RADIUS } from '../../Principal/Constantes';

export default function ArbolProbabilidad({ resultado, ramas, causasBayes }) {
    if (!resultado || !ramas || ramas.length === 0) return null;

    const height = Math.max(400, ramas.length * 140);
    const rootX = 80, rootY = height / 2, nodeAX = 440, nodeBX = 740;
    const defaultHighlightColor = '#0ea5e9';
    const bayesHighlightColor = '#f97316';
    const dimColor = '#94a3b8';
    const veryDimColor = '#cbd5e1';

    // Pre-calcular anchos uniformes para alineación perfecta
    let maxWPill = 80;
    let maxWLabel1 = 120;
    let maxWLabel2 = 130;

    resultado.desglose.forEach(rama => {
        const l1 = `P(${rama.nombre})=${rama.pA.toFixed(4)}`;
        const l2 = `P(A|${rama.nombre})=${rama.pB_A.toFixed(4)}`;
        maxWPill = Math.max(maxWPill, rama.nombre.length * 8 + 30);
        maxWLabel1 = Math.max(maxWLabel1, l1.length * 7 + 20);
        maxWLabel2 = Math.max(maxWLabel2, l2.length * 7 + 20);
    });

    const width = Math.max(850, nodeBX + 150);
    const hasBayesSelected = causasBayes && causasBayes.length > 0;

    return (
        <div style={{ width: '100%', height: '100%', padding: '0px' }}>

            <svg viewBox={`0 0 ${width} ${height + 40}`} width="100%" height="100%" style={{ display: 'block', margin: '0 auto', fontFamily: FONT }}>

                {resultado.desglose.map((rama, i) => {
                    const ySpacing = height / (ramas.length + 1);
                    const nodeAY = ySpacing * (i + 1);

                    // --- Textos dinámicos ---
                    const label1Text = `P(${rama.nombre})=${rama.pA.toFixed(4)}`;
                    const label2Text = `P(A|${rama.nombre})=${rama.pB_A.toFixed(4)}`;
                    const pillText = rama.nombre;

                    const wPill = maxWPill;
                    const wLabel1 = maxWLabel1;
                    const wLabel2 = maxWLabel2;

                    const pillX = nodeAX - wPill; // Ahora será igual para todos

                    // Puntos medios geométricos precisos para las etiquetas
                    const midX1 = (rootX + pillX) / 2;
                    const midY1 = (rootY + nodeAY) / 2;

                    const midX2 = (nodeAX + nodeBX - 70) / 2;
                    const midY2 = (nodeAY + nodeAY - 35) / 2;

                    const midX3 = (nodeAX + nodeBX - 70) / 2;
                    const midY3 = (nodeAY + nodeAY + 35) / 2;

                    const isBayesTarget = hasBayesSelected && causasBayes.includes(rama.nombre);
                    const isOtherBayes = hasBayesSelected && !causasBayes.includes(rama.nombre);

                    // En lugar de usar un gris claro estático (veryDimColor) que falla en modo oscuro,
                    // usamos el color original pero bajamos la opacidad (transparencia) para un difuminado natural.
                    const currentColor = isBayesTarget ? bayesHighlightColor : defaultHighlightColor;
                    const fadeOpacity = isOtherBayes ? "0.25" : "1";
                    const lineOpacity = isOtherBayes ? "0.15" : "0.9";
                    const textOpacity = isOtherBayes ? "0.4" : "1";

                    const strokeWidthCurrent = isBayesTarget ? "3.5" : "2.5";
                    const strokeWidthSubCurrent = isBayesTarget ? "3" : "2";

                    return (
                        <g key={rama.id}>
                            {/* === RAMA PRINCIPAL (Hacia A_i) === */}
                            <line
                                x1={rootX} y1={rootY}
                                x2={pillX} y2={nodeAY}
                                stroke={currentColor} strokeWidth={strokeWidthCurrent} opacity={lineOpacity}
                            />

                            {/* Etiqueta P(A_i) sobre la línea */}
                            <rect x={midX1 - wLabel1 / 2} y={midY1 - 12} width={wLabel1} height="24" rx="4" fill="var(--bg-card)" stroke={currentColor} strokeWidth="1" strokeOpacity={fadeOpacity} />
                            <text x={midX1} y={midY1 + 4} textAnchor="middle" fontSize="11" fill={currentColor} fontWeight="bold" opacity={fadeOpacity}>
                                {label1Text}
                            </text>

                            {/* Nodo A_i (Píldora dinámica) */}
                            <rect x={pillX} y={nodeAY - 14} width={wPill} height="28" rx="14" fill={currentColor} fillOpacity={fadeOpacity} />
                            <text x={pillX + wPill / 2} y={nodeAY + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" opacity={textOpacity}>
                                {pillText}
                            </text>

                            {/* === SUB-RAMA ÉXITO (Hacia A) === */}
                            <line
                                x1={nodeAX} y1={nodeAY}
                                x2={nodeBX - 70} y2={nodeAY - 35}
                                stroke={currentColor} strokeWidth={strokeWidthSubCurrent} opacity={lineOpacity}
                            />
                            {/* Etiqueta P(A|A_i) */}
                            <rect x={midX2 - wLabel2 / 2} y={midY2 - 12} width={wLabel2} height="24" rx="4" fill="var(--bg-card)" stroke={currentColor} strokeWidth="1" strokeOpacity={fadeOpacity} />
                            <text x={midX2} y={midY2 + 4} textAnchor="middle" fontSize="11" fill={currentColor} fontWeight="bold" opacity={fadeOpacity}>
                                {label2Text}
                            </text>

                            {/* Nodo A (Éxito) */}
                            <rect x={nodeBX - 70} y={nodeAY - 35 - 12} width="70" height="24" rx="4" fill={currentColor} fillOpacity={fadeOpacity} />
                            <text x={nodeBX - 35} y={nodeAY - 35 + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" opacity={textOpacity}>A (Éxito)</text>

                            {/* Multiplicador Final */}
                            <text x={nodeBX + 10} y={nodeAY - 35 + 4} fontSize="12" fontWeight="bold" fill={currentColor} opacity={fadeOpacity}>
                                = {rama.mult.toFixed(4)}
                            </text>

                            {/* === SUB-RAMA FRACASO (Hacia A') === */}
                            <line
                                x1={nodeAX} y1={nodeAY}
                                x2={nodeBX - 70} y2={nodeAY + 35}
                                stroke={dimColor} strokeWidth="1.5" strokeDasharray="5,5" opacity={isOtherBayes ? "0.2" : "1"}
                            />
                            {/* Etiqueta P(A'|A_i) */}
                            <rect x={midX3 - 25} y={midY3 - 10} width="50" height="20" rx="4" fill="var(--bg-card)" stroke={dimColor} strokeWidth="1" strokeOpacity={isOtherBayes ? "0.25" : "1"} />
                            <text x={midX3} y={midY3 + 4} textAnchor="middle" fontSize="10" fill={dimColor} opacity={isOtherBayes ? "0.4" : "1"}>
                                {(1 - rama.pB_A).toFixed(4)}
                            </text>

                            {/* Nodo A' (Otro) */}
                            <rect x={nodeBX - 70} y={nodeAY + 35 - 10} width="70" height="20" rx="4" fill="var(--bg-card)" stroke={dimColor} strokeWidth="1" strokeOpacity={isOtherBayes ? "0.25" : "1"} />
                            <text x={nodeBX - 35} y={nodeAY + 35 + 4} textAnchor="middle" fontSize="10" fill={dimColor} opacity={isOtherBayes ? "0.4" : "1"}>A' (Otro)</text>
                        </g>
                    );
                })}

                {/* NODO RAÍZ (Renderizado al final para que esté por encima de las líneas) */}
                <rect x={rootX - 70} y={rootY - 16} width="70" height="32" rx="16" fill="var(--primary-color)" />
                <text x={rootX - 35} y={rootY + 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">Inicio</text>
                <circle cx={rootX} cy={rootY} r="5" fill="white" />

                {/* LEYENDA */}
                {(() => {
                    const maxNodeY = (height / (ramas.length + 1)) * ramas.length;
                    const legendY = maxNodeY + 85; // Se calcula 85px debajo de la última rama (la cual baja hasta +35px)
                    return (
                        <text x={width / 2} y={legendY} textAnchor="middle" fontSize="12" fill="var(--text-muted)">
                            <tspan fill={defaultHighlightColor} fontWeight="bold">■ </tspan>
                            Rutas ponderadas que conforman la Probabilidad Total
                            {hasBayesSelected && (
                                <tspan fill={bayesHighlightColor} fontWeight="bold"> | ■ Rutas evaluadas con el Teorema de Bayes</tspan>
                            )}
                        </text>
                    );
                })()}
            </svg>
        </div>
    );
}
