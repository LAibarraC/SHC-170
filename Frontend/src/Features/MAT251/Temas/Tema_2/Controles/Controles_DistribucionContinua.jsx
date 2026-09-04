import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Controles_DistribucionContinua({ onCalcular }) {
    const [funcionFx, setFuncionFx] = useState('2*x');
    const [limiteA, setLimiteA] = useState('0');
    const [limiteB, setLimiteB] = useState('1');

    const handleCalcular = () => {
        onCalcular({
            funcionFx,
            a: parseFloat(limiteA),
            b: parseFloat(limiteB)
        });
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '8px',
        outline: 'none',
        fontSize: '0.9rem',
        backgroundColor: 'var(--bg-input, #1e293b)',
        color: 'var(--text-main, #f8fafc)',
        transition: 'border-color 0.2s ease',
    };

    const isValido = funcionFx.trim() !== '' && limiteA !== '' && limiteB !== '' && parseFloat(limiteA) < parseFloat(limiteB);

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    return (
        <div style={{ background: 'transparent', padding: '5px 0', height: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, color: '#0ea5e9', fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>
                Datos de la Distribución Continua
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                        Función de Densidad {renderLatex('f(x)')}
                    </label>
                    <input
                        type="text"
                        style={inputStyle}
                        value={funcionFx}
                        onChange={(e) => { setFuncionFx(e.target.value); onCalcular(null); }}
                        placeholder="Ej. 2*x, x^2/3, 1/(b-a)"
                    />
                    <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem' }}>
                        Usa sintaxis matemática estándar (ej. 2*x, x^2, exp(-x)).
                    </small>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <button
                    className="button_calcular"
                    onClick={handleCalcular}
                    disabled={!isValido}
                    style={{
                        padding: '10px 40px',
                        width: 'fit-content',
                        minWidth: '200px'
                    }}
                >
                    CALCULAR
                </button>
            </div>
        </div>
    );
}
