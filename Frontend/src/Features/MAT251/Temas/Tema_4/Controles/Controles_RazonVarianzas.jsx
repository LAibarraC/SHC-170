import React, { useState } from 'react';
import { jStat } from 'jstat';
import { cardStyle, labelStyle, RADIUS, FS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../../ui/iconos';

const CustomSelect = ({ value, onChange, options }) => {
    const [isOpen, React_useState] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                React_useState(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', fontSize: FS.sx }}>
            <div 
                onClick={() => React_useState(!isOpen)}
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
                                React_useState(false);
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

export default function Controles_RazonVarianzas({ onCalcular }) {
    // Población 1
    const [varPob1, setVarPob1] = useState('');
    const [n1, setN1] = useState('');

    // Población 2
    const [varPob2, setVarPob2] = useState('');
    const [n2, setN2] = useState('');

    const [condicion, setCondicion] = useState('menor_que');
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState('');
    
    // Estado para guardar los parámetros calculados antes de graficar
    const [parametrosPrevios, setParametrosPrevios] = useState(null);

    const resetValues = () => {
        setParametrosPrevios(null);
        onCalcular(null);
    };

    const calcularParametros = () => {
        const vp1 = parseFloat(varPob1);
        const nn1 = parseFloat(n1);
        const vp2 = parseFloat(varPob2);
        const nn2 = parseFloat(n2);

        if (isNaN(vp1) || isNaN(nn1) || isNaN(vp2) || isNaN(nn2)) {
            alert("Por favor, ingresa todos los valores numéricos para ambas poblaciones.");
            return;
        }

        if (vp1 <= 0 || vp2 <= 0 || nn1 <= 1 || nn2 <= 1) {
            alert("Las varianzas deben ser mayores a 0 y los tamaños de muestra mayores a 1.");
            return;
        }

        const v1 = nn1 - 1;
        const v2 = nn2 - 1;
        const razonVarPob = vp2 / vp1; 

        setParametrosPrevios({ vp1, nn1, vp2, nn2, v1, v2, razonVarPob });
    };

    const calcular = () => {
        if (!parametrosPrevios) return;

        const { vp1, nn1, vp2, nn2, v1, v2, razonVarPob } = parametrosPrevios;

        const x1 = parseFloat(valorX1);
        const x2 = parseFloat(valorX2);

        if ((condicion === 'menor_que' || condicion === 'mayor_que') && (isNaN(x1) || x1 < 0)) {
            alert('Ingresa un valor válido y positivo para la condición a calcular.');
            return;
        }
        if (condicion === 'entre' && (isNaN(x1) || isNaN(x2) || x1 < 0 || x2 < 0)) {
            alert('Ingresa ambos valores positivos para el rango.');
            return;
        }

        let probFinal = 0;
        let strDesarrollo = '';
        let statValue = 0; // The F value that corresponds to x1

        if (condicion === 'menor_que') {
            statValue = x1 * razonVarPob;
            probFinal = jStat.centralF.cdf(statValue, v1, v2);
            strDesarrollo = `\\begin{aligned} P\\left( \\frac{S_1^2}{S_2^2} < ${x1} \\right) &= P\\left( F < ${x1} \\cdot \\frac{${vp2}}{${vp1}} \\right) \\\\ &= P(F < ${statValue.toFixed(4)}) \\\\ &= ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            statValue = x1 * razonVarPob;
            probFinal = 1 - jStat.centralF.cdf(statValue, v1, v2);
            strDesarrollo = `\\begin{aligned} P\\left( \\frac{S_1^2}{S_2^2} > ${x1} \\right) &= P\\left( F > ${x1} \\cdot \\frac{${vp2}}{${vp1}} \\right) \\\\ &= P(F > ${statValue.toFixed(4)}) \\\\ &= 1 - P(F < ${statValue.toFixed(4)}) \\\\ &= ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            const F1 = x1 * razonVarPob;
            const F2 = x2 * razonVarPob;
            statValue = F2; // We can use F2 as the statValue just for display, or show both
            const probZ2 = jStat.centralF.cdf(F2, v1, v2);
            const probZ1 = jStat.centralF.cdf(F1, v1, v2);
            probFinal = Math.abs(probZ2 - probZ1);
            strDesarrollo = `\\begin{aligned} P\\left( ${x1} < \\frac{S_1^2}{S_2^2} < ${x2} \\right) &= P\\left( ${x1} \\cdot \\frac{${vp2}}{${vp1}} < F < ${x2} \\cdot \\frac{${vp2}}{${vp1}} \\right) \\\\ &= P(${F1.toFixed(4)} < F < ${F2.toFixed(4)}) \\\\ &= P(F < ${F2.toFixed(4)}) - P(F < ${F1.toFixed(4)}) \\\\ &= ${probZ2.toFixed(4)} - ${probZ1.toFixed(4)} \\\\ &= ${probFinal.toFixed(4)} \\end{aligned}`;
        }

        const formulaLaTeX = `F = \\left( \\frac{S_1^2}{S_2^2} \\right) \\cdot \\left( \\frac{\\sigma_2^2}{\\sigma_1^2} \\right)`;

        onCalcular({
            vp1, nn1,
            vp2, nn2,
            v1, v2,
            varPob1: vp1,
            varPob2: vp2,
            condicion,
            x1, x2,
            probFinal,
            statValue,
            formulaLaTeX,
            strDesarrollo,
        });
    };

    return (
        <div style={{ ...cardStyle, border: 'none', padding: '0', backgroundColor: 'transparent' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Población 1 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: FS.sm, color: 'var(--text-main)' }}>Población 1</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, minWidth: '45px' }}><Latex formula="\sigma_1^2 =" /></label>
                            <input type="number" placeholder="Var. Pob. 1" value={varPob1} onChange={(e) => { setVarPob1(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, minWidth: '45px' }}><Latex formula="n_1 =" /></label>
                            <input type="number" placeholder="Muestra 1" value={n1} onChange={(e) => { setN1(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                    </div>
                </div>

                {/* Población 2 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: FS.sm, color: 'var(--text-main)' }}>Población 2</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, minWidth: '45px' }}><Latex formula="\sigma_2^2 =" /></label>
                            <input type="number" placeholder="Var. Pob. 2" value={varPob2} onChange={(e) => { setVarPob2(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, minWidth: '45px' }}><Latex formula="n_2 =" /></label>
                            <input type="number" placeholder="Muestra 2" value={n2} onChange={(e) => { setN2(e.target.value); resetValues(); }} style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                    </div>
                </div>
            </div>

            {!parametrosPrevios ? (
                <button
                    onClick={calcularParametros}
                    style={{ width: 'fit-content', margin: '20px auto 0', padding: '10px 40px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    Calcular
                </button>
            ) : (
                <>
                    {/* Grados de Libertad */}
                    <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: FS.sm, marginBottom: '15px', fontWeight: 'bold' }}>
                            Grados de Libertad (v)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
                            <Latex formula={`v_1 = ${parametrosPrevios.nn1} - 1 = ${parametrosPrevios.v1}`} />
                            <Latex formula={`v_2 = ${parametrosPrevios.nn2} - 1 = ${parametrosPrevios.v2}`} />
                        </div>
                    </div>

                    {/* Condición a Calcular */}
                    <div style={{ background: 'transparent', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                        <label style={{ ...labelStyle, display: 'block', marginBottom: '10px' }}>Condición a Calcular</label>
                        <div style={{ display: 'grid', gridTemplateColumns: condicion ? '1fr 1fr' : '1fr', gap: '15px', alignItems: 'start' }}>
                            <div>
                                <CustomSelect
                                    value={condicion}
                                    onChange={(val) => { setCondicion(val); onCalcular(null); }}
                                    options={[
                                        { value: 'menor_que', label: <Latex formula="P\left(\frac{S_1^2}{S_2^2} \le x\right)" /> },
                                        { value: 'mayor_que', label: <Latex formula="P\left(\frac{S_1^2}{S_2^2} \ge x\right)" /> },
                                        { value: 'entre', label: <Latex formula="P\left(x_1 \le \frac{S_1^2}{S_2^2} \le x_2\right)" /> }
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
                                                    onChange={(e) => { setValorX1(e.target.value); onCalcular(null); }}
                                                    style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%', minWidth: 0 }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                                <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="x_2 =" /></label>
                                                <input
                                                    type="number"
                                                    placeholder="Valor"
                                                    value={valorX2}
                                                    onChange={(e) => { setValorX2(e.target.value); onCalcular(null); }}
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
                                                onChange={(e) => { setValorX1(e.target.value); onCalcular(null); }}
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
                        style={{ width: 'fit-content', margin: '0 auto', padding: '10px 40px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        Graficar
                    </button>
                </>
            )}
        </div>
    );
}
