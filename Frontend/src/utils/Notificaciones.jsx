import { sileo, Toaster } from "sileo";
import { confirmarComoPromise } from "./ConfirmHost";


const estilosBase = { title: "texto-blanco", description: "texto-gris" };
export const alerta = {
  exito: (titulo, descripcion) => {
    sileo.success({
      title: titulo,
      description: descripcion,
      fill: "#171717",
      styles: estilosBase
    });
  },
  error: (titulo, descripcion) => {
    sileo.error({
      title: titulo,
      description: descripcion,
      fill: "#474444",
      styles: estilosBase
    });
  },
  advertencia: (titulo, descripcion) => {
    sileo.warning({
      title: titulo,
      description: descripcion,
      fill: "#171717",
      styles: estilosBase
    });
  },
  warning: (titulo, descripcion) => {
    sileo.warning({
      title: titulo,
      description: descripcion,
      fill: "#171717",
      styles: estilosBase
    });
  },
  success: (titulo, descripcion) => {
    sileo.success({
      title: titulo,
      description: descripcion,
      fill: "#171717",
      styles: estilosBase
    });
  },
  /**
   * Muestra un modal de confirmación con el mismo diseño de la app y devuelve
   * una promesa que se resuelve con `true` si el usuario confirma o `false` si
   * cancela. Reemplaza a `window.confirm` para mantener la coherencia visual.
   *
   * @param {object} opciones
   * @param {string} opciones.titulo
   * @param {string} opciones.mensaje
   * @param {string} [opciones.textoConfirmar="Confirmar"]
   * @param {string} [opciones.textoCancelar="Cancelar"]
   * @param {"danger"|"primary"} [opciones.variant="danger"]
   * @returns {Promise<boolean>}
   */
  confirmar: (opciones) => confirmarComoPromise(opciones),
};

