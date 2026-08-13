import React, { useEffect, useState } from "react";
import { useData } from "../../components/Gestion_Datos/DataContext";
import { api } from "../../services/api";
import { alerta } from "../../utils/Notificaciones";
import Skeleton from "../../ui/Skeleton";

import { useNavigate } from "react-router-dom";
import "../../styles/pages/Historial.css";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import escudoAdmin from "../../assets/images/escudoAdmin.png";

import Modal from "../../utils/Modal";

export default function Historial() {
  const { usuario } = useData();
  const navigate = useNavigate();

  // Estados para el historial
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el Modal de confirmación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);

  const iniciarTour = () => {
    const tourSteps = [
      {
        element: '#tour-historial-titulo',
        popover: {
          title: 'Historial de Cálculos',
          description: '¡Bienvenido! Aquí se guardan de forma permanente y segura tus trabajos anteriores para que no pierdas tu progreso.',
          side: "bottom",
          align: 'start'
        }
      }
    ];

    if (document.querySelector('#tour-historial-tabla')) {
      tourSteps.push({
        element: '#tour-historial-tabla',
        popover: {
          title: 'Listado de Trabajos',
          description: 'Aquí verás el registro detallado con fecha, hora, el tipo de análisis y el archivo Excel de origen para cada cálculo guardado.',
          side: "top",
          align: 'start'
        }
      });
    }

    if (document.querySelector('.tour-tipo-calculo')) {
      tourSteps.push({
        element: '.tour-tipo-calculo',
        popover: {
          title: 'Operación Realizada',
          description: 'Indica el tema estadístico del análisis guardado (como Regresión Simple, Distribución de Frecuencias, etc.).',
          side: "right",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-archivo-origen')) {
      tourSteps.push({
        element: '.tour-archivo-origen',
        popover: {
          title: 'Base de Datos de Origen',
          description: 'Identifica cuál libro de Excel contiene los datos que procesaste.',
          side: "right",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-btn-reabrir')) {
      tourSteps.push({
        element: '.tour-btn-reabrir',
        popover: {
          title: 'Restauración Completa',
          description: 'Haz clic en "Reabrir" para restaurar la sesión completa en la Calculadora. Se cargarán todos los parámetros de configuración y los datos modificados tal como los dejaste.',
          side: "left",
          align: 'center'
        }
      });
    }

    if (document.querySelector('.tour-btn-eliminar')) {
      tourSteps.push({
        element: '.tour-btn-eliminar',
        popover: {
          title: 'Eliminar Registro',
          description: 'Si ya no necesitas este cálculo, haz clic en "Eliminar" para borrarlo de forma permanente del sistema.',
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

  const cargarHistorial = async () => {
    if (!usuario) return;
    try {
      // Retraso artificial de 2 segundos para ver el Skeleton (¡Bórralo luego!)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await api.obtenerHistorial(usuario.nombre);
      setRegistros(data.historial || []);
    } catch (error) {
      alerta.error("Error", "No se pudo cargar el historial.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [usuario]);

  // Funciones para manejar el Modal
  const solicitarEliminacion = (id) => {
    setRegistroAEliminar(id);
    setIsModalOpen(true);
  };

  const cancelarEliminacion = () => {
    setIsModalOpen(false);
    setRegistroAEliminar(null);
  };

  const confirmarEliminacion = async () => {
    if (!registroAEliminar) return;
    try {
      await api.eliminarHistorial(registroAEliminar, usuario.nombre);
      // Filtramos el registro eliminado de la pantalla al instante
      setRegistros(registros.filter((reg) => reg.id !== registroAEliminar));
      alerta.exito("Eliminado", "El registro ha sido borrado de tu historial.");
    } catch (error) {
      alerta.error("Error", "No se pudo eliminar el registro.");
    } finally {
      setIsModalOpen(false);
      setRegistroAEliminar(null);
    }
  };

  return (
    <div className="page-container">
      {/* Marca de agua de fondo */}
      <div 
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "450px",
          height: "450px",
          backgroundImage: `url(${escudoAdmin})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.04,
          zIndex: 0,
          pointerEvents: "none"
        }}
      />
      <div className="historial-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 className="historial-titulo" id="tour-historial-titulo">Historial de Cálculos</h2>
          <p className="historial-usuario" style={{ margin: 0 }}>
            Bienvenido, <strong>{usuario?.nombre}</strong>.
          </p>
        </div>
        <button
          onClick={iniciarTour}
          className="guia-rapida-flotante"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="guia-rapida-flotante-texto">Guía Rápida</span>
        </button>
      </div>

      {cargando ? (
        <div className="historial-container">
          <table className="historial-tabla">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo de Cálculo</th>
                <th>Archivo Fuente</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map(i => (
                <tr key={i} className="historial-fila" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="historial-celda">
                    <div className="fecha-col">
                      <Skeleton height="18px" width="100px" style={{ marginBottom: '5px' }} />
                      <Skeleton height="12px" width="70px" />
                    </div>
                  </td>
                  <td className="historial-celda">
                    <Skeleton height="24px" width="180px" borderRadius="12px" />
                  </td>
                  <td className="historial-celda">
                    <Skeleton height="16px" width="120px" />
                  </td>
                  <td className="historial-celda">
                    <div className="acciones-container" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <Skeleton height="32px" width="80px" borderRadius="6px" />
                      <Skeleton height="32px" width="80px" borderRadius="6px" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : registros.length === 0 ? (
        <div className="container_reader_archivo">
          <p>No tienes cálculos guardados todavía.</p>
        </div>
      ) : (
        <div className="historial-container" id="tour-historial-tabla">
          <table className="historial-tabla">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo de Cálculo</th>
                <th>Archivo Fuente</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg) => (
                <tr key={reg.id} className="historial-fila">
                  <td className="historial-celda" data-label="Fecha / Hora">
                    <div className="fecha-col">
                      <strong>{reg.fecha}</strong>
                      <small className="text-muted">{reg.hora}</small>
                    </div>
                  </td>
                  <td className="historial-celda" data-label="Tipo de Cálculo">
                    <span className="tipo-calculo tour-tipo-calculo">
                      {reg.calculo.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="historial-celda" data-label="Archivo Fuente">
                    <span className="archivo-origen tour-archivo-origen">{reg.archivo_origen}</span>
                  </td>

                  <td className="historial-celda" data-label="Acciones">
                    <div className="acciones-container" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button
                        className="btn-reabrir tour-btn-reabrir"
                        onClick={() => {
                          // 1. Buscamos los datos donde sea que estén guardados (versión nueva o vieja)
                          const datosBrutos =
                            reg.snapshot || reg.resultados_json;

                          // 2. Nos aseguramos de que sea un objeto real y no un string
                          const snapshotListo =
                            typeof datosBrutos === "string"
                              ? JSON.parse(datosBrutos)
                              : datosBrutos;

                          // 3. Ahora sí enviamos la variable correcta "snapshotListo"
                          navigate("/calculadora", {
                            state: {
                              archivoReabrir: reg.archivo_origen,
                              calculoReabrir: reg.calculo,
                              snapshot: snapshotListo,
                            },
                          });
                        }}
                        title="Cargar este cálculo"
                      >
                        Reabrir
                      </button>

                      <button
                        className="btn-eliminar tour-btn-eliminar"
                        onClick={() => solicitarEliminacion(reg.id)}
                        title="Eliminar registro"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={cancelarEliminacion} 
        title="Confirmar eliminación"
      >
        <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '20px' }}>
          ¿Estás seguro de que deseas eliminar este cálculo de tu historial? Esta acción no se puede deshacer.
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
    </div>
  );
}