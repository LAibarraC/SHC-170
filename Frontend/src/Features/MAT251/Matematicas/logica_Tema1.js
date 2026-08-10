const factorial = (n) => {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    let resultado = 1;
    for (let i = 2; i <= n; i++) resultado *= i;
    return resultado;
};

const generarCombinaciones = (elementos, r) => {
    if (r === 0) return [[]];
    if (elementos.length === 0) return [];
    const [primero, ...resto] = elementos;
    const conPrimero = generarCombinaciones(resto, r - 1).map(comb => [primero, ...comb]);
    const sinPrimero = generarCombinaciones(resto, r);
    return [...conPrimero, ...sinPrimero];
};

const generarPermutaciones = (elementos, r) => {
    if (r === 0) return [[]];
    if (elementos.length === 0) return [];
    let perms = [];
    for (let i = 0; i < elementos.length; i++) {
        const elemento = elementos[i];
        const resto = [...elementos.slice(0, i), ...elementos.slice(i + 1)];
        const subPerms = generarPermutaciones(resto, r - 1);
        for (const sub of subPerms) {
            perms.push([elemento, ...sub]);
        }
    }
    return perms;
};

export const calcularTecnicasConteo = (n, r, customElements = []) => {
    const numN = parseInt(n);
    const numR = parseInt(r);

    if (isNaN(numN) || isNaN(numR)) return null;
    if (numR > numN) return { error: "r no puede ser mayor que n" };
    if (numN < 0 || numR < 0) return { error: "Los valores deben ser positivos" };

    // Cálculo iterativo de permutaciones P(n, r)
    let resP = 1;
    for (let i = 0; i < numR; i++) {
        resP *= (numN - i);
    }

    // Cálculo iterativo de combinaciones C(n, r)
    let resC = 1;
    const limiteK = Math.min(numR, numN - numR);
    for (let i = 1; i <= limiteK; i++) {
        resC = (resC * (numN - limiteK + i)) / i;
    }
    resC = Math.round(resC);

    const elementos = customElements && customElements.length === numN
        ? customElements
        : Array.from({ length: numN }, (_, i) => String.fromCharCode(65 + i));

    let elementosP = [];
    let elementosC = [];

    // Límite de seguridad para evitar que el navegador se congele
    if (numN <= 10 && numR > 0 && resP <= 5000) {
        elementosP = generarPermutaciones(elementos, numR).map(arr => arr.join('-'));
        elementosC = generarCombinaciones(elementos, numR).map(arr => arr.join('-'));
    } else if (numN <= 10 && numR > 0 && resC <= 5000) {
        elementosC = generarCombinaciones(elementos, numR).map(arr => arr.join('-'));
    }

    return {
        permutacion: {
            simbolo: "nPr",
            formula: `${numN}! / (${numN} - ${numR})!`,
            resultado: resP,
            explicacion: `Existen ${resP.toLocaleString()} formas de ordenar ${numR} elementos de un total de ${numN}.`,
            elementos: elementosP
        },
        combinacion: {
            simbolo: "nCr",
            formula: `${numN}! / [${numR}! * (${numN} - ${numR})!]`,
            resultado: resC,
            explicacion: `Existen ${resC.toLocaleString()} grupos posibles de ${numR} elementos de un total de ${numN}.`,
            elementos: elementosC
        }
    };
};

export const calcularProbabilidadClasica = (arr, eventoFavorable) => {
    if (!arr || arr.length === 0) return null;
    let eventosFav = [];
    if (Array.isArray(eventoFavorable)) {
        eventosFav = eventoFavorable;
    } else if (eventoFavorable) {
        eventosFav = String(eventoFavorable).split(',').map(e => e.trim()).filter(Boolean);
    }

    const casosA = arr.filter(d => {
        const partes = String(d).split(' | ').map(p => p.trim());
        return eventosFav.some(fav => partes.includes(fav));
    }).length;

    return {
        casosFavorables: casosA,
        casosTotales: arr.length,
        probabilidadDecimal: (casosA / arr.length).toFixed(4),
        probabilidadPorcentaje: ((casosA / arr.length) * 100).toFixed(2),
        vennStats: {
            nA: casosA,
            nB: 0,
            nAB: 0,
            nTotal: arr.length
        }
    };
};

