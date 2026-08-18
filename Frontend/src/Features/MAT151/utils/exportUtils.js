// src/utils/exportUtils.js
import { alerta } from '../../../utils/Notificaciones'; // 🆕 Importamos tu sistema de alertas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


export const copiarTablaAExcel = async (datos, nombreCalculo) => {
    if (!datos || datos.length === 0) {
        alerta.advertencia("Sin datos", "No hay datos en la tabla para copiar.");
        return;
    }

    try {
        const cabeceras = Object.keys(datos[0]).join('\t');
        const filas = datos.map(fila =>
            Object.values(fila).map(v => (v === null || v === undefined ? "" : v)).join('\t')
        ).join('\n');

        const contenidoTSV = `${cabeceras}\n${filas}`;

        // Intento 1: API Moderna (Funciona en localhost o HTTPS)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(contenidoTSV);
        }
        // Intento 2: Plan de Respaldo (Para redes locales)
        else {
            const textArea = document.createElement("textarea");
            textArea.value = contenidoTSV;

            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
            } catch (err) {
                console.error("El plan de respaldo falló:", err);
                throw new Error("No se pudo copiar.");
            } finally {
                textArea.remove();
            }
        }

        // 🆕 Usamos alerta.exito de tu proyecto
        alerta.exito(
            "¡Tabla copiada!",
            `Los datos de ${nombreCalculo.replace(/_/g, " ")} están listos para Ctrl+V en Excel.`
        );

    } catch (err) {
        console.error("Error al copiar:", err);
        // 🆕 Usamos alerta.error de tu proyecto
        alerta.error(
            "Error al copiar",
            "Tu navegador bloqueó el copiado automático."
        );
    }
};

// Actualiza esta función en src/utils/exportUtils.js
export const generarPDFReporte = async (elementId, nombreArchivo = "Reporte_Estadistico") => {
    const input = document.getElementById(elementId);
    if (!input) return;

    try {
        alerta.success("Generando reporte...", "Calculando paginación inteligente...");

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter',
            compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 0.5; // Margen de 0.5 pulgadas
        const contentWidth = pdfWidth - (margin * 2);
        const usableHeight = pdfHeight - (margin * 2);

        // 1. Guardamos la posición de cada sección ANTES de capturar (para no cortarlas)
        const secciones = Array.from(input.querySelectorAll('.pdf-section'));
        const inputTop = input.getBoundingClientRect().top + window.scrollY;

        const seccionesInfo = secciones.map(seccion => {
            const rect = seccion.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY - inputTop,
                height: rect.height
            };
        });

        // 2. Capturamos TODO el contenedor de una sola vez
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.00);
        const imgProps = pdf.getImageProperties(imgData);
        const escalaCanvasAPdf = contentWidth / imgProps.width;
        const escalaDomACanvas = canvas.width / input.scrollWidth;

        // 3. Convertimos las posiciones de las secciones a píxeles del canvas
        const seccionesEnCanvas = seccionesInfo.map(s => ({
            topPx: s.top * escalaDomACanvas,
            heightPx: s.height * escalaDomACanvas,
            bottomPx: (s.top + s.height) * escalaDomACanvas
        }));

        // 4. Calculamos los cortes de página evitando partir una sección
        const maxAlturaPaginaPx = usableHeight / escalaCanvasAPdf;
        const cortes = [0];
        let cursor = 0;

        while (cursor < canvas.height) {
            let limite = cursor + maxAlturaPaginaPx;

            if (limite >= canvas.height) break;

            const seccionQueCruza = seccionesEnCanvas.find(
                s => s.topPx < limite && s.bottomPx > limite
            );

            if (seccionQueCruza) {
                limite = seccionQueCruza.heightPx > maxAlturaPaginaPx
                    ? cursor + maxAlturaPaginaPx // sección más alta que una página: no queda otra que cortarla
                    : seccionQueCruza.topPx;      // movemos el corte al inicio de esa sección
            }

            cortes.push(limite);
            cursor = limite;
        }
        cortes.push(canvas.height);

        // 5. Generamos cada página a partir del canvas único
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        const ctx = pageCanvas.getContext('2d');

        for (let i = 0; i < cortes.length - 1; i++) {
            const sourceY = cortes[i];
            const sliceHeight = cortes[i + 1] - sourceY;
            if (sliceHeight <= 0) continue;

            if (i > 0) pdf.addPage();

            pageCanvas.height = Math.max(1, Math.ceil(sliceHeight));
            ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
                canvas,
                0, sourceY, canvas.width, sliceHeight,
                0, 0, canvas.width, pageCanvas.height
            );

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 1.00);
            const pageImgHeight = pageCanvas.height * escalaCanvasAPdf;

            pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, pageImgHeight, undefined, "FAST");
        }

        pdf.save(`${nombreArchivo}.pdf`);
        alerta.exito("PDF Guardado", "Reporte generado con paginación perfecta.");
    } catch (error) {
        console.error("Error al generar PDF:", error);
        alerta.error("Error PDF", "No se pudo generar el archivo.");
    }
};

export const copiarGrafico = async (graficoId) => {
    const input = document.getElementById(graficoId);
    if (!input) {
        alerta.error("Error", "No se encontró el contenedor del gráfico.");
        return;
    }

    try {
        // Capturamos el gráfico con html2canvas
        const canvas = await html2canvas(input, {
            scale: 2, // Mayor resolución
            useCORS: true,
            backgroundColor: "#ffffff", // Fondo blanco
            logging: false
        });

        // Convertimos el canvas a blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                alerta.error("Error", "No se pudo generar la imagen del gráfico.");
                return;
            }

            try {
                // Escribimos en el portapapeles
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                alerta.exito("¡Gráfico Copiado!", "La imagen del gráfico está lista en tu portapapeles.");
            } catch (err) {
                console.error("Error al escribir en el portapapeles:", err);
                alerta.error(
                    "Error al copiar",
                    "Tu navegador bloqueó el copiado de imágenes. Asegúrate de estar en un contexto seguro (HTTPS o localhost)."
                );
            }
        }, "image/png");

    } catch (error) {
        console.error("Error al copiar el gráfico:", error);
        alerta.error("Error", "No se pudo procesar la imagen del gráfico.");
    }
};