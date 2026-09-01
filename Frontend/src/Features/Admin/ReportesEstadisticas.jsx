import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { alerta } from '../../utils/Notificaciones';
import Skeleton from '../../ui/Skeleton';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// Paleta de colores armónica para los gráficos
const COLORES_ROLES = {
  Estudiante: '#3b82f6',
  Docente: '#10b981',
  Administrador: '#f59e0b',
  Pendiente: '#8b5cf6',
  'Sin Rol': '#64748b'
};

const PALETA_BARRAS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function ReportesEstadisticas() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState('todo'); // 'todo', '30d', '7d'
  const reporteRef = useRef(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setCargando(true);
      const data = await api.obtenerEstadisticasAdmin();
      setEstadisticas(data);
    } catch (error) {
      alerta.error('Error al cargar reportes', error.message || 'No se pudieron obtener las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  // --- EXPORTAR A EXCEL PROFESIONAL CON ESTILOS Y GRÁFICOS ---
  const exportarExcel = async () => {
    if (!estadisticas) return;
    try {
      setExportando(true);
      alerta.info('Generando Reporte Excel', 'Preparando hojas de cálculo estilizadas y capturando gráficos...');

      // 1. Obtener lista completa de usuarios si está disponible
      let listaUsuarios = [];
      try {
        listaUsuarios = await api.obtenerUsuarios();
      } catch (e) {
        console.warn('No se pudo obtener la lista de usuarios detallada para Excel:', e);
      }

      // 2. Capturar gráficos como imágenes PNG con html2canvas
      const capturarImagen = async (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        try {
          const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
          return canvas.toDataURL('image/png');
        } catch (err) {
          console.warn(`Error al capturar gráfico ${id}:`, err);
          return null;
        }
      };

      const imgRoles = await capturarImagen('grafico-roles');
      const imgEvolucion = await capturarImagen('grafico-evolucion');
      const imgAnalisis = await capturarImagen('grafico-analisis');

      // 3. Crear Workbook con ExcelJS
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Simulador Empresarial USFX';
      wb.lastModifiedBy = 'Administrador del Sistema';
      wb.created = new Date();
      wb.modified = new Date();

      const COLOR_NAVY = 'FF0F172A';
      const COLOR_BLUE = 'FF1E40AF';
      const COLOR_BORDER = 'FFCBD5E1';
      const COLOR_WHITE = 'FFFFFFFF';
      const COLOR_ZEBRA = 'FFF8FAFC';

      // ==========================================
      // HOJA 1: 📊 DASHBOARD EJECUTIVO & GRÁFICOS
      // ==========================================
      const wsDash = wb.addWorksheet('📊 Dashboard Ejecutivo', {
        views: [{ showGridLines: true }]
      });

      // Anchos de columna iniciales
      wsDash.columns = [
        { width: 4 },   // A
        { width: 22 },  // B
        { width: 22 },  // C
        { width: 22 },  // D
        { width: 22 },  // E
        { width: 22 },  // F
        { width: 22 },  // G
        { width: 4 }    // H
      ];

      // Banner de Título Institucional
      wsDash.mergeCells('B2:G2');
      const titleCell = wsDash.getCell('B2');
      titleCell.value = 'SIMULADOR EMPRESARIAL - SISTEMA DE GESTIÓN Y ANALÍTICA';
      titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLOR_WHITE } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      wsDash.getRow(2).height = 36;

      wsDash.mergeCells('B3:G3');
      const subCell = wsDash.getCell('B3');
      const fechaHoyStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      subCell.value = `Reporte Oficial de Métricas, Rendimiento y Estadísticas del Sistema | Emitido: ${fechaHoyStr}`;
      subCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF94A3B8' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };
      wsDash.getRow(3).height = 20;

      // Sección KPI Tarjetas
      const kpiItems = [
        { colStart: 'B', colEnd: 'C', titulo: 'TOTAL USUARIOS', valor: estadisticas.kpis.total_usuarios, sub: `${estadisticas.kpis.usuarios_activos} Activos • ${estadisticas.kpis.usuarios_suspendidos} Susp.`, color: 'FF3B82F6', bg: 'FFEFF6FF' },
        { colStart: 'D', colEnd: 'E', titulo: 'ESTUDIANTES', valor: estadisticas.kpis.total_estudiantes, sub: `${estadisticas.kpis.total_usuarios > 0 ? Math.round((estadisticas.kpis.total_estudiantes/estadisticas.kpis.total_usuarios)*100) : 0}% de los registrados`, color: 'FF06B6D4', bg: 'FFF0F9FF' },
        { colStart: 'F', colEnd: 'G', titulo: 'DOCENTES', valor: estadisticas.kpis.total_docentes, sub: `${estadisticas.kpis.total_clases} Clases activas`, color: 'FF10B981', bg: 'FFECFDF5' },
      ];

      const kpiItems2 = [
        { colStart: 'B', colEnd: 'C', titulo: 'ADMINISTRADORES', valor: estadisticas.kpis.total_administradores, sub: 'Control total de la plataforma', color: 'FFF59E0B', bg: 'FFFFFBEB' },
        { colStart: 'D', colEnd: 'E', titulo: 'SIMULACIONES / ANÁLISIS', valor: estadisticas.kpis.total_calculos, sub: `${estadisticas.kpis.total_inscripciones} Inscritos en ${estadisticas.kpis.total_clases} clases`, color: 'FF8B5CF6', bg: 'FFF5F3FF' },
        { colStart: 'F', colEnd: 'G', titulo: 'USO DE MEMORIA', valor: estadisticas.kpis.total_mb >= 1024 ? `${(estadisticas.kpis.total_mb/1024).toFixed(2)} GB` : `${estadisticas.kpis.total_mb} MB`, sub: `${estadisticas.kpis.total_archivos} Archivos almacenados`, color: 'FFEC4899', bg: 'FFFDF2F8' },
      ];

      const renderKpiRow = (items, startRow) => {
        wsDash.getRow(startRow).height = 18;
        wsDash.getRow(startRow + 1).height = 28;
        wsDash.getRow(startRow + 2).height = 16;

        items.forEach(kpi => {
          // Titulo
          wsDash.mergeCells(`${kpi.colStart}${startRow}:${kpi.colEnd}${startRow}`);
          const cTit = wsDash.getCell(`${kpi.colStart}${startRow}`);
          cTit.value = kpi.titulo;
          cTit.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: kpi.color } };
          cTit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
          cTit.alignment = { vertical: 'middle', horizontal: 'center' };

          // Valor
          wsDash.mergeCells(`${kpi.colStart}${startRow + 1}:${kpi.colEnd}${startRow + 1}`);
          const cVal = wsDash.getCell(`${kpi.colStart}${startRow + 1}`);
          cVal.value = kpi.valor;
          cVal.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FF0F172A' } };
          cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
          cVal.alignment = { vertical: 'middle', horizontal: 'center' };

          // Sub
          wsDash.mergeCells(`${kpi.colStart}${startRow + 2}:${kpi.colEnd}${startRow + 2}`);
          const cSub = wsDash.getCell(`${kpi.colStart}${startRow + 2}`);
          cSub.value = kpi.sub;
          cSub.font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF64748B' } };
          cSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
          cSub.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      };

      renderKpiRow(kpiItems, 5);
      renderKpiRow(kpiItems2, 9);

      // Insertar Gráficos Embebidos si están capturados
      let filaGraficos = 13;
      if (imgRoles || imgEvolucion) {
        wsDash.mergeCells(`B${filaGraficos}:G${filaGraficos}`);
        const cSect = wsDash.getCell(`B${filaGraficos}`);
        cSect.value = '📈 REPRESENTACIÓN GRÁFICA Y MÉTRICAS VISUALES';
        cSect.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLOR_WHITE } };
        cSect.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLUE } };
        cSect.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        wsDash.getRow(filaGraficos).height = 24;
        filaGraficos += 2;

        if (imgRoles) {
          const imgRolesId = wb.addImage({ base64: imgRoles, extension: 'png' });
          wsDash.addImage(imgRolesId, {
            tl: { col: 1, row: filaGraficos - 1 },
            ext: { width: 380, height: 230 }
          });
        }
        if (imgEvolucion) {
          const imgEvolId = wb.addImage({ base64: imgEvolucion, extension: 'png' });
          wsDash.addImage(imgEvolId, {
            tl: { col: 4, row: filaGraficos - 1 },
            ext: { width: 440, height: 230 }
          });
        }

        filaGraficos += 13;

        if (imgAnalisis) {
          const imgAnaId = wb.addImage({ base64: imgAnalisis, extension: 'png' });
          wsDash.addImage(imgAnaId, {
            tl: { col: 1, row: filaGraficos - 1 },
            ext: { width: 830, height: 220 }
          });
          filaGraficos += 12;
        }
      }

      // Tabla de Ranking de Clases en la Hoja 1 (Dashboard)
      if (estadisticas.top_clases && estadisticas.top_clases.length > 0) {
        filaGraficos += 1;
        wsDash.mergeCells(`B${filaGraficos}:G${filaGraficos}`);
        const cRankTitle = wsDash.getCell(`B${filaGraficos}`);
        cRankTitle.value = '🏆 RANKING DE CLASES CON MAYOR MATRICULACIÓN';
        cRankTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLOR_WHITE } };
        cRankTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        cRankTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        wsDash.getRow(filaGraficos).height = 24;
        filaGraficos += 1;

        const headersRankDash = ['Posición', 'Nombre de la Clase', 'Código', 'Docente Asignado', 'Estudiantes', 'Fecha Registro'];
        const headerRowDash = wsDash.getRow(filaGraficos);
        headerRowDash.height = 24;
        headersRankDash.forEach((h, idx) => {
          const cell = headerRowDash.getCell(idx + 2); // Start from Col B (index 2)
          cell.value = h;
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_WHITE } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: COLOR_BORDER } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: COLOR_BORDER } },
            right: { style: 'thin', color: { argb: COLOR_BORDER } }
          };
        });

        estadisticas.top_clases.forEach((c, idx) => {
          filaGraficos += 1;
          const r = wsDash.getRow(filaGraficos);
          r.height = 20;
          const isEven = idx % 2 === 0;
          const rowValues = [
            `#${idx + 1}`,
            c.nombre,
            c.codigo,
            c.docente,
            c.estudiantes_count,
            c.fecha_creacion || 'N/A'
          ];

          rowValues.forEach((val, cIdx) => {
            const cell = r.getCell(cIdx + 2);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9.5, bold: cIdx === 0, color: { argb: cIdx === 0 ? 'FFF59E0B' : 'FF1E293B' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isEven ? 'FFFFFFFF' : COLOR_ZEBRA }
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: cIdx === 0 || cIdx === 2 || cIdx === 4 ? 'center' : (cIdx === 5 ? 'right' : 'left')
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        });
      }

      // Función auxiliar para formatear encabezados de tablas
      const aplicarEstiloTabla = (ws, startRow, headers, rowsData) => {
        const headerRow = ws.getRow(startRow);
        headerRow.height = 26;
        headers.forEach((h, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.value = h;
          cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: COLOR_WHITE } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: COLOR_BORDER } },
            bottom: { style: 'medium', color: { argb: COLOR_NAVY } },
            left: { style: 'thin', color: { argb: COLOR_BORDER } },
            right: { style: 'thin', color: { argb: COLOR_BORDER } }
          };
        });

        rowsData.forEach((row, rIdx) => {
          const curRow = ws.getRow(startRow + 1 + rIdx);
          curRow.height = 20;
          const isEven = rIdx % 2 === 0;
          row.forEach((val, cIdx) => {
            const cell = curRow.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isEven ? 'FFFFFFFF' : COLOR_ZEBRA }
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: typeof val === 'number' ? 'right' : 'left'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          });
        });

        // Autoajustar ancho de columnas
        ws.columns.forEach(col => {
          let maxLen = 14;
          col.eachCell({ includeEmpty: false }, cell => {
            const cellLen = cell.value ? cell.value.toString().length : 0;
            if (cellLen > maxLen) maxLen = Math.min(cellLen + 4, 45);
          });
          col.width = maxLen;
        });
      };

      // ==========================================
      // HOJA 2: 👥 DIRECTORIO DE USUARIOS
      // ==========================================
      if (listaUsuarios && listaUsuarios.length > 0) {
        const wsUsers = wb.addWorksheet('👥 Directorio de Usuarios', { views: [{ showGridLines: true }] });
        wsUsers.mergeCells('A1:G1');
        const tit = wsUsers.getCell('A1');
        tit.value = 'DIRECTORIO GENERAL DE USUARIOS REGISTRADOS';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLUE } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsUsers.getRow(1).height = 30;

        const headersUsers = ['ID', 'Nombre Completo', 'Correo Electrónico', 'Rol Asignado', 'Perfil Académico', 'Estado', 'Fecha Registro'];
        const dataUsers = listaUsuarios.map(u => [
          u.id,
          u.nombre || 'N/A',
          u.email,
          u.rol || 'Sin Rol',
          u.perfil || 'N/A',
          u.activo ? 'ACTIVO' : 'SUSPENDIDO',
          u.fecha_creacion || 'N/A'
        ]);

        aplicarEstiloTabla(wsUsers, 3, headersUsers, dataUsers);
      }

      // ==========================================
      // HOJA 3: 🏆 RANKING DE CLASES
      // ==========================================
      if (estadisticas.top_clases && estadisticas.top_clases.length > 0) {
        const wsClases = wb.addWorksheet('🏆 Ranking de Clases', { views: [{ showGridLines: true }] });
        wsClases.mergeCells('A1:F1');
        const tit = wsClases.getCell('A1');
        tit.value = 'RANKING DE CLASES CON MAYOR MATRICULACIÓN';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsClases.getRow(1).height = 30;

        const headersClases = ['Posición', 'Nombre de la Clase', 'Código de Acceso', 'Docente Asignado', 'Estudiantes Matriculados', 'Fecha Creación'];
        const dataClases = estadisticas.top_clases.map((c, idx) => [
          `#${idx + 1}`,
          c.nombre,
          c.codigo,
          c.docente,
          c.estudiantes_count,
          c.fecha_creacion || 'N/A'
        ]);

        aplicarEstiloTabla(wsClases, 3, headersClases, dataClases);
      }

      // ==========================================
      // HOJA 4: 📈 MÓDULOS Y ANÁLISIS
      // ==========================================
      if (estadisticas.distribucion_analisis && estadisticas.distribucion_analisis.length > 0) {
        const wsMod = wb.addWorksheet('📈 Módulos y Análisis', { views: [{ showGridLines: true }] });
        wsMod.mergeCells('A1:D1');
        const tit = wsMod.getCell('A1');
        tit.value = 'FRECUENCIA DE USO DE MÓDULOS ESTADÍSTICOS';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsMod.getRow(1).height = 30;

        const totalAnalisis = estadisticas.distribucion_analisis.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
        const headersMod = ['N°', 'Tipo de Análisis / Módulo', 'Cálculos Ejecutados', '% Participación'];
        const dataMod = estadisticas.distribucion_analisis.map((m, idx) => [
          idx + 1,
          m.name,
          m.cantidad,
          totalAnalisis > 0 ? `${((m.cantidad / totalAnalisis) * 100).toFixed(1)}%` : '0%'
        ]);

        aplicarEstiloTabla(wsMod, 3, headersMod, dataMod);
      }

      // ==========================================
      // HOJA 5: 📅 EVOLUCIÓN CRONOLÓGICA
      // ==========================================
      if (estadisticas.evolucion_temporal && estadisticas.evolucion_temporal.length > 0) {
        const wsEvol = wb.addWorksheet('📅 Evolución Cronológica', { views: [{ showGridLines: true }] });
        wsEvol.mergeCells('A1:C1');
        const tit = wsEvol.getCell('A1');
        tit.value = 'HISTORIAL MENSUAL DE REGISTROS Y ACTIVIDAD';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsEvol.getRow(1).height = 30;

        const headersEvol = ['Período (Mes)', 'Nuevos Usuarios Registrados', 'Análisis Ejecutados'];
        const dataEvol = estadisticas.evolucion_temporal.map(e => [
          e.mes,
          e.registros,
          e.calculos
        ]);

        aplicarEstiloTabla(wsEvol, 3, headersEvol, dataEvol);
      }

      // Generar buffer y descargar archivo
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const fechaHoy = new Date().toISOString().split('T')[0];
      anchor.download = `Reporte_Estadisticas_Simulador_${fechaHoy}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      alerta.success('Descarga exitosa', 'El reporte Excel con diseño profesional y gráficos se ha descargado correctamente.');
    } catch (error) {
      console.error('Error al generar Excel con ExcelJS:', error);
      alerta.error('Error al exportar', error.message || 'No se pudo generar el archivo Excel.');
    } finally {
      setExportando(false);
    }
  };

  // --- EXPORTAR A PDF MULTIPÁGINA SIN CORTES ---
  const exportarPDF = async () => {
    if (!reporteRef.current) return;
    try {
      setExportando(true);
      alerta.info('Generando PDF', 'Preparando documento completo en formato PDF...');

      const canvas = await html2canvas(reporteRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const totalImgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = totalImgHeight;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Páginas adicionales automáticas para que no se corte la tabla de ranking ni los gráficos
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fechaHoy = new Date().toISOString().split('T')[0];
      pdf.save(`Reporte_Estadisticas_Simulador_${fechaHoy}.pdf`);
      alerta.success('PDF Descargado', 'El reporte en PDF con todas las tablas y gráficos ha sido guardado correctamente.');
    } catch (error) {
      console.error(error);
      alerta.error('Error', 'No se pudo generar el PDF del reporte.');
    } finally {
      setExportando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Skeleton height="16px" width="50%" style={{ marginBottom: '10px' }} />
              <Skeleton height="32px" width="70%" />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-card)', height: '300px', border: '1px solid var(--border-color)' }}>
            <Skeleton height="20px" width="40%" style={{ marginBottom: '20px' }} />
            <Skeleton height="200px" width="100%" />
          </div>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-card)', height: '300px', border: '1px solid var(--border-color)' }}>
            <Skeleton height="20px" width="40%" style={{ marginBottom: '20px' }} />
            <Skeleton height="200px" width="100%" />
          </div>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
        <p>No se pudieron obtener las estadísticas en este momento.</p>
        <button
          onClick={cargarEstadisticas}
          style={{
            marginTop: '10px',
            padding: '8px 18px',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, distribucion_roles, evolucion_temporal, distribucion_analisis, top_clases } = estadisticas;

  // Formato tooltip personalizado para gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          color: 'var(--text-main, #fff)',
          fontSize: '0.85rem'
        }}>
          {label && <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>}
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: '3px 0', color: entry.color || entry.fill || 'var(--accent-color)' }}>
              {entry.name}: <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={reporteRef} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

      {/* BARRA SUPERIOR DE ACCIONES Y FILTROS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        backgroundColor: 'var(--bg-card)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Período:</span>
          <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-input, #f3f4f6)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setPeriodoFiltro('todo')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: periodoFiltro === 'todo' ? 'var(--accent-color)' : 'transparent',
                color: periodoFiltro === 'todo' ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Histórico Completo
            </button>
            <button
              onClick={() => setPeriodoFiltro('30d')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: periodoFiltro === '30d' ? 'var(--accent-color)' : 'transparent',
                color: periodoFiltro === '30d' ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => setPeriodoFiltro('7d')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: periodoFiltro === '7d' ? 'var(--accent-color)' : 'transparent',
                color: periodoFiltro === '7d' ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Últimos 7 días
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={cargarEstadisticas}
            title="Refrescar Estadísticas"
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-input, #f3f4f6)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refrescar
          </button>

          <button
            onClick={exportarExcel}
            style={{
              padding: '8px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Exportar Excel
          </button>

          <button
            onClick={exportarPDF}
            disabled={exportando}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--accent-color, #f97316)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: exportando ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: exportando ? 0.7 : 1,
              boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exportando ? 'Exportando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* TARJETAS KPI (GRID RESPONSIVO) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Total Usuarios */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Total Usuarios</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_usuarios}
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{kpis.usuarios_activos} activos</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{kpis.usuarios_suspendidos} susp.</span>
          </div>
        </div>

        {/* KPI 2: Estudiantes */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #06b6d4',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Estudiantes</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_estudiantes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {kpis.total_usuarios > 0 ? `${Math.round((kpis.total_estudiantes / kpis.total_usuarios) * 100)}% de los registrados` : '0%'}
          </div>
        </div>

        {/* KPI 3: Docentes (TARJETA SEPARADA) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Número de Docentes</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_docentes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dictando {kpis.total_clases} clases activas
          </div>
        </div>

        {/* KPI 4: Administradores (TARJETA SEPARADA) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Administradores</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_administradores}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Control y gestión total del sistema
          </div>
        </div>

        {/* KPI 5: Simulaciones y Cálculos Ejecutados */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #8b5cf6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              Simulaciones y Análisis
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_calculos}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {kpis.total_inscripciones} alumnos inscritos en {kpis.total_clases} clases
          </div>
        </div>

        {/* KPI 6: Uso Total de Memoria (TARJETA SEPARADA) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #ec4899',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Uso Total de Memoria</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {kpis.total_mb >= 1024 ? `${(kpis.total_mb / 1024).toFixed(2)} GB` : `${kpis.total_mb} MB`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {kpis.total_archivos} archivos en el sistema
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS: DISTRIBUCIÓN DE ROLES & EVOLUCIÓN TEMPORAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

        {/* GRÁFICO 1: DISTRIBUCIÓN POR ROL */}
        <div id="grafico-roles" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }}></span>
            Distribución de Usuarios por Rol
          </h4>

          {distribucion_roles && distribucion_roles.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucion_roles}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distribucion_roles.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_ROLES[entry.name] || PALETA_BARRAS[index % PALETA_BARRAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Sin datos suficientes
            </div>
          )}
        </div>

        {/* GRÁFICO 2: EVOLUCIÓN TEMPORAL */}
        <div id="grafico-evolucion" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Actividad y Registros por Mes
          </h4>

          {evolucion_temporal && evolucion_temporal.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucion_temporal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCalculos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                  <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{value}</span>} />
                  <Area type="monotone" dataKey="registros" name="Nuevos Usuarios" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRegistros)" />
                  <Area type="monotone" dataKey="calculos" name="Análisis Ejecutados" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCalculos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Sin datos temporales registrados aún
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICO DE BARRAS: TIPOS DE ANÁLISIS MÁS USADOS */}
      {distribucion_analisis && distribucion_analisis.length > 0 && (
        <div id="grafico-analisis" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
            Módulos y Tipos de Análisis Estadístico Más Utilizados
          </h4>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribucion_analisis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" name="Ejecuciones" radius={[6, 6, 0, 0]}>
                  {distribucion_analisis.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={PALETA_BARRAS[index % PALETA_BARRAS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLA DE CLASES CON MÁS ESTUDIANTES */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '22px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            Ranking de Clases con Mayor Matriculación
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            Total Clases: {kpis.total_clases}
          </span>
        </div>

        {top_clases && top_clases.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>Clase</th>
                  <th style={{ padding: '10px' }}>Código</th>
                  <th style={{ padding: '10px' }}>Docente</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Estudiantes Inscritos</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {top_clases.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>#{i + 1}</span>
                      {c.nombre}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {c.codigo}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                      {c.docente}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: c.estudiantes_count > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                        color: c.estudiantes_count > 0 ? '#10b981' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {c.estudiantes_count} {c.estudiantes_count === 1 ? 'estudiante' : 'estudiantes'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {c.fecha_creacion || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No hay clases registradas en el sistema todavía.
          </div>
        )}
      </div>

    </div>
  );
}
