// src/components/MAT251/Temas/Tema_3/logica_Tema3_continuas.js
import { jStat } from 'jstat';
// --- Distribución Uniforme Continua ---

// Función de Distribución Acumulada F(x) = P(X <= x)
export const acumuladaUniforme = (a, b, x) => {
    if (x < a) return 0;
    if (x > b) return 1;
    return (x - a) / (b - a);
};

// Función de Densidad de Probabilidad f(x)
export const densidadUniforme = (a, b, x) => {
    if (x >= a && x <= b) return 1 / (b - a);
    return 0;
};

// --- Distribución Normal ---

export const acumuladaNormal = (mu, sigma, x) => {
    return jStat.normal.cdf(x, mu, sigma);
};

export const densidadNormal = (mu, sigma, x) => {
    return jStat.normal.pdf(x, mu, sigma);
};

// Función de bisección para encontrar inversas (usada cuando no hay inv directa o para mantener consistencia)
const bisectionInverse = (targetProb, isRightTail, cdfFunc, minRange = -10000, maxRange = 10000) => {
    let low = minRange;
    let high = maxRange;
    const tol = 1e-6;
    let mid = 0;
    
    // Para Uniforme, acotamos los rangos a los parámetros a y b en la llamada.

    for (let i = 0; i < 100; i++) {
        mid = (low + high) / 2;
        let p = cdfFunc(mid);
        if (isRightTail) p = 1 - p;

        if (Math.abs(p - targetProb) < tol) break;
        if (p < targetProb) {
            if (isRightTail) high = mid;
            else low = mid;
        } else {
            if (isRightTail) low = mid;
            else high = mid;
        }
    }
    return mid;
};

