import React, { useState } from 'react';
import { FONT, RADIUS, FS } from '../../../Principal/Constantes';
import { jStat } from 'jstat';
import Latex from '../../../../../components/excel/Latex';

export default function ModalProbabilidades_v2({ isOpen, onClose, tipo, parametros, onAreaCalculada }) {
    const [modo, setModo] = useState('menor'); // menor, mayor, entre
    const [valX, setValX] = useState('');
    const [valX2, setValX2] = useState('');
    const [resultadoProb, setResultadoProb] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const calcularProbabilidad = () => {
        setErrorMsg(null);
        setResultadoProb(null);

        let p = 0;
        const x = parseFloat(valX);
        const x2 = parseFloat(valX2);

        if (isNaN(x)) {
            setErrorMsg('Ingresa un valor válido para x.');
            return;
        }

        try {
            // Función Helper para obtener CDF de la distribución actual
            const getCDF = (val) => {
                switch (tipo) {
                    case 'normal':
                        return jStat.normal.cdf(val, parseFloat(parametros.mu), parseFloat(parametros.sigma));
                    case 'estandar':
                        return jStat.normal.cdf(val, 0, 1);
                    case 'chi-cuadrado':
                        return val < 0 ? 0 : jStat.chisquare.cdf(val, parseInt(parametros.k));
                    case 'fisher':
                        return val < 0 ? 0 : jStat.centralF.cdf(val, parseInt(parametros.d1), parseInt(parametros.d2));
                    default:
                        return 0;
                }
            };

            if (modo === 'menor') {
                p = getCDF(x);
                if (onAreaCalculada) onAreaCalculada({ x1: null, x2: x });
            } else if (modo === 'mayor') {
                p = 1 - getCDF(x);
                if (onAreaCalculada) onAreaCalculada({ x1: x, x2: null });
            } else if (modo === 'entre') {
                if (isNaN(x2)) {
                    setErrorMsg('Ingresa un valor válido para el segundo límite.');
                    return;
                }
                if (x >= x2) {
                    setErrorMsg('El límite inferior debe ser menor que el límite superior.');
                    return;
                }
                p = getCDF(x2) - getCDF(x);
                if (onAreaCalculada) onAreaCalculada({ x1: x, x2: x2 });
            }

            setResultadoProb(p);
        } catch (err) {
            setErrorMsg("Ocurrió un error al calcular la probabilidad.");
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '25px', borderRadius: RADIUS, width: '90%', maxWidth: '500px',
                fontFamily: FONT, color: 'var(--text-color)', border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Cálculo de Probabilidades (Área)</h3>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                <p style={{ fontSize: FS.sm, marginBottom: '20px' }}>
                    Calcula probabilidades teóricas exactas utilizando funciones CDF para la distribución <strong>{tipo?.toUpperCase()}</strong>.
                </p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: FS.sm }}>Tipo de Probabilidad:</label>
                    <select 
                        value={modo} 
                        onChange={e => { 
                            setModo(e.target.value); 
                            setResultadoProb(null); 
                            setErrorMsg(null); 
                            if (onAreaCalculada) onAreaCalculada({ x1: null, x2: null });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', fontSize: FS.sm, background: 'var(--bg-input)' }}
                    >
                        <option value="menor">Menor que: P(X &lt; x)</option>
                        <option value="mayor">Mayor que: P(X &gt; x)</option>
                        <option value="entre">Entre dos valores: P(x1 &lt; X &lt; x2)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: FS.sm }}>{modo === 'entre' ? 'Límite Inferior (x1):' : 'Valor (x):'}</label>
                        <input type="number" value={valX} onChange={e => setValX(e.target.value)} step="any" style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }} />
                    </div>
                    {modo === 'entre' && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: FS.sm }}>Límite Superior (x2):</label>
                            <input type="number" value={valX2} onChange={e => setValX2(e.target.value)} step="any" style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }} />
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: RADIUS, fontSize: FS.sm, marginBottom: '15px' }}>
                        {errorMsg}
                    </div>
                )}

                {resultadoProb !== null && (
                    <div style={{ padding: '15px', background: 'var(--bg-color)', border: '1px solid var(--primary-color)', borderRadius: RADIUS, marginBottom: '15px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>Resultado:</h4>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                            {modo === 'menor' && <Latex formula={`P(X < ${valX}) = ${resultadoProb.toFixed(4)}`} />}
                            {modo === 'mayor' && <Latex formula={`P(X > ${valX}) = ${resultadoProb.toFixed(4)}`} />}
                            {modo === 'entre' && <Latex formula={`P(${valX} < X < ${valX2}) = ${resultadoProb.toFixed(4)}`} />}
                        </div>
                        <div style={{ marginTop: '5px', fontSize: FS.xs, color: 'var(--text-muted)' }}>
                            {(resultadoProb * 100).toFixed(2)}% de probabilidad (Área bajo la curva)
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px', borderRadius: RADIUS, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', cursor: 'pointer'
                    }}>Cerrar</button>
                    <button onClick={calcularProbabilidad} style={{
                        padding: '8px 16px', borderRadius: RADIUS, background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                    }}>Calcular</button>
                </div>
            </div>
        </div>
    );
}
