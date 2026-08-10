import React from 'react';
import { FONT, RADIUS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';

export default function ModalProcedimientoContinua_v2({ isOpen, onClose, tipo, parametros }) {
    if (!isOpen) return null;

    let titulo = "";
    let contenido = null;

    switch (tipo) {
        case 'normal':
            titulo = "Procedimiento Teórico: Normal";
            contenido = (
                <>
                    <p>En una distribución Normal Clásica, los momentos estadísticos están definidos directamente por sus parámetros teóricos <Latex formula="\mu" /> y <Latex formula="\sigma" />.</p>
                    <ul>
                        <li><strong>Esperanza Matemática:</strong> <Latex formula="E(X) = \mu" /></li>
                        <li><strong>Varianza:</strong> <Latex formula="V(X) = \sigma^2" /></li>
                        <li><strong>Asimetría:</strong> <Latex formula="As = 0" /> (La campana es perfectamente simétrica).</li>
                        <li><strong>Curtosis:</strong> <Latex formula="K = 0" /> (Mesocúrtica).</li>
                    </ul>
                </>
            );
            break;
        case 'estandar':
            titulo = "Procedimiento Teórico: Normal Estándar";
            contenido = (
                <>
                    <p>La distribución Normal Estándar (Z) es un caso especial donde:</p>
                    <ul>
                        <li><strong>Media:</strong> <Latex formula="\mu = 0" /></li>
                        <li><strong>Desviación:</strong> <Latex formula="\sigma = 1" /></li>
                    </ul>
                    <p>Por lo tanto:</p>
                    <ul>
                        <li><strong>Esperanza Matemática:</strong> <Latex formula="E(Z) = 0" /></li>
                        <li><strong>Varianza:</strong> <Latex formula="V(Z) = 1^2 = 1" /></li>
                    </ul>
                </>
            );
            break;
        case 'chi-cuadrado':
            titulo = "Procedimiento Teórico: Chi-Cuadrado";
            contenido = (
                <>
                    <p>Para la distribución Chi-Cuadrado, los momentos dependen exclusivamente de los grados de libertad <Latex formula="k = " /> {parametros?.k || 'k'}.</p>
                    <ul>
                        <li><strong>Esperanza Matemática:</strong> <Latex formula="E(X) = k" /></li>
                        <li><strong>Varianza:</strong> <Latex formula="V(X) = 2k" /></li>
                        <li><strong>Asimetría:</strong> <Latex formula="As = \sqrt{\frac{8}{k}}" /></li>
                        <li><strong>Curtosis:</strong> <Latex formula="K = \frac{12}{k}" /></li>
                    </ul>
                </>
            );
            break;
        case 'fisher':
            titulo = "Procedimiento Teórico: F de Fisher";
            contenido = (
                <>
                    <p>Para la distribución F de Fisher, los momentos dependen de <Latex formula="d_1" /> y <Latex formula="d_2" />.</p>
                    <ul>
                        <li><strong>Esperanza Matemática:</strong> <Latex formula="E(X) = \frac{d_2}{d_2 - 2}" /> (Solo si <Latex formula="d_2 > 2" />).</li>
                        <li><strong>Varianza:</strong> <Latex formula="V(X) = \frac{2d_2^2(d_1 + d_2 - 2)}{d_1(d_2 - 2)^2(d_2 - 4)}" /> (Solo si <Latex formula="d_2 > 4" />).</li>
                    </ul>
                    <p>Las fórmulas para Asimetría y Curtosis son mucho más complejas y requieren que <Latex formula="d_2 > 6" /> y <Latex formula="d_2 > 8" /> respectivamente.</p>
                </>
            );
            break;
        default:
            break;
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '25px', borderRadius: RADIUS, width: '90%', maxWidth: '600px',
                fontFamily: FONT, color: 'var(--text-color)', border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{titulo}</h3>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                <div style={{ lineHeight: '1.6' }}>
                    {contenido}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px', borderRadius: RADIUS, background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