// --- Cálculo Principal de Distribución Continua ---
export const calcularDistribucionContinua = (modelo, params, condicion) => {
    let prob = 0;
    let E = 0;
    let V = 0;
    let resultExtra = {}; // Para guardar valores de x calculados (inversas)

    if (modelo === 'Uniforme') {
        const { a, b } = params;
        E = (a + b) / 2;
        V = Math.pow(b - a, 2) / 12;

        if (condicion) {
            const { tipo, valX, valX2, valP, intervals } = condicion;
            const x = Number(valX);
            const x2 = Number(valX2);
            const pInput = Number(valP);

            const cdf = (v) => acumuladaUniforme(a, b, v);

            switch (tipo) {
                case 'menor':
                case 'menor_igual': // compatibilidad
                    prob = cdf(x);
                    break;
                case 'mayor':
                case 'mayor_igual':
                    prob = 1 - cdf(x);
                    break;
                case 'entre':
                case 'intervalo':
                    prob = cdf(Math.max(x, x2)) - cdf(Math.min(x, x2));
                    break;
                case 'exterior':
                    prob = cdf(Math.min(x, x2)) + (1 - cdf(Math.max(x, x2)));
                    break;
                case 'suma_intervalos':
                    if (intervals && intervals.length > 0) {
                        prob = intervals.reduce((acc, intv) => {
                            const minVal = parseFloat(intv.min);
                            const maxVal = parseFloat(intv.max);
                            if (!isNaN(minVal) && !isNaN(maxVal)) {
                                return acc + (cdf(Math.max(minVal, maxVal)) - cdf(Math.min(minVal, maxVal)));
                            }
                            return acc;
                        }, 0);
                    }
                    break;
                case 'inversa_menor':
                    resultExtra.c = bisectionInverse(pInput, false, cdf, a, b);
                    prob = pInput;
                    break;
                case 'inversa_mayor':
                    resultExtra.c = bisectionInverse(pInput, true, cdf, a, b);
                    prob = pInput;
                    break;
                case 'inversa_entre':
                    const tailProbUni = (1 - pInput) / 2;
                    resultExtra.c1 = bisectionInverse(tailProbUni, false, cdf, a, b);
                    resultExtra.c2 = bisectionInverse(tailProbUni, true, cdf, a, b);
                    prob = pInput;
                    break;
                case 'inversa_exterior':
                    const halfPUni = pInput / 2;
                    resultExtra.c1 = bisectionInverse(halfPUni, false, cdf, a, b);
                    resultExtra.c2 = bisectionInverse(halfPUni, true, cdf, a, b);
                    prob = pInput;
                    break;
                default:
                    prob = 0;
            }
        }
    } else if (modelo === 'Normal') {
        const { mu, sigma } = params;
        E = mu;
        V = Math.pow(sigma, 2);

        if (condicion) {
            const { tipo, valX, valX2, valP, intervals } = condicion;
            const x = Number(valX);
            const x2 = Number(valX2);
            const pInput = Number(valP);

            const cdf = (v) => acumuladaNormal(mu, sigma, v);

            switch (tipo) {
                case 'menor':
                case 'menor_igual': // compatibilidad
                    prob = cdf(x);
                    break;
                case 'mayor':
                case 'mayor_igual':
                    prob = 1 - cdf(x);
                    break;
                case 'entre':
                case 'intervalo':
                    prob = cdf(Math.max(x, x2)) - cdf(Math.min(x, x2));
                    break;
                case 'exterior':
                    prob = cdf(Math.min(x, x2)) + (1 - cdf(Math.max(x, x2)));
                    break;
                case 'suma_intervalos':
                    if (intervals && intervals.length > 0) {
                        prob = intervals.reduce((acc, intv) => {
                            const minVal = parseFloat(intv.min);
                            const maxVal = parseFloat(intv.max);
                            if (!isNaN(minVal) && !isNaN(maxVal)) {
                                return acc + (cdf(Math.max(minVal, maxVal)) - cdf(Math.min(minVal, maxVal)));
                            }
                            return acc;
                        }, 0);
                    }
                    break;
                case 'inversa_menor':
                    resultExtra.c = jStat.normal.inv(pInput, mu, sigma);
                    prob = pInput;
                    break;
                case 'inversa_mayor':
                    resultExtra.c = jStat.normal.inv(1 - pInput, mu, sigma);
                    prob = pInput;
                    break;
                case 'inversa_entre':
                    const tailProb = (1 - pInput) / 2;
                    resultExtra.c1 = jStat.normal.inv(tailProb, mu, sigma);
                    resultExtra.c2 = jStat.normal.inv(1 - tailProb, mu, sigma);
                    prob = pInput;
                    break;
                case 'inversa_exterior':
                    const halfP = pInput / 2;
                    resultExtra.c1 = jStat.normal.inv(halfP, mu, sigma);
                    resultExtra.c2 = jStat.normal.inv(1 - halfP, mu, sigma);
                    prob = pInput;
                    break;
                default:
                    prob = 0;
            }
        }
    }

    return {
        probabilidadFinal: condicion ? prob : null,
        esperanza: E,
        varianza: V,
        ...resultExtra
    };
};

