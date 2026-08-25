import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { alerta } from '../../../utils/Notificaciones';
import Modal from '../../../utils/Modal'; 
import { IconoBuscar } from '../../../ui/iconos'; 

// Importaciones para el tour interactivo
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- ICONOS SVG ---
const IconoAjustes = ({ width = 14, height = 14, style = {} }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const IconoConfig = ({ width = 18, height = 18, style = {} }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const IconoTrash = ({ width = 16, height = 16, style = {} }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function GestionDocente({ usuario }) {
  const [clases, setClases] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Estados para el Modal de Gestión de un estudiante
  const [modalGestionEstudiante, setModalGestionEstudiante] = useState(null);

  // Estados para el Modal de confirmación (Eliminación)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState(null);

  // --- ESTADOS PARA BÚSQUEDA, FILTROS Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [menuFiltroAbierto, setMenuFiltroAbierto] = useState(null); 
  const [filtroCurso, setFiltroCurso] = useState('TODOS');
  const [ordenFecha, setOrdenFecha] = useState('ninguno'); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 
  const menuRef = useRef(null);

  // Cerrar menús de filtro al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuFiltroAbierto(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mantener actualizado el modal de gestión si los datos cambian
  useEffect(() => {
    if (modalGestionEstudiante) {
      const estudianteActualizado = estudiantes.find(e => e.id === modalGestionEstudiante.id);
      if (estudianteActualizado) {
        setModalGestionEstudiante(estudianteActualizado);
      } else {
        setModalGestionEstudiante(null);
      }
    }
  }, [estudiantes]);

  // --- FUNCIÓN DEL TOUR INTERACTIVO ---
  const iniciarTour = () => {
    const tourSteps = [
      {
        element: '#tour-gestion-titulo',
        popover: {
          title: 'Gestión de Alumnos',
          description: 'Aquí puedes visualizar y administrar la lista de todos los estudiantes inscritos en tus materias.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#tour-gestion-buscador',
        popover: {
          title: 'Buscador Rápido',
          description: 'Escribe aquí el nombre o correo del alumno para encontrarlo instantáneamente en cualquiera de tus cursos.',
          side: "bottom",
          align: 'start'
        }
      }
    ];

    if (document.querySelector('#tour-gestion-tabla')) {
      tourSteps.push({
        element: '#tour-gestion-tabla',
        popover: {
          title: 'Registro de Estudiantes',
          description: 'Muestra los datos de los alumnos agrupados. Usa el icono de engranaje (⚙️) para gestionar las materias o desmatricular.',
          side: "top",
          align: 'start'
        }
      });
    }

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
      steps: tourSteps
    });
    driverObj.drive();
  };

  useEffect(() => {
    if (usuario?.email) {
      cargarDatosCompletos();
    }
  }, [usuario]);

  const cargarDatosCompletos = async () => {
    try {
      setCargandoDatos(true);
      const clasesData = await api.obtenerClasesDocente();
      setClases(clasesData);

      let mapaEstudiantes = new Map();
      
      for (const clase of clasesData) {
        const ests = await api.obtenerEstudiantesClase(clase.id, usuario.email);
        
        for (const e of ests) {
          if (!mapaEstudiantes.has(e.id)) {
            mapaEstudiantes.set(e.id, {
              ...e,
              clasesInscritas: []
            });
          }
          
          mapaEstudiantes.get(e.id).clasesInscritas.push({
            claseId: clase.id,
            claseNombre: clase.nombre,
            fecha_inscripcion: e.fecha_creacion
          });
        }
      }
      
      setEstudiantes(Array.from(mapaEstudiantes.values()));
    } catch (error) {
      alerta.error("Error", error.message || "No se pudieron cargar los datos de los cursos");
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleCambiarCurso = async (estudiante, oldClaseId, nuevaClaseId) => {
    if (estudiante.clasesInscritas.some(c => String(c.claseId) === String(nuevaClaseId))) {
      alerta.error("Acción inválida", "El alumno ya se encuentra inscrito en este curso.");
      return;
    }

    try {
      if (api.cambiarCursoEstudiante) {
        await api.cambiarCursoEstudiante(estudiante.id, oldClaseId, nuevaClaseId, usuario.email);
      } else {
        await api.desmatricularEstudiante(oldClaseId, estudiante.id, usuario.email);
        if (api.matricularEstudiante) {
          await api.matricularEstudiante(nuevaClaseId, estudiante.id, usuario.email);
        }
      }

      alerta.exito("Materia actualizada", `El alumno ha sido movido a la nueva materia.`);
      await cargarDatosCompletos();
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo cambiar de curso al estudiante");
    }
  };

  const solicitarEliminacionEstudiante = (estudianteId, estudianteNombre, claseId, claseNombre) => {
    setEstudianteAEliminar({ id: estudianteId, nombre: estudianteNombre, claseId, claseNombre });
    setIsModalOpen(true);
  };

  const confirmarEliminacion = async () => {
    if (!estudianteAEliminar) return;

    try {
      await api.desmatricularEstudiante(estudianteAEliminar.claseId, estudianteAEliminar.id, usuario.email);
      
      alerta.exito("Estudiante removido", `El alumno ha sido removido de ${estudianteAEliminar.claseNombre} correctamente.`);
      
      setEstudiantes(prev => prev.map(e => {
        if (e.id === estudianteAEliminar.id) {
          return {
            ...e,
            clasesInscritas: e.clasesInscritas.filter(c => String(c.claseId) !== String(estudianteAEliminar.claseId))
          };
        }
        return e;
      }).filter(e => e.clasesInscritas.length > 0)); 
      
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo desmatricular al estudiante");
    } finally {
      setIsModalOpen(false);
      setEstudianteAEliminar(null); 
    }
  };

  const cancelarEliminacion = () => {
    setIsModalOpen(false);
    setEstudianteAEliminar(null);
  };

  // --- LÓGICA DE FILTRADO Y BÚSQUEDA ---
  const getDateVal = (clasesArr) => {
    if (!clasesArr || clasesArr.length === 0) return 0;
    return Math.max(...clasesArr.map(c => new Date(c.fecha_inscripcion || 0).getTime()));
  };

  const filteredEstudiantes = estudiantes
    .filter((est) => {
      const matchGlobal = 
        est.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        est.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCurso = filtroCurso === 'TODOS' || est.clasesInscritas.some(c => String(c.claseId) === String(filtroCurso));
      
      return matchGlobal && matchCurso;
    })
    .sort((a, b) => {
      if (ordenFecha === 'asc') return getDateVal(a.clasesInscritas) - getDateVal(b.clasesInscritas);
      if (ordenFecha === 'desc') return getDateVal(b.clasesInscritas) - getDateVal(a.clasesInscritas);
      return 0;
    });

  const totalPages = Math.ceil(filteredEstudiantes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEstudiantes = filteredEstudiantes.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredEstudiantes.length, currentPage, totalPages]);

  const toggleMenu = (columna) => {
    setMenuFiltroAbierto(prev => (prev === columna ? null : columna));
  };

  const getPopoverStyle = (columna) => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: columna === 'registro' ? 'auto' : 0,
    right: columna === 'registro' ? 0 : 'auto',
    backgroundColor: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
    padding: '6px',
    zIndex: 50,
    minWidth: '160px',
    textTransform: 'none',
    fontWeight: 'normal',
    color: 'var(--text-main, #1f2937)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  });

  const btnAjustesStyle = (activo) => ({
    background: activo ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    color: activo ? '#3b82f6' : 'var(--text-muted, #6b7280)',
    transition: 'all 0.2s'
  });

  const btnOpcionStyle = (isSelected) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    background: isSelected ? 'var(--bg-input, #f3f4f6)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isSelected ? '#3b82f6' : 'var(--text-main, #333)',
    fontWeight: isSelected ? 'bold' : 'normal',
    fontSize: '0.85rem',
    borderRadius: '4px',
    transition: 'background 0.2s'
  });

  const ControlesPaginacion = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #d1d5db)",
            background: currentPage === 1 ? "var(--bg-input, #f3f4f6)" : "transparent",
            color: currentPage === 1 ? "#9ca3af" : "var(--text-main, #333)",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "0.85rem",
            transition: "all 0.2s"
          }}
        >
          Anterior
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #6b7280)", fontWeight: "bold" }}>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #d1d5db)",
            background: currentPage === totalPages ? "var(--bg-input, #f3f4f6)" : "transparent",
            color: currentPage === totalPages ? "#9ca3af" : "var(--text-main, #333)",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "0.85rem",
            transition: "all 0.2s"
          }}
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: 'clamp(15px, 3vw, 25px) auto', padding: '0 20px', position: 'relative' }}>
      
      {/* CABECERA CON BOTÓN DE TOUR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(15px, 3vw, 25px)', flexWrap: 'wrap', gap: 'clamp(10px, 3vw, 20px)' }}>
        <div id="tour-gestion-titulo">
          <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', margin: '0 0 5px 0', color: 'var(--text-main)' }}>
            Gestión de Alumnos
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
            Visualiza a todos los estudiantes inscritos en tus materias y reasígnalos fácilmente.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <button onClick={iniciarTour} className="guia-rapida-flotante">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="guia-rapida-flotante-texto">Guía Rápida</span>
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div id="tour-gestion-buscador" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-card)', padding: '8px 15px', borderRadius: '30px', border: '1px solid var(--border-color)', marginBottom: "20px", boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}><IconoBuscar width="18" height="18" /></span>
        <input
          type="text"
          placeholder="Buscar estudiante por nombre o correo..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '0.95rem' }}
        />
      </div>

      {/* CONTENIDO PRINCIPAL DE TABLA */}
      <div className="grafico-card" style={{ borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-card)', padding: '25px', border: '1px solid var(--border-color)' }}>
        {cargandoDatos ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Cargando información de estudiantes y cursos...</p>
          </div>
        ) : (
          <div id="tour-gestion-tabla" style={{ overflowX: 'auto', paddingBottom: menuFiltroAbierto ? '160px' : '10px', transition: 'padding-bottom 0.3s ease' }}>
            <table className="tabla-responsive tabla-responsiva-panel" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Nombre del Estudiante</th>
                  <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Correo Electrónico</th>
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Materias</span>
                      <button style={btnAjustesStyle(filtroCurso !== 'TODOS')} onClick={() => toggleMenu('curso')} title="Filtrar por curso">
                        <IconoAjustes />
                      </button>
                    </div>
                    {menuFiltroAbierto === 'curso' && (
                      <div ref={menuRef} style={getPopoverStyle('curso')}>
                        <button onClick={() => { setFiltroCurso('TODOS'); setCurrentPage(1); setMenuFiltroAbierto(null); }} style={btnOpcionStyle(filtroCurso === 'TODOS')} onMouseEnter={(e) => { if (filtroCurso !== 'TODOS') e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }} onMouseLeave={(e) => { if (filtroCurso !== 'TODOS') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          Todas las materias
                        </button>
                        {clases.map(c => (
                          <button key={c.id} onClick={() => { setFiltroCurso(c.id); setCurrentPage(1); setMenuFiltroAbierto(null); }} style={btnOpcionStyle(String(filtroCurso) === String(c.id))} onMouseEnter={(e) => { if (String(filtroCurso) !== String(c.id)) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }} onMouseLeave={(e) => { if (String(filtroCurso) !== String(c.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            {c.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Último Registro</span>
                      <button style={btnAjustesStyle(ordenFecha !== 'ninguno')} onClick={() => toggleMenu('registro')} title="Ordenar por fecha">
                        <IconoAjustes />
                      </button>
                    </div>
                    {menuFiltroAbierto === 'registro' && (
                      <div ref={menuRef} style={getPopoverStyle('registro')}>
                        {[ 
                          { label: 'Sin orden', value: 'ninguno' },
                          { label: 'Más recientes primero', value: 'desc' },
                          { label: 'Más antiguos primero', value: 'asc' }
                        ].map(opcion => (
                          <button key={opcion.value} onClick={() => { setOrdenFecha(opcion.value); setCurrentPage(1); setMenuFiltroAbierto(null); }} style={btnOpcionStyle(ordenFecha === opcion.value)} onMouseEnter={(e) => { if (ordenFecha !== opcion.value) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }} onMouseLeave={(e) => { if (ordenFecha !== opcion.value) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            {opcion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstudiantes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No se encontraron estudiantes que coincidan con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  currentEstudiantes.map((est, index) => (
                    <tr 
                      key={est.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}
                    >
                      <td data-label="Nombre del Estudiante" style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {est.nombre}
                      </td>
                      <td data-label="Correo Electrónico" style={{ padding: '15px', color: 'var(--text-main)' }}>
                        {est.email}
                      </td>
                      <td data-label="Materias" style={{ padding: '15px' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {est.clasesInscritas.length} materia{est.clasesInscritas.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td data-label="Último Registro" style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(getDateVal(est.clasesInscritas)).toLocaleDateString()}
                      </td>
                      <td data-label="Acciones" style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => setModalGestionEstudiante(est)}
                          title="Gestionar materias"
                          style={{
                            padding: '8px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'var(--bg-input, #f3f4f6)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#3b82f6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-input, #f3f4f6)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        >
                          <IconoConfig />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <ControlesPaginacion />
      </div>

      {/* MODAL DE GESTIÓN DE MATERIAS DEL ESTUDIANTE (ESTILO TABLA LIMPIA) */}
      {modalGestionEstudiante && (
        <Modal 
          isOpen={true} 
          onClose={() => setModalGestionEstudiante(null)} 
          title={`Materias de ${modalGestionEstudiante.nombre}`}
        >
          <div> 
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card, #fff)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-input, #f9fafb)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '12px 15px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Materia Actual</th>
                    <th style={{ padding: '12px 15px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Reasignar a...</th>
                    <th style={{ padding: '12px 15px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {modalGestionEstudiante.clasesInscritas.map((ci, idx) => (
                    <tr 
                      key={ci.claseId} 
                      style={{ 
                        borderBottom: idx === modalGestionEstudiante.clasesInscritas.length - 1 ? 'none' : '1px solid var(--border-color)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Columna: Materia actual e información */}
                      <td style={{ padding: '12px 15px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {ci.claseNombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Inscrito el: {ci.fecha_inscripcion ? ci.fecha_inscripcion.split(' ')[0] : 'N/A'}
                        </div>
                      </td>

                      {/* Columna: Select para reasignar */}
                      <td style={{ padding: '12px 15px', verticalAlign: 'middle' }}>
                        <select
                          value={ci.claseId}
                          onChange={(e) => handleCambiarCurso(modalGestionEstudiante, ci.claseId, e.target.value)}
                          style={{
                            width: '100%',
                            minWidth: '150px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-card, #fff)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        >
                          {clases.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </td>

                      {/* Columna: Botón de desmatricular */}
                      <td style={{ padding: '12px 15px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button
                          onClick={() => solicitarEliminacionEstudiante(modalGestionEstudiante.id, modalGestionEstudiante.nombre, ci.claseId, ci.claseNombre)}
                          title="Desmatricular de la materia"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                        >
                          <IconoTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={cancelarEliminacion} 
        title="Confirmar eliminación"
      >
        <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '20px' }}>
          ¿Estás seguro de que deseas eliminar al estudiante <strong>{estudianteAEliminar?.nombre}</strong> de la materia <strong>{estudianteAEliminar?.claseNombre}</strong>?
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            onClick={cancelarEliminacion}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancelar
          </button>
          
          <button 
            onClick={confirmarEliminacion}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Sí, desmatricular
          </button>
        </div>
      </Modal>

      {/* ESTILOS DE ANIMACIÓN SPIN */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}