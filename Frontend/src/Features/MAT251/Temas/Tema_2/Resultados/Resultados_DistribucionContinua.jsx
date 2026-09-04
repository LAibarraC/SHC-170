import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { compile } from 'mathjs';
import GraficoAreaContinua from '../../../Graficas/Tema_2/GraficoAreaContinua';
import MarcoWidgetMAT251 from '../../../ui/MarcoWidgetMAT251';

// Integración numérica mediante la Regla de Simpson 1/3
const simpsonIntegrate = (fn, a, b, n = 1000) => {
    if (n % 2 !== 0) n++; // n debe ser par
    const h = (b - a) / n;
    let sum = fn(a) + fn(b);

    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += fn(x) * (i % 2 === 0 ? 2 : 4);
    }
    return (sum * h) / 3;
};

export default function Resultados_DistribucionContinua({ resultados }) {
    const { funcionFx, a, b } = resultados;

    const calculos = useMemo(() => {
        try {
            const compiledExpr = compile(funcionFx);
            const f = (x) => {
                try {
                    return compiledExpr.evaluate({ x });
                } catch {
                    return 0;
                }
            };

            // Paso 1: Validar Área
            const area = simpsonIntegrate(f, a, b);
            
            if (Math.abs(area - 1) > 0.02) {
                return { error: `La función no es una densidad de probabilidad válida. El área bajo la curva es ${area.toFixed(4)} (debe ser 1).` };
            }

            // Paso 2: E[X] = integral(x * f(x))
            const eX_fn = (x) => x * f(x);
            const eX = simpsonIntegrate(eX_fn, a, b);

            // Paso 3: E[X^2] = integral(x^2 * f(x))
            const eX2_fn = (x) => (x * x) * f(x);
            const eX2 = simpsonIntegrate(eX2_fn, a, b);

            // Paso 4: V[X]
            const varX = eX2 - (eX * eX);
            const stdDev = Math.sqrt(Math.max(0, varX));

            return { eX, eX2, varX, stdDev, area };

        } catch (err) {
            return { error: 'Error al procesar la función. Verifique la sintaxis.' };
        }
    }, [funcionFx, a, b]);

    const renderLatex = (str) => {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    if (calculos.error) {
        return (
            <div style={{ padding: '20px', background: 'var(--bg-card, #1e293b)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Error de Validación</h3>
                <p style={{ color: 'var(--text-main, #f8fafc)', margin: 0 }}>{calculos.error}</p>
            </div>
        );
    }

    const { eX, varX, stdDev } = calculos;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tarjetas de Resultados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ background: 'var(--bg-card, #1e293b)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '8px' }}>Esperanza {renderLatex('E[X]')}</div>
                    <div style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>{eX.toFixed(4)}</div>
                </div>
                <div style={{ background: 'var(--bg-card, #1e293b)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '8px' }}>Varianza {renderLatex('V[X]')}</div>
                    <div style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>{varX.toFixed(4)}</div>
                </div>
                <div style={{ background: 'var(--bg-card, #1e293b)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '8px' }}>Desv. Estándar {renderLatex('\\sigma')}</div>
                    <div style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>{stdDev.toFixed(4)}</div>
                </div>
            </div>

            {/* Desarrollo Paso a Paso */}
            <div style={{ background: 'var(--bg-card, #1e293b)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #334155)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#0ea5e9', fontSize: '1.1rem' }}>Desarrollo Matemático</h3>
                <div style={{ color: 'var(--text-main, #f8fafc)', display: 'flex', flexDirection: 'column', gap: '15px', overflowX: 'auto' }}>
                    <div>
                        <strong>1. Esperanza Matemática:</strong><br/><br/>
                        {renderLatex(`E[X] = \\int_{${a}}^{${b}} x \\cdot (${funcionFx}) dx = ${eX.toFixed(4)}`)}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: '15px' }}>
                        <strong>2. Varianza:</strong><br/><br/>
                        {renderLatex(`V[X] = E[X^2] - (E[X])^2`)}<br/><br/>
                        {renderLatex(`E[X^2] = \\int_{${a}}^{${b}} x^2 \\cdot (${funcionFx}) dx = ${calculos.eX2.toFixed(4)}`)}<br/><br/>
                        {renderLatex(`V[X] = ${calculos.eX2.toFixed(4)} - (${eX.toFixed(4)})^2 = ${varX.toFixed(4)}`)}
                    </div>
                </div>
            </div>

            {/* Gráfica */}
            <div style={{ width: '100%', marginTop: '20px' }}>
                <GraficoAreaContinua 
                    datos={{ funcion: funcionFx, a, b, modo: 'densidad' }} 
                />
            </div>

        </div>
    );
}