export const calcularProbabilidadCondicional = (arr, eventoFavorable, eventoCondicion) => {
    if (!arr || arr.length === 0) return null;
    const eventosFav = Array.isArray(eventoFavorable) ? eventoFavorable : [];
    const eventosCond = Array.isArray(eventoCondicion) ? eventoCondicion : [];

    if (eventosCond.length === 0) {
        return { error: 'Selecciona al menos un evento para la Condición (B)' };
    }
    if (eventosFav.length === 0) {
        return { error: 'Selecciona al menos un Evento de Interés (A)' };
    }

    // Filtrar el arreglo base para que solo queden los elementos que contienen la condición B
    const arrFiltrado = arr.filter(d => {
        const partes = String(d).split(' | ').map(p => p.trim());
        return eventosCond.some(cond => partes.includes(cond));
    });

    if (arrFiltrado.length === 0) {
        return { error: 'La condición (B) no tiene ocurrencias en los datos. Probabilidad indefinida.' };
    }

    // La probabilidad de A dado B es encontrar A dentro del arrFiltrado
    const casosA = arrFiltrado.filter(d => {
        const partes = String(d).split(' | ').map(p => p.trim());
        return eventosFav.some(fav => partes.includes(fav));
    }).length;

    const casosATotal = arr.filter(d => {
        const partes = String(d).split(' | ').map(p => p.trim());
        return eventosFav.some(fav => partes.includes(fav));
    }).length;

    return {
        casosFavorables: casosA,
        casosTotales: arrFiltrado.length,
        probabilidadDecimal: (casosA / arrFiltrado.length).toFixed(4),
        probabilidadPorcentaje: ((casosA / arrFiltrado.length) * 100).toFixed(2),
        vennStats: {
            nA: casosATotal,
            nB: arrFiltrado.length,
            nAB: casosA,
            nTotal: arr.length
        },
        arrFiltrado: arrFiltrado
    };
};

export const calcularProbabilidadTotalParticion = (arr, nombresColumnas, columnaParticion, eventoFavorable) => {
    if (!arr || arr.length === 0) return null;
    if (!nombresColumnas) return { error: 'La variable de estratificación/partición requiere una matriz con columnas.' };
    if (!columnaParticion) return { error: 'Selecciona una variable (columna) de partición B_i' };
    
    const eventosFav = Array.isArray(eventoFavorable) ? eventoFavorable : [];
    if (eventosFav.length === 0) {
        return { error: 'Selecciona al menos un Evento de Interés (A)' };
    }

    const colIndex = nombresColumnas.indexOf(columnaParticion);
    if (colIndex === -1) {
        return { error: 'Columna de partición no encontrada.' };
    }

    const valoresParticion = [...new Set(arr.map(d => String(d).split(' | ')[colIndex]?.trim()).filter(Boolean))];

    let totalA = 0;
    const desglose = valoresParticion.map(bi => {
        const arrBi = arr.filter(d => {
            const partes = String(d).split(' | ').map(p => p.trim());
            return partes[colIndex] === bi;
        });
        const n_Bi = arrBi.length;
        const p_Bi = n_Bi / arr.length;

        const casosA_en_Bi = arrBi.filter(d => {
            const partes = String(d).split(' | ').map(p => p.trim());
            return eventosFav.some(fav => partes.includes(fav));
        }).length;
        const p_A_dado_Bi = n_Bi > 0 ? casosA_en_Bi / n_Bi : 0;

        const contribucion = p_A_dado_Bi * p_Bi;
        totalA += casosA_en_Bi;

        return {
            bi,
            n_Bi,
            p_Bi: p_Bi.toFixed(4),
            n_A_inter_Bi: casosA_en_Bi,
            p_A_dado_Bi: p_A_dado_Bi.toFixed(4),
            contribucion: contribucion.toFixed(4)
        };
    });

    return {
        casosFavorables: totalA,
        casosTotales: arr.length,
        probabilidadDecimal: (totalA / arr.length).toFixed(4),
        probabilidadPorcentaje: ((totalA / arr.length) * 100).toFixed(2),
        desgloseTotal: desglose
    };
};

