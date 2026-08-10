import React, { useState } from 'react';
import { FONT, FS, RADIUS, cardStyle, labelStyle } from '../../../Principal/Constantes';
import { calcularDistribucionMuestral } from '../../../Matematicas/logica_Tema1';

export default function Controles_DistribucionesMuestrales({ setResDistMuestrales }) {
    const [poblacion, setPoblacion] = useState('');
    const [n, setN] = useState('');
    const [conReemplazo, setConReemplazo] = useState(false);

    const ejecutar = () => {
        const res = calcularDistribucionMuestral(poblacion, n, conReemplazo);
        setResDistMuestrales(res);
    };

    return (
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>
                Distribuciones Muestrales
            </h4>
            
            <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Población (separada por comas):</label>
                <input 
                    type="text" 
                    value={poblacion} 
                    onChange={e => setPoblacion(e.target.value)} 
                    placeholder="Ej. 2, 4, 8, 10, 20"
                    style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Tamaño de la Muestra (n):</label>
                <input 
                    type="number" 
                    value={n} 
                    onChange={e => setN(e.target.value)} 
                    min="1"
                    placeholder="Ej. 2"
                    style={{ width: '100%', borderRadius: RADIUS, padding: '8px', fontSize: FS.sm, border: '1px solid var(--border-color)' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Tipo de Muestreo:</label>
                <div style={{ display: 'flex', gap: '15px', fontSize: FS.sm }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="reemplazo" 
                            checked={conReemplazo === true} 
                            onChange={() => setConReemplazo(true)} 
                        />
                        Con Reemplazo
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input 
                            type="radio" 
                            name="reemplazo" 
                            checked={conReemplazo === false} 
                            onChange={() => setConReemplazo(false)} 
                        />
                        Sin Reemplazo
                    </label>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    onClick={ejecutar} 
                    style={{ 
                        padding: '8px 20px', borderRadius: RADIUS, fontSize: FS.sm, fontWeight: 700, 
                        background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' 
                    }}
                >
                    CALCULAR
                </button>
            </div>
        </div>
    );
}
