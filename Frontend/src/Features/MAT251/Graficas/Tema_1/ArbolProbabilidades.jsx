import React, { useMemo } from 'react';
import { FONT } from '../../Principal/Constantes';

const ArbolManualDinamico = ({ resultado, modReemplazo }) => {
    const events = resultado.events;
    const N = events.length;
    const ROW_HEIGHT = 80;
    const numHojas = N + 1;
    const svgHeight = Math.max(300, numHojas * ROW_HEIGHT + 100);
    const svgWidth = 150 + N * 240;

    // Calcular posiciones Y de las hojas (0 es la activa final, 1 a N son las inactivas)
    const leafYs = [];
    for (let i = 0; i <= N; i++) {
        leafYs.push(50 + i * ROW_HEIGHT);
    }

    // Calcular posiciones Y de los nodos activos (padres)
    const activeYs = new Array(N + 1);
    activeYs[N] = leafYs[0]; // Hoja activa final
    for (let i = N - 1; i >= 0; i--) {
        const inactiveY = leafYs[N - i];
        activeYs[i] = (activeYs[i + 1] + inactiveY) / 2;
    }

    const rootY = activeYs[0];
    const rootX = 60;

    const activeColor = "#10b981"; // Verde iluminado
    const activeStroke = 3;
    const inactiveColor = "#94a3b8"; // Gris opaco
    const inactiveStroke = 1.5;

    let accumP = 1;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ maxWidth: `${svgWidth}px`, fontFamily: FONT }}>
                <defs>
                    <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={activeColor} />
                    </marker>
                    <marker id="arrow-inactive" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={inactiveColor} />
                    </marker>
                </defs>

                {/* Raíz */}
                <rect x={rootX - 40} y={rootY - 25} width="80" height="50" rx="8" fill="var(--bg-input, #f8fafc)" stroke={inactiveColor} strokeWidth="2" />
                <text x={rootX} y={rootY - 5} textAnchor="middle" fontSize="13" fill="var(--text-main, #334155)" fontWeight="bold">Total</text>
                <text x={rootX} y={rootY + 12} textAnchor="middle" fontSize="14" fill="var(--text-main, #0f172a)" fontWeight="bold">N = 100%</text>

                {events.map((ev, i) => {
                    const startX = rootX + 40 + i * 240;
                    const endX = startX + 160;
                    const p = ev.prob;
                    const pComp = 1 - p;
                    accumP *= p;

                    const startY = activeYs[i];
                    const activeY = activeYs[i + 1];
                    const inactiveY = leafYs[N - i];

                    const nameA = ev.name;
                    const nameComp = `No ${nameA}`;

                    const isLast = i === N - 1;

                    return (
                        <g key={i}>
                            {/* Rama Activa */}
                            <line 
                                x1={startX} y1={startY} 
                                x2={endX - 65} y2={activeY} 
                                stroke={activeColor} strokeWidth={activeStroke} 
                                markerEnd="url(#arrow-active)" 
                                strokeLinecap="round"
                            />
                            <rect x={(startX + endX)/2 - 45} y={(startY + activeY)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                            <text x={(startX + endX)/2 - 15} y={(startY + activeY)/2} textAnchor="middle" fontSize="11" fill={activeColor} fontWeight="bold">
                                P={p.toFixed(4)}
                            </text>

                            {/* Caja Activa */}
                            <rect 
                                x={endX - 60} y={activeY - 25} width="120" height="50" rx="6" 
                                fill="var(--bg-input, rgba(16, 185, 129, 0.1))" 
                                stroke={activeColor} strokeWidth={2} 
                            />
                            <text x={endX} y={activeY - 5} textAnchor="middle" fontSize="12" fill="var(--text-main, #064e3b)" fontWeight="bold">
                                {nameA.length > 15 ? nameA.substring(0, 15) + '...' : nameA}
                            </text>
                            <text x={endX} y={activeY + 12} textAnchor="middle" fontSize="12" fill={activeColor} fontWeight="bold">
                                P = {p.toFixed(4)}
                            </text>

                            {/* Si es el último nodo activo, agregar texto de ruta */}
                            {isLast && (
                                <text x={endX + 70} y={activeY + 4} textAnchor="start" fontSize="14" fill={activeColor} fontWeight="bold">
                                    ← RUTA SELECCIONADA ({accumP.toFixed(4)})
                                </text>
                            )}

                            {/* Rama Inactiva */}
                            <line 
                                x1={startX} y1={startY} 
                                x2={endX - 65} y2={inactiveY} 
                                stroke={inactiveColor} strokeWidth={inactiveStroke} 
                                markerEnd="url(#arrow-inactive)" 
                                strokeLinecap="round"
                            />
                            <rect x={(startX + endX)/2 - 45} y={(startY + inactiveY)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                            <text x={(startX + endX)/2 - 15} y={(startY + inactiveY)/2} textAnchor="middle" fontSize="11" fill={inactiveColor} fontWeight="bold">
                                P={pComp.toFixed(4)}
                            </text>

                            {/* Caja Inactiva */}
                            <rect 
                                x={endX - 60} y={inactiveY - 25} width="120" height="50" rx="6" 
                                fill="var(--bg-input, #fff)" 
                                stroke={inactiveColor} strokeWidth={1} 
                            />
                            <text x={endX} y={inactiveY - 5} textAnchor="middle" fontSize="12" fill="var(--text-main, #475569)">
                                {nameComp.length > 15 ? nameComp.substring(0, 15) + '...' : nameComp}
                            </text>
                            <text x={endX} y={inactiveY + 12} textAnchor="middle" fontSize="12" fill="var(--text-muted, #64748b)" fontWeight="bold">
                                P = {pComp.toFixed(4)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default function ArbolProbabilidades({ resultado, filas, varSeleccionada, colA, colB, modReemplazo, inputMode = 'matriz' }) {
    if (!resultado) return null;

    if (resultado.isManualDinamic) {
        return <ArbolManualDinamico resultado={resultado} modReemplazo={modReemplazo} />;
    }

    const dataArbol = (() => {
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
    })();

    if (!dataArbol) return null;

    const { N, ramasA } = dataArbol;
    const numHojas = ramasA.reduce((sum, rama) => sum + rama.hijos.length, 0);
    
    const ROW_HEIGHT = 70;
    const svgHeight = Math.max(300, numHojas * ROW_HEIGHT + 100);
    const svgWidth = 800;

    const rootX = 60;
    const rootY = svgHeight / 2;
    const l1X = 300;
    const l2X = 580;

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

    const activeColor = "#10b981";
    const activeStroke = 3;
    const inactiveColor = "#94a3b8";
    const inactiveStroke = 1.5;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ maxWidth: '900px', fontFamily: FONT }}>
                <defs>
                    <marker id="arrow-active-m" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={activeColor} />
                    </marker>
                    <marker id="arrow-inactive-m" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill={inactiveColor} />
                    </marker>
                </defs>

                <rect x={rootX - 40} y={rootY - 25} width="80" height="50" rx="8" fill="var(--bg-input, #f8fafc)" stroke={inactiveColor} strokeWidth="2" />
                <text x={rootX} y={rootY - 5} textAnchor="middle" fontSize="13" fill="var(--text-main, #334155)" fontWeight="bold">Total</text>
                <text x={rootX} y={rootY + 12} textAnchor="middle" fontSize="14" fill="var(--text-main, #0f172a)" fontWeight="bold">N={N}</text>

                {ramasA.map((rama, i) => {
                    const colorL1 = rama.esActiva ? activeColor : inactiveColor;
                    const strokeL1 = rama.esActiva ? activeStroke : inactiveStroke;
                    const markerL1 = rama.esActiva ? "url(#arrow-active-m)" : "url(#arrow-inactive-m)";

                    return (
                        <g key={`l1-${i}`}>
                            <line 
                                x1={rootX + 40} y1={rootY} 
                                x2={l1X - 65} y2={rama.y} 
                                stroke={colorL1} strokeWidth={strokeL1} 
                                markerEnd={markerL1} 
                                strokeLinecap="round"
                            />
                            <rect x={(rootX + l1X)/2 - 30} y={(rootY + rama.y)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                            <text x={(rootX + l1X)/2} y={(rootY + rama.y)/2} textAnchor="middle" fontSize="11" fill={colorL1} fontWeight="bold">
                                {rama.count === '-' ? `P=${rama.pA.toFixed(4)}` : `${rama.count}/${N}`}
                            </text>

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

                            {rama.hijos.map((hijo, j) => {
                                const colorL2 = hijo.esActiva ? activeColor : inactiveColor;
                                const strokeL2 = hijo.esActiva ? activeStroke : inactiveStroke;
                                const markerL2 = hijo.esActiva ? "url(#arrow-active-m)" : "url(#arrow-inactive-m)";

                                return (
                                    <g key={`l2-${i}-${j}`}>
                                        <line 
                                            x1={l1X + 60} y1={rama.y} 
                                            x2={l2X - 65} y2={hijo.y} 
                                            stroke={colorL2} strokeWidth={strokeL2} 
                                            markerEnd={markerL2} 
                                            strokeLinecap="round"
                                        />
                                        <rect x={(l1X + l2X)/2 - 30} y={(rama.y + hijo.y)/2 - 15} width="60" height="20" fill="var(--bg-card, white)" opacity="0.9" />
                                        <text x={(l1X + l2X)/2} y={(rama.y + hijo.y)/2} textAnchor="middle" fontSize="11" fill={colorL2} fontWeight="bold">
                                            {hijo.count === '-' ? `P=${hijo.pB.toFixed(4)}` : `${hijo.count}/${hijo.total}`}
                                        </text>

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
