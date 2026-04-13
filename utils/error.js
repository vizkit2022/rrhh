import { toast } from "vue3-toastify";
import useGlobalStore from "@/stores/global";

export const createErr = (err) => {
  const globalStore = useGlobalStore();

  // 1) Si no viene ningún error, no hacemos nada
  if (!err) {
    return { status: null, message: null };
  }

  // 2) Intentamos extraer status y mensaje de un error de Axios (err.response)
  const status = err.response?.status ?? err.status ?? null; // si no hay status lo dejamos en null
  let message =
    err.response?.data?.message ??
    err.message ??
    "Ocurrió un error desconocido.";

  // 3) Override de mensajes según status o conexión
  if (!navigator.onLine) {
    message = "No hay conexión a Internet. Por favor, comprueba tu conexión.";
  } else if (status === 401) {
    message = "No estás autorizado para realizar esta acción.";
  } else if (status === 403) {
    message = "No tienes permiso para realizar esta acción.";
  } else if (status === 404) {
    message = "No se encontró el recurso solicitado.";
  } else if (status === 500) {
    message = "Error del servidor. Por favor, inténtelo de nuevo más tarde..";
  }
  // —> ya no hay “else” final que ponga status 500 si no ha habido error

  // 4) Mostramos toast si antes estaba online
  if (globalStore.conexion) {
    toast.error(message, { autoClose: 3000 });
  }

  // 5) Actualizamos el flag de conexión
  //    Seguimos considerándole “sin conexión” sólo si status 501 (offline) o 500
  globalStore.conexion = !(status === 501 || status === 500);

  return { status, message };
};
