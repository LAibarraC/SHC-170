import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { alerta } from '../../utils/Notificaciones';
import { IconoBuscar, IconoEscudo, IconoAlerta } from '../../ui/iconos';
import Skeleton from '../../ui/Skeleton';
import ReportesEstadisticas from './ReportesEstadisticas';

// Importaciones para el Tour (Guía Rápida)
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Icono SVG de Ajustes/Filtro
const IconoAjustes = ({ width = 14, height = 14, style = {} }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={style}
  >
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

export default function Admin() {
  const [pestanaActiva, setPestanaActiva] = useState('usuarios'); // 'usuarios' | 'reportes'
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Estados para filtros por columna
  const [menuFiltroAbierto, setMenuFiltroAbierto] = useState(null); // 'rol', 'estado', 'registro'
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [ordenFecha, setOrdenFecha] = useState('ninguno'); // 'asc', 'desc', 'ninguno'

  const menuRef = useRef(null);

  // Modal de confirmación para eliminar
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [confirmarNombre, setConfirmarNombre] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuFiltroAbierto(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await api.obtenerUsuarios();
      setUsuarios(data);
    } catch (error) {
      alerta.error("Error", error.message || "No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  // --- FUNCIÓN DEL TOUR (GUÍA RÁPIDA) ---
  const iniciarTour = () => {
    const tourSteps = [
      {
        element: '#tour-admin-titulo',
        popover: {
          title: 'Panel de Administración',
          description: '¡Bienvenido! Desde aquí puedes gestionar a todos los usuarios, cambiar sus roles o suspender sus cuentas.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#tour-admin-buscador',
        popover: {
          title: 'Buscador de Usuarios',
          description: 'Usa esta barra para encontrar rápidamente a cualquier persona por su nombre o correo electrónico.',
          side: "bottom",
          align: 'center'
        }
      }
    ];

    if (document.querySelector('#tour-admin-tabla')) {
      tourSteps.push({
        element: '#tour-admin-tabla',
        popover: {
          title: 'Lista de Usuarios',
          description: 'Aquí se visualiza la información de los usuarios registrados, su estado actual y su fecha de registro.',
          side: "top",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-admin-rol')) {
      tourSteps.push({
        element: '.tour-admin-rol',
        popover: {
          title: 'Gestión de Roles',
          description: 'Despliega este menú para cambiar los privilegios de un usuario (Estudiante, Docente, etc.).',
          side: "left",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-admin-estado')) {
      tourSteps.push({
        element: '.tour-admin-estado',
        popover: {
          title: 'Activar / Suspender',
          description: 'Controla el acceso. Si suspendes a un usuario, este no podrá ingresar al sistema hasta que lo reactives.',
          side: "left",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-admin-eliminar')) {
      tourSteps.push({
        element: '.tour-admin-eliminar',
        popover: {
          title: 'Eliminar Registro',
          description: 'Usa este botón para borrar de manera permanente la cuenta de un usuario y todos sus datos asociados.',
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

  const handleCambiarRol = async (email, nuevoRol) => {
    try {
      await api.cambiarRol(email, nuevoRol);
      alerta.exito("Rol actualizado", `El rol de ${email} ha sido actualizado a ${nuevoRol}`);
      setUsuarios(prev => prev.map(u => u.email === email ? { ...u, rol: nuevoRol, perfil: nuevoRol } : u));
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo cambiar el rol");
    }
  };

  const handleCambiarEstado = async (email, activo) => {
    try {
      await api.cambiarEstado(email, activo);
      const accion = activo ? "activado" : "suspendido";
      alerta.exito(`Cuenta ${accion}`, `El usuario ${email} ha sido ${accion} con éxito`);
      setUsuarios(prev => prev.map(u => u.email === email ? { ...u, activo } : u));
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo cambiar el estado");
    }
  };

  const handleEliminarUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioAEliminar) return;

    if (confirmarNombre !== usuarioAEliminar.nombre) {
      alerta.error("Confirmación incorrecta", "El nombre ingresado no coincide con el del usuario.");
      return;
    }

    try {
      await api.eliminarUsuario(usuarioAEliminar.email);
      alerta.exito("Usuario eliminado", "La cuenta y todos los datos asociados han sido eliminados.");
      setUsuarios(prev => prev.filter(u => u.email !== usuarioAEliminar.email));
      setUsuarioAEliminar(null);
      setConfirmarNombre('');
    } catch (error) {
      alerta.error("Error", error.message || "No se pudo eliminar el usuario");
    }
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const usuariosFiltrados = usuarios
    .filter(u => {
      const coincideBusquedaGeneral = 
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase());

      const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;

      const coincideEstado = 
        filtroEstado === 'TODOS' || 
        (filtroEstado === 'ACTIVO' && u.activo) || 
        (filtroEstado === 'SUSPENDIDO' && !u.activo);

      return coincideBusquedaGeneral && coincideRol && coincideEstado;
    })
    .sort((a, b) => {
      if (ordenFecha === 'asc') {
        return new Date(a.fecha_creacion || 0) - new Date(b.fecha_creacion || 0);
      }
      if (ordenFecha === 'desc') {
        return new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0);
      }
      return 0;
    });

  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const usuariosPaginados = usuariosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [usuariosFiltrados.length, currentPage, totalPages]);

  const toggleMenu = (columna) => {
    setMenuFiltroAbierto(prev => (prev === columna ? null : columna));
  };

  const ControlesPaginacion = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "25px", paddingBottom: "10px" }}>
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
            fontSize: "0.9rem",
            transition: "all 0.2s"
          }}
        >
          Anterior
        </button>

        <span style={{ fontSize: "0.9rem", color: "var(--text-muted, #6b7280)", fontWeight: "bold" }}>
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
            fontSize: "0.9rem",
            transition: "all 0.2s"
          }}
        >
          Siguiente
        </button>
      </div>
    );
  };

  // Función para obtener estilos dinámicos del popover para que no se corte hacia los lados
  const getPopoverStyle = (columna) => ({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    // Si es una de las últimas columnas, alineamos el menú a la derecha para evitar corte horizontal
    left: columna === 'registro' || columna === 'estado' ? 'auto' : 0,
    right: columna === 'registro' || columna === 'estado' ? 0 : 'auto',
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

  return (
    <div style={{ maxWidth: '1100px', margin: 'clamp(15px, 4vw, 40px) auto', padding: '0 20px', position: 'relative' }}>

      {/* BOTÓN FLOTANTE DEL TOUR */}
      <button
        onClick={iniciarTour}
        className="guia-rapida-flotante"
        style={{
          bottom: '20px',
          zIndex: 10000
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="guia-rapida-flotante-texto">Guía Rápida</span>
      </button>

      {/* CABECERA */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(15px, 4vw, 25px)', flexWrap: 'wrap', gap: 'clamp(10px, 3vw, 20px)' }}>
        <div className="admin-title-container" id="tour-admin-titulo">
          <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Panel de Administración
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' }}>
            {pestanaActiva === 'usuarios' 
              ? 'Administra roles, suspende cuentas y elimina registros de forma centralizada.'
              : 'Visualiza métricas clave, gráficos de actividad y reportes generales del sistema.'}
          </p>
        </div>

        {/* Buscador (Solo en pestaña de usuarios) */}
        {pestanaActiva === 'usuarios' && (
          <div id="tour-admin-buscador" className="admin-search-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-card)', padding: '6px 15px', borderRadius: '30px', border: '1px solid var(--border-color)', minWidth: '280px', flex: '1', maxWidth: '380px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}><IconoBuscar width="18" height="18" /></span>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={handleBusqueda}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
        )}
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setPestanaActiva('usuarios')}
          style={{
            padding: '10px 18px',
            backgroundColor: pestanaActiva === 'usuarios' ? 'var(--accent-color)' : 'transparent',
            color: pestanaActiva === 'usuarios' ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Gestión de Usuarios
        </button>

        <button
          onClick={() => setPestanaActiva('reportes')}
          style={{
            padding: '10px 18px',
            backgroundColor: pestanaActiva === 'reportes' ? 'var(--accent-color)' : 'transparent',
            color: pestanaActiva === 'reportes' ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Reportes y Estadísticas
        </button>
      </div>

      {/* CONTENIDO SEGÚN LA PESTAÑA */}
      {pestanaActiva === 'reportes' ? (
        <ReportesEstadisticas />
      ) : (
        <>
          {/* CONTENIDO PRINCIPAL */}
          <div
            className="grafico-card"
        style={{
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          backgroundColor: 'var(--bg-card)',
          padding: '25px',
          border: '1px solid var(--border-color)'
        }}
      >
        {cargando ? (
          <div style={{ padding: '10px 0' }}>
            {/* Cabecera de tabla fantasma */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ flex: '1.5' }}><Skeleton height="15px" width="60%" /></div>
              <div style={{ flex: '1' }}><Skeleton height="15px" width="50%" /></div>
              <div style={{ flex: '1' }}><Skeleton height="15px" width="50%" /></div>
              <div style={{ flex: '1' }}><Skeleton height="15px" width="60%" /></div>
              <div style={{ flex: '1.5' }}><Skeleton height="15px" width="70%" /></div>
            </div>

            {/* 5 filas de datos fantasma */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton height="18px" width="80%" />
                  <Skeleton height="14px" width="50%" />
                </div>
                <div style={{ flex: '1' }}>
                  <Skeleton height="32px" width="90%" borderRadius="6px" />
                </div>
                <div style={{ flex: '1' }}>
                  <Skeleton height="24px" width="70%" borderRadius="12px" />
                </div>
                <div style={{ flex: '1' }}>
                  <Skeleton height="14px" width="50%" />
                </div>
                <div style={{ flex: '1.5', display: 'flex', gap: '10px' }}>
                  <Skeleton height="30px" width="45%" borderRadius="6px" />
                  <Skeleton height="30px" width="45%" borderRadius="6px" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            style={{ 
              overflowX: 'auto', 
              // Esto asegura que haya espacio hacia abajo para el menú sin cortarse
              paddingBottom: menuFiltroAbierto ? '160px' : '10px',
              transition: 'padding-bottom 0.3s ease'
            }} 
            id="tour-admin-tabla"
          >
            <table className="tabla-responsive tabla-responsiva-panel" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  
                  {/* COLUMNA: NOMBRE / CORREO */}
                  <th style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                    Nombre / Correo
                  </th>

                  {/* COLUMNA: ROL */}
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Rol</span>
                      <button 
                        style={btnAjustesStyle(filtroRol !== 'TODOS')} 
                        onClick={() => toggleMenu('rol')} 
                        title="Filtrar por rol"
                      >
                        <IconoAjustes />
                      </button>
                    </div>

                    {menuFiltroAbierto === 'rol' && (
                      <div ref={menuRef} style={getPopoverStyle('rol')}>
                        {[
                          { label: 'Todos', value: 'TODOS' },
                          { label: 'Estudiante', value: 'Estudiante' },
                          { label: 'Docente', value: 'Docente' },
                          { label: 'Administrador', value: 'Administrador' }
                        ].map(opcion => (
                          <button
                            key={opcion.value}
                            onClick={() => {
                              setFiltroRol(opcion.value);
                              setCurrentPage(1);
                              setMenuFiltroAbierto(null);
                            }}
                            style={btnOpcionStyle(filtroRol === opcion.value)}
                            onMouseEnter={(e) => {
                              if (filtroRol !== opcion.value) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              if (filtroRol !== opcion.value) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {opcion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>

                  {/* COLUMNA: ESTADO */}
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Estado</span>
                      <button 
                        style={btnAjustesStyle(filtroEstado !== 'TODOS')} 
                        onClick={() => toggleMenu('estado')} 
                        title="Filtrar por estado"
                      >
                        <IconoAjustes />
                      </button>
                    </div>

                    {menuFiltroAbierto === 'estado' && (
                      <div ref={menuRef} style={getPopoverStyle('estado')}>
                        {[
                          { label: 'Todos', value: 'TODOS' },
                          { label: 'Activos', value: 'ACTIVO' },
                          { label: 'Suspendidos', value: 'SUSPENDIDO' }
                        ].map(opcion => (
                          <button
                            key={opcion.value}
                            onClick={() => {
                              setFiltroEstado(opcion.value);
                              setCurrentPage(1);
                              setMenuFiltroAbierto(null);
                            }}
                            style={btnOpcionStyle(filtroEstado === opcion.value)}
                            onMouseEnter={(e) => {
                              if (filtroEstado !== opcion.value) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              if (filtroEstado !== opcion.value) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {opcion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>

                  {/* COLUMNA: REGISTRO */}
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Registro</span>
                      <button 
                        style={btnAjustesStyle(ordenFecha !== 'ninguno')} 
                        onClick={() => toggleMenu('registro')} 
                        title="Ordenar por fecha"
                      >
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
                          <button
                            key={opcion.value}
                            onClick={() => {
                              setOrdenFecha(opcion.value);
                              setCurrentPage(1);
                              setMenuFiltroAbierto(null);
                            }}
                            style={btnOpcionStyle(ordenFecha === opcion.value)}
                            onMouseEnter={(e) => {
                              if (ordenFecha !== opcion.value) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              if (ordenFecha !== opcion.value) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {opcion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>

                  {/* COLUMNA: ACCIONES */}
                  <th style={{ padding: '12px 15px', fontWeight: 'bold', textAlign: 'center' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No se encontraron usuarios registrados con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((u, index) => (
                    <tr
                      key={u.email}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}
                    >
                      <td data-label="Nombre / Correo" style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{u.nombre}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </td>
                      <td data-label="Rol" style={{ padding: '15px' }}>
                        <select
                          className="tour-admin-rol"
                          value={u.rol}
                          onChange={(e) => handleCambiarRol(u.email, e.target.value)}
                          disabled={u.rol === "Administrador"}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: u.rol === 'Administrador' ? 'rgba(239, 68, 68, 0.1)' : (u.rol === 'Docente' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                            color: u.rol === 'Administrador' ? '#ef4444' : (u.rol === 'Docente' ? '#10b981' : '#3b82f6'),
                            fontWeight: 'bold',
                            cursor: u.rol === 'Administrador' ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="Estudiante" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}>Estudiante</option>
                          <option value="Docente" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}>Docente</option>
                          <option value="Administrador" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }}>Administrador</option>
                        </select>
                      </td>
                      <td data-label="Estado" style={{ padding: '15px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: u.activo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: u.activo ? '#10b981' : '#ef4444'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.activo ? '#10b981' : '#ef4444' }}></span>
                          {u.activo ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td data-label="Registro" style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {u.fecha_creacion ? u.fecha_creacion.split(' ')[0] : 'N/A'}
                      </td>
                      <td data-label="Acciones" style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {u.rol !== 'Administrador' ? (
                            <>
                              <button
                                className="tour-admin-estado"
                                onClick={() => handleCambiarEstado(u.email, !u.activo)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid ' + (u.activo ? '#f59e0b' : '#10b981'),
                                  background: 'transparent',
                                  color: u.activo ? '#f59e0b' : '#10b981',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = u.activo ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {u.activo ? 'Suspender' : 'Activar'}
                              </button>
                              <button
                                className="tour-admin-eliminar"
                                onClick={() => setUsuarioAEliminar(u)}
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
                                Eliminar
                              </button>
                            </>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              Protegido <IconoEscudo width="14" height="14" style={{ color: '#10b981' }} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ControlesPaginacion />
    </>
  )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {usuarioAEliminar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000, backdropFilter: 'blur(3px)' }}>
          <div
            className="grafico-card"
            style={{
              width: '95%',
              maxWidth: '500px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconoAlerta width="24" height="24" /> Confirmar Eliminación Permanente
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '20px' }}>
              Estás a punto de eliminar al usuario <strong>{usuarioAEliminar.nombre}</strong> ({usuarioAEliminar.email}). Esto borrará permanentemente su cuenta, archivos, historial de cálculos e inscripciones. Esta acción no se puede deshacer.
            </p>

            <form onSubmit={handleEliminarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Escribe el nombre del usuario para confirmar (<strong>{usuarioAEliminar.nombre}</strong>):
                </label>
                <input
                  type="text"
                  value={confirmarNombre}
                  onChange={(e) => setConfirmarNombre(e.target.value)}
                  placeholder="Escribe el nombre exacto"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setUsuarioAEliminar(null);
                    setConfirmarNombre('');
                  }}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Confirmar Borrado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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