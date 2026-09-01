import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Controles_ContinuaPlantilla({ onCalcular }) {
    const [tipoFuncion, setTipoFuncion] = useState('uniforme');
    const [limiteA, setLimiteA] = useState('');
    const [limiteB, setLimiteB] = useState('');
    const [exponenteN, setExponenteN] = useState('1');
    const [coeficienteC, setCoeficienteC] = useState('');

    const handleCalcular = () => {
        onCalcular({
            tipoFuncion,
            a: tipoFuncion === 'exponencial' ? '0' : limiteA,
            b: tipoFuncion === 'exponencial' ? 'Infinity' : limiteB,
            n: exponenteN,
            c: coeficienteC
        });
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '6px',
        outline: 'none',
        fontSize: '0.85rem',
        backgroundColor: 'var(--bg-input, #fff)',
        color: 'var(--text-main, #0f172a)'
    };

    let isValido = false;
    if (tipoFuncion === 'exponencial') {
        isValido = coeficienteC !== '' && parseFloat(coeficienteC) > 0;
    } else {
        isValido = limiteA !== '' && limiteB !== '' && parseFloat(limiteA) < parseFloat(limiteB) && (tipoFuncion !== 'polinomica' || exponenteN !== '');
    }

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    return (
        <div style={{ background: 'transparent', padding: '5px 0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, color: '#3b82f6', fontSize: '1rem', fontWeight: 600, marginBottom: '15px' }}>
                Datos de la Distribución Continua
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Tipo de Función
                    </label>
                    <select
                        style={inputStyle}
                        value={tipoFuncion}
                        onChange={(e) => {
                            setTipoFuncion(e.target.value);
                            onCalcular(null);
                        }}
                    >
                        <option value="uniforme">Uniforme: f(x) = k</option>
                        <option value="polinomica">Polinómica: f(x) = k · xⁿ</option>
                        <option value="exponencial">Exponencial: f(x) = k · e^{-'{cx}'}</option>
                    </select>
                </div>

                {tipoFuncion !== 'exponencial' ? (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                Límite Inf. {renderLatex('(a)')}
                            </label>
                            <input
                                type="number"
                                style={inputStyle}
                                value={limiteA}
                                onChange={(e) => { setLimiteA(e.target.value); onCalcular(null); }}
                                placeholder="Ej. 0"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                Límite Sup. {renderLatex('(b)')}
                            </label>
                            <input
                                type="number"
                                style={inputStyle}
                                value={limiteB}
                                onChange={(e) => { setLimiteB(e.target.value); onCalcular(null); }}
                                placeholder="Ej. 1"
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1, opacity: 0.7 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                Límite Inf. {renderLatex('(a)')}
                            </label>
                            <input type="text" style={inputStyle} value="0" disabled />
                        </div>
                        <div style={{ flex: 1, opacity: 0.7 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                Límite Sup. {renderLatex('(b)')}
                            </label>
                            <input type="text" style={inputStyle} value="∞" disabled />
                        </div>
                    </div>
                )}

                {tipoFuncion === 'polinomica' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            Exponente {renderLatex('(n)')}
                        </label>
                        <input
                            type="number"
                            style={inputStyle}
                            value={exponenteN}
                            onChange={(e) => { setExponenteN(e.target.value); onCalcular(null); }}
                            placeholder="Ej. 2"
                        />
                    </div>
                )}

                {tipoFuncion === 'exponencial' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            Coeficiente {renderLatex('(c)')}
                        </label>
                        <input
                            type="number"
                            style={inputStyle}
                            value={coeficienteC}
                            onChange={(e) => { setCoeficienteC(e.target.value); onCalcular(null); }}
                            placeholder="Ej. 2"
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleCalcular}
                    disabled={!isValido}
                    style={{
                        padding: '10px 32px',
                        background: isValido ? '#3b82f6' : '#cbd5e1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: isValido ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s',
                        boxShadow: isValido ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none'
                    }}
                >
                    CALCULAR
                </button>
            </div>
            {tipoFuncion !== 'exponencial' && limiteA !== '' && limiteB !== '' && parseFloat(limiteA) >= parseFloat(limiteB) && (
                <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                    El límite inferior debe ser menor al límite superior.
                </div>
            )}
            {tipoFuncion === 'exponencial' && coeficienteC !== '' && parseFloat(coeficienteC) <= 0 && (
                <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                    El coeficiente (c) debe ser mayor a 0.
                </div>
            )}
        </div>
    );
}
