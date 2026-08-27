import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ModalConfirm from "./ModalConfirm";

/**
 * Componente "anfitrión" que renderiza el modal de confirmación actual.
 * Se debe montar una sola vez cerca de la raíz de la app. El helper
 * `alerta.confirmar()` se comunica con él a través de un store a nivel de módulo.
 */
let resolverActual = null;
let pedidoActual = null;

export const confirmarComoPromise = (opciones) => {
  return new Promise((resolve) => {
    // Si ya hay un diálogo abierto, rechazamos el nuevo para evitar superposiciones.
    if (pedidoActual) {
      resolve(false);
      return;
    }
    resolverActual = resolve;
    pedidoActual = {
      titulo: opciones.titulo ?? "¿Estás seguro?",
      mensaje: opciones.mensaje ?? "",
      textoConfirmar: opciones.textoConfirmar ?? "Confirmar",
      textoCancelar: opciones.textoCancelar ?? "Cancelar",
      variant: opciones.variant ?? "danger",
    };
    // Forzar un re-render del host (es un módulo de estado, así que disparamos un evento)
    window.dispatchEvent(new CustomEvent("__confirm_host_update"));
  });
};

const consumirPedido = () => {
  const pedido = pedidoActual;
  pedidoActual = null;
  return pedido;
};

export default function ConfirmHost() {
  const [, forzarRender] = useState(0);

  useEffect(() => {
    const handler = () => forzarRender((n) => n + 1);
    window.addEventListener("__confirm_host_update", handler);
    return () => window.removeEventListener("__confirm_host_update", handler);
  }, []);

  const pedido = pedidoActual;
  if (!pedido) return null;

  const cerrar = (resultado) => {
    const resolver = resolverActual;
    resolverActual = null;
    consumirPedido();
    if (resolver) resolver(resultado);
    // Disparar re-render para desmontar
    window.dispatchEvent(new CustomEvent("__confirm_host_update"));
  };

  return createPortal(
    <ModalConfirm
      open={true}
      titulo={pedido.titulo}
      mensaje={pedido.mensaje}
      textoConfirmar={pedido.textoConfirmar}
      textoCancelar={pedido.textoCancelar}
      variant={pedido.variant}
      onConfirm={() => cerrar(true)}
      onCancel={() => cerrar(false)}
    />,
    document.body
  );
}
