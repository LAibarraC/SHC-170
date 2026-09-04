import React from 'react';
import { FONT } from '../../Principal/Constantes';

export default function DiagramaFlujoSucesivo({ resultado, modReemplazo }) {
    if (!resultado) return null;
    
    const strokeColor = "var(--primary-color, #3b82f6)";
    const boxBg = "var(--bg-input, #eff6ff)";
    const textColor = "var(--text-main, #1e293b)";

    const isManual = resultado.isManualDinamic;
    const events = isManual ? resultado.events : [
        { name: resultado.nameA, pVal: resultado.pA, count: resultado.countA, total: resultado.totalA },
        { name: resultado.nameB, pVal: resultado.pB, count: resultado.countB, total: resultado.totalB }
    ];

    const numBoxes = events.length;
    // Base width: 100 for Total box, + (110 arrow + 130 box) per event = 240 * numBoxes + 50 margin
    const svgWidth = 120 + (numBoxes * 240);
    const svgHeight = 160;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ maxWidth: `${svgWidth}px`, fontFamily: FONT }}>
                {/* Caja Inicial */}
                <foreignObject x="10" y="35" width="100" height="60">
                    <div style={{
                        width: '100%', height: '100%', background: boxBg, border: `2px solid ${strokeColor}`, borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px', boxSizing: 'border-box'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor }}>Total</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: strokeColor }}>
                            {(!isManual && resultado.totalA !== '-') ? `N = ${resultado.totalA}` : 'N = 100%'}
                        </div>
                    </div>
                </foreignObject>

                {events.map((ev, i) => {
                    const startX = 110 + (i * 240);
                    const boxX = startX + 110;
                    
                    let extText = `Extr. ${i + 1} (${String.fromCharCode(65 + i)})`;
                    let probText = `P(${String.fromCharCode(65 + i)})`;
                    if (modReemplazo === 'sin_reemplazo' && i > 0) {
                        extText = `Extr. ${i + 1} (${String.fromCharCode(65 + i)}|prev)`;
                        probText = `P(${String.fromCharCode(65 + i)}|prev)`;
                    }

                    const probVal = isManual ? ev.prob : ev.pVal;
                    const countStr = isManual ? `P = ${probVal.toFixed(4)}` : (ev.count === '-' ? `P = ${probVal.toFixed(4)}` : `n = ${ev.count}${i > 0 ? ` / ${ev.total}` : ''}`);

                    return (
                        <g key={i}>
                            {/* Flecha */}
                            <line x1={startX} y1="65" x2={boxX} y2="65" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" />
                            <text x={startX + 55} y="55" textAnchor="middle" fontSize="12" fill={textColor} fontWeight="bold">{extText}</text>
                            <text x={startX + 55} y="85" textAnchor="middle" fontSize="12" fill={textColor}>{probText} = {probVal.toFixed(4)}</text>

                            {/* Caja */}
                            <foreignObject x={boxX} y="35" width="130" height="60">
                                <div style={{
                                    width: '100%', height: '100%', background: boxBg, border: `2px solid ${strokeColor}`, borderRadius: '8px',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px 8px', boxSizing: 'border-box'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }} title={ev.name}>
                                        {ev.name}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: strokeColor }}>
                                        {countStr}
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* Resultado Final Intersección */}
                <rect x={(svgWidth / 2) - 150} y="115" width="300" height="35" rx="17.5" fill="var(--bg-input, rgba(16, 185, 129, 0.1))" stroke="var(--border-color, #10b981)" strokeWidth="1.5" />
                <text x={svgWidth / 2} y="137" textAnchor="middle" fontSize="14" fill="var(--text-main, #047857)" fontWeight="bold">
                    P(Intersección) = {resultado.pAandB.toFixed(4)} ({(resultado.pAandB * 100).toFixed(1)}%)
                </text>

                {/* Flechas definition */}
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill={strokeColor} />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}

