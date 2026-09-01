import { HashRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Menu from "./ui/Menu";
import Pie_pagina from "./ui/Pie_pagina";
import { useState, useEffect } from "react";
import { sileo, Toaster } from "sileo";

import Inicio from "./Features/Start/Inicio";
import Archivos from "./Features/Archives/Archivos";
import Calculadora from "./Features/MAT151/pages/Calculadora";
import Login from "./Features/auth/Login";
import MAT251 from "./Features/MAT251/pages/EstadisticaMatematica";
import Registro from "./Features/auth/Registro";
import Perfil from "./Features/auth/Perfil";
import ForgotPassword from "./Features/auth/ForgotPassword";
import ResetPassword from "./Features/auth/ResetPassword";
import Admin from "./Features/Admin/Admin";
import GestionDocente from "./Features/User/docentes/GestionDocente";
import ReportesDocente from "./Features/User/docentes/ReportesDocente";

import SelectorRol from './ui/SelectorRol';
import ModalSeleccionRolInicial from './ui/ModalSeleccionRolInicial';
import OscuroClaro from "./ui/oscuro_claro";

import { DataProvider, CalculadoraDataProvider, MAT251DataProvider, ActiveModuleContext } from "./components/Gestion_Datos/DataContext";

import LtiTester from "./pages/LtiTester";
import Historial from "./Features/History/Historial";
import Grupos from './Features/grupos/Grupos';
import GenerarQR from "./Features/qr/GenerarQR";
import Matricular from "./Features/qr/Matricular";
import api from "./services/api";

import "./App.css";
import ConfirmHost from "./utils/ConfirmHost";

const ConditionalFooter = () => {
  const location = useLocation();
  const hidePaths = ['/login', '/registro', '/forgot-password', '/reset-password'];
  if (hidePaths.includes(location.pathname)) {
    return null;
  }
  return <Pie_pagina />;
};

const ConditionalGuestHeader = ({ isAuth, usuario, setUsuario }) => {
  const location = useLocation();
  const hideLinkPaths = ['/registro', '/forgot-password', '/reset-password'];
  const isHideLink = hideLinkPaths.includes(location.pathname);
  const isLogin = location.pathname === '/login';
  
  if (isAuth) {
    return (
      <header className="guest-header">
        <Menu usuario={usuario} setUsuario={setUsuario} />
      </header>
    );
  }

  return (
    <header className="guest-header">
      <div className="guest-actions">
        <OscuroClaro />
        {!isHideLink && (
          <Link
            to={isLogin ? "/" : "/login"}
            className="login-link"
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {isLogin ? "Inicio" : "Iniciar Sesión"}
          </Link>
        )}
      </div>
    </header>
  );
};

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const restaurarSesion = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const perfil = await api.obtenerPerfilActual();
          setUsuario(perfil);
        } catch (error) {
          console.error("Error al restaurar sesión:", error);
          localStorage.removeItem("token");
        }
      }
      setCargandoSesion(false);
    };
    restaurarSesion();
  }, []);

  const isAuth = usuario !== null;

  if (cargandoSesion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontWeight: 'bold' }}>Validando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <DataProvider usuario={usuario} setUsuario={setUsuario}>
      <CalculadoraDataProvider usuario={usuario}>
        <MAT251DataProvider usuario={usuario}>
          <HashRouter>
            {usuario && (usuario.requiere_rol || usuario.rol === 'Pendiente' || !usuario.rol) && (
              <ModalSeleccionRolInicial 
                usuario={usuario} 
                onRolAsignado={(usuarioActualizado) => setUsuario(usuarioActualizado)} 
              />
            )}
            <SelectorRol />
            <div className="app-main" style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'fixed', zIndex: 99999, inset: 0, pointerEvents: 'none' }}>
                <Toaster position="bottom-right" />
              </div>
              
              <ConfirmHost />

              {/* 🆕 CONTROLES FLOTANTES MODERNOS PARA INVITADOS */}
              <ConditionalGuestHeader isAuth={isAuth} usuario={usuario} setUsuario={setUsuario} />

              <div className="content" style={{ flex: 1 }}>
                <Routes>
                  {!isAuth ? (
                    <>
                      <Route path="/" element={<Inicio />} />
                      <Route path="/login" element={<Login onLogin={setUsuario} />} />
                      <Route path="/registro" element={<Registro onLogin={setUsuario} />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/lti-tester" element={<LtiTester onLogin={setUsuario} />} />
                      <Route path="/matricular/:token" element={<Matricular />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Inicio />} />
                      <Route path="/archivos" element={<Archivos usuario={usuario} />} />
                      <Route path="/calculadora" element={
                        <ActiveModuleContext.Provider value="calculadora">
                          <Calculadora />
                        </ActiveModuleContext.Provider>
                      } />
                      <Route path="/historial" element={<Historial />} />
                      <Route path="/grupos" element={<Grupos />} />
                      <Route path="/mis-cursos" element={<Grupos />} />
                      <Route path="/matricular/:token" element={<Matricular />} />

                      <Route path="/lti-tester" element={<Navigate to="/" />} />
                      <Route path="/login" element={<Navigate to="/" />} />
                      <Route path="/registro" element={<Navigate to="/" />} />

                      <Route path="/MAT251" element={
                        <ActiveModuleContext.Provider value="mat251">
                          <MAT251 usuario={usuario} />
                        </ActiveModuleContext.Provider>
                      } />

                      <Route path="/perfil" element={<Perfil usuario={usuario} setUsuario={setUsuario} />} />
                      <Route path="/admin" element={usuario?.rol === "Administrador" ? <Admin /> : <Navigate to="/" />} />
                      <Route path="/gestion-docente" element={usuario?.rol === "Docente" || usuario?.rol === "Administrador" ? <GestionDocente usuario={usuario} /> : <Navigate to="/" />} />
                      <Route path="/reportes-docente" element={usuario?.rol === "Docente" || usuario?.rol === "Administrador" ? <ReportesDocente usuario={usuario} /> : <Navigate to="/" />} />
                      <Route path="/qr" element={usuario?.rol === "Docente" || usuario?.rol === "Administrador" ? <GenerarQR /> : <Navigate to="/" />} />
                    </>
                  )}
                </Routes>
              </div>

              <ConditionalFooter />

            </div>
          </HashRouter>
        </MAT251DataProvider>
      </CalculadoraDataProvider>
    </DataProvider>
  );
}

export default App;