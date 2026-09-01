import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../../../styles/Temas/Tema3.css';

export default function Controles_Bivariante({ onCalcular }) {
    // 1. Estado inicial: Matriz 2x2
    const [valoresX, setValoresX] = useState(['0', '1']);
    const [valoresY, setValoresY] = useState(['0', '1']);
    const [matrizProbabilidades, setMatrizProbabilidades] = useState([
        ['0.25', '0.25'],
        ['0.25', '0.25']
    ]);

    // Funciones para actualizar valores
    const actualizarValorX = (idx, valor) => {
        const nuevos = [...valoresX];
        nuevos[idx] = valor;
        setValoresX(nuevos);
        onCalcular(null);
    };

    const actualizarValorY = (idx, valor) => {
        const nuevos = [...valoresY];
        nuevos[idx] = valor;
        setValoresY(nuevos);
        onCalcular(null);
    };

    const actualizarProbabilidad = (filaIdx, colIdx, valor) => {
        const nuevaMatriz = matrizProbabilidades.map(fila => [...fila]);
        nuevaMatriz[filaIdx][colIdx] = valor;
        setMatrizProbabilidades(nuevaMatriz);
        onCalcular(null);
    };

    // Funciones para agregar/eliminar filas (X) y columnas (Y)
    const agregarFilaX = () => {
        setValoresX([...valoresX, '']);
        setMatrizProbabilidades([...matrizProbabilidades, Array(valoresY.length).fill('')]);
        onCalcular(null);
    };

    const eliminarFilaX = (idx) => {
        if (valoresX.length <= 1) return;
        setValoresX(valoresX.filter((_, i) => i !== idx));
        setMatrizProbabilidades(matrizProbabilidades.filter((_, i) => i !== idx));
        onCalcular(null);
    };

    const agregarColumnaY = () => {
        setValoresY([...valoresY, '']);
        setMatrizProbabilidades(matrizProbabilidades.map(fila => [...fila, '']));
        onCalcular(null);
    };

    const eliminarColumnaY = (idx) => {
        if (valoresY.length <= 1) return;
        setValoresY(valoresY.filter((_, i) => i !== idx));
        setMatrizProbabilidades(matrizProbabilidades.map(fila => fila.filter((_, i) => i !== idx)));
        onCalcular(null);
    };

    // Validación estricta de la suma
    const sumaProbabilidades = useMemo(() => {
        let suma = 0;
        for (let i = 0; i < matrizProbabilidades.length; i++) {
            for (let j = 0; j < matrizProbabilidades[i].length; j++) {
                const val = parseFloat(matrizProbabilidades[i][j]);
                if (!isNaN(val)) {
                    suma += val;
                }
            }
        }
        return suma;
    }, [matrizProbabilidades]);

    const esSumaValida = Math.abs(sumaProbabilidades - 1) < 0.0001;

    const handleCalcular = () => {
        if (!esSumaValida) return;
        onCalcular({
            matrizProbabilidades,
            valoresX,
            valoresY
        });
    };

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '6px',
        textAlign: 'center',
        outline: 'none',
        fontSize: '0.85rem',
        backgroundColor: 'var(--bg-input, #fff)',
        color: 'var(--text-main, #0f172a)'
    };

    const headerInputStyle = {
        ...inputStyle,
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
        color: '#3b82f6'
    };

    const cellStyle = {
        padding: '8px',
        textAlign: 'center'
    };

    const cardStyle = {
        background: 'transparent',
        color: 'var(--text-main, #1e293b)',
        padding: '5px 0',
        height: '100%',
        boxSizing: 'border-box'
    };

    return (
        <div style={cardStyle}>
            <h3 style={{ marginTop: 0, color: '#3b82f6', fontSize: '1rem', fontWeight: 600, marginBottom: '10px' }}>
                Datos: Distribución Conjunta
            </h3>
            
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', textAlign: 'left', tableLayout: 'auto' }}>
                    <thead>
                        <tr>
                            <th style={cellStyle}>
                                <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', color: '#475569', fontWeight: 'bold' }}>
                                    X \ Y
                                </div>
                            </th>
                            {valoresY.map((y, j) => (
                                <th key={j} style={cellStyle}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <input
                                            type="number"
                                            value={y}
                                            onChange={(e) => actualizarValorY(j, e.target.value)}
                                            style={headerInputStyle}
                                            placeholder={`y${j+1}`}
                                        />
                                        {valoresY.length > 1 && (
                                            <button 
                                                onClick={() => eliminarColumnaY(j)} 
                                                style={{ fontSize: '0.75rem', color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 5px', borderRadius: '4px' }}
                                                title="Eliminar columna Y"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th style={cellStyle}>
                                <button 
                                    onClick={agregarColumnaY} 
                                    style={{ padding: '8px 12px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', border: '1px dashed #a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                >
                                    + Agregar Y
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {valoresX.map((x, i) => (
                            <tr key={i}>
                                <td style={cellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            value={x}
                                            onChange={(e) => actualizarValorX(i, e.target.value)}
                                            style={headerInputStyle}
                                            placeholder={`x${i+1}`}
                                        />
                                        {valoresX.length > 1 && (
                                            <button 
                                                onClick={() => eliminarFilaX(i)} 
                                                style={{ fontSize: '0.75rem', color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                title="Eliminar fila X"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </td>
                                {valoresY.map((y, j) => (
                                    <td key={j} style={cellStyle}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={matrizProbabilidades[i][j]}
                                            onChange={(e) => actualizarProbabilidad(i, j, e.target.value)}
                                            style={inputStyle}
                                            placeholder="P(x,y)"
                                        />
                                    </td>
                                ))}
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={cellStyle}>
                                <button 
                                    onClick={agregarFilaX} 
                                    style={{ padding: '8px 12px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', border: '1px dashed #a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', width: '100%' }}
                                >
                                    + Agregar X
                                </button>
                            </td>
                            <td colSpan={valoresY.length + 1}>
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    backgroundColor: esSumaValida ? '#dcfce7' : '#fee2e2',
                                    color: esSumaValida ? '#166534' : '#991b1b',
                                    border: `1px solid ${esSumaValida ? '#bbf7d0' : '#fecaca'}`,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: 600,
                                    boxSizing: 'border-box'
                                }}>
                                    <span style={{ fontSize: '1.0rem' }}>Suma Total: {sumaProbabilidades.toFixed(4)}</span>
                                    {!esSumaValida && (
                                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                            (Debe ser 1.0)
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                <button
                    className="btn-tema3-active"
                    onClick={handleCalcular}
                    disabled={!esSumaValida}
                    style={{
                        padding: '10px 32px',
                        background: esSumaValida ? '#3b82f6' : '#cbd5e1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: esSumaValida ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s',
                        boxShadow: esSumaValida ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none'
                    }}
                >
                    CALCULAR
                </button>
            </div>
        </div>
    );
}