export const calcularReglaAdicion = (filas, nombresColumnas, colA, valA, colB, valB) => {
    if (!nombresColumnas || nombresColumnas.length === 0) {
        return { error: "Para usar esta función, debes importar una 'Matriz' que contenga columnas." };
    }
    const idxA = nombresColumnas.indexOf(colA);
    const idxB = nombresColumnas.indexOf(colB);
    
    if (idxA === -1 || idxB === -1) {
        return { error: "Columnas no encontradas en la matriz." };
    }

    const datosParseados = filas.map(f => {
        const p = f.valor.split(' | ').map(v => v.trim());
        return { valA: p[idxA], valB: p[idxB] };
    }).filter(d => d.valA !== undefined && d.valB !== undefined && d.valA !== '' && d.valB !== '');

    const total = datosParseados.length;
    if (total === 0) {
        return { error: "No hay datos válidos para procesar." };
    }

    let countA = 0;
    let countB = 0;
    let countAandB = 0;

    datosParseados.forEach(d => {
        const isA = d.valA === valA;
        const isB = d.valB === valB;
        if (isA) countA++;
        if (isB) countB++;
        if (isA && isB) countAandB++;
    });

    const pA = countA / total;
    const pB = countB / total;
    const pAandB = countAandB / total;
    const pAorB = pA + pB - pAandB;

    return {
        resultado: {
            total, 
            countA, 
            countB, 
            countAandB, 
            countAorB: countA + countB - countAandB,
            pA, 
            pB, 
            pAandB, 
            pAorB,
            nameA: valA,
            nameB: valB
        }
    };
};

export const calcularReglaMultiplicacion = (filas, nombresColumnas, colA, valA, colB, valB, modReemplazo) => {
    if (!nombresColumnas || nombresColumnas.length === 0) {
        return { error: "Para usar esta función, debes importar una 'Matriz' que contenga columnas." };
    }
    const idxA = nombresColumnas.indexOf(colA);
    const idxB = nombresColumnas.indexOf(colB);
    
    if (idxA === -1 || idxB === -1) {
        return { error: "Columnas no encontradas en la matriz." };
    }

    const datosParseados = filas.map(f => {
        const p = f.valor.split(' | ').map(v => v.trim());
        return { valA: p[idxA], valB: p[idxB] };
    }).filter(d => d.valA !== undefined && d.valB !== undefined && d.valA !== '' && d.valB !== '');

    const totalA = datosParseados.length;
    if (totalA === 0) {
        return { error: "No hay datos válidos para procesar." };
    }

    let countA = 0;
    let countB_inicial = 0;
    let countAandB = 0;

    datosParseados.forEach(d => {
        if (d.valA === valA) countA++;
        if (d.valB === valB) countB_inicial++;
        if (d.valA === valA && d.valB === valB) countAandB++;
    });

    const pA = countA / totalA;
    
    let totalB = totalA;
    let countB = countB_inicial;

    if (modReemplazo === 'sin_reemplazo') {
        totalB = totalA - 1;
        const reduccion = countA > 0 ? (countAandB / countA) : 0;
        countB = Number(Math.max(0, countB_inicial - reduccion).toFixed(2));
    }

    if (totalB <= 0) {
        return { error: "No hay suficientes datos para realizar una segunda extracción sin reemplazo." };
    }

    const pB = countB / totalB;
    const pAandB = pA * pB;

    return {
        resultado: {
            totalA, 
            totalB,
            countA, 
            countB,
            pA, 
            pB, 
            pAandB,
            nameA: valA,
            nameB: valB
        }
    };
};

