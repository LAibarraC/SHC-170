// src/components/MAT251/Temas/Tema_3/logica_Tema3_continuas.js

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

// --- Cálculo Principal de Distribución Continua ---
export const calcularDistribucionContinua = (modelo, params, condicion) => {
    let prob = 0;
    let E = 0;
    let V = 0;

    if (modelo === 'Uniforme') {
        const { a, b } = params;
        E = (a + b) / 2;
        V = Math.pow(b - a, 2) / 12;

        if (condicion) {
            const { tipo, valorX, valorB } = condicion;
            const x = Number(valorX);
            const x2 = Number(valorB);

            switch (tipo) {
                case 'exacta':
                    prob = 0; // En distribuciones continuas P(X = x) = 0
                    break;
                case 'menor_igual':
                case 'menor_estricto': // P(X <= x) = P(X < x) en continuas
                    prob = acumuladaUniforme(a, b, x);
                    break;
                case 'mayor_igual':
                case 'mayor_estricto':
                    prob = 1 - acumuladaUniforme(a, b, x);
                    break;
                case 'intervalo':
                case 'intervalo_estricto':
                    prob = acumuladaUniforme(a, b, Math.max(x, x2)) - acumuladaUniforme(a, b, Math.min(x, x2));
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
    };
};

export const generarDatosGraficoContinua = (modelo, params, condicion) => {
    const datos = [];
    const puntos = 100; // Resolución del gráfico

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
            if (condicion && condicion.tipo && y > 0) {
                const cx = Number(condicion.valorX);
                const cb = Number(condicion.valorB);
                
                if (condicion.tipo === 'menor_igual' || condicion.tipo === 'menor_estricto') {
                    if (x <= cx) fillY = y;
                } else if (condicion.tipo === 'mayor_igual' || condicion.tipo === 'mayor_estricto') {
                    if (x >= cx) fillY = y;
                } else if (condicion.tipo === 'intervalo' || condicion.tipo === 'intervalo_estricto') {
                    if (x >= cx && x <= cb) fillY = y;
                }
            }

            datos.push({ x, y, fillY });
        }
        
        // Puntos exactos en a y b para que la línea caiga recta
        datos.push({ x: a - 0.0001, y: 0, fillY: 0 });
        
        let fillA = null;
        if (condicion && condicion.tipo) {
            const cx = Number(condicion.valorX);
            const cb = Number(condicion.valorB);
            if ((condicion.tipo.includes('menor') && a <= cx) || 
                (condicion.tipo.includes('mayor') && a >= cx) || 
                (condicion.tipo.includes('intervalo') && a >= cx && a <= cb)) {
                fillA = 1 / (b - a);
            }
        }
        datos.push({ x: a, y: 1 / (b - a), fillY: fillA });
        
        let fillB = null;
        if (condicion && condicion.tipo) {
            const cx = Number(condicion.valorX);
            const cb = Number(condicion.valorB);
            if ((condicion.tipo.includes('menor') && b <= cx) || 
                (condicion.tipo.includes('mayor') && b >= cx) || 
                (condicion.tipo.includes('intervalo') && b >= cx && b <= cb)) {
                fillB = 1 / (b - a);
            }
        }
        datos.push({ x: b, y: 1 / (b - a), fillY: fillB });
        datos.push({ x: b + 0.0001, y: 0, fillY: 0 });

        // Ordenar datos por x
        datos.sort((p1, p2) => p1.x - p2.x);
    }

    return datos;
};
