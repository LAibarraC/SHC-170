import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { alerta } from '../../../utils/Notificaciones';
import Skeleton from '../../../ui/Skeleton';
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

// Paleta de colores institucional
const PALETA_BARRAS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '0.85rem'
      }}>
        {label && <p style={{ fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-main)' }}>{label}</p>}
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} style={{ margin: '3px 0', color: entry.color || entry.fill, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }}></span>
            <span>{entry.name}:</span>
            <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Componente escalable para renderizar las materias matriculadas por estudiante
const CeldaMaterias = ({ clases, claseNombre, claseCodigo }) => {
  const [expandido, setExpandido] = useState(false);

  if (!Array.isArray(clases) || clases.length === 0) {
    return (
      <div>
        <span style={{ fontWeight: '600' }}>{claseNombre || 'Sin grupo'}</span>
        {claseCodigo && claseCodigo !== '-' && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'monospace' }}>
            ({claseCodigo})
          </span>
        )}
      </div>
    );
  }

  const LIMITE_INICIAL = 2;
  const tieneMas = clases.length > LIMITE_INICIAL;
  const clasesVisibles = expandido ? clases : clases.slice(0, LIMITE_INICIAL);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: '420px' }}>
      {/* Lista de Badges de Materias */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {clasesVisibles.map((c, idx) => (
          <div
            key={c.id || idx}
            title={`${c.nombre} (Código: ${c.codigo})`}
            className="doc-badge-item"
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              maxWidth: '220px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <span
              style={{
                fontWeight: '600',
                color: 'var(--text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {c.nombre}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                flexShrink: 0
              }}
            >
              {c.codigo}
            </span>
          </div>
        ))}

        {/* Botón de expandir/contraer cuando son más de 2 materias */}
        {tieneMas && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandido(!expandido);
            }}
            style={{
              border: '1px dashed #3b82f6',
              backgroundColor: expandido ? 'rgba(59, 130, 246, 0.14)' : 'rgba(59, 130, 246, 0.08)',
              color: '#3b82f6',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease'
            }}
            title={expandido ? 'Mostrar menos materias' : `Ver las ${clases.length - LIMITE_INICIAL} materias restantes`}
          >
            {expandido ? '▲ Menos' : `+${clases.length - LIMITE_INICIAL} más`}
          </button>
        )}
      </div>

      {/* Subtexto resumen si tiene más de 1 materia */}
      {clases.length > 1 && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {clases.length} materias matriculadas
        </span>
      )}
    </div>
  );
};