export const calcularProbabilidadTotal = (filas, nombresColumnas, colCausa, colEvento, valExito) => {
    if (!nombresColumnas || nombresColumnas.length === 0) {
        return { error: "Para usar el Teorema de Probabilidad Total, debes importar una 'Matriz' que contenga al menos 2 columnas." };
    }
    const idxCausa = nombresColumnas.indexOf(colCausa);
    const idxEvento = nombresColumnas.indexOf(colEvento);

    if (idxCausa === -1 || idxEvento === -1) {
        return { error: "Columnas no encontradas en la matriz." };
    }

    const datosParseados = filas.map(f => {
        const p = f.valor.split(' | ').map(v => v.trim());
        return { causa: p[idxCausa], evento: p[idxEvento] };
    }).filter(d => d.causa !== undefined && d.evento !== undefined && d.causa !== '' && d.evento !== '');

    const totalDatos = datosParseados.length;
    if (totalDatos === 0) {
        return { error: "No hay datos válidos para procesar." };
    }

    const causasUnicas = [...new Set(datosParseados.map(d => d.causa))].sort();

    let probB = 0;
    const desglose = [];

    causasUnicas.forEach((causa, index) => {
        const datosCausa = datosParseados.filter(d => d.causa === causa);
        const n_Ai = datosCausa.length;
        const pA = n_Ai / totalDatos;

        const datosExito = datosCausa.filter(d => d.evento === valExito);
        const n_B_dado_Ai = datosExito.length;
        const pB_A = n_Ai > 0 ? n_B_dado_Ai / n_Ai : 0;

        const mult = pA * pB_A;
        probB += mult;

        desglose.push({
            id: index + 1,
            nombre: causa,
            n_Ai: n_Ai,
            totalDatos: totalDatos,
            pA: pA,
            n_B_dado_Ai: n_B_dado_Ai,
            pB_A: pB_A,
            mult: mult
        });
    });

    return {
        resultado: { probB, desglose }
    };
};

