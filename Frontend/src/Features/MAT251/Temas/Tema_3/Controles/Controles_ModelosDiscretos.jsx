import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/Temas/Tema3.css';
import { calcularDistribucionModelo, generarDatosGrafico } from '../../../Matematicas/logica_Tema3';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Controles_ModelosDiscretos({
    varSeleccionada,
    filas,
    statsDatos,
    abrirEditor,
    onCalcular,
    children
}) {
    const [modelo, setModelo] = useState('Bernoulli');
    const [modo, setModo] = useState('matriz'); // 'manual' | 'matriz'

    const renderLatex = (str) => {
        return <span style={{ fontSize: '0.9em' }} dangerouslySetInnerHTML={{ __html: katex.renderToString(str, { throwOnError: false }) }} />;
    };

    // Parámetros Manuales
    const [paramN_bin, setParamN_bin] = useState('');
    const [paramP_bin, setParamP_bin] = useState('');
    const [paramLambda, setParamLambda] = useState('');
    const [paramN_hip, setParamN_hip] = useState('');
    const [paramK_hip, setParamK_hip] = useState('');
    const [paramn_hip, setParamn_hip] = useState('');
    const [paramP_ber, setParamP_ber] = useState('');

    // Condición
    const [tipoCondicion, setTipoCondicion] = useState('exacta'); // 'exacta', 'menor_igual', 'mayor_igual', 'intervalo'
    const [valorX, setValorX] = useState('');
    const [valorB, setValorB] = useState('');

    // Matriz
    const [columnaSeleccionada, setColumnaSeleccionada] = useState(0);
    const [valorExito, setValorExito] = useState('');
    const [statsEstimados, setStatsEstimados] = useState(null);
    const [nArriba, setNArriba] = useState('');
    const [muestraN, setMuestraN] = useState('');

    const [error, setError] = useState('');

    useEffect(() => {
        // Limpiar todo cuando se cambia entre 'manual' y 'matriz'
        setParamN_bin('');
        setParamP_bin('');
        setParamLambda('');
        setParamN_hip('');
        setParamK_hip('');
        setParamn_hip('');
        setParamP_ber('');
        
        setTipoCondicion('exacta');
        setValorX('');
        setValorB('');
        
        setColumnaSeleccionada(0);
        setValorExito('');
        setStatsEstimados(null);
        setError('');
        
        if (onCalcular) {
            onCalcular(null);
        }
    }, [modo]);

    const handleCambiarModelo = (nuevoModelo) => {
        if (modelo === nuevoModelo) return;
        setModelo(nuevoModelo);
        
        // Reset manual parameters
        setParamN_bin('');
        setParamP_bin('');
        setParamLambda('');
        setParamN_hip('');
        setParamK_hip('');
        setParamn_hip('');
        setParamP_ber('');
        
        // Reset search conditions
        setTipoCondicion('exacta');
        setValorX('');
        setValorB('');
        
        // Reset matrix settings
        setColumnaSeleccionada(0);
        setValorExito('');
        setStatsEstimados(null);
        setError('');

        // Clear graph and results
        if (onCalcular) {
            onCalcular(null);
        }
    };

    // Extraer datos de la matriz
    const columnasDisponibles = useMemo(() => {
        return (varSeleccionada?.nombresColumnas && varSeleccionada.nombresColumnas.length > 0)
            ? varSeleccionada.nombresColumnas
            : (varSeleccionada ? [varSeleccionada.nombre || 'Datos'] : []);
    }, [varSeleccionada]);

    const datosColumna = useMemo(() => {
        if (!varSeleccionada || !filas || filas.length === 0) return [];
        const validas = filas.filter(f => (f.valor || '').toString().trim() !== '');

        return validas.map(f => {
            if (varSeleccionada.nombresColumnas && varSeleccionada.nombresColumnas.length > 1) {
                const partes = (f.valor || '').toString().split(' | ');
                return partes[columnaSeleccionada] ? partes[columnaSeleccionada].trim() : '';
            }
            return (f.valor || '').toString().trim();
        }).filter(val => val !== '');
    }, [varSeleccionada, filas, columnaSeleccionada]);

    const valoresUnicos = useMemo(() => {
        if (datosColumna.length === 0) return [];
        return [...new Set(datosColumna)].sort();
    }, [datosColumna]);

    // Estimar desde datos
    const estimarDesdeDatos = () => {
        if (datosColumna.length === 0) {
            setError('No hay datos válidos en la columna.');
            return;
        }

        const totalDatos = datosColumna.length;
        let p = 0;
        let K = 0;
        let media = 0;

        if (modelo === 'Binomial') {
            const esTexto = isNaN(parseFloat(datosColumna[0]));

            if (!esTexto) {
                // ESCENARIO B: Datos Cuantitativos
                const n_lote = parseInt(nArriba);
                if (isNaN(n_lote) || n_lote <= 0) {
                    setError('Por favor, ingresa el Tamaño del ensayo (n) mayor a 0 antes de estimar.');
                    return;
                }

                const numeros = datosColumna.map(v => parseFloat(v)).filter(v => !isNaN(v));
                const sumaTotal = numeros.reduce((acc, curr) => acc + curr, 0);
                const promedio = sumaTotal / numeros.length;
                p = promedio / n_lote;

                if (p > 1) {
                    setError('Error: La probabilidad calculada es mayor a 1. El Tamaño del ensayo (n) ingresado es demasiado pequeño para estos datos.');
                    return;
                }

                setStatsEstimados({
                    total: numeros.length * n_lote,
                    exitos: sumaTotal,
                    p: p
                });

                setParamN_bin(n_lote.toString());
            } else {
                // ESCENARIO A: Datos Cualitativos
                if (!valorExito) {
                    setError('Debe seleccionar qué valor representa el "Éxito".');
                    return;
                }
                const conteoExito = datosColumna.filter(v => v === valorExito).length;
                p = conteoExito / totalDatos;

                setStatsEstimados({
                    total: totalDatos,
                    exitos: conteoExito,
                    p: p
                });
            }

            setParamP_bin(p.toFixed(4));
        } else if (modelo === 'Hipergeometrica' || modelo === 'Bernoulli') {
            if (modelo === 'Hipergeometrica') {
                const n_muestra = parseInt(muestraN);
                if (isNaN(n_muestra) || n_muestra <= 0) {
                    setError('Por favor, ingresa la Muestra a extraer (n) mayor a 0 antes de estimar.');
                    return;
                }
                if (n_muestra > totalDatos) {
                    setError(`La muestra "n" (${n_muestra}) no puede ser mayor que la población total "N" (${totalDatos}).`);
                    return;
                }
            }

            if (!valorExito) {
                setError('Debe seleccionar qué valor representa el "Éxito".');
                return;
            }
            const conteoExito = datosColumna.filter(v => v === valorExito).length;
            p = conteoExito / totalDatos;
            K = conteoExito;

            setStatsEstimados({
                total: totalDatos,
                exitos: conteoExito,
                p: p,
                K: K
            });

            if (modelo === 'Bernoulli') {
                setParamP_ber(p.toFixed(4));
            } else {
                setParamN_hip(totalDatos.toString());
                setParamK_hip(K.toString());
                setParamn_hip(muestraN.toString());
            }
        } else if (modelo === 'Poisson') {
            const numeros = datosColumna.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (numeros.length === 0) {
                setError('Para Poisson se requieren datos numéricos.');
                return;
            }
            const sum = numeros.reduce((acc, curr) => acc + curr, 0);
            media = sum / numeros.length;

            setStatsEstimados({
                total: numeros.length,
                suma: sum,
                media: media
            });
            setParamLambda(media.toFixed(2));
        }
        setError('');
    };

    const manejarCalculo = () => {
        setError('');

        // Parsear parámetros
        let params = {};

        if (modelo === 'Binomial') {
            const n = parseInt(paramN_bin);
            const p = parseFloat(paramP_bin);
            if (isNaN(n) || n <= 0) return setError('En Binomial, "n" debe ser entero positivo.');
            if (isNaN(p) || p < 0 || p > 1) return setError('En Binomial, "p" debe estar entre 0 y 1.');
            params = { n, p };
        } else if (modelo === 'Poisson') {
            const lambda = parseFloat(paramLambda);
            if (isNaN(lambda) || lambda <= 0) return setError('En Poisson, lambda (λ) debe ser mayor a 0.');
            params = { lambda };
        } else if (modelo === 'Hipergeometrica') {
            const N = parseInt(paramN_hip);
            const K = parseInt(paramK_hip);
            const n = parseInt(paramn_hip);
            if (isNaN(n) || n <= 0) return setError('Por favor, ingresa un tamaño de muestra (n) mayor a 0 para generar la gráfica.');
            if (isNaN(N) || N <= 0) return setError('N (población) debe ser entero positivo.');
            if (isNaN(K) || K < 0 || K > N) return setError('K (éxitos) debe estar entre 0 y N.');
            if (n <= 0 || K < 0 || N <= 0 || n > N || K > N) return setError('Parámetros Hipergeométrica inválidos. n, K <= N, etc.');
            params = { N, K, n };
        } else if (modelo === 'Bernoulli') {
            const p = parseFloat(paramP_ber);
            if (isNaN(p) || p < 0 || p > 1) return setError('La probabilidad p debe estar entre 0 y 1.');
            params = { p };
        }

        // Parsear condición
        let condicionCalculo = null;
        let condicionVisual = null;
        if (valorX !== '') {
            let x = parseInt(valorX);
            if (isNaN(x) || x < 0) return setError('El valor objetivo "x" debe ser un entero no negativo.');

            let b = 0;
            if (tipoCondicion.includes('intervalo')) {
                b = parseInt(valorB);
                if (isNaN(b) || b <= x) return setError('El límite superior del intervalo debe ser mayor que el límite inferior.');
            }

            condicionVisual = { tipo: tipoCondicion, valorX: x, valorB: b };

            // Lógica de traducción estricta a inclusiva
            let tipoAjustado = tipoCondicion;
            switch (tipoCondicion) {
                case 'menor_estricto':
                    x = x - 1;
                    if (x < 0) return setError('Al evaluar P(X < x), el límite inclusivo (x-1) es negativo. La probabilidad es 0.');
                    tipoAjustado = 'menor_igual';
                    break;
                case 'mayor_estricto':
                    x = x + 1;
                    tipoAjustado = 'mayor_igual';
                    break;
                case 'intervalo_estricto':
                    x = x + 1;
                    b = b - 1;
                    if (b < x) return setError('El intervalo estricto ingresado no contiene ningún número entero válido.');
                    tipoAjustado = 'intervalo';
                    break;
                default:
                    break;
            }

            // Validar límites de x según modelo
            if (modelo === 'Binomial' && x > params.n) return setError(`"x" ajustado no puede ser mayor que n (${params.n}).`);
            if (modelo === 'Hipergeometrica' && x > Math.min(params.K, params.n)) {
                return setError(`"x" ajustado no puede ser mayor que el mínimo entre K y n (${Math.min(params.K, params.n)}).`);
            }

            condicionCalculo = { tipo: tipoAjustado, valorX: x, valorB: b };
        }

        // Calcular
        const resultados = calcularDistribucionModelo(modelo, params, condicionCalculo);
        const datosGrafico = generarDatosGrafico(modelo, params);

        onCalcular({ modelo, params, condicion: condicionVisual, resultados, datosGrafico });
    };

    const renderParametrosManuales = () => {
        const isMatriz = modo === 'matriz';
        const readOnlyParams = isMatriz;

        const disabledStyle = {
            backgroundColor: 'var(--bg-input, #f1f5f9)',
            color: 'var(--text-muted, #475569)',
            border: '1px dashed var(--border-color, #94a3b8)',
            cursor: 'not-allowed',
            fontWeight: 600
        };

        return (
            <div className="tema3-grid" style={{ marginBottom: '5px', gap: '10px' }}>
                {modelo === 'Bernoulli' && (
                    <>
                        <div className="tema3-form-group" style={{ marginBottom: '0', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Probabilidad <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('p')}</span></label>
                            <input
                                type="number" className="tema3-input" step="0.01" min="0" max="1"
                                value={paramP_ber} onChange={e => setParamP_ber(e.target.value)}
                                placeholder="0.00"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', width: '200px', textAlign: 'center' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '15px', color: 'var(--text-main, #334155)', background: 'var(--bg-input, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)', width: '100%', boxSizing: 'border-box' }}>
                            {renderLatex(`P(X=x) = ${paramP_ber || 'p'}^x (1 - ${paramP_ber || 'p'})^{1-x}`)}
                        </div>
                    </>
                )}
                {modelo === 'Binomial' && (
                    <>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Muestra total <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('n')}</span></label>
                            <input
                                type="number" className="tema3-input" min="1"
                                value={paramN_bin} onChange={e => setParamN_bin(e.target.value)}
                                placeholder="Ej. 10"
                                disabled={readOnlyParams && !(datosColumna.length > 0 && isNaN(parseFloat(datosColumna[0])))}
                                style={{ ...(readOnlyParams && !(datosColumna.length > 0 && isNaN(parseFloat(datosColumna[0])))) ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>Probabilidad <span style={{ fontSize: '1.05rem', marginLeft: '6px', transform: 'translateY(-1px)' }}>{renderLatex('p')}</span></label>
                            <input
                                type="number" className="tema3-input" step="0.01" min="0" max="1"
                                value={paramP_bin} onChange={e => setParamP_bin(e.target.value)}
                                placeholder="0.00"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '15px', color: 'var(--text-main, #334155)', background: 'var(--bg-input, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)', width: '100%', boxSizing: 'border-box' }}>
                            {renderLatex(`P(X=x) = \\binom{${paramN_bin || 'n'}}{x} ${paramP_bin || 'p'}^x (1 - ${paramP_bin || 'p'})^{${paramN_bin || 'n'}-x}`)}
                        </div>
                    </>
                )}
                {modelo === 'Poisson' && (
                    <>
                        <div className="tema3-form-group" style={{ marginBottom: '0', gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '0', whiteSpace: 'nowrap' }}>Tasa media de Ocurrencia {renderLatex('\\lambda')}</label>
                            <input
                                type="number" className="tema3-input" step="0.1" min="0"
                                value={paramLambda} onChange={e => setParamLambda(e.target.value)}
                                placeholder="0.00"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', width: '200px', textAlign: 'center' }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '15px', color: 'var(--text-main, #334155)', background: 'var(--bg-input, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)', width: '100%', boxSizing: 'border-box' }}>
                            {renderLatex(`P(X=x) = \\frac{${paramLambda || '\\lambda'}^x e^{-${paramLambda || '\\lambda'}}}{x!}`)}
                        </div>
                    </>
                )}
                {modelo === 'Hipergeometrica' && (
                    <>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '1rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px' }}>{renderLatex('N')}</label>
                            <input
                                type="number" className="tema3-input" min="1"
                                value={paramN_hip} onChange={e => setParamN_hip(e.target.value)}
                                placeholder="0"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '1rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px' }}>{renderLatex('N_1')}</label>
                            <input
                                type="number" className="tema3-input" min="0"
                                value={paramK_hip} onChange={e => setParamK_hip(e.target.value)}
                                placeholder="0"
                                disabled={readOnlyParams}
                                style={{ ...readOnlyParams ? disabledStyle : {}, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '1rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px' }}>{renderLatex('N_2')}</label>
                            <input
                                type="number" className="tema3-input"
                                value={(paramN_hip !== '' && paramK_hip !== '') ? Math.max(0, parseInt(paramN_hip) - parseInt(paramK_hip)) : ''}
                                readOnly
                                disabled
                                placeholder="N - N₁"
                                style={{ ...disabledStyle, padding: '6px 10px', fontSize: '0.85rem', flex: 1, backgroundColor: 'var(--bg-input, #e2e8f0)', color: 'var(--text-muted, #64748b)' }}
                            />
                        </div>
                        <div className="tema3-form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label className="tema3-label" style={{ fontSize: '1rem', marginBottom: '0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '35px' }}>{renderLatex('n')}</label>
                            <input
                                type="number" className="tema3-input" min="1"
                                value={paramn_hip} onChange={e => setParamn_hip(e.target.value)}
                                placeholder="0"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '15px', color: 'var(--text-main, #334155)', background: 'var(--bg-input, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)', width: '100%', boxSizing: 'border-box' }}>
                            {renderLatex(`P(X=x) = \\frac{\\binom{${paramK_hip || 'N_1'}}{x} \\binom{${(paramN_hip !== '' && paramK_hip !== '') ? Math.max(0, parseInt(paramN_hip) - parseInt(paramK_hip)) : 'N_2'}}{${paramn_hip || 'n'}-x}}{\\binom{${paramN_hip || 'N'}}{${paramn_hip || 'n'}}}`)}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* GRUPO DE SELECTORES (MODELO Y MODO) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '15px', marginTop: '5px' }}>

                {/* SELECTOR DE MODELO */}
                <div style={{ display: 'flex', width: '100%', maxWidth: '600px', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    {[
                        { id: 'Bernoulli', label: 'Bernoulli' },
                        { id: 'Binomial', label: 'Binomial' },
                        { id: 'Poisson', label: 'Poisson' },
                        { id: 'Hipergeometrica', label: 'Hipergeométrica' }
                    ].map(tipo => (
                        <button
                            key={tipo.id}
                            type="button"
                            className={modelo === tipo.id ? 'btn-tema3-active' : ''}
                            onClick={() => handleCambiarModelo(tipo.id)}
                            style={{
                                flex: 1,
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: modelo === tipo.id ? '#3b82f6' : 'transparent',
                                color: modelo === tipo.id ? '#fff' : 'var(--text-muted, #64748b)',
                                transition: 'all 0.2s ease',
                                boxShadow: modelo === tipo.id ? '0 2px 4px rgba(13, 110, 253, 0.3)' : 'none'
                            }}
                        >
                            {tipo.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'inline-flex', background: 'var(--bg-input, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <button
                        type="button"
                        className={modo === 'matriz' ? 'btn-tema3-active' : ''}
                        onClick={() => { setModo('matriz'); setError(''); }}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'matriz' ? '#3b82f6' : 'transparent',
                            color: modo === 'matriz' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s ease',
                            boxShadow: modo === 'matriz' ? '0 2px 4px rgba(13, 110, 253, 0.3)' : 'none'
                        }}
                    >
                        Análisis de Matriz
                    </button>
                    <button
                        type="button"
                        className={modo === 'manual' ? 'btn-tema3-active' : ''}
                        onClick={() => { setModo('manual'); setError(''); }}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: modo === 'manual' ? '#3b82f6' : 'transparent',
                            color: modo === 'manual' ? '#fff' : 'var(--text-muted, #64748b)',
                            transition: 'all 0.2s ease',
                            boxShadow: modo === 'manual' ? '0 2px 4px rgba(13, 110, 253, 0.3)' : 'none'
                        }}
                    >
                        Modo Manual
                    </button>
                </div>
            </div>

            <div className="tema3-card">

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px' }}>
                        <strong>Error: </strong> {error}
                    </div>
                )}

                {modo === 'matriz' && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }}>
                            <div>
                                <div style={{ color: 'var(--text-main, #334155)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Conjunto de Datos:</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                                    Cargados: <strong style={{ color: 'var(--text-main, #334155)' }}>{statsDatos ? statsDatos.cargados : 0}</strong> &nbsp;
                                    Agregados: <strong style={{ color: 'var(--text-main, #334155)' }}>{statsDatos ? statsDatos.agregados : 0}</strong> &nbsp;
                                    Total: <strong style={{ color: 'var(--text-main, #334155)' }}>{statsDatos ? statsDatos.total : 0}</strong>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={abrirEditor}
                                className="btn-tema3-active"
                                style={{
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    padding: '6px 12px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: '1px solid transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 600
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Editar Datos
                            </button>
                        </div>
                        {columnasDisponibles.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="tema3-form-group" style={{ flex: 1 }}>
                                        <label className="tema3-label">Columna:</label>
                                        <select
                                            className="tema3-select"
                                            value={columnaSeleccionada}
                                            onChange={e => { setColumnaSeleccionada(Number(e.target.value)); setStatsEstimados(null); }}
                                        >
                                            {columnasDisponibles.map((col, idx) => (
                                                <option key={idx} value={idx}>{col}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {(modelo === 'Hipergeometrica' || modelo === 'Bernoulli') && (
                                        <>
                                            <div className="tema3-form-group" style={{ flex: 1 }}>
                                                <label className="tema3-label">Valor a evaluar (x):</label>
                                                <select
                                                    className="tema3-select"
                                                    value={valorExito}
                                                    onChange={e => setValorExito(e.target.value)}
                                                >
                                                    <option value="">Seleccione un valor...</option>
                                                    {valoresUnicos.map((val, idx) => (
                                                        <option key={idx} value={val}>{val}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {modelo === 'Hipergeometrica' && (
                                                <div className="tema3-form-group" style={{ flex: 1 }}>
                                                    <label className="tema3-label">Muestra a extraer {renderLatex('(n)')}:</label>
                                                    <input
                                                        type="number"
                                                        className="tema3-input"
                                                        value={muestraN}
                                                        onChange={e => { setMuestraN(e.target.value); setStatsEstimados(null); }}
                                                        placeholder="Ej. 5"
                                                        min="1"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {modelo === 'Binomial' && (
                                        <>
                                            {datosColumna.length > 0 && isNaN(parseFloat(datosColumna[0])) ? (
                                                <div className="tema3-form-group" style={{ flex: 1 }}>
                                                    <label className="tema3-label">Valor a evaluar (x):</label>
                                                    <select
                                                        className="tema3-select"
                                                        value={valorExito}
                                                        onChange={e => setValorExito(e.target.value)}
                                                    >
                                                        <option value="">Seleccione un valor...</option>
                                                        {valoresUnicos.map((val, idx) => (
                                                            <option key={idx} value={val}>{val}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="tema3-form-group" style={{ flex: 1 }}>
                                                    <label className="tema3-label">Tamaño del ensayo / Lote {renderLatex('(n)')}:</label>
                                                    <input
                                                        type="number"
                                                        className="tema3-input"
                                                        value={nArriba}
                                                        onChange={e => { setNArriba(e.target.value); setStatsEstimados(null); }}
                                                        placeholder="Ej. 10"
                                                        min="1"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <button className="tema3-btn btn-tema3-active" onClick={estimarDesdeDatos} style={{ marginBottom: '10px', width: 'auto', margin: '0 auto', display: 'block', padding: '8px 16px' }}>
                                    Estimar Parámetros
                                </button>

                                {statsEstimados && (
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '5px', color: 'var(--text-muted, #475569)', marginTop: '10px', backgroundColor: 'var(--bg-card, #ffffff)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', textAlign: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Total Registros</span>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>{statsEstimados.total}</strong>
                                        </div>
                                        {modelo !== 'Poisson' ? (
                                            <>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Ocurrencias (Éxito)</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>{statsEstimados.exitos}</strong>
                                                </div>
                                                {modelo !== 'Hipergeometrica' && (
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Probabilidad {renderLatex('p')}</span>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                                                            {renderLatex(`\\frac{${statsEstimados.exitos}}{${statsEstimados.total}} = ${statsEstimados.p?.toFixed(2)}`)}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ flex: 1 }}>
                                                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Media {renderLatex('\\lambda')}</span>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                                                    {renderLatex(`\\frac{${statsEstimados.suma}}{${statsEstimados.total}} = ${statsEstimados.media?.toFixed(2)}`)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>No hay datos cargados en el estado global. Ve a Gestión de Datos para importar.</p>
                        )}
                    </div>
                )}

                {(modo === 'manual' || (modo === 'matriz' && statsEstimados)) && (
                    <>
                        {renderParametrosManuales()}

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                            <button className="tema3-btn btn-tema3-active" onClick={manejarCalculo} style={{ width: 'auto', padding: '6px 30px', fontSize: '0.95rem' }}>
                                Graficar
                            </button>
                        </div>
                    </>
                )}

                {children && (modo === 'manual' || (modo === 'matriz' && statsEstimados)) && (
                    <>
                        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', margin: '15px 0' }}></div>

                <h4 style={{ color: 'var(--text-main, #334155)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>Condición de Búsqueda</h4>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '25px' }}>
                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
                        <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Operador lógico</label>
                        <CustomSelect
                            value={tipoCondicion}
                            onChange={val => setTipoCondicion(val)}
                            options={[
                                { value: 'exacta', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X = x)')}</div> },
                                { value: 'menor_igual', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X \\leq x)')}</div> },
                                { value: 'mayor_igual', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X \\geq x)')}</div> },
                                { value: 'intervalo', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(a \\leq X \\leq b)')}</div> },
                                { value: 'menor_estricto', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X < x)')}</div> },
                                { value: 'mayor_estricto', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(X > x)')}</div> },
                                { value: 'intervalo_estricto', label: <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{renderLatex('P(a < X < b)')}</div> },
                            ]}
                        />
                    </div>

                    <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>{tipoCondicion.includes('intervalo') ? <>Límite Inferior {renderLatex('a')}</> : <>Número de éxitos {renderLatex('x')}</>}</label>
                        <input
                            type="number" className="tema3-input" min="0"
                            value={valorX} onChange={e => setValorX(e.target.value)}
                            placeholder="0"
                            title={modelo === 'Bernoulli' && valorX !== '' && valorX !== '0' && valorX !== '1' ? "En el modelo de Bernoulli, el número de éxitos (x) solo puede ser 0 o 1." : ""}
                            style={{ 
                                padding: '0 10px', 
                                fontSize: '0.85rem', 
                                height: '36px', 
                                boxSizing: 'border-box',
                                ...(modelo === 'Bernoulli' && valorX !== '' && valorX !== '0' && valorX !== '1' ? { borderColor: '#ef4444', backgroundColor: 'var(--bg-error, #fee2e2)', color: '#b91c1c' } : {})
                            }}
                        />
                    </div>

                    {tipoCondicion.includes('intervalo') && (
                        <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <label className="tema3-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Límite Superior {renderLatex('b')}</label>
                            <input
                                type="number" className="tema3-input" min="0"
                                value={valorB} onChange={e => setValorB(e.target.value)}
                                placeholder="0"
                                style={{ padding: '0 10px', fontSize: '0.85rem', height: '36px', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}
                </div>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <button className="tema3-btn btn-tema3-active" onClick={manejarCalculo} style={{ width: 'auto', padding: '6px 30px', fontSize: '0.95rem' }}>
                        Calcular
                    </button>
                </div>
                </>
                )}


                    {/* SECCIÓN DE GRAFICADO Y RESULTADOS */}
                    <div style={{ margin: '20px 0' }}>
                        {children}
                    </div>
                </div>
        </div>
    );
}

function CustomSelect({ value, onChange, options }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div ref={selectRef} style={{ position: 'relative', width: '100%', fontFamily: 'var(--font-family, inherit)' }}>
            <div 
                onClick={() => setIsOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 10px',
                    height: '36px',
                    boxSizing: 'border-box',
                    background: 'var(--bg-input, white)',
                    border: `1px solid ${isOpen ? 'var(--primary-color, #3b82f6)' : 'var(--border-color, #cbd5e1)'}`,
                    borderRadius: '8px', cursor: 'pointer',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-main, #1e293b)',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 400, fontSize: '0.8rem' }}>{selectedOption.label}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', color: 'var(--text-muted, #64748b)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'var(--bg-card, white)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeInDropdown 0.2s ease',
                    maxHeight: '440px',
                    overflowY: 'auto',
                }}>
                    {options.map((op, idx) => {
                        const active = value === op.value;
                        return (
                            <div 
                                key={op.value}
                                onClick={() => { onChange(op.value); setIsOpen(false); }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                                        e.currentTarget.style.color = '#3b82f6';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-main, #1e293b)';
                                    }
                                }}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '0.85rem',
                                    color: active ? '#fff' : 'var(--text-main, #1e293b)',
                                    background: active ? 'var(--primary-color, #3b82f6)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderBottom: idx < options.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                {op.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
