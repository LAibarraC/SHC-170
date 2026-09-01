import React from 'react';
import { FONT } from '../../Principal/Constantes';

export default function DiagramaFlujoSucesivo({ resultado, modReemplazo }) {
    if (!resultado) return null;
    const { pA, pB, pAandB, totalA, totalB, countA, countB, nameA, nameB } = resultado;

    const strokeColor = "var(--primary-color, #3b82f6)";
    const boxBg = "var(--bg-input, #eff6ff)";
    const textColor = "var(--text-main, #1e293b)";

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <svg viewBox="0 0 600 160" width="100%" height="100%" style={{ maxWidth: '750px', fontFamily: FONT }}>
                {/* Caja Inicial */}
                <foreignObject x="10" y="35" width="100" height="60">
                    <div style={{
                        width: '100%', height: '100%', background: boxBg, border: `2px solid ${strokeColor}`, borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px', boxSizing: 'border-box'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor }}>Total</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: strokeColor }}>
                            {totalA === '-' ? 'N = 100%' : `N = ${totalA}`}
                        </div>
                    </div>
                </foreignObject>

                {/* Flecha A */}
                <line x1="110" y1="65" x2="220" y2="65" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="165" y="55" textAnchor="middle" fontSize="12" fill={textColor} fontWeight="bold">Extr. 1 (A)</text>
                <text x="165" y="85" textAnchor="middle" fontSize="12" fill={textColor}>P(A) = {pA.toFixed(4)}</text>

                {/* Caja A */}
                <foreignObject x="220" y="35" width="130" height="60">
                    <div style={{
                        width: '100%', height: '100%', background: boxBg, border: `2px solid ${strokeColor}`, borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px 8px', boxSizing: 'border-box'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }} title={nameA}>
                            {nameA}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: strokeColor }}>
                            {countA === '-' ? `P = ${pA.toFixed(4)}` : `n = ${countA}`}
                        </div>
                    </div>
                </foreignObject>

                {/* Flecha B */}
                <line x1="350" y1="65" x2="460" y2="65" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="405" y="55" textAnchor="middle" fontSize="12" fill={textColor} fontWeight="bold">
                    {modReemplazo === 'sin_reemplazo' ? 'Extr. 2 (B|A)' : 'Extr. 2 (B)'}
                </text>
                <text x="405" y="85" textAnchor="middle" fontSize="12" fill={textColor}>
                    {modReemplazo === 'sin_reemplazo' ? 'P(B|A)' : 'P(B)'} = {pB.toFixed(4)}
                </text>

                {/* Caja B */}
                <foreignObject x="460" y="35" width="130" height="60">
                    <div style={{
                        width: '100%', height: '100%', background: boxBg, border: `2px solid ${strokeColor}`, borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4px 8px', boxSizing: 'border-box'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }} title={nameB}>
                            {nameB}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: strokeColor }}>
                            {countB === '-' ? `P = ${pB.toFixed(4)}` : `n = ${countB} / ${totalB}`}
                        </div>
                    </div>
                </foreignObject>

                {/* Resultado Final Intersección */}
                <rect x="180" y="115" width="240" height="35" rx="17.5" fill="var(--bg-input, rgba(16, 185, 129, 0.1))" stroke="var(--border-color, #10b981)" strokeWidth="1.5" />
                <text x="300" y="137" textAnchor="middle" fontSize="14" fill="var(--text-main, #047857)" fontWeight="bold">
                    P(A ∩ B) = {pAandB.toFixed(4)} ({(pAandB * 100).toFixed(1)}%)
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

