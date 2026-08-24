import { BASE_URL } from "./api";

const tokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || data.detail || "Error al procesar la solicitud";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const qrApi = {
  /**
   * Genera un nuevo QR para la clase indicada.
   * @param {number} claseId
   * @param {number} [duracionMinutos]
   */
  generarQR: async (claseId, duracionMinutos = null) => {
    const body = { clase_id: claseId };
    if (duracionMinutos) body.duracion_minutos = duracionMinutos;
    const res = await fetch(`${BASE_URL}/api/qr/generar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeader() },
      body: JSON.stringify(body),
    });
    return handle(res);
  },

  /**
   * Obtiene la información pública del QR (no requiere autenticación).
   * @param {string} token
   */
  infoQR: async (token) => {
    const res = await fetch(`${BASE_URL}/api/qr/info/${encodeURIComponent(token)}`);
    return handle(res);
  },

  /**
   * Matricula al estudiante autenticado en la clase del QR.
   * @param {string} token
   */
  matricularPorQR: async (token) => {
    const res = await fetch(`${BASE_URL}/api/qr/matricular`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeader() },
      body: JSON.stringify({ token }),
    });
    return handle(res);
  },

  /**
   * Desactiva un QR.
   * @param {number} qrId
   */
  desactivarQR: async (qrId) => {
    const res = await fetch(`${BASE_URL}/api/qr/desactivar/${qrId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tokenHeader() },
    });
    return handle(res);
  },

  /**
   * Lista los QRs del docente autenticado.
   */
  listarMisQRs: async () => {
    const res = await fetch(`${BASE_URL}/api/qr/mis-qrs`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...tokenHeader() },
    });
    return handle(res);
  },

  /**
   * Obtiene el QR activo de una clase específica (si existe).
   * @param {number} claseId
   */
  obtenerQRActivoDeClase: (qrsList, claseId) => {
    // Busca en la lista de QRs el que coincida con la clase y esté activo
    const qrActivo = qrsList.find(
      (qr) => qr.clase_id === claseId && qr.activo
    );
    // Calcula si está expirado
    if (qrActivo) {
      const exp = new Date((qrActivo.fecha_expiracion || "").replace(" ", "T") + "Z");
      if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        return null; // Consideramos expirado como si no existiera
      }
    }
    return qrActivo || null;
  },
};

export default qrApi;
