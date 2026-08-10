// src/components/MAT251/Temas/Tema_3/logica_Tema3.js

// Funciones Auxiliares
const factorial = (n) => {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) {
        res *= i;
    }
    return res;
};

const nCr = (n, r) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    // Optimización para evitar factoriales muy grandes
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
        res = res * (n - i + 1) / i;
    }
    return Math.round(res); // asegurar precisión entera
};

// --- Probabilidades Puntuales P(X = x) ---

export const puntualBinomial = (n, p, x) => {
    if (x < 0 || x > n || !Number.isInteger(x)) return 0;
    const combinatoria = nCr(n, x);
    const exito = Math.pow(p, x);
    const fracaso = Math.pow(1 - p, n - x);
    return combinatoria * exito * fracaso;
};

export const puntualPoisson = (lambda, x) => {
    if (x < 0 || !Number.isInteger(x)) return 0;
    const numerador = Math.pow(Math.E, -lambda) * Math.pow(lambda, x);
    const denominador = factorial(x);
    return numerador / denominador;
};

export const puntualHipergeometrica = (N, K, n, x) => {
    if (x < 0 || x > Math.min(K, n) || x < Math.max(0, n - (N - K)) || !Number.isInteger(x)) return 0;
    const num1 = nCr(K, x);
    const num2 = nCr(N - K, n - x);
    const den = nCr(N, n);
    return (num1 * num2) / den;
};

// --- Cálculo Principal de Distribución (Puntual, Acumuladas e Intervalos) ---
// params: objeto con las propiedades de cada modelo
// condicion: { tipo: 'exacta'|'menor'|'mayor'|'intervalo', valorX: Number, valorB: Number (solo para intervalo) }

export const calcularDistribucionModelo = (modelo, params, condicion) => {
    let prob = 0;
    let inicio = 0;
    let fin = 0;

    // Calcular Esperanza y Varianza teóricas
    let E = 0;
    let V = 0;
    if (modelo === 'Bernoulli') {
        E = params.p;
        V = params.p * (1 - params.p);
    } else if (modelo === 'Binomial') {
        E = params.n * params.p;
        V = params.n * params.p * (1 - params.p);
    } else if (modelo === 'Poisson') {
        E = params.lambda;
        V = params.lambda;
    } else if (modelo === 'Hipergeometrica') {
        const { N, K, n } = params;
        const p = K / N;
        E = n * p;
        V = n * p * (1 - p) * ((N - n) / (N - 1));
    }

    if (!condicion) {
        return {
            probabilidadFinal: null,
            esperanza: E,
            varianza: V,
        };
    }

    // Determinar límites del bucle según condición y modelo
    const { tipo, valorX, valorB } = condicion;
    
    // Límites teóricos máximos
    let maxTeorico = 0;
    if (modelo === 'Bernoulli') maxTeorico = 1;
    else if (modelo === 'Binomial') maxTeorico = params.n;
    else if (modelo === 'Hipergeometrica') maxTeorico = Math.min(params.K, params.n);
    else if (modelo === 'Poisson') {
        // Poisson va al infinito, si es 'mayor' cortaremos el bucle o usaremos complemento 1 - P(X < x)
        // Para graficar, cortaremos cuando P(x) sea muy pequeña.
        maxTeorico = Infinity; 
    }

    if (tipo === 'exacta') {
        inicio = valorX;
        fin = valorX;
    } else if (tipo === 'menor_igual') {
        inicio = 0;
        fin = valorX;
    } else if (tipo === 'mayor_igual') {
        inicio = valorX;
        fin = maxTeorico; 
    } else if (tipo === 'intervalo') {
        inicio = valorX;
        fin = valorB;
    }

    // Funciones de cálculo según modelo
    const calcularPuntual = (x) => {
        if (modelo === 'Bernoulli') return x === 0 ? 1 - params.p : (x === 1 ? params.p : 0);
        if (modelo === 'Binomial') return puntualBinomial(params.n, params.p, x);
        if (modelo === 'Poisson') return puntualPoisson(params.lambda, x);
        if (modelo === 'Hipergeometrica') return puntualHipergeometrica(params.N, params.K, params.n, x);
        return 0;
    };

    // Caso especial: Poisson Acumulada Mayor o Igual
    if (modelo === 'Poisson' && tipo === 'mayor_igual') {
        // 1 - P(X < valorX)
        let probMenorEstricto = 0;
        for (let x = 0; x < valorX; x++) {
            probMenorEstricto += calcularPuntual(x);
        }
        prob = 1 - probMenorEstricto;
    } else {
        // Sumatoria estándar
        for (let x = inicio; x <= fin; x++) {
            // Protección Poisson (si fin es Infinity, nunca ocurriría aquí porque lo cubrimos arriba)
            // Si por alguna razón fin es Infinity, se rompe cuando la prob es casi 0
            const p_x = calcularPuntual(x);
            if (modelo === 'Poisson' && fin === Infinity && p_x < 1e-15 && x > params.lambda) {
                break;
            }
            prob += p_x;
        }
    }

    // Esperanza y Varianza teóricas ya calculadas arriba

    return {
        probabilidadFinal: prob,
        esperanza: E,
        varianza: V,
        desviacion: Math.sqrt(V)
    };
};

// Generador de datos para el gráfico de bastones
export const generarDatosGrafico = (modelo, params) => {
    if (modelo === 'Bernoulli') {
        return [
            { x: 0, p: 1 - params.p },
            { x: 1, p: params.p }
        ];
    }

    const datos = [];
    let limite = 0;

    if (modelo === 'Binomial') {
        limite = params.n;
    } else if (modelo === 'Hipergeometrica') {
        // Puede graficarse hasta n, pero prob=0 si x > K
        limite = params.n; 
    } else if (modelo === 'Poisson') {
        limite = Math.max(10, Math.ceil(params.lambda * 2)); // Empezar con un buen rango
    }

    for (let x = 0; x <= limite; x++) {
        let p_x = 0;
        if (modelo === 'Binomial') p_x = puntualBinomial(params.n, params.p, x);
        else if (modelo === 'Poisson') p_x = puntualPoisson(params.lambda, x);
        else if (modelo === 'Hipergeometrica') p_x = puntualHipergeometrica(params.N, params.K, params.n, x);
        
        datos.push({ x, p: p_x });
    }

    // Para Poisson, extender el límite si la probabilidad aún es significativa (> 0.0001)
    if (modelo === 'Poisson') {
        let x = limite + 1;
        while (true) {
            let p_x = puntualPoisson(params.lambda, x);
            if (p_x < 0.0001 && x > params.lambda) break;
            datos.push({ x, p: p_x });
            x++;
            if (x > 200) break; // Safety break
        }
    }

    return datos;
};
