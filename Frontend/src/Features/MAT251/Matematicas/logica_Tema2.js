/**
 * logica_Tema2.js
 * Motor de cálculo puro para el Tema 2: Variables Aleatorias.
 */
import { compile } from 'mathjs';

export function integracionNumerica(expr, a, b, n = 1000, varName = 'x') {
    const compiledExpr = typeof expr === 'string' ? compile(expr) : expr;

    const f = (val) => {
        try {
            return compiledExpr.evaluate({ [varName]: val });
        } catch (e) {
            return 0;
        }
    };

    let start = a;
    let end = b;

    // Búsqueda heurística de cola para límites infinitos
    if (end === Infinity) {
        end = start >= 0 ? start + 10 : 10;
        let max_iters = 500;
        while (f(end) > 1e-6 && max_iters > 0) {
            end += 10;
            max_iters--;
        }
    }
    if (start === -Infinity) {
        start = end <= 0 ? end - 10 : -10;
        let max_iters = 500;
        while (f(start) > 1e-6 && max_iters > 0) {
            start -= 10;
            max_iters--;
        }
    }

    if (n % 2 !== 0) n++; // Asegurar que sea par
    const h = (end - start) / n;

    let suma = f(start) + f(end);

    for (let i = 1; i < n; i++) {
        const x_i = start + i * h;
        if (i % 2 === 0) {
            suma += 2 * f(x_i);
        } else {
            suma += 4 * f(x_i);
        }
    }

    return (h / 3) * suma;
}

export function calcularMomentosContinua(fxText, a, b, varName = 'x') {
    if (!fxText || isNaN(a) || isNaN(b) || a >= b) {
        return { error: "Parámetros inválidos para la distribución continua." };
    }

    let compiledExpr;
    try {
        compiledExpr = compile(fxText);
    } catch (e) {
        return { error: "Función de densidad inválida." };
    }

    const areaTotal = integracionNumerica(compiledExpr, a, b, 1000, varName);
    const es_valida = Math.abs(areaTotal - 1.0) <= 0.005;

    let warningMsg = null;
    if (!es_valida) {
        warningMsg = `Advertencia: El área bajo la curva es ${areaTotal.toFixed(4)}. Para que sea una función de densidad válida y se puedan calcular probabilidades, el área debe ser exactamente 1.0.`;
    }

    const esperanzaEvaluador = {
        evaluate: (scope) => scope[varName] * compiledExpr.evaluate(scope)
    };
    const esperanza = integracionNumerica(esperanzaEvaluador, a, b, 1000, varName);

    const varianzaEvaluador = {
        evaluate: (scope) => Math.pow(scope[varName] - esperanza, 2) * compiledExpr.evaluate(scope)
    };
    const varianza = integracionNumerica(varianzaEvaluador, a, b, 1000, varName);
    const desviacion = Math.sqrt(Math.max(0, varianza));

    const asimetriaEvaluador = {
        evaluate: (scope) => Math.pow(scope[varName] - esperanza, 3) * compiledExpr.evaluate(scope)
    };
    const m3 = integracionNumerica(asimetriaEvaluador, a, b, 1000, varName);
    const asimetria = desviacion > 0 ? (m3 / Math.pow(desviacion, 3)) : 0;

    const curtosisEvaluador = {
        evaluate: (scope) => Math.pow(scope[varName] - esperanza, 4) * compiledExpr.evaluate(scope)
    };
    const m4 = integracionNumerica(curtosisEvaluador, a, b, 1000, varName);
    const curtosis = desviacion > 0 ? (m4 / Math.pow(desviacion, 4)) - 3 : 0;

    return {
        es_valida,
        warning: warningMsg,
        funcion: fxText,
        a,
        b,
        area: areaTotal,
        esperanza,
        varianza,
        desviacion,
        asimetria,
        curtosis
    };
}

export function calcularMomentosDiscreta(matrizDatos) {
    if (!matrizDatos || matrizDatos.length === 0) {
        return { error: "No hay datos para procesar." };
    }

    let sumP = 0;
    const datosValidos = [];

    for (let i = 0; i < matrizDatos.length; i++) {
        const x = parseFloat(matrizDatos[i].x);
        const p = parseFloat(matrizDatos[i].p);

        if (isNaN(x) || isNaN(p)) {
            return { error: `La fila ${i + 1} contiene valores no numéricos.` };
        }
        if (p < 0 || p > 1) {
            return { error: `La probabilidad en la fila ${i + 1} debe estar entre 0 y 1.` };
        }
        sumP += p;
        datosValidos.push({ ...matrizDatos[i], x, p });
    }

    if (Math.abs(sumP - 1.0) > 0.0001) {
        return { error: `La suma de probabilidades debe ser exactamente 1. Suma actual: ${sumP.toFixed(4)}` };
    }

    // Esperanza Matemática (Momento 1)
    const esperanza = datosValidos.reduce((acc, val) => acc + (val.x * val.p), 0);

    // Varianza y Desviación (Momento 2)
    const varianza = datosValidos.reduce((acc, val) => acc + (Math.pow(val.x - esperanza, 2) * val.p), 0);
    const desviacion = Math.sqrt(varianza);

    // Asimetría (Momento 3)
    const m3 = datosValidos.reduce((acc, val) => acc + (Math.pow(val.x - esperanza, 3) * val.p), 0);
    const asimetria = desviacion > 0 ? (m3 / Math.pow(desviacion, 3)) : 0;

    // Curtosis (Momento 4)
    const m4 = datosValidos.reduce((acc, val) => acc + (Math.pow(val.x - esperanza, 4) * val.p), 0);
    const curtosis = desviacion > 0 ? (m4 / Math.pow(desviacion, 4)) - 3 : 0;

    return {
        datos: datosValidos,
        esperanza,
        varianza,
        desviacion,
        asimetria,
        curtosis
    };
}

