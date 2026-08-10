import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FONT, RADIUS, FS } from '../../../Principal/Constantes';
import { jStat } from 'jstat';

export default function ModalTablaF({ isOpen, onClose, d1, d2, xValue, pValue, modo }) {
    if (!isOpen || d1 === undefined || d2 === undefined) return null;

    const [alfa, setAlfa] = useState(0.05);
    const rowRef = useRef(null);

    // Generamos las columnas d1: 1 a 10. Si d1 > 10, lo incluimos al final.
    const columns = useMemo(() => {
        let cols = Array.from({ length: 12 }, (_, i) => i + 1);
        [15, 20, 30].forEach(v => { if (!cols.includes(v)) cols.push(v); });
        const pD1 = parseInt(d1);
        if (!cols.includes(pD1)) cols.push(pD1);
        cols.sort((a, b) => a - b);
        return cols;
    }, [d1]);

    // Generamos las filas d2: 1 a 30, 40, 60, 120
    const rows = useMemo(() => {
        let rs = Array.from({ length: 30 }, (_, i) => i + 1);
        [40, 60, 120].forEach(v => { if (!rs.includes(v)) rs.push(v); });
        const pD2 = parseInt(d2);
        if (!rs.includes(pD2)) rs.push(pD2);
        rs.sort((a, b) => a - b);
        return rs;
    }, [d2]);

    useEffect(() => {
        if (isOpen && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isOpen, alfa]);

    const valorInterseccion = useMemo(() => {
        try {
            return jStat.centralF.inv(1 - alfa, d1, d2).toFixed(4);
        } catch(e) {
            return "...";
        }
    }, [alfa, d1, d2]);

    const educationalExplanation = useMemo(() => {
        if (pValue === null || xValue === null) return null;
        const valorCalculadoF = xValue.toFixed(4);
        const probExacta = (pValue * 100).toFixed(2);
        const probExactaMayor = ((1 - pValue) * 100).toFixed(2);
        const alfaPercent = (alfa * 100).toFixed(0);

        const isMenor = modo === 'menor' || modo === 'entre';

        let comparisonText = "";
        if (parseFloat(valorCalculadoF) > parseFloat(valorInterseccion)) {
            comparisonText = `Como tu valor calculado es MAYOR al de la tabla, significa que tu probabilidad está aún más arrinconada en la cola, por lo que el área a la derecha es MENOR al ${alfaPercent}%.`;
        } else {
            comparisonText = `Como tu valor calculado es MENOR al de la tabla, significa que tu probabilidad está más hacia el centro, por lo que el área a la derecha es MAYOR al ${alfaPercent}%.`;
        }

        return (
            <div style={{ padding: '15px', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: RADIUS, marginBottom: '20px', color: '#0369a1', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: FS.sm, animation: 'fadeInDropdown 0.3s ease' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ¿Cómo leer la tabla F?
                </div>
                <div>
                    Estás viendo la tabla para un área del <strong>{alfaPercent}%</strong> (Cola superior). Cruzando tus grados de libertad (Columna <strong>d1={d1}</strong> y Fila <strong>d2={d2}</strong>), el valor crítico de la tabla es <strong style={{color: '#0284c7'}}>{valorInterseccion}</strong>.
                </div>
                <div>
                    Tu valor calculado de F es <strong style={{color: '#0284c7'}}>{valorCalculadoF}</strong>.
                </div>
                <div>
                    {comparisonText}
                </div>
                {isMenor ? (
                    <div>
                        Como tú estás buscando la probabilidad <strong>MENOR QUE</strong> (área a la izquierda), nuestro cálculo computacional exacto confirma esto: <strong>{probExacta}%</strong>.
                    </div>
                ) : (
                    <div>
                        Como tú estás buscando la probabilidad <strong>MAYOR QUE</strong> (área a la derecha), nuestro cálculo computacional exacto confirma esto: <strong>{probExactaMayor}%</strong>.
                    </div>
                )}
            </div>
        );
    }, [xValue, pValue, alfa, d1, d2, valorInterseccion, modo]);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary-color)' }}>Tabla F de Fisher</h3>
                        <div style={{ fontSize: FS.sm, color: 'var(--text-muted)', marginTop: '5px' }}>
                            Valores Críticos (Área de Cola Superior)
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                {educationalExplanation}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setAlfa(0.05)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                            background: alfa === 0.05 ? 'var(--primary-color)' : 'var(--bg-input)',
                            color: alfa === 0.05 ? 'white' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        α = 0.05 (5%)
                    </button>
                    <button 
                        onClick={() => setAlfa(0.01)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                            background: alfa === 0.01 ? 'var(--primary-color)' : 'var(--bg-input)',
                            color: alfa === 0.01 ? 'white' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        α = 0.01 (1%)
                    </button>
                </div>

                <div style={{ overflow: 'auto', flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: RADIUS }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', fontFamily: 'monospace' }}>
                        <thead style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <tr>
                                <th style={{ padding: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, left: 0, zIndex: 25 }}>
                                    d2 \ d1
                                </th>
                                {columns.map((colD1, i) => {
                                    const isHighlight = colD1 === parseInt(d1);
                                    let bg = isHighlight ? '#dcfce7' : 'var(--bg-card)';
                                    let color = isHighlight ? '#15803d' : 'var(--text-color)';
                                    return (
                                        <th key={i} style={{ 
                                            padding: '10px', border: '1px solid var(--border-color)', 
                                            background: bg, color: color, fontWeight: 'bold', borderBottom: '2px solid var(--border-color)',
                                            position: 'sticky', top: 0, zIndex: 20
                                        }}>
                                            {colD1}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((rowD2) => {
                                const isRowMatch = rowD2 === parseInt(d2);
                                return (
                                    <tr key={rowD2} ref={isRowMatch ? rowRef : null}>
                                        <th style={{ 
                                            padding: '8px', border: '1px solid var(--border-color)', 
                                            background: isRowMatch ? '#f0fdf4' : 'var(--bg-color)',
                                            color: isRowMatch ? 'var(--primary-color)' : 'var(--text-muted)',
                                            fontWeight: 'bold',
                                            position: 'sticky', left: 0, zIndex: 1
                                        }}>
                                            {rowD2}
                                        </th>
                                        {columns.map((colD1, colIndex) => {
                                            const isExactHighlight = isRowMatch && colD1 === parseInt(d1);
                                            let cellValue = "...";
                                            try {
                                                cellValue = jStat.centralF.inv(1 - alfa, colD1, rowD2).toFixed(4);
                                            } catch(e) {}
                                            
                                            let tdBg = 'var(--bg-color)';
                                            let tdColor = 'var(--text-color)';
                                            let tdWeight = 'normal';
                                            let tdTransform = 'none';
                                            let tdZIndex = 'auto';
                                            let tdShadow = 'none';

                                            if (isExactHighlight) {
                                                tdBg = '#22c55e';
                                                tdColor = 'white';
                                                tdWeight = 'bold';
                                                tdTransform = 'scale(1.1)';
                                                tdZIndex = 10;
                                                tdShadow = '0 4px 10px rgba(34, 197, 94, 0.4)';
                                            } else if (isRowMatch || colD1 === parseInt(d1)) {
                                                tdBg = '#f0fdf4';
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
                                                    position: isExactHighlight ? 'relative' : 'static',
                                                    transition: 'all 0.2s',
                                                    cursor: 'default'
                                                }}>
                                                    {cellValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
