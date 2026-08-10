import React, { useMemo } from 'react';
import { FONT, RADIUS, FS } from '../../../Principal/Constantes';
import { jStat } from 'jstat';

export default function ModalTablaZ({ isOpen, onClose, zValue }) {
    if (!isOpen || zValue === undefined || zValue === null || isNaN(zValue)) return null;

    // Lógica para desglosar zValue en Fila (stem) y Columna (leaf)
    const { stem, leaf, rows, cols, isNegative } = useMemo(() => {
        // Redondeamos a 2 decimales para evitar problemas de precisión flotante
        const zRounded = Math.round(zValue * 100) / 100;
        
        // Determinar el signo
        const isNeg = zRounded < 0 || Object.is(zRounded, -0);
        const zAbs = Math.abs(zRounded);
        
        // Tallo (Primeros dígitos hasta 1 decimal)
        const stemNum = Math.floor(zAbs * 10) / 10;
        const stemVal = isNeg ? -stemNum : stemNum;
        
        // Hoja (Segundo decimal)
        const leafVal = Math.round((zAbs - stemNum) * 100) / 100;

        // Generar las columnas: siempre 0.00 a 0.09
        const generatedCols = Array.from({ length: 10 }, (_, i) => i / 100);

        // Generar un rango de 9 filas centradas alrededor del 'stem'
        const generatedRows = [];
        for (let i = -4; i <= 4; i++) {
            let r = stemVal + (i * 0.1);
            r = Math.round(r * 10) / 10;
            
            // Filtrar para mantenernos dentro de la misma tabla (positiva o negativa)
            if (isNeg && r <= 0 && r >= -3.9) {
                generatedRows.push(r === 0 ? -0 : r);
            } else if (!isNeg && r >= 0 && r <= 3.9) {
                generatedRows.push(r);
            }
        }

        return { stem: stemVal, leaf: leafVal, rows: generatedRows, cols: generatedCols, isNegative: isNeg };
    }, [zValue]);

    // Función auxiliar para formatear la fila (maneja el -0.0 visualmente)
    const formatRow = (r) => {
        if (Object.is(r, -0)) return "-0.0";
        return r.toFixed(1);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
            animation: 'fadeInDropdown 0.3s ease'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '25px', borderRadius: RADIUS, width: '95%', maxWidth: '850px',
                fontFamily: FONT, color: 'var(--text-color)', border: '1px solid var(--border-color)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Tabla Z - Distribución Normal Estándar</h3>
                        <div style={{ fontSize: FS.sm, color: 'var(--text-muted)', marginTop: '5px' }}>
                            Visualizando el valor <strong style={{color: 'var(--text-color)'}}>Z = {zValue.toFixed(2)}</strong> (Tabla {isNegative ? 'Negativa' : 'Positiva'})
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: RADIUS, marginBottom: '20px', border: '1px dashed var(--border-color)' }}>
                    <p style={{ margin: 0, fontSize: FS.sm }}>
                        Para encontrar la probabilidad de <strong>Z = {zValue.toFixed(2)}</strong>, buscamos el "tallo" (<strong>{formatRow(stem)}</strong>) en la fila izquierda, y la "hoja" (<strong>{leaf.toFixed(2)}</strong>) en la columna superior. La celda donde se cruzan es el área acumulada.
                    </p>
                </div>

                <div style={{ overflowX: 'auto', flexGrow: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px', fontFamily: 'monospace' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-muted)', fontWeight: 'bold' }}>Z</th>
                                {cols.map((c, i) => (
                                    <th key={i} style={{ 
                                        padding: '10px', border: '1px solid var(--border-color)', 
                                        background: Math.abs(c - leaf) < 0.001 ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-color)',
                                        color: Math.abs(c - leaf) < 0.001 ? '#15803d' : 'var(--text-color)',
                                        fontWeight: 'bold',
                                        transition: 'all 0.3s'
                                    }}>
                                        {c.toFixed(2).substring(1)} {/* .00, .01, etc */}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, rowIndex) => {
                                const isRowMatch = Math.abs(r - stem) < 0.001;
                                return (
                                    <tr key={rowIndex}>
                                        <th style={{ 
                                            padding: '10px', border: '1px solid var(--border-color)', 
                                            background: isRowMatch ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-color)',
                                            color: isRowMatch ? '#15803d' : 'var(--text-color)',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s'
                                        }}>
                                            {formatRow(r)}
                                        </th>
                                        {cols.map((c, colIndex) => {
                                            const isColMatch = Math.abs(c - leaf) < 0.001;
                                            const isIntersection = isRowMatch && isColMatch;
                                            
                                            // Calcular valor Z real de la celda
                                            const cellZ = isNegative ? r - c : r + c;
                                            // Probabilidad
                                            const prob = jStat.normal.cdf(cellZ, 0, 1).toFixed(4);

                                            return (
                                                <td key={colIndex} style={{
                                                    padding: '10px', 
                                                    border: '1px solid var(--border-color)',
                                                    background: isIntersection ? '#22c55e' : (isRowMatch || isColMatch ? 'rgba(34, 197, 94, 0.1)' : 'transparent'),
                                                    color: isIntersection ? 'white' : 'var(--text-color)',
                                                    fontWeight: isIntersection ? 'bold' : 'normal',
                                                    transform: isIntersection ? 'scale(1.05)' : 'none',
                                                    boxShadow: isIntersection ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                                                    zIndex: isIntersection ? 10 : 1,
                                                    position: isIntersection ? 'relative' : 'static',
                                                    transition: 'all 0.3s',
                                                    cursor: 'default'
                                                }}>
                                                    {prob.substring(1)} {/* .xxxx */}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        padding: '10px 20px', borderRadius: RADIUS, background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