export const calcularMuestreo = (filas, nombresColumnas, metodoMuestreo, tamanoMuestra, varEstratificacion) => {
    const N = filas.length;
    if (N === 0) {
        return { error: "La matriz no tiene datos." };
    }

    const n = parseInt(tamanoMuestra);
    if (isNaN(n) || n < 1 || n > N) {
        return { error: `El tamaño de la muestra (n) debe ser entre 1 y ${N}.` };
    }

    let muestra = [];
    let repData = [];
    let k = null;
    let r = null;
    const copyFilas = [...filas];

    if (metodoMuestreo === 'mas') {
        for (let i = 0; i < n; i++) {
            const randIndex = Math.floor(Math.random() * copyFilas.length);
            muestra.push(copyFilas[randIndex]);
            copyFilas.splice(randIndex, 1);
        }

        const countPob = {};
        const countMue = {};
        const hasCols = nombresColumnas && nombresColumnas.length > 0;
        
        let colIdxChart = 0;
        if (hasCols && varEstratificacion) {
            const idx = nombresColumnas.indexOf(varEstratificacion);
            if (idx !== -1) colIdxChart = idx;
        }
        
        filas.forEach(f => {
            const valorDinamico = hasCols ? f.valor.split(' | ')[colIdxChart].trim() : f.valor.trim();
            if (valorDinamico) countPob[valorDinamico] = (countPob[valorDinamico] || 0) + 1;
        });
        muestra.forEach(f => {
            const valorDinamico = hasCols ? f.valor.split(' | ')[colIdxChart].trim() : f.valor.trim();
            if (valorDinamico) countMue[valorDinamico] = (countMue[valorDinamico] || 0) + 1;
        });

        Object.keys(countPob).sort().forEach(k => {
            repData.push({
                label: k,
                pPob: countPob[k] / N,
                pMuestra: (countMue[k] || 0) / n
            });
        });

    } else if (metodoMuestreo === 'estratificado') {
        const selectedVariable = varEstratificacion; // Renombrado para la lógica dinámica
        
        if (!selectedVariable) {
            return { error: "Selecciona una variable para estratificar." };
        }

        if (!nombresColumnas) {
            return { error: "La variable de estratificación requiere una matriz con columnas." };
        }

        const colIdx = nombresColumnas.indexOf(selectedVariable);
        if (colIdx === -1) {
            return { error: `La variable seleccionada '${selectedVariable}' no fue encontrada.` };
        }

        // Extracción Dinámica: Agrupando en base al índice dinámico (equivalente a item[selectedVariable])
        const estratos = {};
        copyFilas.forEach(f => {
            const valorDinamico = f.valor.split(' | ')[colIdx].trim();
            if (!estratos[valorDinamico]) estratos[valorDinamico] = [];
            estratos[valorDinamico].push(f);
        });

        const estratosObj = Object.keys(estratos).map(k => {
            const N_i = estratos[k].length;
            const prop = N_i / N;
            let n_i = Math.round(prop * n);
            if (n_i === 0 && N_i > 0 && n > 0) n_i = 1;
            return { key: k, N_i, n_i, items: estratos[k] };
        });

        let asignados = estratosObj.reduce((s, e) => s + e.n_i, 0);
        while (asignados > n) {
            const maxE = estratosObj.reduce((max, e) => e.n_i > max.n_i ? e : max, estratosObj[0]);
            maxE.n_i--;
            asignados--;
        }
        while (asignados < n) {
            const maxE = estratosObj.reduce((max, e) => (e.N_i - e.n_i) > (max.N_i - max.n_i) ? e : max, estratosObj[0]);
            if (maxE.n_i < maxE.N_i) {
                maxE.n_i++;
                asignados++;
            } else {
                break;
            }
        }

        estratosObj.sort((a, b) => a.key.localeCompare(b.key)).forEach(e => {
            const pool = [...e.items];
            const extractedCount = Math.min(e.n_i, pool.length);
            for (let i = 0; i < extractedCount; i++) {
                const randIndex = Math.floor(Math.random() * pool.length);
                muestra.push(pool[randIndex]);
                pool.splice(randIndex, 1);
            }

            // Gráfica de Representatividad Dinámica
            // e.key representa los valores únicos categóricos extraídos de selectedVariable
            repData.push({
                label: e.key,
                pPob: e.N_i / N,
                pMuestra: extractedCount / n
            });
        });
    } else if (metodoMuestreo === 'sistematico') {
        k = Math.floor(N / n);
        if (k < 1) {
            return { error: `La muestra (n=${n}) es demasiado grande para la población (N=${N}). Ajusta el tamaño de la muestra.` };
        }
        r = Math.floor(Math.random() * k) + 1;
        
        for (let i = 0; i < n; i++) {
            const index = (r - 1) + (i * k);
            if (index < N) {
                muestra.push(copyFilas[index]);
            }
        }

        const countPob = {};
        const countMue = {};
        const hasCols = nombresColumnas && nombresColumnas.length > 0;
        
        let colIdxChart = 0;
        if (hasCols && varEstratificacion) {
            const idx = nombresColumnas.indexOf(varEstratificacion);
            if (idx !== -1) colIdxChart = idx;
        }
        
        filas.forEach(f => {
            const valorDinamico = hasCols ? f.valor.split(' | ')[colIdxChart].trim() : f.valor.trim();
            if (valorDinamico) countPob[valorDinamico] = (countPob[valorDinamico] || 0) + 1;
        });
        muestra.forEach(f => {
            const valorDinamico = hasCols ? f.valor.split(' | ')[colIdxChart].trim() : f.valor.trim();
            if (valorDinamico) countMue[valorDinamico] = (countMue[valorDinamico] || 0) + 1;
        });

        Object.keys(countPob).sort().forEach(key => {
            repData.push({
                label: key,
                pPob: countPob[key] / N,
                pMuestra: (countMue[key] || 0) / muestra.length
            });
        });
    }

    return {
        resultado: { N, n: muestra.length, muestra, repData, k, r }
    };
};

