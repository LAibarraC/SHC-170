import { jStat } from 'jstat';

/**
 * logica_Tema2_v2.js
 * Motor Matemático Teórico para Distribuciones Continuas Clásicas.
 * No utiliza integrales numéricas, sino propiedades matemáticas exactas.
 */

export function calcularMomentosTeoricos(tipo, parametros) {
    let esperanza, varianza, asimetria, curtosis;

    switch (tipo) {
        case 'normal': {
            const mu = parseFloat(parametros.mu) || 0;
            const sigma = parseFloat(parametros.sigma) || 1;
            if (sigma <= 0) return { error: "La desviación estándar debe ser mayor a 0." };
            esperanza = mu;
            varianza = sigma * sigma;
            asimetria = 0;
            curtosis = 0;
            break;
        }
        case 'estandar': {
            esperanza = 0;
            varianza = 1;
            asimetria = 0;
            curtosis = 0;
            break;
        }
        case 'chi-cuadrado': {
            const k = parseInt(parametros.k);
            if (isNaN(k) || k <= 0) return { error: "Los grados de libertad (k) deben ser un entero positivo." };
            esperanza = k;
            varianza = 2 * k;
            asimetria = Math.sqrt(8 / k);
            curtosis = 12 / k;
            break;
        }
        case 'fisher': {
            const d1 = parseInt(parametros.d1);
            const d2 = parseInt(parametros.d2);
            if (isNaN(d1) || d1 <= 0 || isNaN(d2) || d2 <= 0) {
                return { error: "Los grados de libertad d1 y d2 deben ser enteros positivos." };
            }

            esperanza = d2 > 2 ? d2 / (d2 - 2) : "Indefinido (d2 ≤ 2)";
            varianza = d2 > 4
                ? (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * Math.pow(d2 - 2, 2) * (d2 - 4))
                : "Indefinido (d2 ≤ 4)";

            asimetria = d2 > 6
                ? ((2 * d1 + d2 - 2) * Math.sqrt(8 * (d2 - 4))) / ((d2 - 6) * Math.sqrt(d1 * (d1 + d2 - 2)))
                : "Indefinido (d2 ≤ 6)";

            if (d2 > 8) {
                const num = 12 * (d1 * (5 * d2 - 22) * (d1 + d2 - 2) + (d2 - 4) * Math.pow(d2 - 2, 2));
                const den = d1 * (d2 - 6) * (d2 - 8) * (d1 + d2 - 2);
                curtosis = num / den;
            } else {
                curtosis = "Indefinido (d2 ≤ 8)";
            }
            break;
        }
        default:
            return { error: "Tipo de distribución no soportado." };
    }

    return { esperanza, varianza, asimetria, curtosis };
}

/**
 * Genera coordenadas (x, y) para graficar la campana en Recharts
 */
export function generarCurvaDistribucion(tipo, parametros, puntos = 200) {
    let arr = [];
    let min, max;

    switch (tipo) {
        case 'normal':
        case 'estandar': {
            const mu = tipo === 'estandar' ? 0 : (parseFloat(parametros.mu) || 0);
            const sigma = tipo === 'estandar' ? 1 : (parseFloat(parametros.sigma) || 1);
            min = mu - 4 * sigma;
            max = mu + 4 * sigma;
            const step = (max - min) / puntos;
            for (let x = min; x <= max; x += step) {
                arr.push({ x: parseFloat(x.toFixed(3)), y: jStat.normal.pdf(x, mu, sigma) });
            }
            break;
        }
        case 'chi-cuadrado': {
            const k = parseInt(parametros.k) || 1;
            min = 0;
            // E(X) + 4*desviacion aprox
            max = k + 4 * Math.sqrt(2 * k);
            const step = (max - min) / puntos;
            for (let x = min; x <= max; x += step) {
                const y = x === 0 && k === 1 ? 0 : jStat.chisquare.pdf(x, k);
                arr.push({ x: parseFloat(x.toFixed(3)), y: y === Infinity ? 0 : y });
            }
            break;
        }
        case 'fisher': {
            const d1 = parseInt(parametros.d1) || 1;
            const d2 = parseInt(parametros.d2) || 1;
            min = 0;
            if (d2 > 4) {
                const mu = d2 / (d2 - 2);
                const varianza = (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * Math.pow(d2 - 2, 2) * (d2 - 4));
                max = mu + 4 * Math.sqrt(varianza);
            } else {
                max = 15;
            }
            if (max < 5) max = 5;
            const step = (max - min) / puntos;
            for (let x = min; x <= max; x += step) {
                const y = x === 0 && d1 === 1 ? 0 : jStat.centralF.pdf(x, d1, d2);
                arr.push({ x: parseFloat(x.toFixed(3)), y: y === Infinity ? 0 : y });
            }
            break;
        }
        default:
            break;
    }
    return arr;
}

