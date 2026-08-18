import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../components/Gestion_Datos/DataContext';
import { IconoEscudo, IconoDocente, IconoUsuario } from './iconos';

export default function SelectorRol() {
  const { usuario, setUsuario } = useData();
  const [expandido, setExpandido] = useState(false);
  const location = useLocation();

  // Si no hay usuario, no mostramos el simulador
  if (!usuario) return null;

  // 🛡️ VALIDACIÓN DE SEGURIDAD 
  // Verificamos si es Administrador o si ya se puso un disfraz pero su rol real (rolOriginal) es Administrador
  const esAdministrador = usuario.rol === 'Administrador' || usuario.rolOriginal === 'Administrador';

  // Si entra un Estudiante o Docente real, el componente muere aquí y no ven el botón
  if (!esAdministrador) return null;

  const cambiarRol = (nuevoRol) => {
    // 1. Creamos el nuevo objeto de usuario
    const usuarioActualizado = {
      ...usuario,
      rol: nuevoRol,
      // 🆕 Guardamos tu rol verdadero en secreto para que el botón no desaparezca
      rolOriginal: usuario.rolOriginal || usuario.rol
    };

    // 2. Actualizamos el estado global (esto debería refrescar Grupos.jsx sin recargar)
    if (typeof setUsuario === 'function') {
      setUsuario(usuarioActualizado);
    }

    // 3. Actualizamos el localStorage para que el cambio persista
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

    console.log(`Simulando rol: ${nuevoRol}`);
    
    // Ocultar el menú tras seleccionar
    setExpandido(false);
  };

  // Rutas que sabemos que tienen el botón de "Guía Rápida" en la esquina inferior izquierda
  const rutasConGuia = ['/archivos', '/historial', '/grupos', '/calculadora'];
  const tieneGuia = rutasConGuia.some(ruta => location.pathname.startsWith(ruta));
  const bottomPosition = tieneGuia ? '90px' : '20px';

  return (
    <div
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: 999999,
        background: 'var(--bg-card)', // Ajustado para modo oscuro
        padding: expandido ? '12px' : '8px 16px',
        borderRadius: expandido ? '10px' : '30px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        border: '2px solid var(--accent-color)',
        display: 'flex',
        flexDirection: expandido ? 'column' : 'row',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        opacity: expandido ? 1 : 0.6
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
          {usuario.rol === 'Administrador' && <IconoEscudo />}
          {usuario.rol === 'Docente' && <IconoDocente />}
          {(usuario.rol === 'Estudiante' || usuario.rol === 'Usuario') && <IconoUsuario />}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', transition: 'all 0.3s' }}>
          {expandido ? `VISTA DE: ${usuario.rol}` : usuario.rol}
        </span>
      </div>

      {expandido && (
        <div style={{ display: 'flex', gap: '5px', animation: 'fadeIn 0.3s forwards' }}>
          <button
            onClick={() => cambiarRol('Administrador')}
            style={{
              background: usuario.rol === 'Administrador' ? 'var(--accent-color)' : 'var(--bg-input)',
              color: usuario.rol === 'Administrador' ? 'white' : 'var(--text-main)',
              border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            <IconoEscudo /> Admin
          </button>

          <button
            onClick={() => cambiarRol('Docente')}
            style={{
              background: usuario.rol === 'Docente' ? 'var(--primary-color)' : 'var(--bg-input)',
              color: usuario.rol === 'Docente' ? 'white' : 'var(--text-main)',
              border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            <IconoDocente /> Docente
          </button>

          <button
            onClick={() => cambiarRol('Estudiante')}
            style={{
              background: usuario.rol === 'Estudiante' ? '#10b981' : 'var(--bg-input)',
              color: usuario.rol === 'Estudiante' ? 'white' : 'var(--text-main)',
              border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            <IconoUsuario /> Usuario
          </button>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}