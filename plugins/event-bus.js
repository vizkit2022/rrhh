import { defineNuxtPlugin } from "#app";
import mitt from "mitt";

const emitter = mitt();

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide("bus", {
    $on: emitter.on,
    $off: emitter.off,

    $emit: emitter.emit,
    // Método personalizado para manejar promesas
    async $emitWithPromise(event, ...args) {
      const listeners = emitter.all.get(event) || [];
      return Promise.all(listeners.map((listener) => listener(...args)));
    },
  });
});

// export const eventBus = new Vue();
