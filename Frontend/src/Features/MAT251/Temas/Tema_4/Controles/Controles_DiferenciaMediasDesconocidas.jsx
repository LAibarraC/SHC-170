import React, { useState } from 'react';
import { jStat } from 'jstat';
import { cardStyle, labelStyle, RADIUS, FS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../../ui/iconos';

const CustomSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', fontSize: FS.sx }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: RADIUS, cursor: 'pointer',
                    boxShadow: isOpen ? '0 0 0 3px rgba(0,123,255,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-main)',
                    userSelect: 'none',
                    height: '35px',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>-- Seleccionar --</span>}
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '4px', background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)', borderRadius: RADIUS,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
                    overflow: 'hidden'
                }}>
                    {options.map((opt) => (
                        <div 
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '10px 12px', cursor: 'pointer',
                                background: value === opt.value ? 'var(--bg-app, transparent)' : 'transparent',
                                color: value === opt.value ? 'var(--primary-color)' : 'var(--text-main)',
                                fontWeight: value === opt.value ? 600 : 400,
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-input, rgba(0,0,0,0.05))';
                            }}
                            onMouseLeave={(e) => {
                                if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Controles_DiferenciaMediasDesconocidas({ onCalcular }) {
    // Población 1
    const [mu1, setMu1] = useState('');
    const [s1, setS1] = useState('');
    const [n1, setN1] = useState('');

    // Población 2
    const [mu2, setMu2] = useState('');
    const [s2, setS2] = useState('');
    const [n2, setN2] = useState('');

    const [escenario, setEscenario] = useState('grandes'); // 'grandes', 'iguales', 'distintas'
    const [condicion, setCondicion] = useState('menor_que');
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState('');

    const resetValues = () => {
        onCalcular(null);
    };

    const calcular = () => {
        const m1 = parseFloat(mu1);
        const std1 = parseFloat(s1);
        const nn1 = parseFloat(n1);

        const m2 = parseFloat(mu2);
        const std2 = parseFloat(s2);
        const nn2 = parseFloat(n2);

        if (isNaN(m1) || isNaN(std1) || isNaN(nn1) || isNaN(m2) || isNaN(std2) || isNaN(nn2)) {
            alert("Por favor, ingresa todos los valores numéricos para ambas poblaciones.");
            return;
        }

        if (std1 <= 0 || std2 <= 0 || nn1 <= 0 || nn2 <= 0) {
            alert("Las desviaciones estándar y tamaños de muestra deben ser mayores a 0.");
            return;
        }

        const x1 = parseFloat(valorX1);
        const x2 = parseFloat(valorX2);

        if ((condicion === 'menor_que' || condicion === 'mayor_que') && isNaN(x1)) {
            alert('Ingresa un valor válido para la condición a calcular.');
            return;
        }
        if (condicion === 'entre' && (isNaN(x1) || isNaN(x2))) {
            alert('Ingresa ambos valores para el rango.');
            return;
        }

        const s1Sq = Math.pow(std1, 2);
        const s2Sq = Math.pow(std2, 2);
        const esperanza = m1 - m2;
        let se = 0;
        let v = 0;
        let statValue = 0;
        let statType = 'Z';
        let formulaLaTeX = '';

        if (escenario === 'grandes') {
            se = Math.sqrt((s1Sq / nn1) + (s2Sq / nn2));
            statValue = (x1 - esperanza) / se;
            statType = 'Z';
            formulaLaTeX = `Z = \\frac{(\\bar{X} - \\bar{Y}) - (\\mu_X - \\mu_Y)}{\\sqrt{\\frac{S_X^2}{n} + \\frac{S_Y^2}{m}}}`;
        } else if (escenario === 'iguales') {
            v = nn1 + nn2 - 2;
            const sp2 = ((nn1 - 1) * s1Sq + (nn2 - 1) * s2Sq) / v;
            se = Math.sqrt(sp2 * ((1 / nn1) + (1 / nn2)));
            statValue = (x1 - esperanza) / se;
            statType = 'T';
            formulaLaTeX = `T = \\frac{(\\bar{X} - \\bar{Y}) - (\\mu_X - \\mu_Y)}{\\sqrt{\\frac{(n-1)S_X^2 + (m-1)S_Y^2}{n+m-2} \\left(\\frac{1}{n} + \\frac{1}{m}\\right)}}`;
        } else if (escenario === 'distintas') {
            se = Math.sqrt((s1Sq / nn1) + (s2Sq / nn2));
            const num = Math.pow((s1Sq / nn1) + (s2Sq / nn2), 2);
            const den = (Math.pow(s1Sq / nn1, 2) / (nn1 + 1)) + (Math.pow(s2Sq / nn2, 2) / (nn2 + 1));
            v = (num / den) - 2;
            // Redondeo de g para presentacion
            v = Math.round(v * 100) / 100;
            statValue = (x1 - esperanza) / se;
            statType = 'T';
            formulaLaTeX = `T = \\frac{(\\bar{X} - \\bar{Y}) - (\\mu_X - \\mu_Y)}{\\sqrt{\\frac{S_X^2}{n} + \\frac{S_Y^2}{m}}}`;
        }

        // Calculation for probabilities based on condition
        let probFinal = 0;
        let val2Stat = (x2 - esperanza) / se;

        if (escenario === 'grandes') {
            if (condicion === 'menor_que') {
                probFinal = jStat.normal.cdf(statValue, 0, 1);
            } else if (condicion === 'mayor_que') {
                probFinal = 1 - jStat.normal.cdf(statValue, 0, 1);
            } else if (condicion === 'entre') {
                const p1 = jStat.normal.cdf(statValue, 0, 1);
                const p2 = jStat.normal.cdf(val2Stat, 0, 1);
                probFinal = Math.abs(p2 - p1);
            }
        } else {
            if (condicion === 'menor_que') {
                probFinal = jStat.studentt.cdf(statValue, v);
            } else if (condicion === 'mayor_que') {
                probFinal = 1 - jStat.studentt.cdf(statValue, v);
            } else if (condicion === 'entre') {
                const p1 = jStat.studentt.cdf(statValue, v);
                const p2 = jStat.studentt.cdf(val2Stat, v);
                probFinal = Math.abs(p2 - p1);
            }
        }
        const formatNumber = (num, dec = 0) => num.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: Math.max(dec, 3) }).replace(',', '{,}');
        let strDesarrollo = '';
        let S = statType; // 'Z' or 'T'

        if (condicion === 'menor_que') {
            strDesarrollo = `\\begin{aligned} P(\\bar{X}_1 - \\bar{X}_2 \\le ${formatNumber(x1)}) &= P\\left( \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${formatNumber(se, 2)}} \\le ${S} \\right) \\\\ &= P(${S} \\le ${formatNumber(statValue, 2)}) \\\\ &= ${formatNumber(probFinal, 4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            strDesarrollo = `\\begin{aligned} P(\\bar{X}_1 - \\bar{X}_2 \\ge ${formatNumber(x1)}) &= P\\left( \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${formatNumber(se, 2)}} \\ge ${S} \\right) \\\\ &= P(${S} \\ge ${formatNumber(statValue, 2)}) \\\\ &= 1 - P(${S} \\le ${formatNumber(statValue, 2)}) = ${formatNumber(probFinal, 4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            strDesarrollo = `\\begin{aligned} P(${formatNumber(x1)} \\le \\bar{X}_1 - \\bar{X}_2 \\le ${formatNumber(x2)}) &= P\\left( \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${formatNumber(se, 2)}} \\le ${S} \\le \\frac{${formatNumber(x2)} - ${formatNumber(esperanza)}}{${formatNumber(se, 2)}} \\right) \\\\ &= P(${formatNumber(statValue, 2)} \\le ${S} \\le ${formatNumber(val2Stat, 2)}) \\\\ &= ${formatNumber(probFinal, 4)} \\end{aligned}`;
        }

        onCalcular({
            m1, std1, nn1,
            m2, std2, nn2,
            esperanza,
            se,
            v,
            escenario,
            condicion,
            x1,
            x2,
            probFinal,
            statValue,
            statType,
            formulaLaTeX,
            strDesarrollo,
            mu: esperanza, // Para GraficoStudent
            p: esperanza   // Para GraficoDiferenciaMedias
        });
    };

    return (
        <div style={{ ...cardStyle, border: 'none', padding: '0', backgroundColor: 'transparent' }}>

            {/* Población 1 */}
            <h4 style={{ color: 'var(--text-main)', fontSize: FS.sm, marginBottom: '10px' }}>Población 1</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="\mu_1 =" /></label>
                    <input type="number" placeholder="Media Pob. 1" value={mu1} onChange={(e) => { setMu1(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="S_1 =" /></label>
                    <input type="number" placeholder="Desv. Est. Muestral 1" value={s1} onChange={(e) => { setS1(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="n_1 =" /></label>
                    <input type="number" placeholder="Muestra 1" value={n1} onChange={(e) => { setN1(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
            </div>

            {/* Población 2 */}
            <h4 style={{ color: 'var(--text-main)', fontSize: FS.sm, marginBottom: '10px' }}>Población 2</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="\mu_2 =" /></label>
                    <input type="number" placeholder="Media Pob. 2" value={mu2} onChange={(e) => { setMu2(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="S_2 =" /></label>
                    <input type="number" placeholder="Desv. Est. Muestral 2" value={s2} onChange={(e) => { setS2(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="n_2 =" /></label>
                    <input type="number" placeholder="Muestra 2" value={n2} onChange={(e) => { setN2(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
            </div>

            {/* Escenario de Evaluación */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, display: 'block', marginBottom: '10px' }}>Escenario de Evaluación</label>
                <CustomSelect
                    value={escenario}
                    onChange={(val) => { setEscenario(val); resetValues(); }}
                    options={[
                        { value: 'grandes', label: <Latex formula="\text{Muestras grandes, } n + m > 30" /> },
                        { value: 'iguales', label: <Latex formula="\text{Muestras pequeñas, } n + m \le 30 \text{ y } \sigma_X^2 = \sigma_Y^2" /> },
                        { value: 'distintas', label: <Latex formula="\text{Muestras pequeñas, } n + m \le 30 \text{ y } \sigma_X^2 \neq \sigma_Y^2" /> }
                    ]}
                />
            </div>

            {/* Condición a Calcular */}
            <div style={{ background: 'transparent', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                <label style={{ ...labelStyle, display: 'block', marginBottom: '10px' }}>Condición a Calcular</label>
                <div style={{ display: 'grid', gridTemplateColumns: condicion ? '1fr 1fr' : '1fr', gap: '15px', alignItems: 'start' }}>
                    <div>
                        <CustomSelect
                            value={condicion}
                            onChange={(val) => { setCondicion(val); resetValues(); }}
                            options={[
                                { value: 'menor_que', label: <Latex formula="P(\bar{X}_1 - \bar{X}_2 \le x)" /> },
                                { value: 'mayor_que', label: <Latex formula="P(\bar{X}_1 - \bar{X}_2 \ge x)" /> },
                                { value: 'entre', label: <Latex formula="P(x_1 \le \bar{X}_1 - \bar{X}_2 \le x_2)" /> }
                            ]}
                        />
                    </div>

                    {condicion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {condicion === 'entre' ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                        <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="x_1 =" /></label>
                                        <input
                                            type="number"
                                            placeholder="Valor"
                                            value={valorX1}
                                            onChange={(e) => { setValorX1(e.target.value); resetValues(); }}
                                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%', minWidth: 0 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                        <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="x_2 =" /></label>
                                        <input
                                            type="number"
                                            placeholder="Valor"
                                            value={valorX2}
                                            onChange={(e) => { setValorX2(e.target.value); resetValues(); }}
                                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%', minWidth: 0 }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="x =" /></label>
                                    <input
                                        type="number"
                                        placeholder="Valor"
                                        value={valorX1}
                                        onChange={(e) => { setValorX1(e.target.value); resetValues(); }}
                                        style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%' }}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={calcular}
                style={{ width: 'fit-content', margin: '0 auto', padding: '10px 40px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                Graficar
            </button>
        </div>
    );
}