export const generarDatosGraficoContinua = (modelo, params, condicion, resultados = {}) => {
    const datos = [];
    const puntos = 100; // Resolución del gráfico

    const isInsideCondition = (x) => {
        if (!condicion || !condicion.tipo) return false;
        const tipo = condicion.tipo;
        
        if (tipo === 'menor' || tipo === 'menor_igual' || tipo === 'menor_estricto') {
            return x <= Number(condicion.valX || condicion.valorX);
        } else if (tipo === 'mayor' || tipo === 'mayor_igual' || tipo === 'mayor_estricto') {
            return x >= Number(condicion.valX || condicion.valorX);
        } else if (tipo === 'entre' || tipo === 'intervalo' || tipo === 'intervalo_estricto') {
            const v1 = Number(condicion.valX || condicion.valorX);
            const v2 = Number(condicion.valX2 || condicion.valorB);
            return x >= Math.min(v1, v2) && x <= Math.max(v1, v2);
        } else if (tipo === 'exterior') {
            const v1 = Number(condicion.valX);
            const v2 = Number(condicion.valX2);
            return x <= Math.min(v1, v2) || x >= Math.max(v1, v2);
        } else if (tipo === 'suma_intervalos') {
            if (!condicion.intervals) return false;
            return condicion.intervals.some(intv => {
                const min = parseFloat(intv.min);
                const max = parseFloat(intv.max);
                if (isNaN(min) || isNaN(max)) return false;
                return x >= Math.min(min, max) && x <= Math.max(min, max);
            });
        } else if (tipo === 'inversa_menor') {
            return x <= (resultados.c ?? 0);
        } else if (tipo === 'inversa_mayor') {
            return x >= (resultados.c ?? 0);
        } else if (tipo === 'inversa_entre') {
            return x >= (resultados.c1 ?? 0) && x <= (resultados.c2 ?? 0);
        } else if (tipo === 'inversa_exterior') {
            return x <= (resultados.c1 ?? 0) || x >= (resultados.c2 ?? 0);
        }
        return false;
    };

    if (modelo === 'Uniforme') {
        const { a, b } = params;
        const rango = b - a;
        const padding = rango * 0.2; // Mostrar 20% más allá de a y b
        const inicio = a - padding;
        const fin = b + padding;
        const step = (fin - inicio) / puntos;

        for (let i = 0; i <= puntos; i++) {
            const x = inicio + i * step;
            const y = densidadUniforme(a, b, x);
            
            let fillY = null;
            if (y > 0 && isInsideCondition(x)) {
                fillY = y;
            }

            datos.push({ x, y, fillY });
        }
        
        // Puntos exactos en a y b para que la línea caiga recta
        datos.push({ x: a - 0.0001, y: 0, fillY: 0 });
        datos.push({ x: a, y: 1 / (b - a), fillY: isInsideCondition(a) ? 1 / (b - a) : null });
        datos.push({ x: b, y: 1 / (b - a), fillY: isInsideCondition(b) ? 1 / (b - a) : null });
        datos.push({ x: b + 0.0001, y: 0, fillY: 0 });

        // Ordenar datos por x
        datos.sort((p1, p2) => p1.x - p2.x);
    } else if (modelo === 'Normal') {
        const { mu, sigma } = params;
        const desviaciones = 4; 
        const inicio = mu - desviaciones * sigma;
        const fin = mu + desviaciones * sigma;
        const puntosAumentados = 200; // Mayor resolución para la curva suave
        const step = (fin - inicio) / puntosAumentados;

        const agregarPunto = (x) => {
            const y = densidadNormal(mu, sigma, x);
            let fillY = null;
            if (y > 0 && isInsideCondition(x)) {
                fillY = y;
            }
            datos.push({ x, y, fillY });
        };

        // 1. Puntos regulares de la curva
        for (let i = 0; i <= puntosAumentados; i++) {
            agregarPunto(inicio + i * step);
        }

        // 2. Inyectar puntos frontera exactos para eliminar huecos visuales
        const inyectarFrontera = (frontera) => {
            if (frontera === undefined || isNaN(frontera)) return;
            // Inyectamos el punto exacto y deltas microscópicos para cortes perfectos del área
            agregarPunto(frontera - 0.00001);
            agregarPunto(frontera);
            agregarPunto(frontera + 0.00001);
        };

        if (condicion) {
            if (condicion.valX !== undefined) inyectarFrontera(Number(condicion.valX));
            if (condicion.valorX !== undefined) inyectarFrontera(Number(condicion.valorX));
            if (condicion.valX2 !== undefined) inyectarFrontera(Number(condicion.valX2));
            if (condicion.valorB !== undefined) inyectarFrontera(Number(condicion.valorB));
            if (resultados && resultados.c !== undefined) inyectarFrontera(resultados.c);
            if (resultados && resultados.c1 !== undefined) inyectarFrontera(resultados.c1);
            if (resultados && resultados.c2 !== undefined) inyectarFrontera(resultados.c2);
            if (condicion.intervals) {
                condicion.intervals.forEach(intv => {
                    inyectarFrontera(parseFloat(intv.min));
                    inyectarFrontera(parseFloat(intv.max));
                });
            }
        }

        // Ordenar datos por x para que Recharts dibuje el path de izquierda a derecha correctamente
        datos.sort((p1, p2) => p1.x - p2.x);
    }

    return datos;
};
