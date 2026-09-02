/* const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"; */

/*uvicorn main:app --reload*/

// Detecta automáticamente si estás en localhost o en la IP del celular
const hostActual = window.location.hostname;

// Construye la URL apuntando a la variable de entorno, o al puerto 8000 (tu backend local)
export const BASE_URL = import.meta.env.VITE_API_URL || `http://${hostActual}:8000`;

export const api = {
  // --- VERIFICAR ESTADO DEL SERVIDOR ---
  verificarEstado: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) return { status: "error" };
      return await res.json();
    } catch (err) {
      return { status: "error" };
    }
  },

  // --- OBTENER CURSOS DEL DOCENTE LOGUEADO ---
  obtenerClasesDocente: async () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}/clases/mis-clases`, {
      method: "GET",
      headers: headers
    });
    if (!res.ok) throw new Error("Error al obtener las clases del docente");
    return await res.json();
  },

  actualizarClase: async (id, nombre, fechaLimite, resetearCodigo = false) => {
    const res = await fetch(`${BASE_URL}/actualizar_clase`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
      },
      body: JSON.stringify({ id, nombre, fecha_limite_matriculacion: fechaLimite || null, resetear_codigo: resetearCodigo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.detail || "No se pudo actualizar la clase");
    return data;
  },

  // --- OBTENER ESTUDIANTES DE UNA CLASE ---
  obtenerEstudiantesClase: async (claseId, userEmail) => {
    const res = await fetch(`${BASE_URL}/clases/${claseId}/estudiantes?user_email=${encodeURIComponent(userEmail)}`);
    if (!res.ok) throw new Error("Error al obtener los estudiantes de la clase");
    return await res.json();
  },

  // --- DESMATRICULAR/ELIMINAR ESTUDIANTE DE UNA CLASE (por el docente) ---
  desmatricularEstudiante: async (claseId, estudianteId, userEmail) => {
    const res = await fetch(`${BASE_URL}/clases/${claseId}/desmatricular/${estudianteId}?user_email=${encodeURIComponent(userEmail)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Error al eliminar al estudiante de la clase");
    return await res.json();
  },

  cambiarCursoEstudiante: async (estudianteId, claseActualId, nuevaClaseId, userEmail) => {
    const res = await fetch(`${BASE_URL}/cambiar_clase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estudiante_id: estudianteId,
        clase_actual_id: claseActualId,
        nueva_clase_id: nuevaClaseId,
        user_email: userEmail,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.detail || "Error al cambiar al estudiante de curso");
    return data;
  },

  // --- NUEVA: ABANDONAR CLASE (estudiante se desmatricula a sí mismo) ---
  abandonarClase: async (claseId, estudianteEmail) => {
    const res = await fetch(`${BASE_URL}/abandonar_clase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clase_id: claseId, estudiante_email: estudianteEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.detail || "Error al desmatricularse del curso");
    return data;
  },

  // --- VERIFICAR EMAIL ---
  verificarEmail: async (email) => {
    const res = await fetch(`${BASE_URL}/verificar_email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Error al verificar el correo");
    return await res.json();
  },

  // --- INICIO DE SESION LOCAL ---
  loginLocal: async (email, password) => {
    const res = await fetch(`${BASE_URL}/login_local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Credenciales incorrectas");
    return await res.json();
  },

  // --- OBTENER PERFIL ACTUAL (JWT) ---
  obtenerPerfilActual: async () => {
    const res = await fetch(`${BASE_URL}/me`);
    if (!res.ok) throw new Error("Sesión inválida o expirada");
    return await res.json();
  },

  // --- OBTENER CONTADOR DE VISITAS ---
  obtenerVisitas: async () => {
    try {
      const response = await fetch(`${BASE_URL}/visitas`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.visitas;
    } catch (error) {
      console.error("Error en api.obtenerVisitas:", error);
      return null;
    }
  },

  // --- Función para obtener las hojas de un Excel ---
  obtenerHojas: async (filename, autor = "", curso = "") => {
    let url = `${BASE_URL}/sheets/${encodeURIComponent(filename)}?`;
    if (autor) url += `autor=${encodeURIComponent(autor)}&`;
    if (curso) url += `curso=${encodeURIComponent(curso)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al obtener las hojas del archivo");
    return response.json();
  },

  // --- Función unificada para leer los datos de la hoja ---
  obtenerDatosHoja: async (filename, hoja, autor = "", curso = "") => {
    let url = `${BASE_URL}/view/${encodeURIComponent(filename)}?hoja=${hoja}`;
    if (autor) url += `&autor=${encodeURIComponent(autor)}`;
    if (curso) url += `&curso=${encodeURIComponent(curso)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al visualizar el archivo");
    return response.json();
  },

  // --- OBTENER LISTA DE ARCHIVOS ---
  obtenerArchivos: async (autor, visibilidad = "personal", curso = "") => {
    let url = `${BASE_URL}/files?autor=${encodeURIComponent(autor)}&visibilidad=${visibilidad}`;
    if (curso) url += `&curso=${encodeURIComponent(curso)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al obtener archivos");
    return response.json();
  },

  // --- VER EXCEL (Solo metadatos/estructura) ---
  verExcel: async (filename, hoja = 0, autor = "", curso = "") => {
    let url = `${BASE_URL}/view/${encodeURIComponent(filename)}?hoja=${hoja}`;
    if (autor) url += `&autor=${encodeURIComponent(autor)}`;
    if (curso) url += `&curso=${encodeURIComponent(curso)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al visualizar el archivo");
    return response.json();
  },

  // --- ACTUALIZAR EXCEL ---
  actualizarExcel: async (filename, hoja, datos, autor = "", curso = "", estrategia_guardado = "overwrite") => {
    const payload = {
      filename,
      hoja_index: hoja,
      datos,
      autor,
      curso,
      estrategia_guardado
    };
    const response = await fetch(
      `${BASE_URL}/update_excel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al actualizar el archivo");
    }
    return response.json();
  },

  // --- AÑADIR HOJA DE CAMBIOS (NO DESTRUCTIVO) ---
  agregarHojaCambios: async (filename, datos, autor = "", curso = "") => {
    const payload = {
      filename,
      datos,
      autor,
      curso
    };
    const response = await fetch(
      `${BASE_URL}/add_edit_sheet`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al añadir la hoja de cambios");
    }
    return response.json();
  },

  // =================================================================
  // LAS FUNCIONES DE ABAJO SE MANTIENEN EXACTAMENTE IGUAL
  // =================================================================

  calcularUnivariada: async (bodyData) => {
    try {
      const res = await fetch(`${BASE_URL}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Error en cálculo univariado");
      return await res.json();
    } catch (error) {
      console.error("Error en api.calcularUnivariada:", error);
      throw error;
    }
  },

  calcularBivariadaManual: async (bodyData) => {
    try {
      const res = await fetch(`${BASE_URL}/calcular_bivariada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Error en cálculo bivariado");
      return await res.json();
    } catch (error) {
      console.error("Error en api.calcularBivariadaManual:", error);
      throw error;
    }
  },

  calcularMultivariante: async (bodyData) => {
    try {
      const res = await fetch(`${BASE_URL}/calcular_multivariante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) throw new Error("Error en cálculo multivariante");
      return await res.json();
    } catch (error) {
      console.error("Error en api.calcularMultivariante:", error);
      throw error;
    }
  },

  eliminarArchivo: async (filename, autor, curso = "") => {
    try {
      let url = `${BASE_URL}/files/${encodeURIComponent(filename)}?autor=${encodeURIComponent(autor)}`;
      if (curso) url += `&curso=${encodeURIComponent(curso)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el archivo");
      return true;
    } catch (error) {
      console.error("Error en api.eliminarArchivo:", error);
      throw error;
    }
  },

  descargarArchivoBinario: async (filename, autor) => {
    try {
      const res = await fetch(
        `${BASE_URL}/files/${encodeURIComponent(filename)}?autor=${encodeURIComponent(autor)}`,
      );
      if (!res.ok)
        throw new Error("No se pudo obtener el archivo del servidor");
      return await res.arrayBuffer();
    } catch (error) {
      console.error("Error en api.descargarArchivoBinario:", error);
      throw error;
    }
  },

  descargarArchivoExcel: async (filename) => {
    try {
      const res = await fetch(
        `${BASE_URL}/files/${encodeURIComponent(filename)}`,
        { cache: "no-store" },
      );
      if (!res.ok)
        throw new Error("No se pudo descargar el archivo del servidor.");
      return await res.arrayBuffer();
    } catch (error) {
      console.error("Error en api.descargarArchivoExcel:", error);
      throw error;
    }
  },

  guardarEnHistorial: async (autor, calculo, archivo, snapshotCompleto) => {
    try {
      const res = await fetch(`${BASE_URL}/guardar_historial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autor: autor,
          calculo: calculo,
          archivo_origen: archivo,
          snapshot: snapshotCompleto,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar en el servidor");
      }
      return await res.json();
    } catch (error) {
      console.error("Error en api.guardarEnHistorial:", error);
      throw error;
    }
  },

  obtenerHistorial: async (autor) => {
    try {
      const res = await fetch(
        `${BASE_URL}/obtener_historial?autor=${encodeURIComponent(autor)}`,
      );
      if (!res.ok)
        throw new Error("Error al obtener el historial del servidor");
      return await res.json();
    } catch (error) {
      console.error("Error en api.obtenerHistorial:", error);
      throw error;
    }
  },

  eliminarHistorial: async (registro_id, autor) => {
    try {
      const res = await fetch(
        `${BASE_URL}/eliminar_historial/${registro_id}?autor=${encodeURIComponent(autor)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Error al eliminar el registro");
      return await res.json();
    } catch (error) {
      console.error("Error en api.eliminarHistorial", error);
      throw error;
    }
  },

  obtenerFechaLimite: async () => {
    try {
      const res = await fetch(`${BASE_URL}/fecha_limite`);
      if (!res.ok) throw new Error("Error al obtener la fecha límite");
      return await res.json();
    } catch (error) {
      console.error("Error en api.obtenerFechaLimite:", error);
      throw error;
    }
  },

  recuperarPassword: async (email) => {
    const res = await fetch(`${BASE_URL}/recuperar_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al solicitar recuperación");
    return data;
  },

  resetearPassword: async (email, token, nuevo_password) => {
    const res = await fetch(`${BASE_URL}/resetear_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, nuevo_password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al restablecer contraseña");
    return data;
  },

  cambiarPasswordPerfil: async (email, password_actual, password_nuevo) => {
    const res = await fetch(`${BASE_URL}/cambiar_password_perfil`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password_actual, password_nuevo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña");
    return data;
  },

  eliminarCuenta: async (email, password) => {
    const res = await fetch(`${BASE_URL}/eliminar_cuenta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar la cuenta");
    return data;
  },

  eliminarClase: async (claseId, emailUsuario) => {
    const res = await fetch(`${BASE_URL}/eliminar_clase/${claseId}?user_email=${encodeURIComponent(emailUsuario)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar el curso");
    return data;
  },

  // --- ADMINISTRACIÓN DE USUARIOS ---
  obtenerUsuarios: async () => {
    const res = await fetch(`${BASE_URL}/usuarios`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener la lista de usuarios");
    return data;
  },

  cambiarRol: async (email, nuevo_rol) => {
    const res = await fetch(`${BASE_URL}/cambiar_rol`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nuevo_rol }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar el rol");
    return data;
  },

  cambiarEstado: async (email, activo) => {
    const res = await fetch(`${BASE_URL}/cambiar_estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, activo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cambiar el estado del usuario");
    return data;
  },

  eliminarUsuario: async (email) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/eliminar_usuario/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar el usuario");
    return data;
  },

  obtenerEstadisticasAdmin: async () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/admin/estadisticas`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener estadísticas del sistema");
    return data;
  },

  loginGoogle: async (token) => {
    const res = await fetch(`${BASE_URL}/login_google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión con Google");
    return data;
  },

  asignarRolInicial: async (rol) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/asignar_rol_inicial`, {
      method: "POST",
      headers,
      body: JSON.stringify({ rol }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al asignar rol inicial");
    return data;
  },

  // --- SISTEMA DE NOTIFICACIONES ---
  obtenerNotificaciones: async () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/notificaciones`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener notificaciones");
    return data;
  },

  marcarNotificacionLeida: async (id) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/notificaciones/${id}/leer`, {
      method: "PUT",
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al marcar la notificación como leída");
    return data;
  },

  marcarTodasLeidas: async () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/notificaciones/leer_todas`, {
      method: "PUT",
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al marcar todas las notificaciones como leídas");
    return data;
  },

  crearNotificacion: async (tipo, mensaje, usuario_id = null) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/notificaciones`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tipo, mensaje, usuario_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear la notificación");
    return data;
  },

  // --- OBTENER ESPACIO DE ALMACENAMIENTO USADO ---
  obtenerEspacioUsado: async () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${BASE_URL}/espacio-usado`, { headers });
      if (!res.ok) throw new Error("Error al obtener la cuota de almacenamiento");
      return await res.json();
    } catch (error) {
      console.error("Error en api.obtenerEspacioUsado:", error);
      return null;
    }
  },

  guardarTabla: async (nombre, datos, autor) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`; // <-- TOKEN AÑADIDO

      const res = await fetch(`${BASE_URL}/save_table`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ nombre: nombre, tabla: datos, autor: autor }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || "Error al guardar la tabla");
      return data;
    } catch (error) {
      console.error("Error en api.guardarTabla:", error);
      throw error;
    }
  },

  guardarTablaHojas: async (nombre, hojas, autor) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`; // <-- TOKEN AÑADIDO

      const res = await fetch(`${BASE_URL}/save_table_hojas`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ nombre, hojas, autor }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || "Error al guardar las hojas");
      return data;
    } catch (error) {
      console.error("Error en api.guardarTablaHojas:", error);
      throw error;
    }
  },

  subirArchivo: async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      // NOTA: No seteamos 'Content-Type' aquí, fetch lo hace automático para FormData
      if (token) headers["Authorization"] = `Bearer ${token}`; // <-- TOKEN AÑADIDO

      const res = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Error al subir el archivo");
      return data;
    } catch (error) {
      console.error("Error en api.subirArchivo:", error);
      throw error;
    }
  },

  obtenerEstadisticasDocente: async (claseId = null) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${BASE_URL}/estadisticas-docente`;
      if (claseId) {
        url += `?clase_id=${encodeURIComponent(claseId)}`;
      }

      const res = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Error al obtener las estadísticas del docente");
      return data;
    } catch (error) {
      console.error("Error en api.obtenerEstadisticasDocente:", error);
      throw error;
    }
  },
};

export default api;