export const obtenerLimitesUniforme = (filas, nombresColumnas, varUniforme) => {
    if (!varUniforme || !filas) return null;
    let dataReales = [];
    if (!nombresColumnas || nombresColumnas.length === 0) {
        dataReales = filas.map(f => parseFloat(f.valor)).filter(v => !isNaN(v));
    } else {
        const colIdx = nombresColumnas.indexOf(varUniforme);
        if (colIdx !== -1) {
            dataReales = filas.map(f => parseFloat(f.valor.split(' | ')[colIdx])).filter(v => !isNaN(v));
        }
    }
    if (dataReales.length === 0) return null;
    const min = Math.min(...dataReales);
    const max = Math.max(...dataReales);
    return { min, max, dataReales };
};

export const calcularDistribucionUniforme = (minVal, maxVal, inputMin, inputMax) => {
    const A = minVal;
    const B = maxVal;

    if (A === B) {
        return { error: "El mínimo y máximo poblacional son iguales, no existe dispersión continua." };
    }

    const a = parseFloat(inputMin);
    const b = parseFloat(inputMax);

    if (isNaN(a) || isNaN(b)) {
        return { error: "Debes ingresar valores numéricos válidos para tu rango de interés (a y b)." };
    }

    if (a > b) {
        return { error: "El valor mínimo de interés (a) debe ser menor o igual que el máximo (b)." };
    }

    if (a < A || b > B) {
        return { error: `Tu rango de interés [${a}, ${b}] está fuera del Universo Uniforme real [${A}, ${B}].` };
    }

    const H = 1 / (B - A);
    const prob = (b - a) * H;

    return {
        resultado: { A, B, a, b, H, prob }
    };
};