export default function ReportesDocente({ usuario }) {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState('');
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

  const reporteRef = useRef(null);

  const cargarEstadisticas = async (idClase = null) => {
    try {
      setCargando(true);
      const data = await api.obtenerEstadisticasDocente(idClase);
      setEstadisticas(data);
    } catch (error) {
      alerta.error('Error al cargar reportes', error.message || 'No se pudieron obtener las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas(claseSeleccionadaId ? parseInt(claseSeleccionadaId) : null);
  }, [claseSeleccionadaId]);

  // --- EXPORTAR A EXCEL PROFESIONAL ---
  const exportarExcel = async () => {
    if (!estadisticas) return;
    try {
      setExportando(true);
      alerta.info('Generando Reporte Excel', 'Preparando documento analítico y capturando gráficos...');

      // Capturar gráficos como imágenes PNG
      const capturarImagen = async (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        try {
          const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
          return canvas.toDataURL('image/png');
        } catch (err) {
          console.warn(`No se pudo capturar gráfico #${id} para Excel:`, err);
          return null;
        }
      };

      const imgModulos = await capturarImagen('grafico-docente-modulos');
      const imgComparativa = await capturarImagen('grafico-docente-comparativa');
      const imgEvolucion = await capturarImagen('grafico-docente-evolucion');

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Simulador Empresarial USFX - Módulo Docente';
      wb.created = new Date();

      const COLOR_NAVY = 'FF0F172A';
      const COLOR_BLUE = 'FF2563EB';
      const COLOR_WHITE = 'FFFFFFFF';
      const COLOR_BORDER = 'FFCBD5E1';
      const COLOR_ZEBRA = 'FFF8FAFC';

      const nombreAlcance = estadisticas.clase_seleccionada
        ? `Grupo: ${estadisticas.clase_seleccionada.nombre} (${estadisticas.clase_seleccionada.codigo})`
        : 'Vista General (Todos los Grupos)';

      // ==========================================
      // HOJA 1: 📊 DASHBOARD EJECUTIVO
      // ==========================================
      const wsDash = wb.addWorksheet('📊 Dashboard Ejecutivo', {
        views: [{ showGridLines: true }]
      });

      // Banner Superior
      wsDash.mergeCells('B2:H3');
      const titleCell = wsDash.getCell('B2');
      titleCell.value = 'SIMULADOR EMPRESARIAL - INFORME DOCENTE';
      titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLOR_WHITE } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      wsDash.mergeCells('B4:H4');
      const subCell = wsDash.getCell('B4');
      const fechaHoy = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      subCell.value = `Docente: ${usuario?.nombre || usuario?.email || 'Docente'} | Alcance: ${nombreAlcance} | Emisión: ${fechaHoy}`;
      subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Tarjetas KPI
      const kpis = estadisticas.kpis || {};
      const tarjetas = [
        { titulo: 'GRUPOS / CLASES', valor: kpis.total_clases, color: 'FF3B82F6', detalle: 'Aulas a cargo' },
        { titulo: 'ESTUDIANTES', valor: kpis.total_alumnos, color: 'FF10B981', detalle: `${kpis.alumnos_activos} activos (${kpis.total_alumnos > 0 ? Math.round((kpis.alumnos_activos / kpis.total_alumnos) * 100) : 0}%)` },
        { titulo: 'ANÁLISIS EJECUTADOS', valor: kpis.total_calculos, color: 'FF6366F1', detalle: 'Cálculos realizados' },
        { titulo: 'PROMEDIO / ALUMNO', valor: kpis.promedio_calculos, color: 'FFF59E0B', detalle: 'Cálculos por estudiante' },
        { titulo: 'ARCHIVOS DE CLASE', valor: kpis.total_archivos, color: 'FF8B5CF6', detalle: 'Documentos compartidos' }
      ];

      tarjetas.forEach((tarjeta, idx) => {
        const colStartNum = 2 + idx;
        const colLetter = String.fromCharCode(65 + colStartNum - 1);

        const rTit = wsDash.getCell(`${colLetter}6`);
        rTit.value = tarjeta.titulo;
        rTit.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: COLOR_WHITE } };
        rTit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tarjeta.color } };
        rTit.alignment = { vertical: 'middle', horizontal: 'center' };

        const rVal = wsDash.getCell(`${colLetter}7`);
        rVal.value = tarjeta.valor;
        rVal.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLOR_NAVY } };
        rVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        rVal.alignment = { vertical: 'middle', horizontal: 'center' };

        const rDet = wsDash.getCell(`${colLetter}8`);
        rDet.value = tarjeta.detalle;
        rDet.font = { name: 'Segoe UI', size: 8, color: { argb: 'FF64748B' } };
        rDet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        rDet.alignment = { vertical: 'middle', horizontal: 'center' };

        [rTit, rVal, rDet].forEach(c => {
          c.border = {
            top: { style: 'thin', color: { argb: COLOR_BORDER } },
            bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
            left: { style: 'thin', color: { argb: COLOR_BORDER } },
            right: { style: 'thin', color: { argb: COLOR_BORDER } }
          };
        });

        wsDash.getColumn(colStartNum).width = 22;
      });

      wsDash.getColumn(1).width = 4;
      wsDash.getRow(6).height = 20;
      wsDash.getRow(7).height = 32;
      wsDash.getRow(8).height = 18;

      let filaGraficos = 10;

      // Insertar imágenes de gráficos capturados
      if (imgModulos || imgComparativa) {
        if (imgModulos) {
          const imgModId = wb.addImage({ base64: imgModulos, extension: 'png' });
          wsDash.addImage(imgModId, {
            tl: { col: 1, row: filaGraficos - 1 },
            ext: { width: 380, height: 230 }
          });
        }
        if (imgComparativa) {
          const imgCompId = wb.addImage({ base64: imgComparativa, extension: 'png' });
          wsDash.addImage(imgCompId, {
            tl: { col: 4, row: filaGraficos - 1 },
            ext: { width: 440, height: 230 }
          });
        }
        filaGraficos += 13;
      }

      if (imgEvolucion) {
        const imgEvolId = wb.addImage({ base64: imgEvolucion, extension: 'png' });
        wsDash.addImage(imgEvolId, {
          tl: { col: 1, row: filaGraficos - 1 },
          ext: { width: 830, height: 220 }
        });
        filaGraficos += 12;
      }

      // Tabla Resumen de Alumnos en el Dashboard
      if (estadisticas.lista_estudiantes && estadisticas.lista_estudiantes.length > 0) {
        filaGraficos += 1;
        wsDash.mergeCells(`B${filaGraficos}:G${filaGraficos}`);
        const cTitle = wsDash.getCell(`B${filaGraficos}`);
        cTitle.value = '👥 LISTADO Y ACTIVIDAD DE ESTUDIANTES';
        cTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLOR_WHITE } };
        cTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLUE } };
        cTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        wsDash.getRow(filaGraficos).height = 24;
        filaGraficos += 1;

        const headersDash = ['N°', 'Estudiante', 'Correo Electrónico', 'Grupo / Materia', 'Cálculos Realizados', 'Estado de Actividad'];
        const headerRowDash = wsDash.getRow(filaGraficos);
        headerRowDash.height = 24;
        headersDash.forEach((h, idx) => {
          const cell = headerRowDash.getCell(idx + 2);
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

        estadisticas.lista_estudiantes.slice(0, 30).forEach((est, idx) => {
          filaGraficos += 1;
          const r = wsDash.getRow(filaGraficos);
          r.height = 20;
          const isEven = idx % 2 === 0;
          const nombreClasesStr = Array.isArray(est.clases) && est.clases.length > 0
            ? est.clases.map(c => `${c.nombre} (${c.codigo})`).join(', ')
            : (est.clase_codigo && est.clase_codigo !== '-' ? `${est.clase_nombre} (${est.clase_codigo})` : est.clase_nombre);

          const rowVals = [
            idx + 1,
            est.nombre,
            est.email,
            nombreClasesStr,
            est.calculos_count,
            est.estado_actividad
          ];

          rowVals.forEach((val, cIdx) => {
            const cell = r.getCell(cIdx + 2);
            cell.value = val;
            cell.font = {
              name: 'Segoe UI',
              size: 9.5,
              bold: cIdx === 4,
              color: { argb: cIdx === 5 ? (val === 'Activo' ? 'FF10B981' : 'FF64748B') : 'FF1E293B' }
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isEven ? 'FFFFFFFF' : COLOR_ZEBRA }
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: cIdx === 0 || cIdx === 4 || cIdx === 5 ? 'center' : 'left'
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

      // Función auxiliar para formatear tablas en otras hojas
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
      // HOJA 2: 👥 ESTUDIANTES MATRICULADOS
      // ==========================================
      if (estadisticas.lista_estudiantes && estadisticas.lista_estudiantes.length > 0) {
        const wsEst = wb.addWorksheet('👥 Estudiantes Matriculados', { views: [{ showGridLines: true }] });
        wsEst.mergeCells('A1:G1');
        const tit = wsEst.getCell('A1');
        tit.value = 'DIRECTORIO DE ESTUDIANTES Y REGISTRO DE ACTIVIDAD';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_BLUE } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsEst.getRow(1).height = 30;

        const headersEst = ['N°', 'Nombre del Alumno', 'Correo Electrónico', 'Grupo(s) / Materia(s)', 'Código(s)', 'Cálculos Realizados', 'Fecha Inscripción'];
        const dataEst = estadisticas.lista_estudiantes.map((e, idx) => [
          idx + 1,
          e.nombre,
          e.email,
          Array.isArray(e.clases) && e.clases.length > 0
            ? e.clases.map(c => c.nombre).join(', ')
            : e.clase_nombre,
          Array.isArray(e.clases) && e.clases.length > 0
            ? e.clases.map(c => c.codigo).join(', ')
            : (e.clase_codigo || '-'),
          e.calculos_count,
          e.fecha_inscripcion || 'N/A'
        ]);

        aplicarEstiloTabla(wsEst, 3, headersEst, dataEst);
      }

      // ==========================================
      // HOJA 3: 📈 MÓDULOS PRACTICADOS
      // ==========================================
      if (estadisticas.distribucion_modulos && estadisticas.distribucion_modulos.length > 0) {
        const wsMod = wb.addWorksheet('📈 Módulos Practicados', { views: [{ showGridLines: true }] });
        wsMod.mergeCells('A1:D1');
        const tit = wsMod.getCell('A1');
        tit.value = 'FRECUENCIA DE USO DE MÓDULOS POR LOS ESTUDIANTES';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsMod.getRow(1).height = 30;

        const totalAnalisis = estadisticas.distribucion_modulos.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
        const headersMod = ['N°', 'Tipo de Análisis / Módulo', 'Cálculos Ejecutados', '% Participación'];
        const dataMod = estadisticas.distribucion_modulos.map((m, idx) => [
          idx + 1,
          m.name,
          m.cantidad,
          totalAnalisis > 0 ? `${((m.cantidad / totalAnalisis) * 100).toFixed(1)}%` : '0%'
        ]);

        aplicarEstiloTabla(wsMod, 3, headersMod, dataMod);
      }

      // ==========================================
      // HOJA 4: 🏫 COMPARATIVA DE GRUPOS
      // ==========================================
      if (estadisticas.comparativa_grupos && estadisticas.comparativa_grupos.length > 0) {
        const wsGrupos = wb.addWorksheet('🏫 Comparativa Grupos', { views: [{ showGridLines: true }] });
        wsGrupos.mergeCells('A1:E1');
        const tit = wsGrupos.getCell('A1');
        tit.value = 'RESUMEN COMPARATIVO DE GRUPOS Y MATERIAS';
        tit.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLOR_WHITE } };
        tit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
        tit.alignment = { vertical: 'middle', horizontal: 'center' };
        wsGrupos.getRow(1).height = 30;

        const headersGrupos = ['N°', 'Nombre de la Clase', 'Código de Acceso', 'Estudiantes Inscritos', 'Cálculos Totales'];
        const dataGrupos = estadisticas.comparativa_grupos.map((g, idx) => [
          idx + 1,
          g.nombre,
          g.codigo,
          g.alumnos,
          g.calculos
        ]);

        aplicarEstiloTabla(wsGrupos, 3, headersGrupos, dataGrupos);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const sufijoGrupo = estadisticas.clase_seleccionada ? `_${estadisticas.clase_seleccionada.codigo}` : '_General';
      anchor.download = `Reporte_Docente${sufijoGrupo}_${fechaArchivo}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      alerta.success('Descarga exitosa', 'El reporte Excel del docente se ha generado con formato profesional.');
    } catch (error) {
      console.error('Error al generar Excel docente:', error);
      alerta.error('Error al exportar', error.message || 'No se pudo generar el archivo Excel.');
    } finally {
      setExportando(false);
    }
  };

  // --- EXPORTAR A PDF MULTIPÁGINA ---
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

      // Páginas adicionales automáticas sin cortes
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fechaHoy = new Date().toISOString().split('T')[0];
      const sufijoGrupo = estadisticas?.clase_seleccionada ? `_${estadisticas.clase_seleccionada.codigo}` : '_General';
      pdf.save(`Reporte_Docente${sufijoGrupo}_${fechaHoy}.pdf`);
      alerta.success('PDF Descargado', 'El reporte en PDF ha sido guardado correctamente.');
    } catch (error) {
      console.error(error);
      alerta.error('Error', 'No se pudo generar el PDF del reporte docente.');
    } finally {
      setExportando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="50px" width="100%" borderRadius="12px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <Skeleton height="16px" width="50%" style={{ marginBottom: '10px' }} />
              <Skeleton height="32px" width="70%" />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
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
        <p>No se pudieron obtener las estadísticas de tus grupos en este momento.</p>
        <button
          onClick={() => cargarEstadisticas()}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const {
    kpis = {},
    distribucion_modulos = [],
    comparativa_grupos = [],
    evolucion_temporal = [],
    ranking_estudiantes = [],
    lista_estudiantes = [],
    clases_disponibles = [],
    clase_seleccionada
  } = estadisticas;

  // Filtrado local de estudiantes por buscador
  const estudiantesFiltrados = lista_estudiantes.filter(est => {
    if (!busquedaEstudiante) return true;
    const term = busquedaEstudiante.toLowerCase();
    const matchClases = Array.isArray(est.clases) && est.clases.length > 0
      ? est.clases.some(c => (c.nombre && c.nombre.toLowerCase().includes(term)) || (c.codigo && c.codigo.toLowerCase().includes(term)))
      : ((est.clase_nombre && est.clase_nombre.toLowerCase().includes(term)) || (est.clase_codigo && est.clase_codigo.toLowerCase().includes(term)));
    return (
      (est.nombre && est.nombre.toLowerCase().includes(term)) ||
      (est.email && est.email.toLowerCase().includes(term)) ||
      matchClases
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '10px 0 40px 0' }} ref={reporteRef} className="doc-fade-in-container">
      <style>{`
        @keyframes docFadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .doc-fade-in-container {
          animation: docFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Tarjetas KPI con micro-interacción */
        .doc-kpi-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease !important;
          cursor: default;
        }
        .doc-kpi-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
        }
        .doc-kpi-card:hover .doc-kpi-icon {
          transform: scale(1.12) rotate(4deg);
        }
        .doc-kpi-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Tarjetas de Gráficos y Contenedores */
        .doc-card-elevate {
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .doc-card-elevate:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06) !important;
          border-color: rgba(99, 102, 241, 0.25) !important;
        }

        /* Filas interactivas de la tabla */
        .doc-table-row {
          transition: background-color 0.18s ease, transform 0.15s ease;
        }
        .doc-table-row:hover {
          background-color: var(--bg-main) !important;
        }

        /* Botones con transición */
        .doc-btn-interactive {
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, filter 0.18s ease !important;
        }
        .doc-btn-interactive:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.06);
        }
        .doc-btn-interactive:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }

        /* Input de búsqueda interactivo */
        .doc-search-input {
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .doc-search-input:focus {
          width: 320px !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18) !important;
        }

        /* Selector de grupo interactivo */
        .doc-select-custom {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease !important;
        }
        .doc-select-custom:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18) !important;
        }

        /* Badges de materias */
        .doc-badge-item {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease !important;
        }
        .doc-badge-item:hover {
          transform: translateY(-1px);
          border-color: #3b82f6 !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15) !important;
        }
      `}</style>

      {/* CABECERA Y SELECTOR DE GRUPOS */}
      <div className="doc-card-elevate" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        backgroundColor: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Título y Subtítulo con Icono Profesional */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28)',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Estadísticas y Reportes Docente
              </h3>
              <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                {clase_seleccionada
                  ? `Métricas del grupo: ${clase_seleccionada.nombre} (Código: ${clase_seleccionada.codigo})`
                  : 'Métricas consolidadas de todas tus materias y grupos asignados'}
              </p>
            </div>
          </div>

          {/* Selector de Grupo / Clase con Icono y Estilo Profesional */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-main)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Filtrar por:
              </span>
            </div>

            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={claseSeleccionadaId}
                onChange={(e) => setClaseSeleccionadaId(e.target.value)}
                className="doc-select-custom"
                style={{
                  padding: '7px 32px 7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '230px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <option value="">Todos los Grupos (Vista General)</option>
                {clases_disponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.codigo})
                  </option>
                ))}
              </select>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  right: '10px',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Botones de Exportación */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={exportarExcel}
            disabled={exportando}
            className="doc-btn-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#107c41',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 15px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: exportando ? 'not-allowed' : 'pointer',
              opacity: exportando ? 0.7 : 1,
              boxShadow: '0 2px 6px rgba(16,124,65,0.2)'
            }}
            title="Exportar reporte completo en Excel con formato profesional"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel (.xlsx)
          </button>

          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="doc-btn-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 15px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: exportando ? 'not-allowed' : 'pointer',
              opacity: exportando ? 0.7 : 1,
              boxShadow: '0 2px 6px rgba(225,29,72,0.2)'
            }}
            title="Exportar informe en formato PDF"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* SECCIÓN DE TARJETAS KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Grupos / Clases */}
        <div className="doc-kpi-card" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                {clase_seleccionada ? 'Grupo Actual' : 'Clases a Cargo'}
              </span>
              <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0', color: 'var(--text-main)', fontWeight: 'bold' }}>
                {kpis.total_clases}
              </h3>
            </div>
            <div className="doc-kpi-icon" style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {clase_seleccionada ? `Código: ${clase_seleccionada.codigo}` : 'Total materias activas'}
          </p>
        </div>

        {/* KPI 2: Estudiantes Matriculados */}
        <div className="doc-kpi-card" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Estudiantes
              </span>
              <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0', color: '#10b981', fontWeight: 'bold' }}>
                {kpis.total_alumnos}
              </h3>
            </div>
            <div className="doc-kpi-icon" style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🟢 <strong>{kpis.alumnos_activos} activos</strong> · ⚪ {kpis.alumnos_inactivos} sin actividad
          </p>
        </div>

        {/* KPI 3: Cálculos y Análisis */}
        <div className="doc-kpi-card" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Análisis Ejecutados
              </span>
              <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0', color: '#6366f1', fontWeight: 'bold' }}>
                {kpis.total_calculos}
              </h3>
            </div>
            <div className="doc-kpi-icon" style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total de simulaciones y ejercicios
          </p>
        </div>

        {/* KPI 4: Promedio por Alumno */}
        <div className="doc-kpi-card" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Promedio / Alumno
              </span>
              <h3 style={{ fontSize: '1.8rem', margin: '8px 0 0 0', color: '#f59e0b', fontWeight: 'bold' }}>
                {kpis.promedio_calculos}
              </h3>
            </div>
            <div className="doc-kpi-icon" style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cálculos promedio por matriculado
          </p>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS INTERACTIVOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

        {/* GRÁFICO 1: MÓDULOS PRACTICADOS */}
        <div id="grafico-docente-modulos" className="doc-card-elevate" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
            Módulos Estadísticos Más Practicados
          </h4>

          {distribucion_modulos && distribucion_modulos.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucion_modulos}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="cantidad"
                  >
                    {distribucion_modulos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETA_BARRAS[index % PALETA_BARRAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Sin datos de análisis registrados aún
            </div>
          )}
        </div>

        {/* GRÁFICO 2: COMPARATIVA DE GRUPOS O RANKING DE ALUMNOS */}
        <div id="grafico-docente-comparativa" className="doc-card-elevate" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
            {clase_seleccionada ? 'Alumnos Más Activos en el Grupo' : 'Comparativa de Alumnos y Cálculos por Grupo'}
          </h4>

          {!clase_seleccionada && comparativa_grupos && comparativa_grupos.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativa_grupos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                  <XAxis dataKey="codigo" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{value}</span>} />
                  <Bar dataKey="alumnos" name="Estudiantes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calculos" name="Cálculos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : clase_seleccionada && ranking_estudiantes && ranking_estudiantes.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking_estudiantes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                  <XAxis dataKey="nombre" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="calculos_count" name="Cálculos Realizados" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {ranking_estudiantes.map((_, index) => (
                      <Cell key={`bar-rank-${index}`} fill={PALETA_BARRAS[index % PALETA_BARRAS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Sin datos suficientes para graficar
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICO 3: EVOLUCIÓN TEMPORAL */}
      {evolucion_temporal && evolucion_temporal.length > 0 && (
        <div id="grafico-docente-evolucion" className="doc-card-elevate" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '22px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Historial de Matriculación y Cálculos por Mes
          </h4>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucion_temporal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInscDoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCalcDoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{value}</span>} />
                <Area type="monotone" dataKey="inscripciones" name="Nuevos Inscritos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInscDoc)" />
                <Area type="monotone" dataKey="calculos" name="Análisis Realizados" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCalcDoc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLA DE ESTUDIANTES Y SU RENDIMIENTO */}
      <div className="doc-card-elevate" style={{
        backgroundColor: 'var(--bg-card)',
        padding: '22px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Directorio y Actividad de Alumnos
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Mostrando {estudiantesFiltrados.length} de {lista_estudiantes.length} estudiantes
            </span>
          </div>

          {/* Buscador con icono profesional */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por alumno, correo o materia..."
              value={busquedaEstudiante}
              onChange={(e) => setBusquedaEstudiante(e.target.value)}
              className="doc-search-input"
              style={{
                padding: '8px 14px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                minWidth: '270px',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>

        {estudiantesFiltrados.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>Estudiante</th>
                  <th style={{ padding: '10px' }}>Correo Electrónico</th>
                  <th style={{ padding: '10px' }}>{clase_seleccionada ? 'Grupo / Clase' : 'Grupos / Materias Matriculadas'}</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Cálculos</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Fecha Inscripción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((est, i) => (
                  <tr key={est.id ? `est-${est.id}` : `est-idx-${i}`} className="doc-table-row" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                      {est.nombre}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                      {est.email}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                      <CeldaMaterias
                        clases={est.clases}
                        claseNombre={est.clase_nombre}
                        claseCodigo={est.clase_codigo}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: est.calculos_count > 0 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                        color: est.calculos_count > 0 ? '#6366f1' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {est.calculos_count} {est.calculos_count === 1 ? 'cálculo' : 'cálculos'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: est.estado_actividad === 'Activo' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                        color: est.estado_actividad === 'Activo' ? '#10b981' : 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {est.estado_actividad === 'Activo' ? '● Activo' : '○ Sin Actividad'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {est.fecha_inscripcion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No se encontraron estudiantes para los criterios seleccionados.
          </div>
        )}
      </div>

    </div>
  );
}
