import { useState, useEffect, useRef, useCallback } from "react";
import escudoAdmin from "../../assets/images/Logo-Adm.png";
import imagenInicio1 from "../../assets/images/imagen de inicio 1.jpg";
import imagenInicio2 from "../../assets/images/imagen de inicio 2.jpg";
import "../../styles/ui/Inicio.css";

const INTERVALO_MS = 4000;

export default function Inicio() {
  const imagenes = [escudoAdmin, imagenInicio1, imagenInicio2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("next");
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const touchStartX = useRef(null);

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

  // AUTOPLAY
  useEffect(() => {
    if (isPaused) return;
    const intervalo = setInterval(nextSlide, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [isPaused, nextSlide, progressKey]);

  // SWIPE TÁCTIL (Deslizar en celular)
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

  return (
    <div className="inicio-container">
      {/* CARRUSEL */}
      <div
        className="carrusel-wrapper"
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
            <img
              key={index}
              src={img}
              alt={`Slide ${index + 1}`}
              className={`slide ${index === 0 ? "logo-inicio" : "imagen-fondo"} ${estado} ${direction}`}
            />
          );
        })}

        {/* FLECHAS DE NAVEGACIÓN (Se ocultan en CSS para celulares) */}
        <button className="carrusel-arrow arrow-left" onClick={prevSlide} type="button">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="carrusel-arrow arrow-right" onClick={nextSlide} type="button">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* PAGINACIÓN CON BARRA DE PROGRESO */}
      <div className="paginacion-container">
        {imagenes.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index, index > currentIndex ? "next" : "prev")}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            type="button"
          >
            {index === currentIndex && (
              <span
                key={progressKey}
                className="dot-progress"
                style={{
                  animationDuration: `${INTERVALO_MS}ms`,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}