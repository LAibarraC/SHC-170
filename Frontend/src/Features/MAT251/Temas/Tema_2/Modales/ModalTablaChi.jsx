import React, { useMemo, useEffect, useRef } from 'react';
import { FONT, RADIUS, FS } from '../../../Principal/Constantes';
import { jStat } from 'jstat';

export default function ModalTablaChi({ isOpen, onClose, k, xValue, pValue, modo }) {
    if (!isOpen || k === undefined || k === null) return null;

    const rowRef = useRef(null);

    // Columnas típicas de la tabla Chi-Cuadrado (Área de cola superior)
    const columns = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005];

    const { matchScenario, matchData } = useMemo(() => {
        let scenario = null;
        let data = {};

        if (pValue !== undefined && pValue !== null) {
            // pValue en nuestras distribuciones continuas (modo 'menor') es el área inferior.
            // Para el modo 'mayor', pValue ya era el área superior.
            // Wait, the parent component passes pX1.
            // En ResultadoDistribucionContinua_v2, pX1 = jStat.chisquare.cdf(x1, k).
            // This is ALWAYS the lower tail probability!
            // So areaUpper is always 1 - pValue.
            const areaUpper = 1 - pValue;

            // Scenario A: Exact/Close match
            let exactMatchIdx = -1;
            columns.forEach((col, idx) => {
                if (Math.abs(col - areaUpper) < 0.01) {
                    exactMatchIdx = idx;
                }
            });

            if (exactMatchIdx !== -1) {
                scenario = 'A';
                data = { colIndex: exactMatchIdx };
            } 
            // Scenario C: Out of bounds
            // columns[0] is 0.995, columns[last] is 0.005
            else if (areaUpper > columns[0]) {
                scenario = 'C';
                data = { message: "cola inferior extrema" };
            } else if (areaUpper < columns[columns.length - 1]) {
                scenario = 'C';
                data = { message: "cola superior extrema" };
            } 
            // Scenario B: In between
            else {
                let leftIdx = -1;
                for (let i = 0; i < columns.length - 1; i++) {
                    // Since columns are descending (0.995, 0.99, ... 0.005)
                    if (areaUpper < columns[i] && areaUpper > columns[i+1]) {
                        leftIdx = i;
                        break;
                    }
                }
                if (leftIdx !== -1) {
                    scenario = 'B';
                    data = {
                        colLeftIdx: leftIdx,
                        colRightIdx: leftIdx + 1,
                        colLeftLabel: columns[leftIdx].toFixed(3).replace(/^0/, ''),
                        colRightLabel: columns[leftIdx + 1].toFixed(3).replace(/^0/, '')
                    };
                }
            }
        }
        return { matchScenario: scenario, matchData: data };
    }, [pValue, columns]);

    const maxRows = Math.max(35, k + 5);
    const rows = Array.from({ length: maxRows }, (_, i) => i + 1);

    // Desplazamiento automático hacia la fila 'k'
    useEffect(() => {
        if (isOpen && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isOpen]);

    const educationalExplanation = useMemo(() => {
        if (!isOpen || pValue === null || pValue === undefined || xValue === null) return null;
        
        const areaUpper = 1 - pValue;
        
        // Encuentra la columna más cercana
        let closestIdx = 0;
        let minDiff = Infinity;
        
        columns.forEach((col, idx) => {
            const diff = Math.abs(col - areaUpper);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
            }
        });
        
        const columnHeader = columns[closestIdx]; // ej 0.950
        
        // Obtiene el valor exacto de la tabla (closestValue)
        let closestValue = 0;
        try {
            closestValue = jStat.chisquare.inv(1 - columnHeader, k).toFixed(3);
        } catch (e) {
            closestValue = "...";
        }
        
        const valorUsuario = xValue.toFixed(3);
        const resultadoExacto = (pValue * 100).toFixed(2);
        const resultadoExactoMayor = ((1 - pValue) * 100).toFixed(2);
        const columnPercent = (columnHeader * 100).toFixed(1);
        const inversePercent = ((1 - columnHeader) * 100).toFixed(1);

        const isMenor = modo === 'menor' || modo === 'entre'; 
        
        return (
            <div style={{ padding: '15px', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: RADIUS, marginBottom: '20px', color: '#0369a1', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: FS.sm, animation: 'fadeInDropdown 0.3s ease' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ¿Cómo leer este resultado en la tabla?
                </div>
                <div>
                    El valor que ingresaste (<strong style={{color: '#0284c7'}}>X² = {valorUsuario}</strong>) rara vez existe de forma exacta en las tablas impresas tradicionales. El número más cercano en la fila <strong>k={k}</strong> es <strong style={{color: '#0284c7'}}>{closestValue}</strong>.
                </div>
                <div>
                    En la tabla, este número está bajo la columna de <strong>{columnHeader.toFixed(3)}</strong>. Como la tabla Chi-Cuadrado por convención muestra el área de la cola derecha, esto significa que hay un <strong>{columnPercent}%</strong> de probabilidad de ser MAYOR a ese número.
                </div>
                {isMenor ? (
                    <>
                        <div>
                            Como tú estás buscando la probabilidad <strong>MENOR QUE</strong>, la tabla te diría que es el complemento:<br/>
                            <code style={{background: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: '4px'}}>1 - {columnHeader.toFixed(3)} = {(1 - columnHeader).toFixed(3)} ({inversePercent}%)</code>
                        </div>
                        <div>
                            Compara ese {inversePercent}% de la tabla clásica con nuestro <strong>cálculo computacional exacto ({resultadoExacto}%)</strong>. ¡La tabla impresa es solo una guía para darte una buena aproximación!
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            Como tú estás buscando la probabilidad <strong>MAYOR QUE</strong>, el valor de la tabla nos daría directamente un <strong>{columnPercent}%</strong> aproximado.
                        </div>
                        <div>
                            Compara ese {columnPercent}% de la tabla clásica con nuestro <strong>cálculo computacional exacto ({resultadoExactoMayor}%)</strong>. ¡La tabla impresa es solo una guía para darte una buena aproximación!
                        </div>
                    </>
                )}
            </div>
        );
    }, [isOpen, pValue, xValue, k, modo, columns]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
            animation: 'fadeInDropdown 0.3s ease'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '25px', borderRadius: RADIUS, width: '95%', maxWidth: '900px',
                fontFamily: FONT, color: 'var(--text-color)', border: '1px solid var(--border-color)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Tabla de Distribución Chi-Cuadrado (<span style={{ fontFamily: 'Times New Roman, serif' }}>χ²</span>)</h3>
                        <div style={{ fontSize: FS.sm, color: 'var(--text-muted)', marginTop: '5px' }}>
                            Mostrando valores críticos para los Grados de Libertad: <strong style={{color: 'var(--text-color)'}}>k = {k}</strong>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                {matchScenario === 'B' && (
                    <div style={{ padding: '12px 15px', background: '#fef3c7', border: '1px solid #fde047', borderRadius: RADIUS, marginBottom: '15px', color: '#854d0e', display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeInDropdown 0.3s ease' }}>
                        <div style={{ fontSize: FS.sm, lineHeight: 1.5 }}>
                            <strong>Análisis Inteligente:</strong> Tu valor calculado (<strong style={{color: '#9a3412'}}>X² = {xValue?.toFixed(3)}</strong>) cae en la zona intermedia entre las columnas <strong>{matchData.colLeftLabel}</strong> y <strong>{matchData.colRightLabel}</strong>. Las tablas clásicas impresas omiten estos valores centrales por espacio, pero el cálculo computacional exacto que realizamos arroja un área de <strong style={{color: '#9a3412'}}>{pValue?.toFixed(4)}</strong>. Hemos resaltado el rango en el que se encuentra.
                        </div>
                    </div>
                )}

                {matchScenario === 'C' && (
                    <div style={{ padding: '12px 15px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: RADIUS, marginBottom: '15px', color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeInDropdown 0.3s ease' }}>
                        <div style={{ fontSize: '18px' }}>⚠️</div>
                        <div style={{ fontSize: FS.sm, lineHeight: 1.5 }}>
                            <strong>Fuera de Rango:</strong> Tu valor calculado (<strong style={{color: '#7f1d1d'}}>X² = {xValue?.toFixed(3)}</strong>) está fuera de los límites estándar de esta tabla impresa ({matchData.message}). El cálculo computacional exacto es <strong style={{color: '#7f1d1d'}}>{pValue?.toFixed(4)}</strong>.
                        </div>
                    </div>
                )}

                {educationalExplanation}

                <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: RADIUS, marginBottom: '20px', border: '1px dashed var(--border-color)', display: matchScenario === 'A' ? 'block' : 'none' }}>
                    <p style={{ margin: 0, fontSize: FS.sm }}>
                        La tabla muestra los valores críticos de <span style={{ fontFamily: 'Times New Roman, serif' }}>χ²</span> para distintos Grados de Libertad (filas) y Áreas en la Cola Superior (columnas). Tu valor <strong>X² = {xValue?.toFixed(3)}</strong> coincide directamente con una columna estándar.
                    </p>
                </div>

                <div style={{ overflow: 'auto', flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: RADIUS }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', fontFamily: 'monospace' }}>
                        <thead style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <tr>
                                <th style={{ padding: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, left: 0, zIndex: 25 }}>
                                    gl \ α
                                </th>
                                {columns.map((col, i) => {
                                    let isHighlight = false;
                                    let isRange = false;
                                    if (matchScenario === 'A' && matchData.colIndex === i) isHighlight = true;
                                    if (matchScenario === 'B' && (matchData.colLeftIdx === i || matchData.colRightIdx === i)) isRange = true;
                                    
                                    let bg = 'var(--bg-card)';
                                    let color = 'var(--text-color)';
                                    if (isHighlight) {
                                        bg = '#dcfce7';
                                        color = '#15803d';
                                    } else if (isRange) {
                                        bg = '#fef08a';
                                        color = '#a16207';
                                    }

                                    return (
                                        <th key={i} style={{ 
                                            padding: '10px', border: '1px solid var(--border-color)', 
                                            background: bg, color: color, fontWeight: 'bold', borderBottom: '2px solid var(--border-color)',
                                            position: 'sticky', top: 0, zIndex: 20
                                        }}>
                                            {col.toFixed(3).replace(/^0/, '')}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((rowK) => {
                                const isRowMatch = rowK === k;
                                return (
                                    <tr key={rowK} ref={isRowMatch ? rowRef : null}>
                                        <th style={{ 
                                            padding: '8px', border: '1px solid var(--border-color)', 
                                            background: isRowMatch ? '#f0fdf4' : 'var(--bg-color)',
                                            color: isRowMatch ? 'var(--primary-color)' : 'var(--text-muted)',
                                            fontWeight: 'bold',
                                            position: 'sticky', left: 0, zIndex: 1
                                        }}>
                                            {rowK}
                                        </th>
                                        {columns.map((colProb, colIndex) => {
                                            let isExactHighlight = matchScenario === 'A' && matchData.colIndex === colIndex && isRowMatch;
                                            let isRangeHighlight = matchScenario === 'B' && (matchData.colLeftIdx === colIndex || matchData.colRightIdx === colIndex) && isRowMatch;
                                            
                                            // Valor crítico de Chi-Cuadrado
                                            let criticalValue = 0;
                                            try {
                                                criticalValue = jStat.chisquare.inv(1 - colProb, rowK).toFixed(3);
                                            } catch (e) {
                                                criticalValue = "-";
                                            }

                                            let tdBg = isRowMatch ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-color)';
                                            let tdColor = 'var(--text-color)';
                                            let tdWeight = 'normal';
                                            let tdTransform = 'none';
                                            let tdZIndex = 0;
                                            let tdShadow = 'none';

                                            if (isExactHighlight) {
                                                tdBg = '#22c55e'; // Verde vibrante
                                                tdColor = 'white';
                                                tdWeight = 'bold';
                                                tdTransform = 'scale(1.1)';
                                                tdZIndex = 10;
                                                tdShadow = '0 4px 10px rgba(34, 197, 94, 0.4)';
                                            } else if (isRangeHighlight) {
                                                tdBg = '#fef08a'; // Amarillo tenue
                                                tdColor = '#854d0e';
                                                tdWeight = 'bold';
                                                tdTransform = 'scale(1.05)';
                                                tdZIndex = 5;
                                                tdShadow = '0 2px 5px rgba(234, 179, 8, 0.2)';
                                            }

                                            return (
                                                <td key={colIndex} style={{
                                                    padding: '8px', 
                                                    border: '1px solid var(--border-color)',
                                                    background: tdBg,
                                                    color: tdColor,
                                                    fontWeight: tdWeight,
                                                    transform: tdTransform,
                                                    boxShadow: tdShadow,
                                                    zIndex: tdZIndex,
                                                    position: (isExactHighlight || isRangeHighlight) ? 'relative' : 'static',
                                                    transition: 'all 0.2s',
                                                    cursor: 'default'
                                                }}>
                                                    {criticalValue}
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
