import React from 'react';
import '../../../styles/Temas/Tema3.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { IconoProcedimiento } from '../../../ui/Iconos';

export default function Resultados_ModelosContinuos({ resultados, modelo, onOpenProcedimiento }) {
    if (!resultados) return null;

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const formatNum = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '-';
        return Number.isInteger(num) ? num.toString() : num.toFixed(4);
    };

    return (
        <div className="tema3-card" style={{ marginTop: '20px' }}>
            <h3 className="tema3-title" style={{ borderBottom: 'none', marginBottom: '15px', textAlign: 'center', color: '#0f172a' }}>
                Resultados {modelo}
            </h3>

            {resultados.probabilidadFinal !== null && (
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid #bfdbfe', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>Probabilidad Calculada {renderLatex('P(X)')}</div>
                        {onOpenProcedimiento && (
                            <button onClick={() => onOpenProcedimiento('probabilidad')} title="Ver procedimiento matemático" style={{ position: 'absolute', top: '10px', right: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: '#475569' }}>
                                <IconoProcedimiento />
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>
                        {formatNum(resultados.probabilidadFinal)} <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>({(resultados.probabilidadFinal * 100).toFixed(2)}%)</span>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Esperanza {renderLatex('E(X)')}</div>
                        {onOpenProcedimiento && (
                            <button onClick={() => onOpenProcedimiento('esperanza')} title="Ver procedimiento matemático" style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', color: '#64748b' }}>
                                <IconoProcedimiento />
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.esperanza)}
                    </div>
                </div>

                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Varianza {renderLatex('V(X)')}</div>
                        {onOpenProcedimiento && (
                            <button onClick={() => onOpenProcedimiento('varianza')} title="Ver procedimiento matemático" style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', color: '#64748b' }}>
                                <IconoProcedimiento />
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.varianza)}
                    </div>
                </div>

                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Desviación {renderLatex('\\sigma')}</div>
                        {onOpenProcedimiento && (
                            <button onClick={() => onOpenProcedimiento('desviacion')} title="Ver procedimiento matemático" style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', color: '#64748b' }}>
                                <IconoProcedimiento />
                            </button>
                        )}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#334155', fontWeight: 700 }}>
                        {formatNum(resultados.desviacion !== undefined ? resultados.desviacion : Math.sqrt(resultados.varianza))}
                    </div>
                </div>
            </div>
        </div>
    );
}
