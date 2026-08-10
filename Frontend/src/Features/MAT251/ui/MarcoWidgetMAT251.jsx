import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconoGrafico, IconoMostrar, IconoOcultar, IconoMaximizar, IconoRestaurar } from '../../../ui/iconos';

const IconoMover = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style={{ cursor: 'grab', opacity: 0.6 }}>
    <path d="M7 2a2 2 0 1 0 .001 4.001 A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001 A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001 A2 2 0 0 0 7 14zm6-12a2 2 0 1 0 .001 4.001 A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001 A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001 A2 2 0 0 0 13 14z" />
  </svg>
);

const IconoArbol = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="2" fill="currentColor" />
    <circle cx="19" cy="6" r="2" fill="currentColor" />
    <circle cx="19" cy="18" r="2" fill="currentColor" />
    <path d="M7 11.5l10-5" />
    <path d="M7 12.5l10 5" />
  </svg>
);

export default function MarcoWidgetMAT251({ id, titulo, children, anchoCompleto = false, ancho, alto }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [zoom, setZoom] = useState(1);

  const containerRefNormal = useRef(null);
  const containerRefMax = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startScroll, setStartScroll] = useState({ left: 0, top: 0 });

  const handlePointerDown = (e, ref) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    if (ref.current) {
      setStartScroll({ left: ref.current.scrollLeft, top: ref.current.scrollTop });
    }
  };

  const handlePointerMove = (e, ref) => {
    if (!isPanning || zoom <= 1) return;
    e.preventDefault();
    if (ref.current) {
      ref.current.scrollLeft = startScroll.left - (e.clientX - startPos.x);
      ref.current.scrollTop = startScroll.top - (e.clientY - startPos.y);
    }
  };

  const handlePointerUp = () => setIsPanning(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isMaximized });

  // 1. Estilo para la caja normal (atrapada en la grilla)
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    gridColumn: anchoCompleto ? "1 / -1" : "auto",
    zIndex: isDragging ? 999 : 1,
    width: anchoCompleto ? "100%" : (ancho ? ancho : undefined),
    height: alto ? alto : undefined,
    position: "relative",
    minWidth: 0,
    minHeight: 0,
    maxWidth: '100%',
  };

  const childrenConProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { isMaximized });
    }
    return child;
  });

  return (
    <>
      {/* ========================================================== */}
      {/* 📦 VISTA NORMAL: LA CAJA ATRAPADA EN LA CUADRÍCULA           */}
      {/* ========================================================== */}
      <div ref={setNodeRef} id={id} style={style} className={`widget-grafico pdf-section ${isMinimized ? 'minimizada' : ''}`}>
        <div className="widget-header">

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              {...attributes}
              {...listeners}
              style={{ display: 'flex', alignItems: 'center', cursor: 'grab', touchAction: 'none', padding: '4px' }}
              title="Arrastrar gráfico"
            >
              <IconoMover />
            </div>
            <h4 className="widget-titulo" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <IconoArbol /> {titulo}
            </h4>
          </div>

          <div className="widget-controles">
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input, transparent)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <button className="widget-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Alejar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', minWidth: '38px', color: 'var(--text-main)', userSelect: 'none', height: '24px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                    {Math.round(zoom * 100)}%
                </div>
                <button className="widget-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Acercar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            
            <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

            <button className="widget-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Mostrar" : "Ocultar"} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMinimized ? <IconoMostrar /> : <IconoOcultar />}
            </button>
            <button className="widget-btn" onClick={() => { setIsMaximized(true); setIsMinimized(false); setZoom(1); }} title="Maximizar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconoMaximizar />
            </button>
          </div>
        </div>

        <div className={`widget-body ${isMinimized ? 'oculto' : ''}`} style={{ flex: 1, position: 'relative', minHeight: '300px', padding: 0 }}>
          {/* Si está maximizado, dejamos la caja vacía para que no se renderice dos veces el gráfico pesado */}
          {!isMaximized && (
            <div 
              ref={containerRefNormal}
              className="contenedor-grafico-interno thin-scrollbar" 
              style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, overflow: zoom > 1 ? 'auto' : 'hidden', cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              onPointerDown={(e) => handlePointerDown(e, containerRefNormal)}
              onPointerMove={(e) => handlePointerMove(e, containerRefNormal)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: '100%', minHeight: '100%', transition: 'width 0.3s, height 0.3s' }}>
                {childrenConProps}
              </div>
            </div>
          )}
          {isMaximized && (
            <div style={{ display: 'flex', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', color: '#999', fontStyle: 'italic' }}>
              Gráfico en vista detallada...
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🚀 VISTA MAXIMIZADA: EL MODAL PANTALLA COMPLETA              */}
      {/* ========================================================== */}
      {isMaximized && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)', // Fondo oscuro elegante
            zIndex: 999999, // Supera cualquier navbar o barra lateral
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '30px'
          }}
          onClick={() => setIsMaximized(false)} // Clic afuera cierra el gráfico
        >
          {/* La Tarjeta Blanca Gigante */}
          <div
            className="widget-grafico"
            style={{
              width: '90%',
              height: '90%',
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} // Evita que se cierre si haces clic dentro del gráfico
          >
            {/* Header del Modal */}
            <div className="widget-header" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconoArbol /> {titulo}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input, transparent)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button className="widget-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Alejar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: 0, cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', minWidth: '45px', color: 'var(--text-main)', userSelect: 'none', height: '30px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                      {Math.round(zoom * 100)}%
                  </div>
                  <button className="widget-btn" onClick={() => setZoom(z => Math.min(4, z + 0.25))} title="Acercar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: 0, cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
                <button
                  onClick={() => { setIsMaximized(false); setZoom(1); }}
                  style={{
                    background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px',
                    padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
                  }}
                >
                  <IconoRestaurar /> Cerrar
                </button>
              </div>
            </div>

            {/* Cuerpo Gigante del Gráfico */}
            <div 
              ref={containerRefMax}
              className="thin-scrollbar"
              style={{ flex: 1, position: 'relative', padding: '20px', overflow: zoom > 1 ? 'auto' : 'hidden', cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              onPointerDown={(e) => handlePointerDown(e, containerRefMax)}
              onPointerMove={(e) => handlePointerMove(e, containerRefMax)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: '100%', minHeight: '100%', transition: 'width 0.3s, height 0.3s' }}>
                {childrenConProps}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
