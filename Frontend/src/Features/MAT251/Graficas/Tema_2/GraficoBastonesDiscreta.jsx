import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                padding: '10px',
                borderRadius: '8px',
                color: 'var(--text-main, #f8fafc)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '5px' }}>x = {label}</p>
                <p style={{ margin: 0, color: '#0ea5e9', fontWeight: 600 }}>P(x) = {payload[0].value}</p>
            </div>
        );
    }
    return null;
};

export default function GraficoBastonesDiscreta({ datos }) {
    if (!datos || datos.length === 0) return null;

    // Adaptar para que parezcan bastones reales (barras muy finas con un punto arriba)
    const datosGrafica = datos.map(d => ({
        x: d.x.toString(),
        prob: parseFloat(d.p.toFixed(4))
    }));

    const maxProb = Math.max(...datosGrafica.map(d => d.prob));
    const yAxisDomain = [0, Math.min(1, Math.ceil(maxProb * 1.2 * 10) / 10)]; // Ligero margen arriba

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={datosGrafica} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="x" tick={{ fill: 'var(--text-variable, #ffffffff)' }} stroke="var(--text-variable, #ffffffff)" />
                <YAxis domain={yAxisDomain} tick={{ fill: 'var(--text-variable, #ffffffff)' }} stroke="var(--text-variable, #ffffffff)" />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    content={<CustomTooltip />}
                />

                {/* Barras dinámicas inteligentes */}
                <Bar dataKey="prob" maxBarSize={60} fill="#0ea5e9" radius={[0, 0, 0, 0]} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