export function calcularBivariante(matrizDatos, valoresX, valoresY) {
    // Parseo de los números
    const numX = valoresX.map(v => parseFloat(v));
    const numY = valoresY.map(v => parseFloat(v));
    const matriz = matrizDatos.map(fila => fila.map(v => parseFloat(v)));

    // Probabilidades Marginales
    const probX = Array(numX.length).fill(0);
    const probY = Array(numY.length).fill(0);

    for (let i = 0; i < numX.length; i++) {
        for (let j = 0; j < numY.length; j++) {
            probX[i] += matriz[i][j];
            probY[j] += matriz[i][j];
        }
    }

    // Esperanzas Simples y Cuadráticas
    let EX = 0;
    let EX2 = 0;
    for (let i = 0; i < numX.length; i++) {
        EX += numX[i] * probX[i];
        EX2 += (numX[i] ** 2) * probX[i];
    }

    let EY = 0;
    let EY2 = 0;
    for (let j = 0; j < numY.length; j++) {
        EY += numY[j] * probY[j];
        EY2 += (numY[j] ** 2) * probY[j];
    }

    // Esperanza Conjunta E(XY)
    let EXY = 0;
    let latexExyTerms = [];
    for (let i = 0; i < numX.length; i++) {
        for (let j = 0; j < numY.length; j++) {
            if (matriz[i][j] !== 0) {
                EXY += numX[i] * numY[j] * matriz[i][j];
                latexExyTerms.push(`(${numX[i]})(${numY[j]})(${matriz[i][j]})`);
            }
        }
    }

    // Varianzas
    const VarX = EX2 - (EX ** 2);
    const VarY = EY2 - (EY ** 2);
    
    // Covarianza
    const CovXY = EXY - (EX * EY);
    
    // Coeficiente de Correlación
    const denom = Math.sqrt(VarX * VarY);
    const Rho = denom === 0 ? 0 : CovXY / denom;

    return {
        EX, EX2, VarX,
        EY, EY2, VarY,
        EXY,
        latexExyStr: latexExyTerms.join(' + '),
        CovXY,
        Rho
    };
}

export function calcularContinuaPlantilla(tipoFuncion, a, b, n = 0, c = 0) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const numN = parseFloat(n);
    const numC = parseFloat(c);

    if (tipoFuncion !== 'exponencial') {
        if (isNaN(numA) || isNaN(numB)) return { error: 'Límites inválidos' };
        if (numA >= numB) return { error: 'El límite inferior (a) debe ser menor al límite superior (b).' };
    } else {
        if (isNaN(numC) || numC <= 0) return { error: 'Coeficiente c inválido. Debe ser mayor a 0.' };
    }

    let k = 0, EX = 0, EX2 = 0, VarX = 0, Desv = 0;
    
    if (tipoFuncion === 'uniforme') {
        k = 1 / (numB - numA);
        EX = (numA + numB) / 2;
        VarX = Math.pow(numB - numA, 2) / 12;
        Desv = Math.sqrt(VarX);
        EX2 = VarX + Math.pow(EX, 2);
    } else if (tipoFuncion === 'polinomica') {
        if (isNaN(numN)) return { error: 'Exponente inválido' };
        
        const termSuperiorK = Math.pow(numB, numN + 1);
        const termInferiorK = Math.pow(numA, numN + 1);
        
        if (termSuperiorK - termInferiorK === 0) return { error: 'División por cero al calcular k.' };
        
        k = (numN + 1) / (termSuperiorK - termInferiorK);
        
        const termSuperiorE1 = Math.pow(numB, numN + 2);
        const termInferiorE1 = Math.pow(numA, numN + 2);
        EX = k * ((termSuperiorE1 - termInferiorE1) / (numN + 2));
        
        const termSuperiorE2 = Math.pow(numB, numN + 3);
        const termInferiorE2 = Math.pow(numA, numN + 3);
        EX2 = k * ((termSuperiorE2 - termInferiorE2) / (numN + 3));
        
        VarX = EX2 - Math.pow(EX, 2);
        Desv = Math.sqrt(Math.max(0, VarX));
    } else if (tipoFuncion === 'exponencial') {
        k = numC;
        EX = 1 / numC;
        VarX = 1 / Math.pow(numC, 2);
        Desv = Math.sqrt(VarX);
        EX2 = VarX + Math.pow(EX, 2);
    }

    return {
        tipoFuncion,
        a: tipoFuncion === 'exponencial' ? 0 : numA,
        b: tipoFuncion === 'exponencial' ? '∞' : numB,
        n: numN,
        c: numC,
        k,
        EX,
        EX2,
        VarX,
        Desv
    };
}