export const calcularDistribucionMuestral = (poblacionStr, nStr, conReemplazo) => {
    if (!poblacionStr || poblacionStr.trim() === '') return { error: 'Ingresa la población.' };
    
    const rawItems = poblacionStr.split(',').map(v => v.trim()).filter(v => v !== '');
    const poblacion = [];
    
    for (const item of rawItems) {
        let label = '';
        let numStr = item;
        
        if (item.includes('=')) {
            const parts = item.split('=');
            label = parts[0].trim();
            numStr = parts[1].trim();
        } else if (item.includes(':')) {
            const parts = item.split(':');
            label = parts[0].trim();
            numStr = parts[1].trim();
        } else if (item.includes('|')) {
            const parts = item.split('|').map(p => p.trim());
            if (parts.length >= 3) {
                // Para 3 o más columnas (ej: "1 | A | 3000"), buscamos el valor numérico desde el final
                let foundNum = false;
                for (let i = parts.length - 1; i >= 0; i--) {
                    if (!isNaN(parseFloat(parts[i]))) {
                        numStr = parts[i];
                        label = i > 0 ? parts[i - 1] : parts[0]; // La etiqueta es el valor anterior
                        foundNum = true;
                        break;
                    }
                }
                if (!foundNum) {
                    numStr = parts[parts.length - 1];
                    label = parts[parts.length - 2];
                }
            } else if (parts.length === 2) {
                // Para 2 columnas
                const p0 = parts[0];
                const p1 = parts[1];
                if (!isNaN(parseFloat(p1)) && isNaN(parseFloat(p0))) {
                    label = p0;
                    numStr = p1;
                } else if (!isNaN(parseFloat(p0)) && isNaN(parseFloat(p1))) {
                    label = p1;
                    numStr = p0;
                } else {
                    label = p0;
                    numStr = p1;
                }
            } else {
                numStr = parts[0];
            }
        }
        
        const valor = parseFloat(numStr);
        if (!isNaN(valor)) {
            poblacion.push({ id: label || valor.toString(), valor: valor });
        }
    }
    
    if (poblacion.length === 0) return { error: 'La población ingresada no tiene números válidos.' };
    
    const n = parseInt(nStr);
    if (isNaN(n) || n <= 0) return { error: 'El tamaño de muestra (n) debe ser un número entero positivo.' };
    if (!conReemplazo && n > poblacion.length) return { error: 'El tamaño de muestra (n) no puede ser mayor a la población sin reemplazo.' };

    const limiteSeguridad = 5000;
    let muestras = [];

    const generarCombinaciones = (arr, r) => {
        if (r === 0) return [[]];
        if (arr.length === 0) return [];
        const [primero, ...resto] = arr;
        const conPrimero = generarCombinaciones(resto, r - 1).map(c => [primero, ...c]);
        const sinPrimero = generarCombinaciones(resto, r);
        return [...conPrimero, ...sinPrimero];
    };

    const generarConReemplazo = (arr, r) => {
        if (r === 0) return [[]];
        const subMuestras = generarConReemplazo(arr, r - 1);
        let res = [];
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < subMuestras.length; j++) {
                if (res.length >= limiteSeguridad) return res;
                res.push([arr[i], ...subMuestras[j]]);
            }
        }
        return res;
    };

    if (conReemplazo) {
        muestras = generarConReemplazo(poblacion, n);
    } else {
        muestras = generarCombinaciones(poblacion, n);
    }

    if (muestras.length >= limiteSeguridad) {
        return { error: `Límite de seguridad excedido. Se intentaron generar demasiadas muestras (límite: ${limiteSeguridad}). Por favor, reduce la población o el tamaño de la muestra.` };
    }

    const calcularMedia = (arr) => arr.reduce((a, b) => a + b.valor, 0) / arr.length;
    const calcularVarianza = (arr, media) => arr.reduce((acc, val) => acc + Math.pow(val.valor - media, 2), 0) / arr.length;

    const datosTabla = muestras.map((muestra, index) => {
        const media = calcularMedia(muestra);
        const varianza = calcularVarianza(muestra, media);
        return {
            id: index + 1,
            elementos: muestra.map(x => x.id).join(', '),
            valores: muestra.map(x => x.valor).join(' '),
            media: parseFloat(media.toFixed(2)),
            varianza: parseFloat(varianza.toFixed(2))
        };
    });

    const frecuenciasMedias = {};
    datosTabla.forEach(fila => {
        const m = fila.media;
        if (frecuenciasMedias[m]) {
            frecuenciasMedias[m]++;
        } else {
            frecuenciasMedias[m] = 1;
        }
    });

    const distribucionMedias = Object.keys(frecuenciasMedias)
        .map(m => parseFloat(m))
        .sort((a, b) => a - b)
        .map(m => ({
            media: m,
            frecuencia: frecuenciasMedias[m],
            total: datosTabla.length
        }));

    // Cálculos Finales
    const esperanzaMedia = distribucionMedias.reduce((acc, curr) => acc + (curr.media * (curr.frecuencia / curr.total)), 0);
    const varianzaMedia = distribucionMedias.reduce((acc, curr) => acc + (Math.pow(curr.media - esperanzaMedia, 2) * (curr.frecuencia / curr.total)), 0);

    const mediaPoblacional = calcularMedia(poblacion);
    const varianzaPoblacional = calcularVarianza(poblacion, mediaPoblacional);

    const calculosFinales = {
        esperanzaMedia: parseFloat(esperanzaMedia.toFixed(4)),
        varianzaMedia: parseFloat(varianzaMedia.toFixed(4)),
        mediaPoblacional: parseFloat(mediaPoblacional.toFixed(4)),
        varianzaPoblacional: parseFloat(varianzaPoblacional.toFixed(4)),
        n: n,
        N: poblacion.length,
        poblacionOriginal: poblacion.map(p => p.valor)
    };

    return { resultado: datosTabla, distribucionMedias, calculosFinales, conReemplazo };
};