import React, { useState } from 'react';
import { cardStyle, labelStyle, RADIUS, FS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../../ui/iconos';

// Aproximación polinómica para la CDF de una distribución Normal Estándar
function cdfNormal(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989422804 * Math.exp(-x * x / 2);
    let p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    if (x > 0) {
        p = 1 - p;
    }
    return p;
}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>-- Selecciona una Condición --</span>}
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)', flexShrink: 0 }}>
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

export default function Controles_DiferenciaMedias({ onCalcular }) {
    // Poblacion 1
    const [mu1, setMu1] = useState('');
    const [sigma1, setSigma1] = useState('');
    const [n1, setN1] = useState('');

    // Poblacion 2
    const [mu2, setMu2] = useState('');
    const [sigma2, setSigma2] = useState('');
    const [n2, setN2] = useState('');

    const [distribucionGenerada, setDistribucionGenerada] = useState(false);
    const [datosParciales, setDatosParciales] = useState(null);

    const [condicion, setCondicion] = useState('');
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState('');

    const generarDistribucion = () => {
        const m1 = parseFloat(mu1);
        const s1 = parseFloat(sigma1);
        const nn1 = parseFloat(n1);

        const m2 = parseFloat(mu2);
        const s2 = parseFloat(sigma2);
        const nn2 = parseFloat(n2);

        if (isNaN(m1) || isNaN(s1) || isNaN(nn1) || isNaN(m2) || isNaN(s2) || isNaN(nn2)) {
            alert("Por favor, ingresa todos los valores numéricos para ambas poblaciones.");
            return;
        }

        if (s1 <= 0 || s2 <= 0 || nn1 <= 0 || nn2 <= 0) {
            alert("Las desviaciones estándar y tamaños de muestra deben ser mayores a 0.");
            return;
        }

        const esperanza = m1 - m2;
        const varianza = (Math.pow(s1, 2) / nn1) + (Math.pow(s2, 2) / nn2);
        const se = Math.sqrt(varianza);

        // Calculate exact fraction for variance
        let num = (Math.pow(s1, 2) * nn2) + (Math.pow(s2, 2) * nn1);
        let den = nn1 * nn2;
        num = Math.round(num * 1000000) / 1000000;
        while (!Number.isInteger(num)) {
            num *= 10;
            den *= 10;
            num = Math.round(num * 1000000) / 1000000;
        }
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const g = gcd(Math.abs(num), Math.abs(den));
        const varFracNum = num / g;
        const varFracDen = den / g;

        setDatosParciales({ m1, s1, nn1, m2, s2, nn2, esperanza, varianza, se, varFracNum, varFracDen });
        setDistribucionGenerada(true);
        setCondicion('');
        setValorX1('');
        setValorX2('');
        onCalcular({ p: esperanza, se }); // Pasamos 'p' (como mu) y 'se' para que sea compatible con los ejes de la gráfica normal
    };

    const calcularProbabilidad = () => {
        if (!condicion) {
            alert('Por favor selecciona una condición.');
            return;
        }

        const x1 = parseFloat(valorX1);
        const x2 = parseFloat(valorX2);

        if ((condicion === 'menor_que' || condicion === 'mayor_que') && isNaN(x1)) {
            alert('Ingresa un valor válido para la condición.');
            return;
        }
        if (condicion === 'entre' && (isNaN(x1) || isNaN(x2))) {
            alert('Ingresa ambos valores para el rango.');
            return;
        }

        const { m1, s1, nn1, m2, s2, nn2, esperanza, se, varFracNum, varFracDen } = datosParciales;

        let probFinal = 0;
        let strDesarrollo = '';

        let denomStr = varFracDen === 1 ? `${varFracNum}` : `\\frac{${varFracNum}}{${varFracDen}}`;
        denomStr = `\\sqrt{${denomStr}}`;

        const z1 = (x1 - esperanza) / se;

        const formatNumber = (num, dec = 0) => num.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: Math.max(dec, 3) }).replace(',', '{,}');

        if (condicion === 'menor_que') {
            probFinal = cdfNormal(z1);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} - \\bar{Y} \\le ${formatNumber(x1)}) &= P\\left( Z \\le \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${denomStr}} \\right) \\\\ &= P(Z \\le ${formatNumber(z1, 2)}) \\\\ &= ${formatNumber(probFinal, 4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            probFinal = 1 - cdfNormal(z1);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} - \\bar{Y} \\ge ${formatNumber(x1)}) &= P\\left( Z \\ge \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${denomStr}} \\right) \\\\ &= P(Z \\ge ${formatNumber(z1, 2)}) \\\\ &= 1 - P(Z \\le ${formatNumber(z1, 2)}) = ${formatNumber(probFinal, 4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            let z2 = (x2 - esperanza) / se;
            let probZ2 = cdfNormal(z2);
            let probZ1 = cdfNormal(z1);
            probFinal = probZ2 - probZ1;
            strDesarrollo = `\\begin{aligned} P(${formatNumber(x1)} \\le \\bar{X} - \\bar{Y} \\le ${formatNumber(x2)}) &= P\\left( \\frac{${formatNumber(x1)} - ${formatNumber(esperanza)}}{${denomStr}} \\le Z \\le \\frac{${formatNumber(x2)} - ${formatNumber(esperanza)}}{${denomStr}} \\right) \\\\ &= P(${formatNumber(z1, 2)} \\le Z \\le ${formatNumber(z2, 2)}) \\\\ &= P(Z \\le ${formatNumber(z2, 2)}) - P(Z \\le ${formatNumber(z1, 2)}) = ${formatNumber(probFinal, 4)} \\end{aligned}`;
        }

        onCalcular({
            ...datosParciales,
            strDesarrollo,
            probFinal,
            x1,
            x2,
            condicion,
            p: esperanza, 
            se: se
        });
    };

    const resetDistribucion = () => {
        setDistribucionGenerada(false);
        setDatosParciales(null);
        setCondicion('');
        setValorX1('');
        setValorX2('');
        onCalcular(null);
    };

    return (
        <div style={{ ...cardStyle, border: 'none', padding: '0', backgroundColor: 'transparent', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Población 1 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--primary-color)' }}>
                        Población 1 (<span style={{ display: 'inline-block' }}><Latex formula="X" /></span>)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\mu_X =" /></label>
                            <input
                                type="number"
                                placeholder="Media Pob. X"
                                value={mu1}
                                onChange={(e) => { setMu1(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\sigma_X =" /></label>
                            <input
                                type="number"
                                placeholder="Desv. Est. Pob. X"
                                value={sigma1}
                                onChange={(e) => { setSigma1(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="n_X =" /></label>
                            <input
                                type="number"
                                placeholder="Muestra X"
                                value={n1}
                                onChange={(e) => { setN1(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Población 2 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--primary-color)' }}>
                        Población 2 (<span style={{ display: 'inline-block' }}><Latex formula="Y" /></span>)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\mu_Y =" /></label>
                            <input
                                type="number"
                                placeholder="Media Pob. Y"
                                value={mu2}
                                onChange={(e) => { setMu2(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\sigma_Y =" /></label>
                            <input
                                type="number"
                                placeholder="Desv. Est. Pob. Y"
                                value={sigma2}
                                onChange={(e) => { setSigma2(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="n_Y =" /></label>
                            <input
                                type="number"
                                placeholder="Muestra Y"
                                value={n2}
                                onChange={(e) => { setN2(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={generarDistribucion}
                style={{ width: 'fit-content', margin: '15px auto 20px', padding: '10px 40px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                Calcular
            </button>

            {distribucionGenerada && (
                <div style={{ marginTop: '20px', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--text-main)', textAlign: 'center' }}>Parámetros Combinados</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                            <Latex formula={`E(\\bar{X} - \\bar{Y}) = \\mu_X - \\mu_Y = ${datosParciales.m1.toLocaleString('es-ES')} - ${datosParciales.m2.toLocaleString('es-ES')} = ${datosParciales.esperanza.toLocaleString('es-ES')}`} />
                            <Latex formula={`Var(\\bar{X} - \\bar{Y}) = \\frac{\\sigma_X^2}{n_X} + \\frac{\\sigma_Y^2}{n_Y} = \\frac{${datosParciales.s1.toLocaleString('es-ES')}^2}{${datosParciales.nn1}} + \\frac{${datosParciales.s2.toLocaleString('es-ES')}^2}{${datosParciales.nn2}} = ${datosParciales.varFracDen === 1 ? datosParciales.varFracNum : `\\frac{${datosParciales.varFracNum}}{${datosParciales.varFracDen}}`}`} />
                            <Latex formula={`\\bar{X} - \\bar{Y} \\sim N\\left(${datosParciales.esperanza.toLocaleString('es-ES').replace(',', '{,}')} ; ${datosParciales.varFracDen === 1 ? datosParciales.varFracNum : `\\frac{${datosParciales.varFracNum}}{${datosParciales.varFracDen}}`}\\right)`} />
                        </div>
                    </div>

                    <div style={{ background: 'transparent', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                        <label style={{ ...labelStyle, display: 'block', marginBottom: '10px' }}>Condición a Calcular</label>
                        <div style={{ display: 'grid', gridTemplateColumns: condicion ? '1fr 1fr' : '1fr', gap: '15px', alignItems: 'start' }}>
                            <div>
                                <CustomSelect
                                    value={condicion}
                                    onChange={(val) => { setCondicion(val); }}
                                    options={[
                                        { value: 'menor_que', label: <Latex formula="P(\bar{X} - \bar{Y} \le x)" /> },
                                        { value: 'mayor_que', label: <Latex formula="P(\bar{X} - \bar{Y} \ge x)" /> },
                                        { value: 'entre', label: <Latex formula="P(x_1 \le \bar{X} - \bar{Y} \le x_2)" /> }
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
                                                    onChange={(e) => { setValorX1(e.target.value); }}
                                                    style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%', minWidth: 0 }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                                <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="x_2 =" /></label>
                                                <input
                                                    type="number"
                                                    placeholder="Valor"
                                                    value={valorX2}
                                                    onChange={(e) => { setValorX2(e.target.value); }}
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
                                                onChange={(e) => { setValorX1(e.target.value); }}
                                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%' }}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {condicion && (
                        <button
                            onClick={calcularProbabilidad}
                            style={{ width: 'fit-content', margin: '15px auto 0', padding: '10px 40px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            Graficar
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
