import React, { useEffect, useState, useRef } from 'react';
import { FONT, FS, RADIUS, cardStyle } from '../../../Principal/Constantes';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, LineChart, Line, Legend } from 'recharts';
import { generarCurvaDistribucion, generarCurvasMultiples } from '../../../Matematicas/logica_Tema2_v2';
import Latex from '../../../../../components/excel/Latex';
import MarcoWidgetMAT251 from '../../../ui/MarcoWidgetMAT251';
import { jStat } from 'jstat';
import { IconoMas, IconoBasura } from '../../../../../ui/iconos';
import { IconoProcedimiento } from '../../../ui/iconos';
import ModalTablaZ from '../Modales/ModalTablaZ';
import ModalTablaChi from '../Modales/ModalTablaChi';
import ModalTablaF from '../Modales/ModalTablaF';

const LatexLabel = ({ viewBox, value, fill, dy = -25, strokeColor, strokeWidth, strokeDasharray }) => {
    if (!viewBox) return null;

    const width = 120;
    const x = viewBox.x - (width / 2);
    const y = viewBox.y + dy;

    // Line coordinates
    const bottomY = viewBox.y + viewBox.height;
    const lineTop = viewBox.y + dy + 28; // Start drawing line slightly below the text box

    return (
        <g>
            {strokeColor && (
                <line
                    x1={viewBox.x}
                    y1={bottomY}
                    x2={viewBox.x}
                    y2={lineTop}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                />
            )}
            <foreignObject x={x} y={y} width={width} height={30} style={{ overflow: 'visible' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <div style={{
                        color: fill,
                        fontSize: '13px',
                        fontWeight: 'bold',
                        padding: '2px 6px'
                    }}>
                        <Latex formula={value} />
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

const SmartAnnotation = (props) => {
    // escapeX: positivo => etiqueta va a la DERECHA, negativo => izquierda
    const { viewBox, value, escapeX = 60 } = props;
    if (!viewBox || viewBox.x === undefined || viewBox.y === undefined) return null;

    const cx = viewBox.x;
    const cy = viewBox.y;

    const toRight = escapeX >= 0;

    // Tramo 1: diagonal a 45°
    const diagLen = 28;
    const midX = toRight ? cx + diagLen : cx - diagLen;
    const midY = cy - diagLen;

    // Tramo 2: horizontal recto hasta el texto
    const horizLen = Math.max(20, Math.abs(escapeX) - diagLen);
    const lineEndX = toRight ? midX + horizLen : midX - horizLen;
    const lineEndY = midY;

    const boxWidth = 90;
    const boxHeight = 28;
    const boxX = toRight ? lineEndX : lineEndX - boxWidth;
    const boxY = lineEndY - (boxHeight / 2);

    return (
        <g style={{ pointerEvents: 'none' }}>
            <path
                d={`M ${cx},${cy} L ${midX},${midY} L ${lineEndX},${lineEndY}`}
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={cx} cy={cy} r={5} fill="var(--primary-color)" />

            <foreignObject x={boxX} y={boxY} width={boxWidth} height={boxHeight} style={{ overflow: 'visible' }}>
                <div style={{
                    color: 'var(--text-main)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: toRight ? 'flex-start' : 'flex-end',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    height: '100%',
                }}>
                    {value}
                </div>
            </foreignObject>
        </g>
    );
};

export default function ResultadoDistribucionContinua_v2({ resultados, tipo, parametros }) {
    const [datosGrafico, setDatosGrafico] = useState([]);

    // Estados para el cálculo de probabilidades reactivo
    const [modo, setModo] = useState('menor'); // menor, mayor, entre
    const [valX, setValX] = useState('');
    const [valX2, setValX2] = useState('');
    const [valP, setValP] = useState('');
    const [intervals, setIntervals] = useState([{ id: 1, min: '', max: '' }, { id: 2, min: '', max: '' }]);
    const [resultadoProb, setResultadoProb] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [rangoSombreado, setRangoSombreado] = useState({ modo: null, x1: null, x2: null, intervals: [] });
    const [mostrarPasos, setMostrarPasos] = useState(false);
    const [zModalData, setZModalData] = useState({ isOpen: false, zValue: null });
    const [chiModalData, setChiModalData] = useState({ isOpen: false, k: null, xValue: null, pValue: null, modo: null });
    const [fModalData, setFModalData] = useState({ isOpen: false, d1: null, d2: null, xValue: null, pValue: null, modo: null });

    // Custom select para Modo
    const [isOpenModo, setIsOpenModo] = useState(false);
    const selectModoRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (selectModoRef.current && !selectModoRef.current.contains(e.target)) setIsOpenModo(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const opcionesModo = [
        { value: 'menor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><Latex formula="P(X < x)" /></span> },
        { value: 'mayor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><Latex formula="P(X > x)" /></span> },
        { value: 'entre', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><Latex formula="P(x_1 < X < x_2)" /></span> },
        { value: 'exterior', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><Latex formula="P(x_1 > X > x_2)" /></span> },
        { value: 'suma_intervalos', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}><Latex formula="P(x_1 < X < x_2) + P(x_3 < X < x_4) + \dots" /></span> },
        { value: 'inversa_menor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', color: 'var(--primary-color)' }}><Latex formula="P(X < c) = p" /></span> },
        { value: 'inversa_mayor', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', color: 'var(--primary-color)' }}><Latex formula="P(X > c) = p" /></span> },
        { value: 'inversa_exterior', label: <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', color: 'var(--primary-color)' }}><Latex formula="P(c_1 > X > c_2) = p" /></span> }
    ];

    // Efecto para calcular la probabilidad y actualizar la sombra dinámicamente
    useEffect(() => {
        if (!tipo || !parametros) return;

        setErrorMsg(null);
        setResultadoProb(null);

        if (modo !== 'suma_intervalos' && !['inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo) && valX === '') {
            setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
            return;
        }

        const x = parseFloat(valX);
        const x2 = parseFloat(valX2);
        const pInput = parseFloat(valP);

        if (modo !== 'suma_intervalos' && !['inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo) && isNaN(x)) {
            setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
            return;
        }

        if (['inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo)) {
            if (isNaN(pInput) || pInput <= 0 || pInput >= 1) {
                setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                return;
            }
        }

        const getCDF = (val) => {
            switch (tipo) {
                case 'normal':
                    return jStat.normal.cdf(val, parseFloat(parametros.mu), parseFloat(parametros.sigma));
                case 'estandar':
                    return jStat.normal.cdf(val, 0, 1);
                case 'chi-cuadrado':
                    return val < 0 ? 0 : jStat.chisquare.cdf(val, parseInt(parametros.k));
                case 'fisher':
                    return val < 0 ? 0 : jStat.centralF.cdf(val, parseInt(parametros.d1), parseInt(parametros.d2));
                default:
                    return 0;
            }
        };

        const bisectionInverse = (targetProb, isRightTail) => {
            let low = 0;
            let high = 0;

            if (['normal', 'estandar'].includes(tipo)) {
                const mu = tipo === 'estandar' ? 0 : parseFloat(parametros.mu);
                const sigma = tipo === 'estandar' ? 1 : parseFloat(parametros.sigma);
                low = mu - 10 * sigma;
                high = mu + 10 * sigma;
            } else if (tipo === 'chi-cuadrado') {
                const k = parseInt(parametros.k);
                low = 0;
                high = k + 25 * Math.sqrt(2 * k);
            } else if (tipo === 'fisher') {
                low = 0;
                high = 500; // fisher can have very long tails
            }

            let mid = 0;
            let iter = 0;
            while (high - low > 1e-6 && iter < 150) {
                mid = (low + high) / 2;
                const cdfMid = getCDF(mid);
                const currentProb = isRightTail ? 1 - cdfMid : cdfMid;

                if (isRightTail) {
                    if (currentProb > targetProb) low = mid;
                    else high = mid;
                } else {
                    if (currentProb < targetProb) low = mid;
                    else high = mid;
                }
                iter++;
            }
            return (low + high) / 2;
        };

        try {
            let p = 0;
            if (modo === 'menor') {
                p = getCDF(x);
                setRangoSombreado({ modo, x1: null, x2: x, intervals: [] });
            } else if (modo === 'mayor') {
                p = 1 - getCDF(x);
                setRangoSombreado({ modo, x1: x, x2: null, intervals: [] });
            } else if (modo === 'entre') {
                if (valX2 === '' || isNaN(x2)) {
                    setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                    return;
                }
                if (x >= x2) {
                    setErrorMsg('El límite inferior (x1) debe ser menor que el superior (x2).');
                    setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                    return;
                }
                p = getCDF(x2) - getCDF(x);
                setRangoSombreado({ modo, x1: x, x2: x2, intervals: [] });
            } else if (modo === 'exterior') {
                if (valX2 === '' || isNaN(x2)) {
                    setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                    return;
                }
                if (x >= x2) {
                    setErrorMsg('x1 debe ser menor que x2.');
                    setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                    return;
                }
                p = getCDF(x) + (1 - getCDF(x2));
                setRangoSombreado({ modo, x1: x, x2: x2, intervals: [] });
            } else if (modo === 'suma_intervalos') {
                const validIntervals = intervals
                    .filter(inv => inv.min !== '' && inv.max !== '')
                    .map(inv => ({ min: parseFloat(inv.min), max: parseFloat(inv.max) }));

                if (validIntervals.length === 0 || validIntervals.some(inv => isNaN(inv.min) || isNaN(inv.max))) {
                    setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                    return;
                }

                for (let i = 0; i < validIntervals.length; i++) {
                    if (validIntervals[i].min >= validIntervals[i].max) {
                        setErrorMsg(`El límite inferior debe ser menor al superior en todos los intervalos.`);
                        setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                        return;
                    }
                }

                validIntervals.sort((a, b) => a.min - b.min);
                for (let i = 0; i < validIntervals.length - 1; i++) {
                    if (validIntervals[i].max > validIntervals[i + 1].min) {
                        setErrorMsg(`Los intervalos no pueden superponerse.`);
                        setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
                        return;
                    }
                }

                p = validIntervals.reduce((acc, inv) => acc + (getCDF(inv.max) - getCDF(inv.min)), 0);
                setRangoSombreado({ modo, x1: null, x2: null, intervals: validIntervals });
            } else if (modo === 'inversa_menor') {
                const c = bisectionInverse(pInput, false);
                setValX(c.toFixed(4)); // Actualizamos silenciosamente valX para que renderPasos funcione fácil
                p = pInput;
                setRangoSombreado({ modo: 'menor', x1: null, x2: c, intervals: [] });
            } else if (modo === 'inversa_mayor') {
                const c = bisectionInverse(pInput, true);
                setValX(c.toFixed(4));
                p = pInput;
                setRangoSombreado({ modo: 'mayor', x1: c, x2: null, intervals: [] });
            } else if (modo === 'inversa_exterior') {
                const halfP = pInput / 2;
                const c1 = bisectionInverse(halfP, false); // cola inferior
                const c2 = bisectionInverse(halfP, true);  // cola superior
                setValX(c1.toFixed(4));
                setValX2(c2.toFixed(4));
                p = pInput;
                setRangoSombreado({ modo: 'exterior', x1: c1, x2: c2, intervals: [] });
            }
            setResultadoProb(p);
        } catch (err) {
            setErrorMsg("Error matemático al calcular probabilidad.");
            setRangoSombreado({ modo, x1: null, x2: null, intervals: [] });
        }
    }, [modo, valX, valX2, valP, intervals, tipo, parametros]);

    const renderPasos = () => {
        if (resultadoProb === null || (modo !== 'suma_intervalos' && isNaN(parseFloat(valX)))) return null;

        const isNormal = ['normal', 'estandar'].includes(tipo);
        const isChi = tipo === 'chi-cuadrado';
        const isFisher = tipo === 'fisher';

        const x1 = parseFloat(valX);
        const x2 = parseFloat(valX2);
        const isEntre = modo === 'entre';
        const isExterior = modo === 'exterior';
        const isSumaIntervalos = modo === 'suma_intervalos';
        const validIntervals = (intervals || []).filter(inv => inv.min !== '' && inv.max !== '').map(inv => ({ min: parseFloat(inv.min), max: parseFloat(inv.max) })).filter(inv => !isNaN(inv.min) && !isNaN(inv.max));

        if (['inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo)) {
            const pInput = parseFloat(valP);
            const isMenor = modo === 'inversa_menor';
            const isExterior = modo === 'inversa_exterior';
            return (
                <div style={{ marginTop: '20px', background: 'var(--bg-input)', padding: '20px', borderRadius: RADIUS, border: '1px solid var(--border-color)', animation: 'fadeInDropdown 0.3s ease', textAlign: 'left', color: 'var(--text-main)' }}>
                    <h5 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>Resolución de Probabilidad Inversa (Punto Crítico)</h5>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 1: Planteamiento de la Ecuación</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, fontSize: '16px', border: '1px dashed var(--border-color)' }}>
                            <Latex formula={isExterior ? `P(c_1 > X > c_2) = ${pInput}` : isMenor ? `P(X < c) = ${pInput}` : `P(X > c) = ${pInput}`} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 2: Búsqueda {isExterior ? `de los Puntos Críticos (2 Colas)` : `del Punto Crítico`} <Latex formula={isExterior ? `c_1 \\text{ y } c_2` : `c`} /></div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, fontSize: '16px', border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: FS.xs, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                {isExterior
                                    ? `Se divide la probabilidad a la mitad (${pInput / 2}) y se utiliza el Método de Bisección iterativamente en ambas colas.`
                                    : `Se utiliza el Método de Bisección sobre la Función de Distribución Acumulada (CDF) para hallar la inversa numérica iterativamente.`
                                }
                            </div>
                            {['normal', 'estandar'].includes(tipo) && (
                                <div style={{ fontSize: FS.xs, color: 'var(--primary-color)', marginBottom: '10px', fontStyle: 'italic' }}>
                                    Nota para Normales: Tradicionalmente {isExterior ? 'estos valores se aproximan' : 'este valor se aproxima'} buscando {isExterior ? `p/2 = ${pInput / 2}` : `p`} en una Tabla de $Z$, hallando el puntaje $z$, y despejando: $X = z \cdot \sigma + \mu$.
                                </div>
                            )}
                            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {isExterior ? (
                                    <>
                                        <Latex formula={`c_1 = ${parseFloat(valX).toFixed(4)}`} />
                                        <Latex formula={`c_2 = ${parseFloat(valX2).toFixed(4)}`} />
                                    </>
                                ) : (
                                    <Latex formula={`c = ${parseFloat(valX).toFixed(4)}`} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Resultado Final</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, fontSize: '16px', border: '1px dashed var(--border-color)', fontWeight: 'bold' }}>
                            <Latex formula={isExterior ? `P(${parseFloat(valX).toFixed(4)} > X > ${parseFloat(valX2).toFixed(4)}) = ${pInput}` : isMenor ? `P(X < ${parseFloat(valX).toFixed(4)}) = ${pInput}` : `P(X > ${parseFloat(valX).toFixed(4)}) = ${pInput}`} />
                        </div>
                    </div>
                </div>
            );
        }

        if (isNormal) {
            const isEstandar = tipo === 'estandar';
            const mu = isEstandar ? 0 : parseFloat(parametros.mu);
            const sigma = isEstandar ? 1 : parseFloat(parametros.sigma);
            const z1 = (x1 - mu) / sigma;
            const pZ1 = jStat.normal.cdf(z1, 0, 1);
            let z2 = null, pZ2 = null;

            if (isEntre || isExterior) {
                if (!isNaN(x2)) {
                    z2 = (x2 - mu) / sigma;
                    pZ2 = jStat.normal.cdf(z2, 0, 1);
                }
            }

            return (
                <div style={{ marginTop: '20px', background: 'var(--bg-input)', padding: '20px', borderRadius: RADIUS, border: '1px solid var(--border-color)', animation: 'fadeInDropdown 0.3s ease', textAlign: 'left', color: 'var(--text-main)' }}>
                    <h5 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>Resolución Matemática Paso a Paso</h5>

                    {/* Paso 1 */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 1: Fórmula de Estandarización</div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: '16px' }}><Latex formula="Z = \frac{X - \mu}{\sigma}" /></div>
                            <div style={{ fontSize: FS.xs, color: 'var(--text-muted)' }}>
                                Datos: <Latex formula={`\\mu = ${mu}`} />, <Latex formula={`\\sigma = ${sigma}`} />
                            </div>
                        </div>
                    </div>

                    {/* Paso 2 */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 2: Calcular el valor de Z</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, fontSize: '16px', border: '1px dashed var(--border-color)' }}>
                            {modo === 'menor' || modo === 'mayor' ? (
                                <Latex formula={`Z = \\frac{${x1} - ${mu}}{${sigma}} = ${z1.toFixed(4)}`} />
                            ) : modo === 'entre' || modo === 'exterior' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div><Latex formula={`Z_1 = \\frac{${x1} - ${mu}}{${sigma}} = ${z1.toFixed(4)}`} /></div>
                                    <div><Latex formula={`Z_2 = \\frac{${x2} - ${mu}}{${sigma}} = ${z2.toFixed(4)}`} /></div>
                                </div>
                            ) : modo === 'suma_intervalos' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {validIntervals.map((inv, idx) => (
                                        <React.Fragment key={idx}>
                                            <div><Latex formula={`Z_{${idx * 2 + 1}} = \\frac{${inv.min} - ${mu}}{${sigma}} = ${((inv.min - mu) / sigma).toFixed(4)}`} /></div>
                                            <div><Latex formula={`Z_{${idx * 2 + 2}} = \\frac{${inv.max} - ${mu}}{${sigma}} = ${((inv.max - mu) / sigma).toFixed(4)}`} /></div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <span>No se han especificado valores</span>
                            )}
                        </div>
                    </div>

                    {/* Paso 3 */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 3: Planteamiento de la Integral</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '16px', textAlign: 'center' }}>
                                <Latex formula="P(Z \le z_0) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^{z_0} e^{-\frac{x^2}{2}} dx" />
                            </div>
                            <div style={{ fontSize: FS.xs, fontStyle: 'italic', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                <span>
                                    Nota: Esta integral no tiene solución algebraica. El valor de {resultadoProb.toFixed(4)} se obtiene buscando el valor de Z en la Tabla de la Normal Estándar o mediante aproximación computacional.
                                </span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {modo === 'suma_intervalos' ? (
                                        validIntervals.flatMap((inv, idx) => {
                                            const zStart = (inv.min - mu) / sigma;
                                            const zEnd = (inv.max - mu) / sigma;
                                            return [
                                                <button
                                                    key={`btn-z-${idx * 2 + 1}`}
                                                    onClick={() => setZModalData({ isOpen: true, zValue: zStart })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    Ver Z_{idx * 2 + 1} en Tabla
                                                </button>,
                                                <button
                                                    key={`btn-z-${idx * 2 + 2}`}
                                                    onClick={() => setZModalData({ isOpen: true, zValue: zEnd })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    Ver Z_{idx * 2 + 2} en Tabla
                                                </button>
                                            ];
                                        })
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setZModalData({ isOpen: true, zValue: z1 })}
                                                style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                            >
                                                {['entre', 'exterior'].includes(modo) ? `Ver Z1 en Tabla` : `Ver en Tabla Z`}
                                            </button>
                                            {['entre', 'exterior'].includes(modo) && (
                                                <button
                                                    onClick={() => setZModalData({ isOpen: true, zValue: z2 })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    Ver Z2 en Tabla
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Paso 4 */}
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 4: Calcular la Probabilidad Final</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '16px', border: '1px dashed var(--border-color)' }}>
                            {modo === 'menor' && (
                                <>
                                    <div><Latex formula={`P(X < ${x1}) = P(Z < ${z1.toFixed(4)})`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'mayor' && (
                                <>
                                    <div><Latex formula={`P(X > ${x1}) = P(Z > ${z1.toFixed(4)})`} /></div>
                                    <div><Latex formula={`= 1 - P(Z \\le ${z1.toFixed(4)})`} /></div>
                                    <div><Latex formula={`= 1 - ${pZ1.toFixed(4)}`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'entre' && (
                                <>
                                    <div><Latex formula={`P(${x1} < X < ${x2}) = P(${z1.toFixed(4)} < Z < ${z2.toFixed(4)})`} /></div>
                                    <div><Latex formula={`= P(Z < ${z2.toFixed(4)}) - P(Z < ${z1.toFixed(4)})`} /></div>
                                    <div><Latex formula={`= ${pZ2.toFixed(4)} - ${pZ1.toFixed(4)}`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'exterior' && (
                                <>
                                    <div><Latex formula={`P(${x1} > X > ${x2}) = P\\left( \\frac{${x1} - ${mu}}{${sigma}} > Z > \\frac{${x2} - ${mu}}{${sigma}} \\right)`} /></div>
                                    <div><Latex formula={`= P(${z1.toFixed(4)} > Z > ${z2.toFixed(4)})`} /></div>
                                    <div><Latex formula={`= 1 - [ P(Z \\le ${z2.toFixed(4)}) - P(Z \\le ${z1.toFixed(4)}) ]`} /></div>
                                    <div><Latex formula={`= 1 - [ ${pZ2.toFixed(4)} - ${pZ1.toFixed(4)} ]`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'suma_intervalos' && (
                                <>
                                    <div><Latex formula={validIntervals.map(i => `P(${i.min} < X < ${i.max})`).join(' + ')} /></div>
                                    <div><Latex formula={validIntervals.map(i => `P(${((i.min - mu) / sigma).toFixed(4)} < Z < ${((i.max - mu) / sigma).toFixed(4)})`).join(' + ')} /></div>
                                    <div><Latex formula={validIntervals.map(i => `(P(Z < ${((i.max - mu) / sigma).toFixed(4)}) - P(Z < ${((i.min - mu) / sigma).toFixed(4)}))`).join(' + ')} /></div>
                                    <div><Latex formula={validIntervals.map(i => `(${jStat.normal.cdf((i.max - mu) / sigma, 0, 1).toFixed(4)} - ${jStat.normal.cdf((i.min - mu) / sigma, 0, 1).toFixed(4)})`).join(' + ')} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        } else if (isChi || isFisher) {
            const isChi = tipo === 'chi-cuadrado';

            // Fórmulas PDF
            const formulaPDFChi = `f(x; k) = \\frac{x^{\\frac{k}{2}-1} e^{-\\frac{x}{2}}}{2^{\\frac{k}{2}} \\Gamma\\left(\\frac{k}{2}\\right)}`;
            const formulaPDFFisher = `f(x; n, m) = \\frac{\\Gamma\\left(\\frac{n+m}{2}\\right) \\left(\\frac{n}{m}\\right)^{n/2}}{\\Gamma\\left(\\frac{n}{2}\\right)\\Gamma\\left(\\frac{m}{2}\\right)} \\frac{x^{\\frac{n}{2}-1}}{\\left(1 + \\frac{n}{m}x\\right)^{(n+m)/2}}`;

            const formulaPDF = isChi ? formulaPDFChi : formulaPDFFisher;

            // Textos de parámetros
            const paramText = isChi
                ? `k = ${parametros.k}`
                : `n = ${parametros.d1}, m = ${parametros.d2}`;

            const symbol = isChi ? '\\chi^2' : 'F';
            const f_t = isChi ? 'f(t; k)' : 'f(t; n, m)';

            // Función Helper para CDF interno (Chi o Fisher)
            const getCDFLocal = (val) => {
                if (isChi) return val < 0 ? 0 : jStat.chisquare.cdf(val, parseInt(parametros.k));
                if (isFisher) return val < 0 ? 0 : jStat.centralF.cdf(val, parseInt(parametros.d1), parseInt(parametros.d2));
                return 0;
            };

            // Valores de probabilidad para el paso 3
            let pX1 = getCDFLocal(x1);
            let pX2 = ['entre', 'exterior'].includes(modo) ? getCDFLocal(x2) : null;

            return (
                <div style={{ marginTop: '20px', background: 'var(--bg-input)', padding: '20px', borderRadius: RADIUS, border: '1px solid var(--border-color)', animation: 'fadeInDropdown 0.3s ease', textAlign: 'left', color: 'var(--text-main)' }}>
                    <h5 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.sm }}>Resolución Matemática Paso a Paso</h5>

                    {/* Paso 1 */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 1: Función de Densidad de Probabilidad (PDF)</div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: '16px' }}><Latex formula={formulaPDF} /></div>
                            <div style={{ fontSize: FS.xs, color: 'var(--text-muted)' }}>
                                Datos: <Latex formula={paramText} />
                            </div>
                        </div>
                    </div>

                    {/* Paso 2 */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 2: Planteamiento de la Integral (CDF)</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, fontSize: '16px', border: '1px dashed var(--border-color)', overflowX: 'auto' }}>
                            <div style={{ marginBottom: '10px', fontSize: FS.xs, color: 'var(--text-muted)' }}>Sustituyendo los parámetros en la función de densidad e integrando:</div>
                            {(() => {
                                const chiIntTemplate = `\\frac{t^{\\frac{${parametros.k}}{2}-1} e^{-\\frac{t}{2}}}{2^{\\frac{${parametros.k}}{2}} \\Gamma\\left(\\frac{${parametros.k}}{2}\\right)}`;
                                const fisherIntTemplate = `\\frac{\\Gamma\\left(\\frac{${parametros.d1}+${parametros.d2}}{2}\\right) \\left(\\frac{${parametros.d1}}{${parametros.d2}}\\right)^{${parametros.d1}/2}}{\\Gamma\\left(\\frac{${parametros.d1}}{2}\\right)\\Gamma\\left(\\frac{${parametros.d2}}{2}\\right)} \\frac{t^{\\frac{${parametros.d1}}{2}-1}}{\\left(1 + \\frac{${parametros.d1}}{${parametros.d2}}t\\right)^{(${parametros.d1}+${parametros.d2})/2}}`;
                                const integralBody = isChi ? chiIntTemplate : fisherIntTemplate;

                                return (
                                    <>
                                        {modo === 'menor' && (
                                            <Latex formula={`P(${symbol} < ${x1}) = \\int_{0}^{${x1}} ${integralBody} \\, dt`} />
                                        )}
                                        {modo === 'mayor' && (
                                            <Latex formula={`P(${symbol} > ${x1}) = \\int_{${x1}}^{\\infty} ${integralBody} \\, dt`} />
                                        )}
                                        {modo === 'entre' && (
                                            <Latex formula={`P(${x1} < ${symbol} < ${x2}) = \\int_{${x1}}^{${x2}} ${integralBody} \\, dt`} />
                                        )}
                                    </>
                                );
                            })()}
                            {modo === 'exterior' && (
                                <Latex formula={`P(${symbol} < ${x1}) + P(${symbol} > ${x2}) = \\int_{0}^{${x1}} f(t)\\, dt + \\int_{${x2}}^{\\infty} f(t)\\, dt`} />
                            )}
                            {modo === 'suma_intervalos' && (
                                <Latex formula={`${validIntervals.map(i => `P(${i.min} < ${symbol} < ${i.max})`).join(' + ')} = ${validIntervals.map(i => `\\int_{${i.min}}^{${i.max}} f(t)\\, dt`).join(' + ')}`} />
                            )}
                        </div>
                    </div>

                    {/* Paso 3 */}
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: FS.sm, marginBottom: '8px' }}>Paso 3: Calcular la Probabilidad Final</div>
                        <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: RADIUS, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '16px', border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: FS.xs, fontStyle: 'italic', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                                <span>
                                    *Nota: Esta integral no posee solución algebraica exacta. El valor se obtiene computacionalmente mediante aproximación numérica o tablas estadísticas.
                                </span>
                                {isChi && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {modo === 'suma_intervalos' ? (
                                            validIntervals.flatMap((inv, idx) => [
                                                <button
                                                    key={`btn-chi-${idx * 2 + 1}`}
                                                    onClick={() => setChiModalData({ isOpen: true, k: parseInt(parametros.k), xValue: inv.min, pValue: getCDFLocal(inv.min), modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >Ver X²_{idx * 2 + 1} en Tabla</button>,
                                                <button
                                                    key={`btn-chi-${idx * 2 + 2}`}
                                                    onClick={() => setChiModalData({ isOpen: true, k: parseInt(parametros.k), xValue: inv.max, pValue: getCDFLocal(inv.max), modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >Ver X²_{idx * 2 + 2} en Tabla</button>
                                            ])
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setChiModalData({ isOpen: true, k: parseInt(parametros.k), xValue: x1, pValue: pX1, modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    {['entre', 'exterior'].includes(modo) ? `Ver X² (1) en Tabla` : `Ver en Tabla Chi-Cuadrado`}
                                                </button>
                                                {['entre', 'exterior'].includes(modo) && (
                                                    <button
                                                        onClick={() => setChiModalData({ isOpen: true, k: parseInt(parametros.k), xValue: x2, pValue: pX2, modo: modo })}
                                                        style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                    >Ver X² (2) en Tabla</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                {isFisher && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {modo === 'suma_intervalos' ? (
                                            validIntervals.flatMap((inv, idx) => [
                                                <button
                                                    key={`btn-f-${idx * 2 + 1}`}
                                                    onClick={() => setFModalData({ isOpen: true, d1: parseInt(parametros.d1), d2: parseInt(parametros.d2), xValue: inv.min, pValue: getCDFLocal(inv.min), modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >Ver F_{idx * 2 + 1} en Tabla</button>,
                                                <button
                                                    key={`btn-f-${idx * 2 + 2}`}
                                                    onClick={() => setFModalData({ isOpen: true, d1: parseInt(parametros.d1), d2: parseInt(parametros.d2), xValue: inv.max, pValue: getCDFLocal(inv.max), modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >Ver F_{idx * 2 + 2} en Tabla</button>
                                            ])
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setFModalData({ isOpen: true, d1: parseInt(parametros.d1), d2: parseInt(parametros.d2), xValue: x1, pValue: pX1, modo: modo })}
                                                    style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    {['entre', 'exterior'].includes(modo) ? `Ver F (1) en Tabla` : `Ver en Tabla F-Fisher`}
                                                </button>
                                                {['entre', 'exterior'].includes(modo) && (
                                                    <button
                                                        onClick={() => setFModalData({ isOpen: true, d1: parseInt(parametros.d1), d2: parseInt(parametros.d2), xValue: x2, pValue: pX2, modo: modo })}
                                                        style={{ padding: '4px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                    >Ver F (2) en Tabla</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {modo === 'menor' && (
                                <>
                                    <div><Latex formula={`P(${symbol} < ${x1})`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'mayor' && (
                                <>
                                    <div><Latex formula={`P(${symbol} > ${x1}) = 1 - P(${symbol} \\le ${x1})`} /></div>
                                    <div><Latex formula={`= 1 - ${pX1.toFixed(4)}`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'entre' && (
                                <>
                                    <div><Latex formula={`P(${x1} < ${symbol} < ${x2}) = P(${symbol} < ${x2}) - P(${symbol} < ${x1})`} /></div>
                                    <div><Latex formula={`= ${pX2.toFixed(4)} - ${pX1.toFixed(4)}`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'exterior' && (
                                <>
                                    <div><Latex formula={`P(${symbol} < ${x1}) + P(${symbol} > ${x2})`} /></div>
                                    <div><Latex formula={`= P(${symbol} < ${x1}) + (1 - P(${symbol} \\le ${x2}))`} /></div>
                                    <div><Latex formula={`= ${pX1.toFixed(4)} + (1 - ${pX2.toFixed(4)})`} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                            {modo === 'suma_intervalos' && (
                                <>
                                    <div><Latex formula={validIntervals.map(i => `P(${i.min} < ${symbol} < ${i.max})`).join(' + ')} /></div>
                                    <div><Latex formula={validIntervals.map(i => `(P(${symbol} < ${i.max}) - P(${symbol} < ${i.min}))`).join(' + ')} /></div>
                                    <div><Latex formula={validIntervals.map(i => `(${getCDFLocal(i.max).toFixed(4)} - ${getCDFLocal(i.min).toFixed(4)})`).join(' + ')} /></div>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><Latex formula={`= ${resultadoProb.toFixed(4)}`} /></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };





    // Generar la curva gráfica optimizada
    useEffect(() => {
        if (parametros?.modoB) {
            const validMultiples = (parametros.multiples || []).filter(c => {
                if (tipo === 'normal') return c.params.mu !== '' && c.params.sigma !== '';
                if (tipo === 'chi-cuadrado') return c.params.k !== '';
                if (tipo === 'fisher') return c.params.d1 !== '' && c.params.d2 !== '';
                return true;
            });
            if (validMultiples.length === 0) {
                setDatosGrafico([]);
                return;
            }
            const datosMultiples = generarCurvasMultiples(tipo, validMultiples);
            setDatosGrafico(datosMultiples);
            return;
        }

        if (!resultados || resultados.error || !tipo || !parametros) {
            setDatosGrafico([]);
            return;
        }

        const datos = generarCurvaDistribucion(tipo, parametros);
        setDatosGrafico(datos);

        // CLEANUP FUNCTION: Limpiar memoria al desmontar
        return () => {
            setDatosGrafico([]);
        };
    }, [resultados, tipo, parametros]);

    if (!parametros?.modoB && !resultados) return null;

    if (!parametros?.modoB && resultados?.error) {
        return (
            <div style={{ ...cardStyle, background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', fontWeight: 'bold' }}>
                {resultados.error}
            </div>
        );
    }

    const { esperanza, varianza, asimetria, curtosis } = resultados || {};

    const formatoNum = (num) => {
        if (typeof num === 'string') return num;
        if (typeof num === 'number') {
            if (Math.abs(num) < 0.0001 && num !== 0) return num.toExponential(2);
            return num.toFixed(2);
        }
        return "N/A";
    };

    if (parametros?.modoB) {
        const validMultiples = (parametros.multiples || []).filter(c => {
            if (!c || !c.params) return false;
            if (tipo === 'normal') return c.params.mu !== '' && c.params.sigma !== '';
            if (tipo === 'chi-cuadrado') return c.params.k !== '';
            if (tipo === 'fisher') return c.params.d1 !== '' && c.params.d2 !== '';
            return true;
        });

        return (
            <div style={{ ...cardStyle, fontFamily: FONT, background: 'var(--bg-card)' }}>
                <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.md }}>
                    Comparación de Múltiples Curvas
                </h4>
                {datosGrafico.length > 0 && validMultiples.length > 0 ? (
                    <div style={{ marginTop: '20px', width: '100%' }}>
                        <MarcoWidgetMAT251 id="grafica_continua_v2_multi" titulo="Comparación de Curvas" anchoCompleto={true} alto="450px">
                            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={datosGrafico} margin={{ top: 35, right: 30, left: 0, bottom: 30 }}>
                                        <XAxis
                                            dataKey="x"
                                            type="number"
                                            domain={['dataMin', 'dataMax']}
                                            allowDataOverflow={true}
                                            padding={{ left: 20, right: 20 }}
                                            tickFormatter={(val) => {
                                                if (typeof val !== 'number' || isNaN(val)) return '';
                                                return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
                                            }}
                                            tick={{ fill: '#000', fontSize: 13 }}
                                            axisLine={{ stroke: '#000', strokeWidth: 1.5 }}
                                            tickLine={{ stroke: '#000', strokeWidth: 1.5 }}
                                        />
                                        <YAxis
                                            domain={[0, dataMax => (typeof dataMax === 'number' && isFinite(dataMax) ? dataMax * 1.15 : 'auto')]}
                                            tickFormatter={(val) => {
                                                if (typeof val !== 'number' || isNaN(val)) return '';
                                                return val === 0 ? 0 : parseFloat(val.toPrecision(2));
                                            }}
                                            tick={{ fill: '#000', fontSize: 13 }}
                                            axisLine={{ stroke: '#000', strokeWidth: 1.5 }}
                                            tickLine={{ stroke: '#000', strokeWidth: 1.5 }}
                                            width={55}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            layout="vertical"
                                            wrapperStyle={{ padding: '10px' }}
                                            formatter={(value) => {
                                                const parts = value.split(/(μ|σ|k|n|m)/g);
                                                return (
                                                    <span style={{ color: 'var(--text-color)', fontSize: '13px' }}>
                                                        {parts.map((part, i) => ['μ', 'σ', 'k', 'n', 'm'].includes(part) ? <b key={i}>{part}</b> : part)}
                                                    </span>
                                                );
                                            }}
                                        />
                                        {validMultiples.map((c, i) => {
                                            const label = tipo === 'normal' ? `μ=${c.params.mu}, σ=${c.params.sigma}` : tipo === 'chi-cuadrado' ? `k=${c.params.k}` : tipo === 'fisher' ? `n=${c.params.d1}, m=${c.params.d2}` : 'Normal Estándar';
                                            return <Line key={c.id || i} type="monotone" dataKey={`y_${i}`} name={label} stroke={c.color || '#3b82f6'} dot={false} strokeWidth={2} isAnimationActive={false} />;
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </MarcoWidgetMAT251>
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay suficientes parámetros válidos para comparar.</div>
                )}
            </div>
        );
    }

    // 1. Cálculo dinámico del dominio elástico para el Eje X (Zoom-out)
    const domainDinamico = React.useMemo(() => {
        if (!resultados || typeof esperanza !== 'number' || typeof varianza !== 'number') {
            return ['dataMin', 'dataMax'];
        }

        const mu = esperanza;
        const sigma = Math.sqrt(varianza);
        const padding = sigma * 0.5; // Margen para que no quede pegado al borde (media desviación estándar)

        // Rango base
        let minX = mu - 4 * sigma;
        let maxX = mu + 4 * sigma;

        // Ajuste elástico si x1 sobrepasa los límites
        if (rangoSombreado?.x1 !== null) {
            if (rangoSombreado.x1 < minX) minX = rangoSombreado.x1 - padding;
            if (rangoSombreado.x1 > maxX) maxX = rangoSombreado.x1 + padding;
        }

        // Ajuste elástico si x2 sobrepasa los límites
        if (rangoSombreado?.x2 !== null) {
            if (rangoSombreado.x2 < minX) minX = rangoSombreado.x2 - padding;
            if (rangoSombreado.x2 > maxX) maxX = rangoSombreado.x2 + padding;
        }

        return [minX, maxX];
    }, [esperanza, varianza, rangoSombreado]);

    const datosGraficoPadded = React.useMemo(() => {
        if (!datosGrafico || datosGrafico.length === 0) return [];
        const [minX, maxX] = domainDinamico;
        if (typeof minX !== 'number') return datosGrafico;

        const p = [...datosGrafico];
        const step = (p[p.length - 1].x - p[0].x) / p.length;
        const validStep = step > 0 && isFinite(step) ? step : 0.1;

        let currX = p[0].x - validStep;
        while (currX >= minX) {
            p.unshift({ x: parseFloat(currX.toFixed(3)), y: 0 });
            currX -= validStep;
        }

        currX = p[p.length - 1].x + validStep;
        while (currX <= maxX) {
            p.push({ x: parseFloat(currX.toFixed(3)), y: 0 });
            currX += validStep;
        }

        return p;
    }, [datosGrafico, domainDinamico]);

    // Calculamos offsets para sombreado usando los datos YA RELLENADOS para que los gradientes cuadren
    const { offset1, offset2, offsetStops } = React.useMemo(() => {
        const dataToUse = datosGraficoPadded.length > 0 ? datosGraficoPadded : datosGrafico;

        if (!rangoSombreado || (rangoSombreado.x1 === null && rangoSombreado.x2 === null && (!rangoSombreado.intervals || rangoSombreado.intervals.length === 0)) || dataToUse.length === 0) {
            return { offset1: 0, offset2: 100, offsetStops: [] }; // Sin rango, mostramos color normal
        }

        const xMin = dataToUse[0].x;
        const xMax = dataToUse[dataToUse.length - 1].x;
        const rangoTotal = xMax - xMin;

        const getPerc = (val) => {
            if (val === null || val === undefined) return null;
            return Math.max(0, Math.min(100, ((val - xMin) / rangoTotal) * 100));
        };

        const perc1 = rangoSombreado.x1 === null ? (rangoSombreado.modo === 'menor' ? 0 : null) : getPerc(rangoSombreado.x1);
        const perc2 = rangoSombreado.x2 === null ? (rangoSombreado.modo === 'mayor' ? 100 : null) : getPerc(rangoSombreado.x2);

        const stops = (rangoSombreado.intervals || []).map(inv => ({
            perc1: getPerc(inv.min),
            perc2: getPerc(inv.max)
        }));

        return { offset1: perc1, offset2: perc2, offsetStops: stops };
    }, [datosGraficoPadded, datosGrafico, rangoSombreado]);

    // 1.5 Calculamos el Centro de Masa (Centroid) del área sombreada
    // 1.5 Calculamos el Centro de Masa (Centroid) y los puntos de anotación (etiquetas)
    const annotationData = React.useMemo(() => {
        if (!rangoSombreado || (rangoSombreado.x1 === null && rangoSombreado.x2 === null && (!rangoSombreado.intervals || rangoSombreado.intervals.length === 0)) || datosGrafico.length === 0 || resultadoProb === null) {
            return [];
        }

        const { x1, x2, intervals: sIntervals, modo: visualModo } = rangoSombreado;
        const mu = typeof esperanza === 'number' ? esperanza : 0;
        const sigma = Math.sqrt(varianza);

        const getClosestY = (x_target) => {
            let closestY = 0;
            let minDiff = Infinity;
            for (let i = 0; i < datosGrafico.length; i++) {
                const diff = Math.abs(datosGrafico[i].x - x_target);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestY = datosGrafico[i].y;
                }
            }
            return closestY;
        };

        const getCDF = (val) => {
            if (val === null || val === undefined) return 0;
            try {
                switch (tipo) {
                    case 'normal': return jStat.normal.cdf(val, parseFloat(parametros.mu), parseFloat(parametros.sigma));
                    case 'estandar': return jStat.normal.cdf(val, 0, 1);
                    case 'chi-cuadrado': return val < 0 ? 0 : jStat.chisquare.cdf(val, parseInt(parametros.k));
                    case 'fisher': return val < 0 ? 0 : jStat.centralF.cdf(val, parseInt(parametros.d1), parseInt(parametros.d2));
                    default: return 0;
                }
            } catch { return 0; }
        };

        let annotations = [];

        if (visualModo === 'exterior' && x1 !== null && x2 !== null) {
            const x_anchor1 = x1 - (0.35 * sigma);
            const prob1 = getCDF(x1);
            // Si el punto está muy a la izquierda (cerca del borde), lo empujamos hacia adentro (50). Si no, hacia afuera (-50).
            const escapeX1 = x_anchor1 < mu - 2 * sigma ? 50 : -50;

            annotations.push({
                x: x_anchor1,
                y: getClosestY(x_anchor1) / 2,
                text: `Izquierda: ${(prob1 * 100).toFixed(2)}%`,
                escapeX: escapeX1
            });

            const x_anchor2 = x2 + (0.35 * sigma);
            const prob2 = 1 - getCDF(x2);
            // Si el punto está muy a la derecha (cerca del borde), lo empujamos hacia adentro (-50). Si no, hacia afuera (50).
            const escapeX2 = x_anchor2 > mu + 2 * sigma ? -50 : 50;

            annotations.push({
                x: x_anchor2,
                y: getClosestY(x_anchor2) / 2,
                text: `Derecha: ${(prob2 * 100).toFixed(2)}%`,
                escapeX: escapeX2
            });
        } else if (visualModo === 'suma_intervalos' && sIntervals?.length > 0) {
            sIntervals.forEach((inv, idx) => {
                if (inv.min !== null && inv.max !== null && inv.min !== '' && inv.max !== '') {
                    const minVal = parseFloat(inv.min);
                    const maxVal = parseFloat(inv.max);
                    if (!isNaN(minVal) && !isNaN(maxVal) && minVal < maxVal) {
                        const x_anchor = (minVal + maxVal) / 2;
                        const prob = getCDF(maxVal) - getCDF(minVal);
                        annotations.push({
                            x: x_anchor,
                            y: getClosestY(x_anchor) / 2,
                            text: `${(prob * 100).toFixed(2)}%`,
                            escapeX: idx % 2 === 0 ? 50 : -50
                        });
                    }
                }
            });
        } else {
            let sumXY = 0;
            let sumY = 0;
            for (let i = 0; i < datosGrafico.length; i++) {
                const pt = datosGrafico[i];
                let isShaded = false;
                if (visualModo === 'entre' && x1 !== null && x2 !== null) {
                    if (pt.x >= x1 && pt.x <= x2) isShaded = true;
                } else if (visualModo === 'menor' && x2 !== null) {
                    if (pt.x <= x2) isShaded = true;
                } else if (visualModo === 'mayor' && x1 !== null) {
                    if (pt.x >= x1) isShaded = true;
                }
                if (isShaded) {
                    sumXY += pt.x * pt.y;
                    sumY += pt.y;
                }
            }
            let x_anchor = sumY > 0 ? sumXY / sumY : mu;
            let escapeX = 0;

            annotations.push({
                x: x_anchor,
                y: getClosestY(x_anchor) / 2,
                text: `${(resultadoProb * 100).toFixed(2)}%`,
                escapeX: escapeX
            });
        }

        return annotations;
    }, [rangoSombreado, datosGrafico, resultadoProb, esperanza, varianza, modo, tipo, parametros]);

    // 2. Generar array de 'ticks' personalizado (Actualizado con los límites dinámicos)
    const xAxisTicks = React.useMemo(() => {
        if (!resultados || typeof esperanza !== 'number' || typeof varianza !== 'number') return undefined;

        const mu = esperanza;
        const sigma = Math.sqrt(varianza);

        // Pasos exactos base: μ-3σ, μ-2σ, μ-1σ, μ, μ+1σ, μ+2σ, μ+3σ
        let ticks = [
            mu - 3 * sigma,
            mu - 2 * sigma,
            mu - 1 * sigma,
            mu,
            mu + 1 * sigma,
            mu + 2 * sigma,
            mu + 3 * sigma
        ];

        // Añadimos las variables de entrada a los ticks para que el eje renderice el número exacto ingresado
        if (rangoSombreado?.x1 !== null && rangoSombreado?.x1 !== undefined) ticks.push(rangoSombreado.x1);
        if (rangoSombreado?.x2 !== null && rangoSombreado?.x2 !== undefined) ticks.push(rangoSombreado.x2);

        if (rangoSombreado?.intervals) {
            rangoSombreado.intervals.forEach(inv => {
                if (inv.min !== null && inv.min !== undefined && !isNaN(inv.min)) ticks.push(inv.min);
                if (inv.max !== null && inv.max !== undefined && !isNaN(inv.max)) ticks.push(inv.max);
            });
        }

        if (['chi-cuadrado', 'fisher', 'exponencial'].includes(tipo)) {
            ticks.push(0);
        }

        // Limpiar duplicados y ordenar de menor a mayor
        return Array.from(new Set(ticks)).sort((a, b) => a - b);
    }, [esperanza, varianza, rangoSombreado, tipo]);

    // 3. Lógica para escalonamiento dinámico de etiquetas (Evitar colisión con la media)
    const labelOffsets = React.useMemo(() => {
        if (typeof esperanza !== 'number' || typeof varianza !== 'number') return { dy1: -25, dy2: -25 };
        const mu = esperanza;
        const sigma = Math.sqrt(varianza);
        const threshold = sigma * 0.85; // Umbral de colisión (85% de una desviación estándar)

        let dy1 = -25;
        let dy2 = -25;
        let dy3 = -25;
        let dy4 = -25;

        const x1 = rangoSombreado?.x1;
        const x2 = rangoSombreado?.x2;

        if (x1 !== null && x1 !== undefined) {
            if (Math.abs(x1 - mu) < threshold) dy1 = 12;
        }

        if (x2 !== null && x2 !== undefined) {
            if (Math.abs(x2 - mu) < threshold) {
                dy2 = 45;
            } else if (x1 !== null && Math.abs(x2 - x1) < threshold) {
                dy2 = dy1 === -25 ? 12 : -25;
            }
        }

        // For intervals, we'll just provide static offsets that alternate well
        // since dynamic collision detection for N intervals is overkill for now
        dy3 = 12;
        dy4 = 45;

        return { dy1, dy2, dy3, dy4 };
    }, [esperanza, varianza, rangoSombreado]);

    return (
        <div style={{ fontFamily: FONT }}>
            <div style={{ ...cardStyle, marginTop: '20px' }}>
                <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0', fontSize: FS.md }}>
                    Momentos Estadísticos y Gráfica Teórica
                </h4>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="tabla-academica" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                        <thead style={{ position: 'sticky', top: 0 }}>
                            <tr>
                                <th>Parámetro</th>
                                <th>Símbolo</th>
                                <th>Valor Teórico</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Esperanza Matemática (Media)</td>
                                <td><Latex formula="\mu" /></td>
                                <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{formatoNum(esperanza)}</td>
                            </tr>
                            <tr>
                                <td>Varianza</td>
                                <td><Latex formula="\sigma^2" /></td>
                                <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{formatoNum(varianza)}</td>
                            </tr>
                            <tr>
                                <td>Desviación Estándar</td>
                                <td><Latex formula="\sigma" /></td>
                                <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {typeof varianza === 'number' ? formatoNum(Math.sqrt(varianza)) : "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td>Asimetría</td>
                                <td><Latex formula="As" /></td>
                                <td>{formatoNum(asimetria)}</td>
                            </tr>
                            <tr>
                                <td>Curtosis</td>
                                <td><Latex formula="K" /></td>
                                <td>{formatoNum(curtosis)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: RADIUS }}>
                    <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)' }}>Cálculo de Área / Probabilidad (Reactivo)</h4>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1 1 300px' }} ref={selectModoRef}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: FS.sm, color: 'var(--text-main)' }}>Tipo de Probabilidad:</label>
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setIsOpenModo(!isOpenModo)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        background: 'var(--bg-input, #fff)',
                                        border: `1px solid ${isOpenModo ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        borderRadius: RADIUS, cursor: 'pointer',
                                        boxShadow: isOpenModo ? '0 0 0 3px rgba(0,123,255,0.15)' : 'none',
                                        transition: 'all 0.2s ease',
                                        color: 'var(--text-main)',
                                        userSelect: 'none',
                                        fontSize: FS.sm,
                                        minHeight: '42px' // En lugar de height fijo, para acomodar KaTeX
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {opcionesModo.find(o => o.value === modo)?.label}
                                    </span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: isOpenModo ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted)' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>

                                {isOpenModo && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                        background: 'var(--bg-card, #fff)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: RADIUS,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        zIndex: 1000,
                                        overflow: 'hidden',
                                        animation: 'fadeInDropdown 0.2s ease'
                                    }}>
                                        {opcionesModo.map(op => {
                                            const active = op.value === modo;
                                            return (
                                                <div
                                                    key={op.value}
                                                    onClick={() => { setModo(op.value); setValX(''); setValX2(''); setIntervals([{ id: 1, min: '', max: '' }, { id: 2, min: '', max: '' }]); setIsOpenModo(false); }}
                                                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,123,255,0.08)' }}
                                                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        background: active ? 'rgba(0,123,255,0.05)' : 'transparent',
                                                        color: active ? 'var(--primary-color)' : 'var(--text-main)',
                                                        fontWeight: active ? 600 : 400,
                                                        fontSize: FS.sm,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    {op.label}
                                                    {active && (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {['inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo) && (
                            <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: FS.sm, color: 'var(--text-main)' }}>
                                    <Latex formula="\text{Probabilidad / Área } (p):" />
                                </label>
                                <input
                                    type="number"
                                    value={valP}
                                    onChange={e => setValP(e.target.value)}
                                    step="0.01"
                                    min="0.0001"
                                    max="0.9999"
                                    placeholder="Ej. 0.05"
                                    style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                                />
                            </div>
                        )}

                        {!['suma_intervalos', 'inversa_menor', 'inversa_mayor', 'inversa_exterior'].includes(modo) && (
                            <>
                                <div style={{ flex: '1 1 150px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: FS.sm, color: 'var(--text-main)' }}>
                                        {modo === 'exterior' ? <Latex formula="\text{Límite Izquierdo } (x_1):" /> : modo === 'entre' ? <Latex formula="\text{Límite Inferior } (x_1):" /> : <Latex formula="\text{Valor } (x):" />}
                                    </label>
                                    <input
                                        type="number"
                                        value={valX}
                                        onChange={e => setValX(e.target.value)}
                                        step="any"
                                        style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                                    />
                                </div>

                                {['entre', 'exterior'].includes(modo) && (
                                    <div style={{ flex: '1 1 150px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: FS.sm, color: 'var(--text-main)' }}>
                                            <Latex formula={modo === 'exterior' ? "\\text{Límite Derecho } (x_2):" : "\\text{Límite Superior } (x_2):"} />
                                        </label>
                                        <input
                                            type="number"
                                            value={valX2}
                                            onChange={e => setValX2(e.target.value)}
                                            step="any"
                                            style={{ width: '100%', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {modo === 'suma_intervalos' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {intervals.map((inv, index) => (
                                        <div key={inv.id} style={{ position: 'relative', flex: '1 1 calc(50% - 15px)', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-color)', padding: '24px 15px 15px 15px', borderRadius: RADIUS, border: '1px dashed var(--border-color)' }}>
                                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ fontSize: '12px', flex: '0 0 140px', color: 'var(--text-main)' }}>
                                                    <Latex formula={`\\text{Límite Inferior } (x_{${index * 2 + 1}}):`} />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={inv.min}
                                                    onChange={e => {
                                                        const newIntervals = [...intervals];
                                                        newIntervals[index].min = e.target.value;
                                                        setIntervals(newIntervals);
                                                    }}
                                                    step="any"
                                                    style={{ flex: 1, minWidth: '60px', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', marginRight: '30px' }}
                                                />
                                            </div>
                                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ fontSize: '12px', flex: '0 0 140px', color: 'var(--text-main)' }}>
                                                    <Latex formula={`\\text{Límite Superior } (x_{${index * 2 + 2}}):`} />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={inv.max}
                                                    onChange={e => {
                                                        const newIntervals = [...intervals];
                                                        newIntervals[index].max = e.target.value;
                                                        setIntervals(newIntervals);
                                                    }}
                                                    step="any"
                                                    style={{ flex: 1, minWidth: '60px', padding: '8px', borderRadius: RADIUS, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', marginRight: '30px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (intervals.length > 1) {
                                                        setIntervals(intervals.filter(i => i.id !== inv.id));
                                                    }
                                                }}
                                                disabled={intervals.length === 1}
                                                style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    padding: '5px', background: intervals.length === 1 ? 'transparent' : '#fee2e2', color: intervals.length === 1 ? 'var(--text-muted)' : '#ef4444', border: 'none', borderRadius: '6px', cursor: intervals.length === 1 ? 'not-allowed' : 'pointer'
                                                }}
                                                title="Eliminar intervalo"
                                            >
                                                <IconoBasura width="15" height="15" />
                                            </button>
                                        </div>
                                    ))}
                                    {intervals.length % 2 !== 0 && (
                                        <div style={{ flex: '1 1 calc(50% - 15px)', minWidth: '250px' }}></div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIntervals([...intervals, { id: Date.now(), min: '', max: '' }])}
                                    style={{ padding: '8px 12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: RADIUS, cursor: 'pointer', fontWeight: 'bold', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <IconoMas width="16" height="16" /> Agregar otro intervalo
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px', width: '100%' }}>
                        {errorMsg ? (
                            <div style={{ color: '#ef4444', fontSize: FS.sm, fontWeight: 'bold' }}>{errorMsg}</div>
                        ) : resultadoProb !== null ? (
                            <div style={{ padding: '12px 30px', background: 'var(--bg-color)', border: '2px solid var(--primary-color)', borderRadius: RADIUS, textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                    {modo === 'menor' && <Latex formula={`P(X < ${valX}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'mayor' && <Latex formula={`P(X > ${valX}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'inversa_menor' && <Latex formula={`P(X < ${parseFloat(valX).toFixed(4)}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'inversa_mayor' && <Latex formula={`P(X > ${parseFloat(valX).toFixed(4)}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'inversa_exterior' && <Latex formula={`P(${parseFloat(valX).toFixed(4)} > X > ${parseFloat(valX2).toFixed(4)}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'entre' && <Latex formula={`P(${valX} < X < ${valX2}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'exterior' && <Latex formula={`P(${valX} > X > ${valX2}) = ${resultadoProb.toFixed(4)}`} />}
                                    {modo === 'suma_intervalos' && <Latex formula={`${intervals.filter(i => i.min !== '' && i.max !== '').map(i => `P(${i.min} < X < ${i.max})`).join(' + ')} = ${resultadoProb.toFixed(4)}`} />}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: FS.sm, color: 'var(--text-muted)' }}>Ingresa un valor numérico para calcular el área.</div>
                        )}
                    </div>

                    {/* Botón y contenedor de pasos (Para todas las distribuciones) */}
                    {['normal', 'estandar', 'chi-cuadrado', 'fisher'].includes(tipo) && resultadoProb !== null && !errorMsg && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px' }}>
                            <button
                                onClick={() => setMostrarPasos(!mostrarPasos)}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    color: 'var(--primary-color)',
                                    border: '1px solid var(--primary-color)',
                                    borderRadius: RADIUS,
                                    cursor: 'pointer',
                                    fontSize: FS.xs,
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                            >
                                {mostrarPasos ? 'Ocultar Resolución Paso a Paso' : 'Ver Resolución Paso a Paso'}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: mostrarPasos ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {mostrarPasos && <div style={{ width: '100%' }}>{renderPasos()}</div>}
                        </div>
                    )}
                </div>

                {datosGrafico.length > 0 && (
                    <div style={{ marginTop: '30px', width: '100%' }}>
                        <MarcoWidgetMAT251 id="grafica_continua_v2" titulo="Curva de Densidad de Probabilidad f(x)" anchoCompleto={true} alto="450px">
                            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                                {['exterior', 'suma_intervalos'].includes(modo) && (
                                    <div style={{ position: 'absolute', top: '15px', right: '25px', fontWeight: 'bold', fontSize: '13px', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        Total: {(resultadoProb * 100).toFixed(2)}%
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={datosGraficoPadded} margin={{ top: 35, right: 30, left: 0, bottom: 30 }}>
                                        <defs>
                                            <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorArea" x1="0" y1="0" x2="1" y2="0">
                                                {rangoSombreado?.modo === 'exterior' ? (
                                                    <>
                                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset={`${offset1}%`} stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset={`${offset1}%`} stopColor="transparent" stopOpacity={0} />
                                                        <stop offset={`${offset2}%`} stopColor="transparent" stopOpacity={0} />
                                                        <stop offset={`${offset2}%`} stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.8} />
                                                    </>
                                                ) : rangoSombreado?.modo === 'suma_intervalos' ? (
                                                    <>
                                                        <stop offset="0%" stopColor="transparent" stopOpacity={0} />
                                                        <stop offset="0%" stopColor="transparent" stopOpacity={0} />
                                                        {offsetStops.flatMap((stop, idx) => [
                                                            <stop key={`${idx}-1`} offset={`${stop.perc1}%`} stopColor="transparent" stopOpacity={0} />,
                                                            <stop key={`${idx}-2`} offset={`${stop.perc1}%`} stopColor="#22c55e" stopOpacity={0.8} />,
                                                            <stop key={`${idx}-3`} offset={`${stop.perc2}%`} stopColor="#22c55e" stopOpacity={0.8} />,
                                                            <stop key={`${idx}-4`} offset={`${stop.perc2}%`} stopColor="transparent" stopOpacity={0} />
                                                        ])}
                                                        <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                                                        <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <stop offset="0%" stopColor="transparent" stopOpacity={0} />
                                                        <stop offset={`${offset1 ?? 0}%`} stopColor="transparent" stopOpacity={0} />
                                                        <stop offset={`${offset1 ?? 0}%`} stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset={`${offset2 ?? 100}%`} stopColor="#22c55e" stopOpacity={0.8} />
                                                        <stop offset={`${offset2 ?? 100}%`} stopColor="transparent" stopOpacity={0} />
                                                        <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                                                    </>
                                                )}
                                            </linearGradient>
                                        </defs>

                                        {/* 2 y 3. Inyectamos el Eje X Elástico */}
                                        <XAxis
                                            dataKey="x"
                                            type="number"
                                            domain={domainDinamico}
                                            allowDataOverflow={true}
                                            padding={{ left: 20, right: 20 }}
                                            ticks={xAxisTicks}
                                            tickFormatter={(val) => {
                                                if (typeof val !== 'number' || isNaN(val)) return '';
                                                return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
                                            }}
                                            tick={{ fill: 'var(--text-main)', fontSize: 13 }}
                                            axisLine={{ stroke: 'var(--text-main)', strokeWidth: 1.5 }}
                                            tickLine={{ stroke: 'var(--text-main)', strokeWidth: 1.5 }}
                                        />

                                        <YAxis
                                            domain={[0, dataMax => (typeof dataMax === 'number' && isFinite(dataMax) ? dataMax * 1.15 : 'auto')]}
                                            tickFormatter={(val) => {
                                                if (typeof val !== 'number' || isNaN(val)) return '';
                                                return val === 0 ? 0 : parseFloat(val.toPrecision(2));
                                            }}
                                            tick={{ fill: 'var(--text-main)', fontSize: 13 }}
                                            axisLine={{ stroke: 'var(--text-main)', strokeWidth: 1.5 }}
                                            tickLine={{ stroke: 'var(--text-main)', strokeWidth: 1.5 }}
                                            width={55}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />

                                        {/* Línea de la Media */}
                                        {typeof esperanza === 'number' && (
                                            <ReferenceLine
                                                x={esperanza}
                                                stroke="none"
                                                label={<LatexLabel value={`\\boldsymbol{\\mu = ${parseFloat(esperanza.toFixed(4))}}`} fill="var(--text-main)" strokeColor="#64748b" strokeWidth={3} strokeDasharray="3 3" />}
                                            />
                                        )}

                                        {/* Líneas de los Límites Sombreados */}
                                        {rangoSombreado?.modo !== 'suma_intervalos' ? (
                                            <>
                                                {rangoSombreado && rangoSombreado.x1 !== null && (
                                                    <ReferenceLine
                                                        x={rangoSombreado.x1}
                                                        stroke="none"
                                                        label={<LatexLabel value={`\\boldsymbol{${modo === 'inversa_exterior' ? 'c_1' : modo === 'inversa_mayor' ? 'c' : (modo === 'mayor' ? 'x' : 'x_1')} = ${Number.isInteger(rangoSombreado.x1) ? rangoSombreado.x1 : parseFloat(rangoSombreado.x1.toFixed(4))}}`} fill="var(--text-main)" dy={labelOffsets.dy1} strokeColor="#ef4444" strokeWidth={2} strokeDasharray="4 4" />}
                                                    />
                                                )}

                                                {rangoSombreado && rangoSombreado.x2 !== null && (
                                                    <ReferenceLine
                                                        x={rangoSombreado.x2}
                                                        stroke="none"
                                                        label={<LatexLabel value={`\\boldsymbol{${modo === 'inversa_exterior' ? 'c_2' : modo === 'inversa_menor' ? 'c' : (modo === 'menor' ? 'x' : 'x_2')} = ${Number.isInteger(rangoSombreado.x2) ? rangoSombreado.x2 : parseFloat(rangoSombreado.x2.toFixed(4))}}`} fill="var(--text-main)" dy={labelOffsets.dy2} strokeColor="#10b981" strokeWidth={2} strokeDasharray="4 4" />}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            rangoSombreado?.intervals?.flatMap((inv, idx) => [
                                                <ReferenceLine
                                                    key={`min-${idx}`}
                                                    x={inv.min}
                                                    stroke="none"
                                                    label={<LatexLabel value={`\\boldsymbol{x_{${idx * 2 + 1}} = ${Number.isInteger(inv.min) ? inv.min : parseFloat(inv.min.toFixed(4))}}`} fill="var(--text-main)" dy={idx % 2 === 0 ? labelOffsets.dy1 : labelOffsets.dy3} strokeColor="#ef4444" strokeWidth={2} strokeDasharray="4 4" />}
                                                />,
                                                <ReferenceLine
                                                    key={`max-${idx}`}
                                                    x={inv.max}
                                                    stroke="none"
                                                    label={<LatexLabel value={`\\boldsymbol{x_{${idx * 2 + 2}} = ${Number.isInteger(inv.max) ? inv.max : parseFloat(inv.max.toFixed(4))}}`} fill="var(--text-main)" dy={idx % 2 === 0 ? labelOffsets.dy2 : labelOffsets.dy4} strokeColor="#10b981" strokeWidth={2} strokeDasharray="4 4" />}
                                                />
                                            ])
                                        )}

                                        {Array.isArray(annotationData) && annotationData.map((ann, idx) => (
                                            <ReferenceDot
                                                key={`ann-${idx}`}
                                                x={ann.x}
                                                y={ann.y}
                                                r={0}
                                                stroke="none"
                                                label={<SmartAnnotation value={ann.text} escapeX={ann.escapeX} />}
                                            />
                                        ))}

                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                            itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                                            labelFormatter={(label) => `x = ${typeof label === 'number' ? parseFloat(label.toFixed(4)) : label}`}
                                            formatter={(value) => [typeof value === 'number' ? parseFloat(value.toFixed(4)) : value, 'y, f(x)']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="y"
                                            stroke="var(--primary-color)"
                                            fillOpacity={1}
                                            fill={rangoSombreado && (rangoSombreado.x1 !== null || rangoSombreado.x2 !== null || (rangoSombreado.intervals && rangoSombreado.intervals.length > 0)) ? "url(#colorArea)" : "url(#colorY)"}
                                            isAnimationActive={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </MarcoWidgetMAT251>
                    </div>
                )}
            </div>

            <ModalTablaZ
                isOpen={zModalData.isOpen}
                onClose={() => setZModalData({ ...zModalData, isOpen: false })}
                zValue={zModalData.zValue}
            />

            <ModalTablaChi
                isOpen={chiModalData.isOpen}
                onClose={() => setChiModalData({ ...chiModalData, isOpen: false })}
                k={chiModalData.k}
                xValue={chiModalData.xValue}
                pValue={chiModalData.pValue}
                modo={chiModalData.modo}
            />

            <ModalTablaF
                isOpen={fModalData.isOpen}
                onClose={() => setFModalData({ ...fModalData, isOpen: false })}
                d1={fModalData.d1}
                d2={fModalData.d2}
                xValue={fModalData.xValue}
                pValue={fModalData.pValue}
                modo={fModalData.modo}
            />
        </div>
    );
}
