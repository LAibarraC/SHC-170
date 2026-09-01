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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>Seleccionar...</span>}
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
                                background: value === opt.value ? 'var(--bg-app, #f8fafc)' : 'transparent',
                                color: value === opt.value ? 'var(--primary-color)' : 'var(--text-main)',
                                fontWeight: value === opt.value ? 600 : 400,
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-app, #f8fafc)'; }}
                            onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Controles_ChiCuadrada({ onCalcular }) {
    // Inputs numéricos
    const [varianzaPoblacional, setVarianzaPoblacional] = useState(''); // sigma^2
    const [tamañoMuestra, setTamañoMuestra] = useState(''); // n
    const [tipoDispersion, setTipoDispersion] = useState('varianza'); // 'varianza' o 'desviacion'

    // Estado del proceso
    const [distribucionGenerada, setDistribucionGenerada] = useState(false);
    const [datosParciales, setDatosParciales] = useState(null);

    // Inputs de objetivo
    const [condicion, setCondicion] = useState(''); // '', 'menor_que', 'mayor_que', 'entre'
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState(''); // solo si 'entre'

    const formatLatexNum = (num) => {
        return num.toLocaleString('es-ES', { maximumFractionDigits: 4 }).replace(',', '{,}');
    };

    // Paso 1: Generar Distribución
    const generarDistribucion = () => {
        let valDispersion = parseFloat(varianzaPoblacional);
        const varPob = tipoDispersion === 'varianza' ? valDispersion : (valDispersion * valDispersion);
        const n = parseInt(tamañoMuestra);

        if (isNaN(varPob) || varPob <= 0 || isNaN(n) || n <= 1) {
            alert(`Por favor, completa correctamente los parámetros (${tipoDispersion === 'varianza' ? 'σ²' : 'σ'}, n). La medida de dispersión debe ser > 0 y la muestra n > 1.`);
            return;
        }

        const k = n - 1; // Grados de libertad

        const valDispStr = tipoDispersion === 'desviacion' ? `${formatLatexNum(valDispersion)}^2` : formatLatexNum(varPob);
        const parametrosStr = `\\begin{gathered} v = n - 1 = ${n} - 1 = ${k} \\\\ E(S^2) = \\sigma^2 = ${valDispStr} \\end{gathered}`;

        const parciales = { k, varPob, n, parametrosStr };
        setDatosParciales(parciales);
        setDistribucionGenerada(true);
        
        onCalcular(parciales);
    };

    // Paso 2: Calcular Probabilidad
    const calcularProbabilidad = () => {
        if (!datosParciales) return;

        const x1 = parseFloat(valorX1);
        const x2 = parseFloat(valorX2);

        if (!condicion) {
            alert("Por favor, selecciona una condición a calcular.");
            return;
        }

        if (isNaN(x1) || x1 < 0) {
            alert("Por favor, ingresa el valor objetivo correctamente. Debe ser ≥ 0.");
            return;
        }

        if (condicion === 'entre' && (isNaN(x2) || x2 <= x1)) {
            alert("Para la condición 'Entre', el Valor Límite Superior (S²_2) debe ser mayor que el Inferior (S²_1).");
            return;
        }

        const { k, varPob, n, parametrosStr } = datosParciales;

        // Cálculos Chi-Cuadrada
        let chi1 = (k * x1) / varPob;
        let strDesarrollo = '';
        let probFinal = 0;

        if (condicion === 'menor_que') {
            probFinal = jStat.chisquare.cdf(chi1, k);
            strDesarrollo = `\\begin{aligned} P(S^2 \\le ${formatLatexNum(x1)}) &= P\\left( \\chi^2 \\le \\frac{(n-1)S^2}{\\sigma^2} \\right) \\\\ &= P\\left( \\chi^2 \\le \\frac{(${n}-1)(${formatLatexNum(x1)})}{${formatLatexNum(varPob)}} \\right) \\\\ &= P(\\chi^2 \\le ${formatLatexNum(chi1)}) = ${formatLatexNum(probFinal)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            probFinal = 1 - jStat.chisquare.cdf(chi1, k);
            strDesarrollo = `\\begin{aligned} P(S^2 \\ge ${formatLatexNum(x1)}) &= P\\left( \\chi^2 \\ge \\frac{(n-1)S^2}{\\sigma^2} \\right) \\\\ &= P\\left( \\chi^2 \\ge \\frac{(${n}-1)(${formatLatexNum(x1)})}{${formatLatexNum(varPob)}} \\right) \\\\ &= P(\\chi^2 \\ge ${formatLatexNum(chi1)}) \\\\ &= 1 - P(\\chi^2 \\le ${formatLatexNum(chi1)}) = ${formatLatexNum(probFinal)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            let chi2 = (k * x2) / varPob;
            let probChi2 = jStat.chisquare.cdf(chi2, k);
            let probChi1 = jStat.chisquare.cdf(chi1, k);
            probFinal = probChi2 - probChi1;
            strDesarrollo = `\\begin{aligned} P(${formatLatexNum(x1)} \\le S^2 \\le ${formatLatexNum(x2)}) &= P\\left( \\frac{(${n}-1)(${formatLatexNum(x1)})}{${formatLatexNum(varPob)}} \\le \\chi^2 \\le \\frac{(${n}-1)(${formatLatexNum(x2)})}{${formatLatexNum(varPob)}} \\right) \\\\ &= P(${formatLatexNum(chi1)} \\le \\chi^2 \\le ${formatLatexNum(chi2)}) \\\\ &= P(\\chi^2 \\le ${formatLatexNum(chi2)}) - P(\\chi^2 \\le ${formatLatexNum(chi1)}) = ${formatLatexNum(probFinal)} \\end{aligned}`;
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
        <div style={{ ...cardStyle, border: 'none', padding: '0', backgroundColor: 'transparent', marginTop: '20px' }}>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                        value={tipoDispersion}
                        onChange={(e) => { setTipoDispersion(e.target.value); resetDistribucion(); }}
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', outline: 'none', fontWeight: 'bold' }}
                        title="Cambiar entre Varianza y Desviación Estándar"
                    >
                        <option value="varianza">σ² =</option>
                        <option value="desviacion">σ =</option>
                    </select>
                    <input
                        type="number"
                        placeholder={tipoDispersion === 'varianza' ? "Var. Pob." : "Desv. Est. Pob."}
                        value={varianzaPoblacional}
                        onChange={(e) => { setVarianzaPoblacional(e.target.value); resetDistribucion(); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="n =" /></label>
                    <input
                        type="number"
                        placeholder="Muestra"
                        value={tamañoMuestra}
                        onChange={(e) => { setTamañoMuestra(e.target.value); resetDistribucion(); }}
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
                <>
                    <div style={{ background: 'transparent', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: FS.sm }}>Parámetros de la Distribución</div>
                        <div className="thin-scrollbar" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                            <Latex formula={datosParciales.parametrosStr} />
                        </div>
                    </div>

                    <h3 style={{ color: 'var(--primary-color)', fontSize: FS.md, margin: '15px 0' }}>
                        Condición a Calcular
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'end' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Tipo de Condición</label>
                            <CustomSelect
                                value={condicion}
                                onChange={(val) => { setCondicion(val); }}
                                options={[
                                    { value: 'menor_que', label: <Latex formula="P(S^2 < x)" /> },
                                    { value: 'mayor_que', label: <Latex formula="P(S^2 > x)" /> },
                                    { value: 'entre', label: <Latex formula="P(x_1 < S^2 < x_2)" /> }
                                ]}
                            />
                        </div>

                        {condicion && (
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {condicion === 'entre' ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="S^2_1 =" /></label>
                                            <input
                                                type="number"
                                                placeholder="Desv. Est. Pob."
                                                value={valorX1}
                                                onChange={(e) => { setValorX1(e.target.value); }}
                                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%', minWidth: 0 }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="S^2_2 =" /></label>
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
                                            placeholder="Desv. Est. Pob."
                                            value={valorX1}
                                            onChange={(e) => { setValorX1(e.target.value); }}
                                            style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none', width: '100%' }}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={calcularProbabilidad}
                        style={{ width: 'fit-content', margin: '0 auto', padding: '10px 40px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        Graficar
                    </button>
                </>
            )}
        </div>
    );
}
