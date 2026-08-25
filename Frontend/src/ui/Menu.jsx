  import { useState, useEffect, useRef } from "react";
  import { NavLink, useNavigate, useLocation } from "react-router-dom";
  import OscuroClaro from "./oscuro_claro.jsx";
  import escudoAdmin from "../assets/images/Logo-Adm.png";
  import '../styles/ui/Menu.css';
  import { alerta } from "../utils/Notificaciones";
  import { api } from "../services/api";
  import { IconoCandado } from "./iconos";

  export default function Menu({ usuario, setUsuario }) {
    const [isOpen, setIsOpen] = useState(false);
    // Nuevo estado para controlar cuándo se abre el submenú (útil para móviles)
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [gruposDropdownOpen, setGruposDropdownOpen] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const perfilRef = useRef(null);

    // --- ESTADOS PARA SISTEMA DE NOTIFICACIONES ---
    const [notificaciones, setNotificaciones] = useState([]);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const notifRef = useRef(null);

    // Refs para cerrar el menú móvil (hamburguesa)
    const mobileMenuRef = useRef(null);
    const hamburgerRef = useRef(null);

    const cargarNotificaciones = async () => {
      try {
        const data = await api.obtenerNotificaciones();
        setNotificaciones(data);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      }
    };

    useEffect(() => {
      if (usuario) {
        cargarNotificaciones();
        const interval = setInterval(cargarNotificaciones, 30000);
        return () => clearInterval(interval);
      } else {
        setNotificaciones([]);
      }
    }, [usuario]);

    const handleMarcarLeida = async (id, e) => {
      e.stopPropagation(); // Evitar que el dropdown se cierre
      try {
        await api.marcarNotificacionLeida(id);
        setNotificaciones(prev =>
          prev.map(n => n.id === id ? { ...n, leido: true } : n)
        );
      } catch (error) {
        console.error("Error al marcar como leída:", error);
      }
    };

    const handleMarcarTodasLeidas = async (e) => {
      e.stopPropagation(); // Evitar que el dropdown se cierre
      try {
        await api.marcarTodasLeidas();
        setNotificaciones(prev =>
          prev.map(n => ({ ...n, leido: true }))
        );
        alerta.exito("Leídas", "Todas las notificaciones marcadas como leídas");
      } catch (error) {
        console.error("Error al marcar todas como leídas:", error);
      }
    };

    const noLeidasCount = notificaciones.filter(n => !n.leido).length;

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (perfilRef.current && !perfilRef.current.contains(event.target)) {
          setMenuAbierto(false);
        }
        if (notifRef.current && !notifRef.current.contains(event.target)) {
          setNotifDropdownOpen(false);
        }
        if (navLinksRef.current && !navLinksRef.current.contains(event.target)) {
          setDropdownOpen(false);
          setGruposDropdownOpen(false);
        }
        if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target) &&
          hamburgerRef.current &&
          !hamburgerRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const closeMenu = () => {
      setIsOpen(false);
      setDropdownOpen(false); // Cerramos también el submenú
      setGruposDropdownOpen(false);
    };

    const navigate = useNavigate();
    const location = useLocation();
    const navLinksRef = useRef(null);
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

    // Detectamos si estamos en alguna de las páginas de la calculadora
    const isCalculadoraActive = location.pathname === '/calculadora' || location.pathname === '/MAT251';
    const isGruposActive = location.pathname === '/grupos' || location.pathname === '/gestion-docente';

    useEffect(() => {
      const updateUnderline = () => {
        // Buscar el NavLink que coincida con la ruta actual o los spans activos
        const activeLinks = Array.from(navLinksRef.current?.querySelectorAll('a.active, span.active, a[aria-current="page"]') || []);
        // Seleccionamos el último (para evitar que atrape '/' si no tiene 'end')
        let activeLink = activeLinks[activeLinks.length - 1];

        if (activeLink) {
          let leftPos = activeLink.offsetLeft;
          let width = activeLink.offsetWidth;

          // Corregimos la posición si es parte del menú desplegable
          const dropdownParent = activeLink.closest('.dropdown-container');
          if (dropdownParent) {
            leftPos = dropdownParent.offsetLeft;
            const span = dropdownParent.querySelector('span');
            width = span ? span.offsetWidth : dropdownParent.offsetWidth;
          }

          setUnderlineStyle({
            left: leftPos,
            width: width,
            opacity: 1
          });
        } else {
          setUnderlineStyle(prev => ({ ...prev, opacity: 0 }));
        }
      };

      updateUnderline();
      window.addEventListener("resize", updateUnderline);
      const timer = setTimeout(updateUnderline, 100);

      return () => {
        window.removeEventListener("resize", updateUnderline);
        clearTimeout(timer);
      };
    }, [location.pathname]);

    return (
      <nav className="main-navbar">

        <div className="nav-brand">
          <img src={escudoAdmin} alt="Escudo Administración" className="nav-logo" />
        </div>

        <div className={`nav-menu ${isOpen ? "active" : ""}`} ref={mobileMenuRef}>
          <ul className="nav-links" ref={navLinksRef}>
            <li><NavLink to="/" end onClick={closeMenu}>Inicio</NavLink></li>
            <li><NavLink to="/archivos" onClick={closeMenu}>Archivos</NavLink></li>

            {/* EL CONTENEDOR DESPLEGABLE */}
            <li
              className="nav-item dropdown-container"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                if (!dropdownOpen) setGruposDropdownOpen(false);
              }} // Abrir solo con clic y cerrar el otro
            >
              {/* El título "Calculadora" se marca como activo si estamos en esas rutas */}
              <span className={`nav-link-dropdown ${isCalculadoraActive ? 'active' : ''}`}>
                Calculadora
                <svg
                  className={`chevron-icon ${dropdownOpen ? 'open' : ''}`}
                  width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>

              <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                <li className="dropdown-li" style={{ transitionDelay: '0.05s' }}>
                  <NavLink to="/calculadora" onClick={closeMenu} className="dropdown-item">
                    Estadística General
                  </NavLink>
                </li>
                <li className="dropdown-li" style={{ transitionDelay: '0.1s' }}>
                  <NavLink to="/MAT251" onClick={closeMenu} className="dropdown-item">
                    Estadística Matemática
                  </NavLink>
                </li>
              </ul>
            </li>

            <li><NavLink to="/historial" onClick={closeMenu}>Historial</NavLink></li>
            {usuario && (usuario.rol === "Docente" || usuario.rol === "Administrador") ? (
              <li
                className="nav-item dropdown-container"
                onClick={() => {
                  setGruposDropdownOpen(!gruposDropdownOpen);
                  if (!gruposDropdownOpen) setDropdownOpen(false);
                }}
              >
                <span className={`nav-link-dropdown ${isGruposActive ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                  Grupos
                  <svg
                    className={`chevron-icon ${gruposDropdownOpen ? 'open' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>

                <ul className={`dropdown-menu ${gruposDropdownOpen ? 'show' : ''}`}>
                  <li className="dropdown-li" style={{ transitionDelay: '0.05s' }}>
                    <NavLink to="/grupos" onClick={closeMenu} className="dropdown-item">
                      Gestión Grupos
                    </NavLink>
                  </li>
                  <li className="dropdown-li" style={{ transitionDelay: '0.1s' }}>
                    <NavLink to="/gestion-docente" onClick={closeMenu} className="dropdown-item">
                      Gestión Alumnos
                    </NavLink>
                  </li>
                </ul>
              </li>
            ) : (
              <li><NavLink to="/grupos" onClick={closeMenu}>Grupos</NavLink></li>
            )}

            {usuario && usuario.rol === "Administrador" && (
              <li><NavLink to="/admin" onClick={closeMenu}>Admin</NavLink></li>
            )}

            <span className="nav-underline" style={underlineStyle} />
          </ul>

          <div className="nav-menu-mobile-extra mobile-only">
            <OscuroClaro />
          </div>
        </div>

        <div className="menu-derecha">
          <div className="nav-theme desktop-only">
            <OscuroClaro />
          </div>

          {usuario && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

              {/* CAMPANA DE NOTIFICACIONES */}
              <div className="notificaciones-container" ref={notifRef}>
                <button
                  className="bell-btn"
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    if (!notifDropdownOpen) {
                      setIsOpen(false);
                      setMenuAbierto(false);
                    }
                  }}
                  title="Notificaciones"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {noLeidasCount > 0 && (
                    <span className="notif-badge">{noLeidasCount}</span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h4 className="notif-title">Notificaciones</h4>
                      {notificaciones.length > 0 && (
                        <button className="notif-clear-btn" onClick={handleMarcarTodasLeidas}>
                          Marcar todo como leído
                        </button>
                      )}
                    </div>
                    <ul className="notif-list">
                      {notificaciones.length === 0 ? (
                        <div className="notif-empty">No tienes notificaciones</div>
                      ) : (
                        notificaciones.map(n => (
                          <li
                            key={n.id}
                            className={`notif-item ${!n.leido ? 'unread' : ''}`}
                            onClick={(e) => !n.leido && handleMarcarLeida(n.id, e)}
                          >
                            <span className="notif-item-msg">{n.mensaje}</span>
                            <div className="notif-item-meta">
                              <span className={`notif-badge-type ${n.tipo === 'sistema' ? 'sistema' : 'personal'}`}>
                                {n.tipo === 'sistema' ? 'Sistema' : 'Personal'}
                              </span>
                              <span>{n.fecha_creacion.split(' ')[0]}</span>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* PERFIL USUARIO */}
              <div className="relative" ref={perfilRef}>
                <div
                  className="perfil-usuario-menu"
                  title={`${usuario.nombre} - ${usuario.rol}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAbierto(!menuAbierto);
                    if (!menuAbierto) {
                      setIsOpen(false);
                      setNotifDropdownOpen(false);
                    }
                  }}
                >
                  <div className="avatar-naranja">
                    {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <span className="user-name-text">
                    {usuario.nombre?.split(' ')[0] || 'Usuario'}
                  </span>
                </div>

                {/* Submenú desplegable al hacer clic */}
                {menuAbierto && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                    <div
                      onClick={() => {
                        navigate('/perfil');
                        closeMenu();
                        setMenuAbierto(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      style={{ transition: 'background-color 0.2s', color: 'var(--text-main)' }}
                    >
                      Mi Perfil
                    </div>

                    {usuario.rol === "Administrador" && (
                      <div
                        onClick={() => {
                          navigate('/admin');
                          closeMenu();
                          setMenuAbierto(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        style={{ transition: 'background-color 0.2s', color: 'var(--text-main)', fontWeight: 'bold' }}
                      >
                        Panel de Admin
                      </div>
                    )}

                    <div
                      onClick={() => {
                        localStorage.removeItem("token");
                        setUsuario(null);
                        navigate('/login');
                        closeMenu();
                        setMenuAbierto(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold cursor-pointer"
                      style={{ transition: 'background-color 0.2s' }}
                    >
                      Cerrar sesión
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <button
          ref={hamburgerRef}
          className={`hamburger-menu ${isOpen ? "open" : ""}`}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setMenuAbierto(false);
              setNotifDropdownOpen(false);
            }
          }}
          aria-label="Abrir menú"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </nav>
    );
  }