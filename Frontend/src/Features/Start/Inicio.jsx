import { useState, useEffect, useRef, useCallback } from "react";
import escudoAdmin from "../../assets/images/Logo-Adm.png";
import imagenInicio1 from "../../assets/images/imagen de inicio 1.jpg";
import imagenInicio2 from "../../assets/images/imagen de inicio 2.jpg";
import "../../styles/ui/Inicio.css";

// Importamos iconos modernos de Lucide (Se quitó ChevronUp)
import {
  BarChart3, LineChart, Briefcase,
  ShieldCheck, Smartphone, Zap, QrCode,
  FileText, History, ChevronDown
} from "lucide-react";

const INTERVALO_MS = 4000;

export default function Inicio() {
  const imagenes = [escudoAdmin, imagenInicio1, imagenInicio2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("next");
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const touchStartX = useRef(null);

  const [showFloating, setShowFloating] = useState(false);

  // IDs de las secciones principales unificando introducción y módulos
  const secciones = ['modulos', 'caracteristicas', 'equipo'];

  const goTo = useCallback((index, dir) => {
    setDirection(dir);
    setCurrentIndex(index);
    setProgressKey((k) => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      setDirection("next");
      return prev === imagenes.length - 1 ? 0 : prev + 1;
    });
    setProgressKey((k) => k + 1);
  }, [imagenes.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      setDirection("prev");
      return prev === 0 ? imagenes.length - 1 : prev - 1;
    });
    setProgressKey((k) => k + 1);
  }, [imagenes.length]);

  useEffect(() => {
    if (isPaused) return;
    const intervalo = setInterval(nextSlide, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [isPaused, nextSlide, progressKey]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      delta > 0 ? prevSlide() : nextSlide();
    }
    touchStartX.current = null;
  };

  // Avanza por las secciones y vuelve al inicio cuando llega a la última.
  const goToNextSection = () => {
    const currentScroll = window.scrollY;
    const headerOffset = 10;
    const posiciones = secciones
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((el) => ({ el, top: el.offsetTop - headerOffset }));
    const siguiente = posiciones.find(({ top }) => top > currentScroll + 50) || posiciones[0];

    if (siguiente) {
      window.scrollTo({ top: siguiente.top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.querySelector('.hero-section');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        setShowFloating(rect.bottom < window.innerHeight * 0.5);
      }

      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- DATOS DEL EQUIPO ---
  const autoridades = [
    { nombre: "Ph.D. Roberto Rivera Salazar", cargo: "Director de Administración de Empresas", imagen: "https://ui-avatars.com/api/?name=Roberto+Rivera&background=f1c40f&color=fff&size=150" },
    { nombre: "Ing. José Boris Bellido Santa María", cargo: "Supervisión y Asesoría Técnica", imagen: "https://ui-avatars.com/api/?name=Boris+Bellido&background=f1c40f&color=fff&size=150" }
  ];

  const desarrolladores = [
    { nombre: "Diego Coa Véliz", cargo: "Desarrollador Full-Stack", modulo: "Estadística General", imagen: "https://ui-avatars.com/api/?name=Diego+Coa&background=17a2b8&color=fff&size=150" },
    { nombre: "Luis Alberto Ibarra Calderon", cargo: "Desarrollador Full-Stack", modulo: "Estadística Matemática", imagen: "https://ui-avatars.com/api/?name=Luis+Ibarra&background=17a2b8&color=fff&size=150" },
    { nombre: "Diego Santiago Solorzano Arancibia", cargo: "Desarrollador Full-Stack", modulo: "Analisis Empresarial", imagen: "https://ui-avatars.com/api/?name=Diego+Solorzano&background=17a2b8&color=fff&size=150" },
    { nombre: "Ulises", cargo: "Desarrollador Full-Stack", modulo: "Marketing", imagen: "https://ui-avatars.com/api/?name=Ulises&background=17a2b8&color=fff&size=150" }
  ];

  return (
    // 🆕 Se agregó overflowX: 'hidden' y maxWidth: '100vw' para evitar cortes horizontales
    <div className="inicio-container" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', paddingBottom: 0, boxSizing: 'border-box' }}>

      {/* 🎨 ESTILOS MÁGICOS */}
      <style>{`
        /* 1. Ajustes para mantener el Carrusel centrado y responsivo */
        .hero-section {
          height: 100dvh; /* 🆕 Uso de 100dvh para evitar recortes en celulares */
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-main);
          overflow: hidden;
        }

        .modern-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          box-sizing: border-box;
        }
        .modern-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
          border-color: var(--accent-color, #f1c40f);
        }
        .icon-container { transition: transform 0.3s ease; }
        .modern-card:hover .icon-container { transform: scale(1.1) rotate(3deg); }
        
        .yellow-text { color: var(--accent-color, #f1c40f); }
        
        .profile-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 25px 20px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          box-sizing: border-box;
        }
        .profile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 25px rgba(0,0,0,0.1);
          border-color: rgba(150, 150, 150, 0.4); 
        }
        .profile-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 15px;
          border: 3px solid var(--border-color);
          transition: border-color 0.3s ease;
        }
        .profile-card:hover .profile-img {
          border-color: rgba(150, 150, 150, 0.4);
        }

        @keyframes bounce-down {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
          60% { transform: translateY(-6px); }
        }
        .scroll-btn {
          animation: bounce-down 2s infinite;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: background 0.3s;
        }
        .scroll-btn:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .floating-scroll-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 50px;
          padding: 10px 20px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--text-main, #333);
          font-weight: 600;
        }
        .floating-scroll-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .floating-scroll-btn .floating-text {
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .responsive-title {
          font-size: clamp(2rem, 5vw, 3rem);
        }
      `}</style>

      {/* ---------------- SECCIÓN 1: HERO CENTRADO (100DVH) ---------------- */}
      <div className="hero-section">
        <div
          className="carrusel-wrapper"
          style={{ transform: 'translateY(-110px)' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {imagenes.map((img, index) => {
            let estado = "inactive";
            if (index === currentIndex) estado = "active";
            else if (
              (direction === "next" && index === (currentIndex === 0 ? imagenes.length - 1 : currentIndex - 1)) ||
              (direction === "prev" && index === (currentIndex === imagenes.length - 1 ? 0 : currentIndex + 1))
            ) {
              estado = "leaving";
            }
            return (
              <img key={index} src={img} alt={`Slide ${index + 1}`} className={`slide ${index === 0 ? "logo-inicio" : "imagen-fondo"} ${estado} ${direction}`} />
            );
          })}

          <button className="carrusel-arrow arrow-left" onClick={prevSlide} type="button">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="carrusel-arrow arrow-right" onClick={nextSlide} type="button">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        <div className="paginacion-container" style={{ position: 'absolute', bottom: '210px', width: '100%' }}>
          {imagenes.map((_, index) => (
            <button key={index} onClick={() => goTo(index, index > currentIndex ? "next" : "prev")} className={`dot ${index === currentIndex ? "active" : ""}`} type="button">
              {index === currentIndex && (
                <span className="dot-progress" style={{ animationDuration: `${INTERVALO_MS}ms`, animationPlayState: isPaused ? "paused" : "running" }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: '100px', left: '0', right: '0', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <button
            onClick={goToNextSection}
            className="scroll-btn"
            style={{
              width: '50px', height: '50px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer'
            }}
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </div>

      {/* 🆕 Botón flotante: Ahora solo se muestra si NO estamos al final */}
      {showFloating && (
        <button
          className="floating-scroll-btn"
          onClick={goToNextSection}
          type="button"
          title="Ir a la siguiente sección"
        >
          <ChevronDown size={24} aria-hidden="true" />
          <span className="floating-text">Siguiente sección</span>
        </button>
      )}

      {/* ---------------- SECCIÓN 2: CONTENIDO PRINCIPAL ---------------- */}
      <div id="contenido-principal" style={{ maxWidth: '1200px', margin: '100px 100px', padding: '80px 20px 60px', color: 'var(--text-main)', minHeight: '100vh', boxSizing: 'border-box' }}>

        {/* INTRODUCCIÓN + MÓDULOS */}
        <div id="modulos" style={{ marginBottom: '100px' }}>

          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 className="yellow-text responsive-title" style={{ marginBottom: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Innovación Académica
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '850px', margin: '0 auto', lineHeight: '1.7' }}>
              Plataforma diseñada exclusivamente para la carrera de <strong style={{ color: 'var(--text-main)' }}>Administración de Empresas</strong>.
              Nuestro sistema centraliza herramientas de cálculo avanzado, gestión documental y matriculación inteligente para optimizar el tiempo de docentes y estudiantes.
            </p>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', fontWeight: '800' }}>Módulos de Aprendizaje</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '30px' }}>

            <div className="modern-card" style={{ backgroundColor: 'var(--bg-card)', padding: '35px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <div className="icon-container" style={{ width: '60px', height: '60px', borderRadius: '15px', backgroundColor: 'rgba(241, 196, 15, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-color, #f1c40f)' }}>
                <BarChart3 size={32} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: '700' }}>Estadística General</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>
                Herramientas interactivas para comprender los fundamentos del análisis de datos, distribuciones y probabilidad aplicada a los negocios.
              </p>
            </div>

            <div className="modern-card" style={{ backgroundColor: 'var(--bg-card)', padding: '35px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'var(--accent-color, #f1c40f)', color: '#000', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                En Desarrollo
              </div>
              <div className="icon-container" style={{ width: '60px', height: '60px', borderRadius: '15px', backgroundColor: 'rgba(241, 196, 15, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-color, #f1c40f)' }}>
                <LineChart size={32} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: '700' }}>Estadística Matemática</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>
                Módulos avanzados de cálculo estadístico orientados a la predicción, pruebas de hipótesis y la toma de decisiones gerenciales.
              </p>
            </div>

            <div className="modern-card" style={{ backgroundColor: 'var(--bg-card)', padding: '35px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'var(--accent-color, #f1c40f)', color: '#000', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                Próximamente
              </div>
              <div className="icon-container" style={{ width: '60px', height: '60px', borderRadius: '15px', backgroundColor: 'rgba(241, 196, 15, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-color, #f1c40f)' }}>
                <Briefcase size={32} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: '700' }}>Análisis Empresarial</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem' }}>
                Integración de nuevos módulos orientados a la evaluación financiera y el diagnóstico integral de escenarios de negocios.
              </p>
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS DEL SISTEMA */}
        <div id="caracteristicas" style={{ backgroundColor: 'var(--bg-card)', padding: '60px 40px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '80px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2rem', fontWeight: '800' }}>Potenciando la Gestión Educativa</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '40px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><ShieldCheck size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Roles Seguros</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Acceso diferenciado para Administradores, Docentes y Estudiantes, garantizando la privacidad.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><QrCode size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Matriculación QR</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Los docentes pueden generar códigos QR para que los estudiantes se unan a sus grupos al instante.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><Zap size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Cálculos en Tiempo Real</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Calculadoras integradas que procesan datos estadísticos sin necesidad de software externo.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><Smartphone size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Diseño Adaptable</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Interfaz completamente responsive y soporte nativo para Modo Oscuro en todos los dispositivos.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><FileText size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Gestión de Archivos</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Repositorio centralizado para el intercambio de documentos, prácticas y material de apoyo.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="yellow-text" style={{ marginTop: '5px' }}><History size={28} /></div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: 'bold' }}>Historial Académico</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>Trazabilidad completa de las acciones, avances y registros para un mejor seguimiento.</p>
              </div>
            </div>
          </div>
        </div>

        {/* EQUIPO */}
        <div id="equipo" style={{ paddingTop: '20px' }}>
          <h2 className="yellow-text" style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem', fontWeight: '800' }}>Quiénes Somos</h2>

          <h3 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.3rem' }}>Dirección y Supervisión Técnica</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '30px', maxWidth: '800px', margin: '0 auto 60px' }}>
            {autoridades.map((autoridad, idx) => (
              <div key={idx} className="profile-card">
                <img src={autoridad.imagen} alt={autoridad.nombre} className="profile-img" />
                <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '700' }}>{autoridad.nombre}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{autoridad.cargo}</p>
              </div>
            ))}
          </div>

          <h3 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.3rem' }}>Equipo de Desarrollo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '30px' }}>
            {desarrolladores.map((dev, idx) => (
              <div key={idx} className="profile-card">
                <img src={dev.imagen} alt={dev.nombre} className="profile-img" />
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', fontWeight: '700' }}>{dev.nombre}</h4>
                <p className="yellow-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px' }}>{dev.cargo}</p>
                <div style={{ backgroundColor: 'rgba(128,128,128,0.1)', padding: '10px', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    <strong>Módulo:</strong> <br />{dev.modulo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}