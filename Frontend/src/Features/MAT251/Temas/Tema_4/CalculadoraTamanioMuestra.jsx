import React, { useState } from 'react';
import { cardStyle, labelStyle, RADIUS, FS } from '../../Principal/Constantes';
import Latex from '../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../ui/iconos';

export default function CalculadoraTamanioMuestra() {
    // 1. Estados
    const [tipoParametro, setTipoParametro] = useState('media'); // 'media' o 'proporcion'
    const [tipoPoblacion, setTipoPoblacion] = useState('infinita'); // 'infinita' o 'finita'
    const [nivelConfianza, setNivelConfianza] = useState(1.96); // Z por defecto 95%
    
    // Inputs numéricos
    const [error, setError] = useState(''); // e
    const [poblacionN, setPoblacionN] = useState(''); // N
    const [desviacion, setDesviacion] = useState(''); // sigma
    const [probExito, setProbExito] = useState(''); // p
    
    // Resultados
    const [resultados, setResultados] = useState(null);

    // Constantes Z
    const opcionesConfianza = [
        { label: '90%', valor: 1.645 },
        { label: '95%', valor: 1.96 },
        { label: '97%', valor: 2.17 },
        { label: '99%', valor: 2.576 },
    ];

    // Lógica Matemática
    const calcularMuestra = () => {
        const Z = parseFloat(nivelConfianza);
        const e = parseFloat(error);
        const N = parseFloat(poblacionN);
        const s = parseFloat(desviacion);
        let p = parseFloat(probExito);

        // Validaciones básicas
        if (isNaN(Z) || isNaN(e) || e <= 0) {
            alert("Por favor, ingresa un valor de error válido (mayor a 0).");
            return;
        }

        let nCalculado = 0;
        let formulaLaTeX = '';
        let formulaConValores = '';

        if (tipoParametro === 'media') {
            if (isNaN(s) || s <= 0) {
                alert("Por favor, ingresa una desviación estándar válida (mayor a 0).");
                return;
            }

            if (tipoPoblacion === 'infinita') {
                nCalculado = Math.ceil((Math.pow(Z, 2) * Math.pow(s, 2)) / Math.pow(e, 2));
                formulaLaTeX = `n = \\frac{Z^2 \\cdot \\sigma^2}{e^2}`;
                formulaConValores = `n = \\frac{(${Z})^2 \\cdot (${s})^2}{(${e})^2}`;
            } else {
                if (isNaN(N) || N <= 1) {
                    alert("Por favor, ingresa un tamaño de población (N) mayor a 1.");
                    return;
                }
                const numerador = Math.pow(Z, 2) * Math.pow(s, 2) * N;
                const denominador = (Math.pow(Z, 2) * Math.pow(s, 2)) + (Math.pow(e, 2) * (N - 1));
                nCalculado = Math.ceil(numerador / denominador);
                formulaLaTeX = `n = \\frac{Z^2 \\cdot \\sigma^2 \\cdot N}{Z^2 \\cdot \\sigma^2 + e^2 \\cdot (N - 1)}`;
                formulaConValores = `n = \\frac{(${Z})^2 \\cdot (${s})^2 \\cdot ${N}}{(${Z})^2 \\cdot (${s})^2 + (${e})^2 \\cdot (${N} - 1)}`;
            }
        } else {
            // Proporción
            if (isNaN(p) || p <= 0 || p >= 1) {
                alert("Por favor, ingresa una probabilidad de éxito (p) entre 0 y 1. (Ej. 0.5)");
                return;
            }
            const q = 1 - p;

            if (tipoPoblacion === 'infinita') {
                nCalculado = Math.ceil((Math.pow(Z, 2) * p * q) / Math.pow(e, 2));
                formulaLaTeX = `n = \\frac{Z^2 \\cdot P \\cdot Q}{e^2}`;
                formulaConValores = `n = \\frac{(${Z})^2 \\cdot (${p.toFixed(2)}) \\cdot (${q.toFixed(2)})}{(${e})^2}`;
            } else {
                if (isNaN(N) || N <= 1) {
                    alert("Por favor, ingresa un tamaño de población (N) mayor a 1.");
                    return;
                }
                const numerador = Math.pow(Z, 2) * p * q * N;
                const denominador = (Math.pow(Z, 2) * p * q) + (Math.pow(e, 2) * (N - 1));
                nCalculado = Math.ceil(numerador / denominador);
                formulaLaTeX = `n = \\frac{Z^2 \\cdot P \\cdot Q \\cdot N}{Z^2 \\cdot P \\cdot Q + e^2 \\cdot (N - 1)}`;
                formulaConValores = `n = \\frac{(${Z})^2 \\cdot (${p.toFixed(2)}) \\cdot (${q.toFixed(2)}) \\cdot ${N}}{(${Z})^2 \\cdot (${p.toFixed(2)}) \\cdot (${q.toFixed(2)}) + (${e})^2 \\cdot (${N} - 1)}`;
            }
        }

        setResultados({
            n: nCalculado,
            formulaLaTeX,
            formulaConValores
        });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', alignItems: 'start' }}>
            
            {/* PANEL IZQUIERDO: CONTROLES */}
            <div style={{ ...cardStyle }}>
                <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '0 0 15px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    Parámetros de Cálculo
                </h3>

                {/* Toggles */}
                <div style={{ marginBottom: '20px' }}>
                    <span style={labelStyle}>Parámetro a Estimar</span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button
                            onClick={() => { setTipoParametro('media'); setResultados(null); }}
                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: `1px solid ${tipoParametro === 'media' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoParametro === 'media' ? 'rgba(0,123,255,0.1)' : 'white', color: tipoParametro === 'media' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoParametro === 'media' ? 'bold' : 'normal' }}
                        >
                            Media (μ)
                        </button>
                        <button
                            onClick={() => { setTipoParametro('proporcion'); setResultados(null); }}
                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: `1px solid ${tipoParametro === 'proporcion' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoParametro === 'proporcion' ? 'rgba(0,123,255,0.1)' : 'white', color: tipoParametro === 'proporcion' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoParametro === 'proporcion' ? 'bold' : 'normal' }}
                        >
                            Proporción (P)
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <span style={labelStyle}>Tipo de Población</span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button
                            onClick={() => { setTipoPoblacion('infinita'); setResultados(null); }}
                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: `1px solid ${tipoPoblacion === 'infinita' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoPoblacion === 'infinita' ? 'rgba(0,123,255,0.1)' : 'transparent', color: tipoPoblacion === 'infinita' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoPoblacion === 'infinita' ? 'bold' : 'normal' }}
                        >
                            Infinita
                        </button>
                        <button
                            onClick={() => { setTipoPoblacion('finita'); setResultados(null); }}
                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: `1px solid ${tipoPoblacion === 'finita' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoPoblacion === 'finita' ? 'rgba(0,123,255,0.1)' : 'transparent', color: tipoPoblacion === 'finita' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoPoblacion === 'finita' ? 'bold' : 'normal' }}
                        >
                            Finita (Se conoce N)
                        </button>
                    </div>
                </div>

                {/* Select Nivel de Confianza */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Nivel de Confianza (Z)</label>
                    <select
                        value={nivelConfianza}
                        onChange={(e) => { setNivelConfianza(parseFloat(e.target.value)); setResultados(null); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                        {opcionesConfianza.map(opc => (
                            <option key={opc.valor} value={opc.valor}>{opc.label} (Z = {opc.valor})</option>
                        ))}
                    </select>
                </div>

                {/* Input Error */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Error Máximo Permitido (e)</label>
                    <input
                        type="number"
                        placeholder="Ej. 5 o 0.05"
                        value={error}
                        onChange={(e) => { setError(e.target.value); setResultados(null); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                </div>

                {/* Inputs Condicionales */}
                {tipoPoblacion === 'finita' && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Tamaño de la Población (N)</label>
                        <input
                            type="number"
                            placeholder="Ej. 1250"
                            value={poblacionN}
                            onChange={(e) => { setPoblacionN(e.target.value); setResultados(null); }}
                            style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                    </div>
                )}

                {tipoParametro === 'media' && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Desviación Estándar (σ o S)</label>
                        <input
                            type="number"
                            placeholder="Ej. 150"
                            value={desviacion}
                            onChange={(e) => { setDesviacion(e.target.value); setResultados(null); }}
                            style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                    </div>
                )}

                {tipoParametro === 'proporcion' && (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Probabilidad de Éxito (P)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="Ej. 0.5"
                                value={probExito}
                                onChange={(e) => { setProbExito(e.target.value); setResultados(null); }}
                                style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Probabilidad de Fracaso (Q = 1 - P)</label>
                            <input
                                type="text"
                                value={probExito && !isNaN(parseFloat(probExito)) ? (1 - parseFloat(probExito)).toFixed(2) : ''}
                                readOnly
                                disabled
                                style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', background: '#f3f4f6' }}
                            />
                        </div>
                    </>
                )}

                <button
                    onClick={calcularMuestra}
                    style={{ width: '100%', padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}
                >
                    <IconoCalculadora width={18} height={18} color="white" />
                    CALCULAR
                </button>
            </div>

            {/* PANEL DERECHO: RESULTADOS */}
            <div style={{ ...cardStyle, background: 'var(--bg-card)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '0 0 15px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    Resultados y Desarrollo
                </h3>

                {!resultados ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                        Ingresa los parámetros y presiona "Calcular" para ver el tamaño de muestra recomendado.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={{ background: 'var(--header-bg, #f3f4f6)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: FS.sm }}>Fórmula General:</div>
                            <div className="thin-scrollbar" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                                <Latex formula={resultados.formulaLaTeX} />
                            </div>
                        </div>

                        <div style={{ background: 'var(--header-bg, #f3f4f6)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: FS.sm }}>Sustitución de Valores:</div>
                            <div className="thin-scrollbar" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                                <Latex formula={resultados.formulaConValores} />
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: RADIUS, border: '2px dashed var(--primary-color)', textAlign: 'center' }}>
                            <div style={{ fontSize: FS.sm, color: 'var(--primary-color)', marginBottom: '5px', fontWeight: 600 }}>
                                TAMAÑO DE MUESTRA ESTIMADO (n)
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {resultados.n}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
