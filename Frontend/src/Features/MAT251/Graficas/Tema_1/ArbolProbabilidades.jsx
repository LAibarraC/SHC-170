import React, { useMemo } from 'react';
import { FONT } from '../../Principal/Constantes';

export default function ArbolProbabilidades({ resultado, filas, varSeleccionada, colA, colB, modReemplazo, inputMode = 'matriz' }) {
    const dataArbol = useMemo(() => {
        if (!resultado) return null;

        if (inputMode === 'manual') {
            const pA_comp = 1 - resultado.pA;
            const pB_comp = 1 - resultado.pB;

            const nameA_comp = `No ${resultado.nameA}`;
            const nameB_comp = `No ${resultado.nameB}`;

            const ramasA = [
                {
                    valor: resultado.nameA,
                    count: '-',
                    pA: resultado.pA,
                    esActiva: true,
                    hijos: [
                        {
                            valor: resultado.nameB,
                            count: '-',
                            total: '-',
                            pB: resultado.pB,
                            pJoint: resultado.pA * resultado.pB,
                            esActiva: true
                        },
                        {
                            valor: nameB_comp,
                            count: '-',
                            total: '-',
                            pB: pB_comp,
                            pJoint: resultado.pA * pB_comp,
                            esActiva: false
                        }
                    ]
                },
                {
                    valor: nameA_comp,
                    count: '-',
                    pA: pA_comp,
                    esActiva: false,
                    hijos: [
                        {
                            valor: resultado.nameB,
                            count: '-',
                            total: '-',
                            pB: resultado.pB,
                            pJoint: pA_comp * resultado.pB,
                            esActiva: false
                        },
                        {
                            valor: nameB_comp,
                            count: '-',
                            total: '-',
                            pB: pB_comp,
                            pJoint: pA_comp * pB_comp,
                            esActiva: false
                        }
                    ]
                }
            ];
            return { N: '-', ramasA };
        }

        // Modo Matriz Original
        if (!filas || !varSeleccionada || !colA || !colB) return null;

        const idxA = varSeleccionada.nombresColumnas.indexOf(colA);
        const idxB = varSeleccionada.nombresColumnas.indexOf(colB);
        if (idxA === -1 || idxB === -1) return null;

        const datosParseados = filas.map(f => {
            const p = f.valor.split(' | ').map(v => v.trim());
            return { valA: p[idxA], valB: p[idxB] };
        }).filter(d => d.valA !== undefined && d.valB !== undefined && d.valA !== '' && d.valB !== '');

        const N = datosParseados.length;
        if (N === 0) return null;

        // Frecuencias iniciales
        const conteoA = {};
        const conteoB_inicial = {};
        datosParseados.forEach(d => {
            conteoA[d.valA] = (conteoA[d.valA] || 0) + 1;
            conteoB_inicial[d.valB] = (conteoB_inicial[d.valB] || 0) + 1;
        });

        const ramasA = Object.keys(conteoA).sort().map(valA => {
            const countA = conteoA[valA];
            const pA = countA / N;

            let totalB = N;
            if (modReemplazo === 'sin_reemplazo') totalB = N - 1;

            const hijosB = Object.keys(conteoB_inicial).sort().map(valB => {
                let countB = conteoB_inicial[valB];
                
                if (modReemplazo === 'sin_reemplazo') {
                    const nA_and_B = datosParseados.filter(d => d.valA === valA && d.valB === valB).length;
                    const reduccion = countA > 0 ? (nA_and_B / countA) : 0;
                    countB = Number(Math.max(0, countB - reduccion).toFixed(2));
                }

                const pB = totalB > 0 ? countB / totalB : 0;
                const pJoint = pA * pB;
                
                return {
                    valor: valB,
                    count: countB,
                    total: totalB,
                    pB,
                    pJoint,
                    esActiva: valA === resultado.nameA && valB === resultado.nameB
                };
            });

            return {
                valor: valA,
                count: countA,
                pA,
                hijos: hijosB,
                esActiva: valA === resultado.nameA
            };
        });

        return { N, ramasA };
    }, [resultado, filas, varSeleccionada, colA, colB, modReemplazo, inputMode]);

    if (!dataArbol) return null;

    const { N, ramasA } = dataArbol;
    const numHojas = ramasA.reduce((sum, rama) => sum + rama.hijos.length, 0);
    
    // Dimensiones
    const ROW_HEIGHT = 70;
    const svgHeight = Math.max(300, numHojas * ROW_HEIGHT + 100);
    const svgWidth = 800;

    const rootX = 60;
    const rootY = svgHeight / 2;
    const l1X = 300;
    const l2X = 580;

    // Calcular posiciones Y
    let currentY = 50;
    ramasA.forEach(ramaA => {
        const hYStart = currentY;
        ramaA.hijos.forEach(hijoB => {
            hijoB.y = currentY;
            currentY += ROW_HEIGHT;
        });
        const hYEnd = currentY - ROW_HEIGHT;
        ramaA.y = (hYStart + hYEnd) / 2;
    });

    const activeColor = "#10b981"; // Verde iluminado
    const activeStroke = 3;
    const inactiveColor = "#94a3b8"; // Gris opaco
    const inactiveStroke = 1.5;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ maxWidth: '900px', fontFamily: FONT }}>
                {/* Definiciones */}
                <defs>
                    <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={activeColor} />
                    </marker>
                    <marker id="arrow-inactive" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={inactiveColor} />
                    </marker>
                </defs>

                {/* Título y Raíz */}
                <rect x={rootX - 40} y={rootY - 25} width="80" height="50" rx="8" fill="var(--bg-input, #f8fafc)" stroke={inactiveColor} strokeWidth="2" />
                <text x={rootX} y={rootY - 5} textAnchor="middle" fontSize="13" fill="var(--text-main, #334155)" fontWeight="bold">Total</text>
                <text x={rootX} y={rootY + 12} textAnchor="middle" fontSize="14" fill="var(--text-main, #0f172a)" fontWeight="bold">N={N}</text>

                {/* Dibujar Ramas Nivel 1 */}
                {ramasA.map((rama, i) => {
                    const colorL1 = rama.esActiva ? activeColor : inactiveColor;
                    const strokeL1 = rama.esActiva ? activeStroke : inactiveStroke;
                    const markerL1 = rama.esActiva ? "url(#arrow-active)" : "url(#arrow-inactive)";

                    return (
                        <g key={`l1-${i}`}>
                            <line 
                                x1={rootX + 40} y1={rootY} 
                                x2={l1X - 65} y2={rama.y} 
                                stroke={colorL1} strokeWidth={strokeL1} 
                                markerEnd={markerL1} 
                                strokeLinecap="round"
                            />
                            {/* Probabilidad en flecha L1 */}
                            <rect x={(rootX + l1X)/2 - 30} y={(rootY + rama.y)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                            <text x={(rootX + l1X)/2} y={(rootY + rama.y)/2} textAnchor="middle" fontSize="11" fill={colorL1} fontWeight="bold">
                                {rama.count === '-' ? `P=${rama.pA.toFixed(4)}` : `${rama.count}/${N}`}
                            </text>

                            {/* Caja Nivel 1 */}
                            <rect 
                                x={l1X - 60} y={rama.y - 25} width="120" height="50" rx="6" 
                                fill={rama.esActiva ? "var(--bg-input, rgba(16, 185, 129, 0.05))" : "var(--bg-input, #fff)"} 
                                stroke={colorL1} strokeWidth={rama.esActiva ? 2 : 1} 
                            />
                            <text x={l1X} y={rama.y - 5} textAnchor="middle" fontSize="12" fill={rama.esActiva ? "var(--text-main, #064e3b)" : "var(--text-main, #475569)"} fontWeight={rama.esActiva ? "bold" : "normal"}>
                                {rama.valor.length > 15 ? rama.valor.substring(0, 15) + '...' : rama.valor}
                            </text>
                            <text x={l1X} y={rama.y + 12} textAnchor="middle" fontSize="12" fill={rama.esActiva ? activeColor : "var(--text-muted, #64748b)"} fontWeight="bold">
                                {rama.count === '-' ? `P=${rama.pA.toFixed(4)}` : `n=${rama.count}`}
                            </text>

                            {/* Dibujar Ramas Nivel 2 */}
                            {rama.hijos.map((hijo, j) => {
                                const colorL2 = hijo.esActiva ? activeColor : inactiveColor;
                                const strokeL2 = hijo.esActiva ? activeStroke : inactiveStroke;
                                const markerL2 = hijo.esActiva ? "url(#arrow-active)" : "url(#arrow-inactive)";

                                return (
                                    <g key={`l2-${i}-${j}`}>
                                        <line 
                                            x1={l1X + 60} y1={rama.y} 
                                            x2={l2X - 65} y2={hijo.y} 
                                            stroke={colorL2} strokeWidth={strokeL2} 
                                            markerEnd={markerL2} 
                                            strokeLinecap="round"
                                        />
                                        {/* Probabilidad en flecha L2 */}
                                        <rect x={(l1X + l2X)/2 - 30} y={(rama.y + hijo.y)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                                        <text x={(l1X + l2X)/2} y={(rama.y + hijo.y)/2} textAnchor="middle" fontSize="11" fill={colorL2} fontWeight="bold">
                                            {hijo.count === '-' ? `P=${hijo.pB.toFixed(4)}` : `${hijo.count}/${hijo.total}`}
                                        </text>

                                        {/* Caja Nivel 2 */}
                                        <rect 
                                            x={l2X - 60} y={hijo.y - 25} width="120" height="50" rx="6" 
                                            fill={hijo.esActiva ? "var(--bg-input, rgba(16, 185, 129, 0.1))" : "var(--bg-input, #fff)"} 
                                            stroke={colorL2} strokeWidth={hijo.esActiva ? 2 : 1} 
                                        />
                                        <text x={l2X} y={hijo.y - 5} textAnchor="middle" fontSize="12" fill={hijo.esActiva ? "var(--text-main, #064e3b)" : "var(--text-main, #475569)"} fontWeight={hijo.esActiva ? "bold" : "normal"}>
                                            {hijo.valor.length > 15 ? hijo.valor.substring(0, 15) + '...' : hijo.valor}
                                        </text>
                                        <text x={l2X} y={hijo.y + 12} textAnchor="middle" fontSize="12" fill={hijo.esActiva ? activeColor : "var(--text-muted, #64748b)"} fontWeight="bold">
                                            P = {(hijo.pB).toFixed(4)}
                                        </text>

                                        {hijo.esActiva && (
                                            <text x={l2X + 70} y={hijo.y + 4} textAnchor="start" fontSize="14" fill={activeColor} fontWeight="bold">
                                                ← RUTA SELECCIONADA
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