/**
 * Genera coordenadas (x, y) para graficar múltiples curvas (Modo Comparación)
 */
export function generarCurvasMultiples(tipo, curvas, puntos = 400) {
    if (!curvas || curvas.length === 0) return [];
    
    let globalMin = Infinity;
    let globalMax = -Infinity;

    // Calcular el dominio global (min y max absoluto entre todas las curvas)
    curvas.forEach(c => {
        let min, max;
        switch (tipo) {
            case 'normal':
            case 'estandar': {
                const mu = tipo === 'estandar' ? 0 : (parseFloat(c.params.mu) || 0);
                const sigma = tipo === 'estandar' ? 1 : (parseFloat(c.params.sigma) || 1);
                min = mu - 4 * sigma;
                max = mu + 4 * sigma;
                break;
            }
            case 'chi-cuadrado': {
                const k = parseInt(c.params.k) || 1;
                min = 0;
                max = k + 4 * Math.sqrt(2 * k);
                break;
            }
            case 'fisher': {
                const d1 = parseInt(c.params.d1) || 1;
                const d2 = parseInt(c.params.d2) || 1;
                min = 0;
                if (d2 > 4) {
                    const mu = d2 / (d2 - 2);
                    const varianza = (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * Math.pow(d2 - 2, 2) * (d2 - 4));
                    max = mu + 4 * Math.sqrt(varianza);
                } else {
                    max = 8;
                }
                if (max < 5) max = 5;
                break;
            }
            default:
                min = 0; max = 10;
        }
        if (min < globalMin) globalMin = min;
        if (max > globalMax) globalMax = max;
    });

    if (globalMin === Infinity) return [];

    let arr = [];
    const step = (globalMax - globalMin) / puntos;

    for (let x = globalMin; x <= globalMax; x += step) {
        let punto = { x: parseFloat(x.toFixed(3)) };
        
        curvas.forEach((c, idx) => {
            let y = 0;
            switch (tipo) {
                case 'normal':
                case 'estandar': {
                    const mu = tipo === 'estandar' ? 0 : (parseFloat(c.params.mu) || 0);
                    const sigma = tipo === 'estandar' ? 1 : (parseFloat(c.params.sigma) || 1);
                    y = jStat.normal.pdf(x, mu, sigma);
                    break;
                }
                case 'chi-cuadrado': {
                    const k = parseInt(c.params.k) || 1;
                    if (x >= 0) y = (x === 0 && k === 1) ? 0 : jStat.chisquare.pdf(x, k);
                    break;
                }
                case 'fisher': {
                    const d1 = parseInt(c.params.d1) || 1;
                    const d2 = parseInt(c.params.d2) || 1;
                    if (x >= 0) y = (x === 0 && d1 === 1) ? 0 : jStat.centralF.pdf(x, d1, d2);
                    break;
                }
                default: break;
            }
            punto[`y_${idx}`] = y === Infinity ? 0 : y;
        });
        
        arr.push(punto);
    }

    return arr;
}
