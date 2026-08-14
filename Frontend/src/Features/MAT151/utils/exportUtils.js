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
            format: 'letter'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 0.5; // Margen de 0.5 pulgadas
        const contentWidth = pdfWidth - (margin * 2);

        // 1. Buscamos todas las secciones marcadas
        const secciones = input.querySelectorAll('.pdf-section');
        let currentY = margin;

        for (let i = 0; i < secciones.length; i++) {
            const seccion = secciones[i];

            // Capturamos solo esta sección
            const canvas = await html2canvas(seccion, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: (clonedDoc) => {
                    // Aseguramos que la sección sea visible y tenga el ancho correcto en el clon
                    const el = clonedDoc.getElementById(seccion.id) || clonedDoc.querySelector(`[class*="${seccion.className}"]`);
                    if (el) {
                        el.style.display = "block";
                        el.style.width = "800px";
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            // 2. ¿Cabe en la página actual?
            if (currentY + imgHeight > pdfHeight - margin) {
                pdf.addPage();
                currentY = margin; // Reiniciamos en la nueva página
            }

            // 3. Añadimos la sección
            pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 0.2; // Espacio de 0.2in entre secciones
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