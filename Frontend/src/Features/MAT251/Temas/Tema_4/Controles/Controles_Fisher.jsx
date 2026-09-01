import React, { useState } from 'react';
import { cardStyle, labelStyle, RADIUS, FS } from '../../../Principal/Constantes';
import Latex from '../../../../../components/excel/Latex';
import { IconoCalculadora } from '../../../../../ui/iconos';
import { jStat } from 'jstat';

export default function Controles_Fisher({ onCalcular }) {
    // Inputs
    const [varPob1, setVarPob1] = useState('');
    const [n1, setN1] = useState('');
    
    const [varPob2, setVarPob2] = useState('');
    const [n2, setN2] = useState('');

    // Estado del paso 1
    const [distribucionGenerada, setDistribucionGenerada] = useState(false);
    const [datosParciales, setDatosParciales] = useState(null);

    // Condicion
    const [condicion, setCondicion] = useState('');
    const [valorX1, setValorX1] = useState('');
    const [valorX2, setValorX2] = useState('');

    const generarDistribucion = () => {
        const vp1 = parseFloat(varPob1);
        const nn1 = parseFloat(n1);
        const vp2 = parseFloat(varPob2);
        const nn2 = parseFloat(n2);

        if (isNaN(vp1) || isNaN(nn1) || isNaN(vp2) || isNaN(nn2) || vp1 <= 0 || nn1 <= 1 || vp2 <= 0 || nn2 <= 1) {
            alert("Por favor, ingrese valores numéricos válidos. Las varianzas deben ser mayores a 0 y las muestras mayores a 1.");
            return;
        }

        const v1 = nn1 - 1;
        const v2 = nn2 - 1;

        setDatosParciales({ v1, v2, varPob1: vp1, varPob2: vp2, n1: nn1, n2: nn2 });
        setDistribucionGenerada(true);
        setCondicion('');
        setValorX1('');
        setValorX2('');
        onCalcular({ v1, v2, varPob1: vp1, varPob2: vp2, n1: nn1, n2: nn2 });
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

        const { v1, v2, varPob1, varPob2 } = datosParciales;
        const razonVarPob = varPob2 / varPob1;

        let probFinal = 0;
        let strDesarrollo = '';

        if (condicion === 'menor_que') {
            const F1 = x1 * razonVarPob;
            probFinal = jStat.centralF.cdf(F1, v1, v2);
            strDesarrollo = `\\begin{aligned} P\\left( \\frac{S_1^2}{S_2^2} < ${x1} \\right) &= P\\left( F < ${x1} \\cdot \\frac{${varPob2}}{${varPob1}} \\right) \\\\ &= P(F < ${F1.toFixed(4)}) \\\\ &= ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'mayor_que') {
            const F1 = x1 * razonVarPob;
            probFinal = 1 - jStat.centralF.cdf(F1, v1, v2);
            strDesarrollo = `\\begin{aligned} P\\left( \\frac{S_1^2}{S_2^2} > ${x1} \\right) &= P\\left( F > ${x1} \\cdot \\frac{${varPob2}}{${varPob1}} \\right) \\\\ &= P(F > ${F1.toFixed(4)}) \\\\ &= 1 - P(F < ${F1.toFixed(4)}) = ${probFinal.toFixed(4)} \\end{aligned}`;
        } else if (condicion === 'entre') {
            const F1 = x1 * razonVarPob;
            const F2 = x2 * razonVarPob;
            const probZ2 = jStat.centralF.cdf(F2, v1, v2);
            const probZ1 = jStat.centralF.cdf(F1, v1, v2);
            probFinal = probZ2 - probZ1;
            strDesarrollo = `\\begin{aligned} P\\left( ${x1} < \\frac{S_1^2}{S_2^2} < ${x2} \\right) &= P\\left( ${x1} \\cdot \\frac{${varPob2}}{${varPob1}} < F < ${x2} \\cdot \\frac{${varPob2}}{${varPob1}} \\right) \\\\ &= P(${F1.toFixed(4)} < F < ${F2.toFixed(4)}) \\\\ &= P(F < ${F2.toFixed(4)}) - P(F < ${F1.toFixed(4)}) = ${probFinal.toFixed(4)} \\end{aligned}`;
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Población 1 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--primary-color)' }}>Población 1</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\sigma_1^2 =" /></label>
                            <input
                                type="number"
                                placeholder="Var. Muestral 1"
                                value={varPob1}
                                onChange={(e) => { setVarPob1(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="n_1 =" /></label>
                            <input
                                type="number"
                                placeholder="Muestra 1"
                                value={n1}
                                onChange={(e) => { setN1(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Población 2 */}
                <div style={{ background: 'var(--bg-app)', padding: '15px', borderRadius: RADIUS, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--primary-color)' }}>Población 2</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="\sigma_2^2 =" /></label>
                            <input
                                type="number"
                                placeholder="Var. Muestral 2"
                                value={varPob2}
                                onChange={(e) => { setVarPob2(e.target.value); resetDistribucion(); }}
                                style={{ flex: 1, padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ ...labelStyle, color: 'var(--text-main)', marginBottom: 0, width: '40px' }}><Latex formula="n_2 =" /></label>
                            <input
                                type="number"
                                placeholder="Var. Muestral 2"
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
                        <h4 style={{ margin: '0 0 10px 0', fontSize: FS.sm, color: 'var(--text-main)' }}>Grados de Libertad (v)</h4>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <Latex formula={`v_1 = ${n1} - 1 = ${datosParciales.v1}`} />
                            <Latex formula={`v_2 = ${n2} - 1 = ${datosParciales.v2}`} />
                        </div>
                    </div>

                    <label style={{ ...labelStyle, display: 'block', marginBottom: '10px' }}>Condición a Calcular</label>
                    <select
                        value={condicion}
                        onChange={(e) => setCondicion(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)', marginBottom: '15px', outline: 'none', background: 'white' }}
                    >
                        <option value="">-- Selecciona una Condición --</option>
                        <option value="menor_que">P(S₁² / S₂² {'<'} x)</option>
                        <option value="mayor_que">P(S₁² / S₂² {'>'} x)</option>
                        <option value="entre">P(x₁ {'<'} S₁² / S₂² {'<'} x₂)</option>
                    </select>

                    {condicion && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>x {condicion === 'entre' && '1'} = </label>
                            <input
                                type="number"
                                placeholder="Valor"
                                value={valorX1}
                                onChange={(e) => setValorX1(e.target.value)}
                                style={{ flex: 1, padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                            />
                            {condicion === 'entre' && (
                                <>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>x 2 = </label>
                                    <input
                                        type="number"
                                        placeholder="Valor"
                                        value={valorX2}
                                        onChange={(e) => setValorX2(e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: RADIUS, border: '1px solid var(--border-color)', outline: 'none' }}
                                    />
                                </>
                            )}
                        </div>
                    )}

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
