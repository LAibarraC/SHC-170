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
    const [isOpen, ReactSetIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                ReactSetIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', fontSize: FS.sx }}>
            <div 
                onClick={() => ReactSetIsOpen(!isOpen)}
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
                                ReactSetIsOpen(false);
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

export default function Controles_ProbabilidadMuestral({ onCalcular }) {
    // 1. Estados
    const [tipoPoblacion, setTipoPoblacion] = useState('infinita'); // 'infinita' o 'finita'
    const [tipoDispersion, setTipoDispersion] = useState('varianza'); // 'varianza' o 'desviacion'
    
    // Inputs numéricos
    const [mediaPoblacional, setMediaPoblacional] = useState(''); // mu
    const [desviacion, setDesviacion] = useState(''); // sigma
    const [tamañoMuestra, setTamañoMuestra] = useState(''); // n
    const [poblacionN, setPoblacionN] = useState(''); // N (solo si finita)

    // Estado del proceso
    const [distribucionGenerada, setDistribucionGenerada] = useState(false);
    const [datosParciales, setDatosParciales] = useState(null);

    // Inputs de objetivo
    const [condicion, setCondicion] = useState(''); // '', 'menor_que', 'mayor_que', 'entre'
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState(''); // solo si 'entre'

    // Lógica Matemática - Paso 1: Generar Distribución
    const generarDistribucion = () => {
        const mu = parseFloat(mediaPoblacional);
        let valDispersion = parseFloat(desviacion);
        const varianzaInput = tipoDispersion === 'varianza' ? valDispersion : (valDispersion * valDispersion);
        const n = parseFloat(tamañoMuestra);
        const N = parseFloat(poblacionN);

        if (isNaN(mu) || isNaN(varianzaInput) || varianzaInput <= 0 || isNaN(n) || n <= 0) {
            alert(`Por favor, completa correctamente los parámetros (μ, ${tipoDispersion === 'varianza' ? 'σ²' : 'σ'}, n) con números válidos.`);
            return;
        }

        if (tipoPoblacion === 'finita' && (isNaN(N) || N <= n)) {
            alert("Para población finita, N debe ser mayor que el tamaño de muestra (n).");
            return;
        }

        const sigma = Math.sqrt(varianzaInput); // Necesitamos sigma real para SE
        let SE = 0;
        let varianzaMuestralStr = '';

        const formatLatexNum = (num) => {
            return num.toLocaleString('es-ES', { maximumFractionDigits: 2 }).replace(',', '{,}');
        };

        const numeradorStr = tipoDispersion === 'desviacion' ? `${formatLatexNum(valDispersion)}^2` : formatLatexNum(varianzaInput);

        if (tipoPoblacion === 'infinita') {
            const varX = varianzaInput / n;
            SE = Math.sqrt(varX);
            varianzaMuestralStr = `\\begin{gathered} E(\\bar{X}) = \\mu = ${formatLatexNum(mu)} \\\\ Var(\\bar{X}) = \\frac{\\sigma^2}{n} = \\frac{${numeradorStr}}{${formatLatexNum(n)}} = ${formatLatexNum(varX)} \\\\ \\bar{X} \\sim N\\left(${formatLatexNum(mu)} ; ${formatLatexNum(varX)}\\right) \\end{gathered}`;
        } else {
            const factorCorreccion = (N - n) / (N - 1);
            const varX = (varianzaInput / n) * factorCorreccion;
            SE = Math.sqrt(varX);
            varianzaMuestralStr = `\\begin{gathered} E(\\bar{X}) = \\mu = ${formatLatexNum(mu)} \\\\ Var(\\bar{X}) = \\frac{\\sigma^2}{n} \\left( \\frac{N-n}{N-1} \\right) = \\frac{${numeradorStr}}{${formatLatexNum(n)}} \\left( \\frac{${formatLatexNum(N)} - ${formatLatexNum(n)}}{${formatLatexNum(N)} - 1} \\right) = ${formatLatexNum(varX)} \\\\ \\bar{X} \\sim N\\left(${formatLatexNum(mu)} ; ${formatLatexNum(varX)}\\right) \\end{gathered}`;
        }

        const parciales = { SE, varianzaMuestralStr, mu, sigma, n, N, tipoPoblacion };
        setDatosParciales(parciales);
        setDistribucionGenerada(true);
        
        // Llamar a onCalcular solo con los datos parciales para que la gráfica y los parámetros se muestren
        onCalcular(parciales);
    };

    // Lógica Matemática - Paso 2: Calcular Probabilidad
    const calcularProbabilidad = () => {
        if (!datosParciales) return;

        const x1 = parseFloat(valorX1);
        const x2 = parseFloat(valorX2);

        if (!condicion) {
            alert("Por favor, selecciona una condición a calcular.");
            return;
        }

        if (isNaN(x1)) {
            alert("Por favor, ingresa el valor objetivo (x) correctamente.");
            return;
        }

        if (condicion === 'entre' && (isNaN(x2) || x2 <= x1)) {
            alert("Para la condición 'Entre', el Valor Límite Superior (x2) debe ser mayor que el Inferior (x1).");
            return;
        }

        const { SE, mu, sigma, n, tipoPoblacion } = datosParciales;

        // Paso 2: Cálculo de Z y Probabilidad
        let z1 = (x1 - mu) / SE;
        let strDesarrollo = '';
        let probFinal = 0;

        let denomStr = tipoPoblacion === 'infinita' ? `${sigma}/\\sqrt{${n}}` : `${SE.toFixed(4)}`;

        if (condicion === 'menor_que') {
            probFinal = cdfNormal(z1);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} \\le ${x1}) &= P\\left( Z \\le \\frac{${x1} - ${mu}}{${denomStr}} \\right) \\\\ &= P(Z \\le ${z1.toFixed(4)}) = ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            probFinal = 1 - cdfNormal(z1);
            strDesarrollo = `\\begin{aligned} P(\\bar{X} \\ge ${x1}) &= P\\left( Z \\ge \\frac{${x1} - ${mu}}{${denomStr}} \\right) \\\\ &= P(Z \\ge ${z1.toFixed(4)}) \\\\ &= 1 - P(Z \\le ${z1.toFixed(4)}) = ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            let z2 = (x2 - mu) / SE;
            let probZ2 = cdfNormal(z2);
            let probZ1 = cdfNormal(z1);
            probFinal = probZ2 - probZ1;
            strDesarrollo = `\\begin{aligned} P(${x1} \\le \\bar{X} \\le ${x2}) &= P\\left( \\frac{${x1} - ${mu}}{${denomStr}} \\le Z \\le \\frac{${x2} - ${mu}}{${denomStr}} \\right) \\\\ &= P(${z1.toFixed(4)} \\le Z \\le ${z2.toFixed(4)}) \\\\ &= P(Z \\le ${z2.toFixed(4)}) - P(Z \\le ${z1.toFixed(4)}) = ${probFinal.toFixed(4)} \\end{aligned}`;
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
            {/* Toggle Población */}
            <div style={{ marginBottom: '20px', marginTop: '10px' }}>
                <span style={labelStyle}>Tipo de Población</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button
                        onClick={() => { setTipoPoblacion('infinita'); resetDistribucion(); }}
                        style={{ flex: 1, padding: '5px', borderRadius: RADIUS, border: `1px solid ${tipoPoblacion === 'infinita' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoPoblacion === 'infinita' ? 'rgba(0,123,255,0.1)' : 'transparent', color: tipoPoblacion === 'infinita' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoPoblacion === 'infinita' ? 'bold' : 'normal' }}
                    >
                        Infinita
                    </button>
                    <button
                        onClick={() => { setTipoPoblacion('finita'); resetDistribucion(); }}
                        style={{ flex: 1, padding: '5px', borderRadius: RADIUS, border: `1px solid ${tipoPoblacion === 'finita' ? 'var(--primary-color)' : 'var(--border-color)'}`, background: tipoPoblacion === 'finita' ? 'rgba(0,123,255,0.1)' : 'transparent', color: tipoPoblacion === 'finita' ? 'var(--primary-color)' : 'var(--text-main)', cursor: 'pointer', fontWeight: tipoPoblacion === 'finita' ? 'bold' : 'normal' }}
                    >
                        Finita
                    </button>
                </div>
            </div>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="\mu =" /></label>
                    <input
                        type="number"
                        placeholder="Media Pob."
                        value={mediaPoblacional}
                        onChange={(e) => { setMediaPoblacional(e.target.value); resetDistribucion(); }}
                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                </div>
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
                        value={desviacion}
                        onChange={(e) => { setDesviacion(e.target.value); resetDistribucion(); }}
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
                {tipoPoblacion === 'finita' && (
                    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0 }}><Latex formula="N =" /></label>
                        <input
                            type="number"
                            placeholder="Población"
                            value={poblacionN}
                            onChange={(e) => { setPoblacionN(e.target.value); resetDistribucion(); }}
                            style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                        />
                    </div>
                )}
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
                        <div style={{ marginBottom: '15px', color: 'var(--text-muted)', fontSize: FS.sm }}>Parámetros de la Distribución Muestral</div>
                        <div className="thin-scrollbar" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                            <Latex formula={datosParciales.varianzaMuestralStr} />
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
                                    { value: 'menor_que', label: <Latex formula="P(\bar{X} < x)" /> },
                                    { value: 'mayor_que', label: <Latex formula="P(\bar{X} > x)" /> },
                                    { value: 'entre', label: <Latex formula="P(x_1 < \bar{X} < x_2)" /> }
                                ]}
                            />
                        </div>

                        {condicion && (
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
