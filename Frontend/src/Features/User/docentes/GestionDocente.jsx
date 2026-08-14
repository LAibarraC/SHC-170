import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { alerta } from '../../../utils/Notificaciones';
import Modal from '../../../utils/Modal'; 

// Importaciones para el tour interactivo
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function GestionDocente({ usuario }) {
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargandoClases, setCargandoClases] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  // Estados para el Modal de confirmación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estudianteAEliminar, setEstudianteAEliminar] = useState(null);

  // --- ESTADOS PARA BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Cantidad de estudiantes por página

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
        element: '#tour-gestion-selector',
        popover: {
          title: 'Selector de Curso',
          description: 'Despliega este menú y elige uno de tus cursos asignados para cargar su respectiva lista de estudiantes.',
          side: "bottom",
          align: 'center'
        }
      }
    ];

    if (document.querySelector('#tour-gestion-buscador')) {
      tourSteps.push({
        element: '#tour-gestion-buscador',
        popover: {
          title: 'Buscador Rápido',
          description: 'Si tienes muchos alumnos, escribe aquí su nombre o correo electrónico para encontrarlo instantáneamente.',
          side: "bottom",
          align: 'start'
        }
      });
    }

    if (document.querySelector('#tour-gestion-tabla')) {
      tourSteps.push({
        element: '#tour-gestion-tabla',
        popover: {
          title: 'Registro de Estudiantes',
          description: 'Esta tabla te muestra los datos de los alumnos y la fecha exacta en la que se inscribieron a tu clase.',
          side: "top",
          align: 'start'
        }
      });
    }

    if (document.querySelector('.tour-gestion-eliminar')) {
      tourSteps.push({
        element: '.tour-gestion-eliminar',
        popover: {
          title: 'Desmatricular Alumno',
          description: 'Haciendo clic aquí podrás remover a un estudiante del curso. Se te pedirá confirmación antes de aplicar los cambios.',
          side: "left",
          align: 'center'
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
      cargarClases();
    }
  }, [usuario]);

  const cargarClases = async () => {
    try {
      setCargandoClases(true);
      const data = await api.obtenerClasesDocente();
      setClases(data);
      if (data.length > 0) {
        // Seleccionamos la primera clase por defecto
        setClaseSeleccionada(data[0].id);
        cargarEstudiantes(data[0].id);
      }
    } catch (error) {
      alerta.error("Error", error.message || "No se pudieron cargar los cursos");
    } finally {
      setCargandoClases(false);
    }
  };

  const cargarEstudiantes = async (claseId) => {
    if (!claseId) {
      setEstudiantes([]);
      return;
    }
    try {
      setCargandoEstudiantes(true);
      const data = await api.obtenerEstudiantesClase(claseId, usuario.email);
      setEstudiantes(data);
    } catch (error) {
      alerta.error("Error", error.message || "No se pudieron cargar los estudiantes");
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  const handleSeleccionarClase = (e) => {
    const id = e.target.value;
    setClaseSeleccionada(id);
    setSearchTerm(""); // Limpiar búsqueda al cambiar de clase
    setCurrentPage(1); // Reiniciar paginación al cambiar de clase
    cargarEstudiantes(id);
  };

  // --- LÓGICA DE BÚSQUEDA Y PAGINACIÓN ---
  // Filtramos la lista de estudiantes
  const filteredEstudiantes = estudiantes.filter((est) => {
    const nombreMatch = est.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = est.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return nombreMatch || emailMatch;
  });

  // Cálculos para la paginación
  const totalPages = Math.ceil(filteredEstudiantes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEstudiantes = filteredEstudiantes.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Volver a la página 1 al buscar
  };

  // Efecto para evitar quedarse en una página vacía si se elimina el último elemento
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredEstudiantes.length, currentPage, totalPages]);


  // Prepara el estado y abre el modal
  const solicitarEliminacionEstudiante = (estudianteId, estudianteNombre) => {
    setEstudianteAEliminar({ id: estudianteId, nombre: estudianteNombre });
    setIsModalOpen(true);
  };

  // Ejecuta la eliminación tras confirmar en el modal
  const confirmarEliminacion = async () => {
    if (!estudianteAEliminar) return;

    try {
      await api.desmatricularEstudiante(claseSeleccionada, estudianteAEliminar.id, usuario.email);
      alerta.exito("Estudiante eliminado", "El alumno ha sido removido del curso correctamente.");
      // Recargar lista
      cargarEstudiantes(claseSeleccionada);
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo desmatricular al estudiante");
    } finally {
      // Cerrar modal y limpiar estado
      setIsModalOpen(false);
      setEstudianteAEliminar(null);
    }
  };

  const cancelarEliminacion = () => {
    setIsModalOpen(false);
    setEstudianteAEliminar(null);
  };

  // --- COMPONENTE REUTILIZABLE DE PAGINACIÓN ---
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
        <div>
          <h2 id="tour-gestion-titulo" style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', margin: '0 0 5px 0', color: 'var(--text-main)' }}>
            Gestión de Alumnos
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
            Selecciona un grupo para visualizar y administrar la lista de estudiantes inscritos.
          </p>
        </div>

        {/* Contenedor de Botón Tour y Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          
          {/* Botón de Guía Rápida */}
          <button
            onClick={iniciarTour}
            className="guia-rapida-flotante"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="guia-rapida-flotante-texto">Guía Rápida</span>
          </button>

          {/* Selector de Curso */}
          <div id="tour-gestion-selector" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Curso:
            </label>
            {cargandoClases ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando cursos...</span>
            ) : clases.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tienes cursos asignados</span>
            ) : (
              <select
                value={claseSeleccionada}
                onChange={handleSeleccionarClase}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {clases.map((c) => (
                  <option 
                    key={c.id} 
                    value={c.id} 
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}
                  >
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div 
        className="grafico-card" 
        style={{ 
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
          backgroundColor: 'var(--bg-card)', 
          padding: '25px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {!claseSeleccionada ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Por favor, crea o inscríbete en un curso para comenzar a gestionar alumnos.
          </div>
        ) : cargandoEstudiantes ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Cargando estudiantes...</p>
          </div>
        ) : estudiantes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No hay estudiantes inscritos en este curso todavía.
          </div>
        ) : (
          <>
            {/* BUSCADOR */}
            <div id="tour-gestion-buscador" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Buscar estudiante por nombre o correo..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", outline: "none", fontSize: "0.95rem" }}
              />
            </div>

            {/* TABLA DE ESTUDIANTES */}
            {filteredEstudiantes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No se encontraron estudiantes que coincidan con "{searchTerm}".
              </div>
            ) : (
              <div id="tour-gestion-tabla" style={{ overflowX: 'auto' }}>
                <table className="tabla-responsive" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Nombre del Estudiante</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Correo Electrónico</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>Fecha de Inscripción</th>
                      <th style={{ padding: '12px 15px', fontWeight: 'bold', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEstudiantes.map((est, index) => (
                      <tr 
                        key={est.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td data-label="Nombre del Estudiante" style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          <div style={{ textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{est.nombre}</div>
                        </td>
                        <td data-label="Correo Electrónico" style={{ padding: '15px', color: 'var(--text-main)' }}>
                          <div style={{ textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{est.email}</div>
                        </td>
                        <td data-label="Fecha de Inscripción" style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {est.fecha_creacion ? est.fecha_creacion.split(' ')[0] : 'N/A'}
                        </td>
                        <td data-label="Acciones" style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            className="tour-gestion-eliminar"
                            onClick={() => solicitarEliminacionEstudiante(est.id, est.nombre)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ef4444',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            Eliminar estudiante
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* PAGINACIÓN */}
            <ControlesPaginacion />
          </>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={cancelarEliminacion} 
        title="Confirmar eliminación"
      >
        <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '20px' }}>
          ¿Estás seguro de que deseas eliminar al estudiante <strong>{estudianteAEliminar?.nombre}</strong> de este curso?
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
            Sí, eliminar
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