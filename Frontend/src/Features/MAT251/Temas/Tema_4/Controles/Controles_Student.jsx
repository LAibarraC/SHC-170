import React, { useState } from 'react';
import { cardStyle, labelStyle, RADIUS, FS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../../ui/iconos';
import { jStat } from 'jstat';

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

export default function Controles_Student({ onCalcular }) {
    const [mu, setMu] = useState('');
    const [s, setS] = useState('');
    const [n, setN] = useState('');

    const [distribucionGenerada, setDistribucionGenerada] = useState(false);
    const [datosParciales, setDatosParciales] = useState(null);

    const [condicion, setCondicion] = useState('');
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState('');

    const formatNumber = (num, minDec = 0, maxDec = 3) => {
        return num.toLocaleString('es-ES', { minimumFractionDigits: minDec, maximumFractionDigits: maxDec }).replace(/,/g, '{,}');
    };

    const generarDistribucion = () => {
        const muPob = parseFloat(mu);
        const sMuestral = parseFloat(s);
        const tamMuestra = parseFloat(n);

        if (isNaN(muPob) || isNaN(sMuestral) || isNaN(tamMuestra)) {
            alert("Por favor, ingresa todos los valores numéricos.");
            return;
        }

        if (sMuestral <= 0 || tamMuestra <= 1) {
            alert("La desviación estándar debe ser > 0 y la muestra n > 1.");
            return;
        }

        const v = tamMuestra - 1;
        const se = sMuestral / Math.sqrt(tamMuestra);

        setDatosParciales({ mu: muPob, s: sMuestral, n: tamMuestra, v, se });
        setDistribucionGenerada(true);
        setCondicion('');
        setValorX1('');
        setValorX2('');
        onCalcular({ mu: muPob, s: sMuestral, n: tamMuestra, v, se }); 
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

        const { mu: muPob, s: sMuestral, n: tamMuestra, v, se } = datosParciales;

        let probFinal = 0;
        let strDesarrollo = '';

        const t1 = (x1 - muPob) / se;

        if (condicion === 'menor_que') {
            probFinal = jStat.studentt.cdf(t1, v);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} \\le ${formatNumber(x1)}) &= P\\left( T \\le \\frac{(${formatNumber(x1)} - ${formatNumber(muPob)})\\sqrt{${tamMuestra}}}{${formatNumber(sMuestral)}} \\right) \\\\ &= P(T \\le ${formatNumber(t1, 3, 3)}) \\\\ &= ${formatNumber(probFinal, 4, 4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            probFinal = 1 - jStat.studentt.cdf(t1, v);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} \\ge ${formatNumber(x1)}) &= P\\left( T \\ge \\frac{(${formatNumber(x1)} - ${formatNumber(muPob)})\\sqrt{${tamMuestra}}}{${formatNumber(sMuestral)}} \\right) \\\\ &= P(T \\ge ${formatNumber(t1, 3, 3)}) \\\\ &= 1 - P(T \\le ${formatNumber(t1, 3, 3)}) = ${formatNumber(probFinal, 4, 4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            let t2 = (x2 - muPob) / se;
            let probT2 = jStat.studentt.cdf(t2, v);
            let probT1 = jStat.studentt.cdf(t1, v);
            probFinal = probT2 - probT1;
            strDesarrollo = `\\begin{aligned} P(${formatNumber(x1)} \\le \\bar{X} \\le ${formatNumber(x2)}) &= P\\left( \\frac{(${formatNumber(x1)} - ${formatNumber(muPob)})\\sqrt{${tamMuestra}}}{${formatNumber(sMuestral)}} \\le T \\le \\frac{(${formatNumber(x2)} - ${formatNumber(muPob)})\\sqrt{${tamMuestra}}}{${formatNumber(sMuestral)}} \\right) \\\\ &= P(${formatNumber(t1, 3, 3)} \\le T \\le ${formatNumber(t2, 3, 3)}) \\\\ &= P(T \\le ${formatNumber(t2, 3, 3)}) - P(T \\le ${formatNumber(t1, 3, 3)}) = ${formatNumber(probFinal, 4, 4)} \\end{aligned}`;
        }

        onCalcular({
            ...datosParciales,
            strDesarrollo,
            probFinal,
            x1,
            x2,
            condicion
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
        <div style={{ ...cardStyle, border: 'none', padding: '0', backgroundColor: 'transparent' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="\mu =" /></label>
                    <input
                        type="number"
                        placeholder="Media Pob."
                        value={mu}
                        onChange={(e) => { setMu(e.target.value); resetDistribucion(); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                </div>
                
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="S =" /></label>
                    <input
                        type="number"
                        placeholder="Desv. Est. Muestral"
                        value={s}
                        onChange={(e) => { setS(e.target.value); resetDistribucion(); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                </div>

                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="n =" /></label>
                    <input
                        type="number"
                        placeholder="Muestra"
                        value={n}
                        onChange={(e) => { setN(e.target.value); resetDistribucion(); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
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
                        <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--text-main)' }}>Parámetros t-Student</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Latex formula={`v = n - 1 = ${datosParciales.n} - 1 = ${datosParciales.v}`} />
                            <Latex formula={`E(\\bar{X}) = \\mu = ${formatNumber(datosParciales.mu)}`} />
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
                                        { value: 'menor_que', label: <Latex formula="P(\bar{X} \le x)" /> },
                                        { value: 'mayor_que', label: <Latex formula="P(\bar{X} \ge x)" /> },
                                        { value: 'entre', label: <Latex formula="P(x_1 \le \bar{X} \le x_2)" /> }
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
