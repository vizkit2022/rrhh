import api from "@/composables/api";
import apiRender from "@/composables/apiRender";
import userAuthStore from "@/stores/auth";
import userGlobalStore from "@/stores/global";
export async function useCustomFetch(method, url, params = {}, body = {}) {

  const authStore = userAuthStore();
  const globalStore = userGlobalStore();

  if (!authStore) {
    console.error("authStore has not been initialized yet");
    return;
  }

  const baseURL = api();
  const access_token = authStore.access_token || useCookie("access_token").value;
  const organization = globalStore.organizationId || useCookie("organization").value;

  let fullURL = `${baseURL}${url}`;
const queryString = Object.entries(params)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(v => `${key}=${encodeURIComponent(v)}`).join("&");
    }
    return `${key}=${encodeURIComponent(value)}`;
  })
  .join("&");

if (Object.keys(params).length > 0) {
  fullURL += `?${queryString}`;
}


  const headers = {
    Authorization: access_token,
    Organization: organization || "",
  };

  let fetchOptions = { method, headers };

  // 👇 si existe un `signal`, agregarlo
  if (params.signal) {
    fetchOptions.signal = params.signal;
    delete params.signal; // 👈 importante: no lo mandes como query param
  }

  if (["post", "put", "delete"].includes(method.toLowerCase())) {
    if (body instanceof FormData) {
      // Si el cuerpo es un FormData, no establezca el Content-Type manualmente.
      // El navegador lo hará automáticamente, incluyendo el boundary necesario.
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers["Content-Type"] = "application/json";
    }
  }

try {
    let response;

    //  Si el body es FormData, usar fetch nativo
    if (body instanceof FormData) {
      const res = await fetch(fullURL, fetchOptions);
      response = await res.json();
    } else {
      response = await $fetch(fullURL, fetchOptions);
    }

    return response;

  } catch (error) {
    console.error("Fetch errorss:", error.response || error);
    const status = error.response?.status || 500;
    const errorMessage =
      error.response?._data?.error || "Internal Server Error";
    throw { status, message: errorMessage };
  }

}

export async function useCustomFetchUrl(
  method,
  url,
  body = {},
  typeFetch = ""
) {
  // if (!navigator.onLine) {
  //   throw new Error("No hay conexión a internet");
  // }
  const baseURL = apiRender();
  let fullURL = url;
  // const config = useRuntimeConfig();
  // const apiUrl = useCookie("apiUrl");
  // const env = apiUrl.value || config.public.API_URL.trim();
  fullURL = baseURL + fullURL
  // Si el baseURL no contiene "localhost" o "dev" y la url contiene "dev"
  //fullURL = url.replace("https://v4.unabase.com/node", 'https://api-ubapp-j8ol.onrender.com');
  // fullURL = url.replace("dev", "back");
  const authStore = userAuthStore();
  const globalStore = userGlobalStore();
  const access_token = authStore.access_token
    ? authStore.access_token
    : useCookie("access_token").value;
  const organization = globalStore.organizationId
    ? globalStore.organizationId
    : useCookie("organization").value;

  const headers = {
    Authorization: `${access_token}`,
    Organization: organization || "",
  };

  let fetchOptions = {
    method: method,
    headers: headers,
    mode: "cors",
  };

  if (["post", "put", "delete, patch"].includes(method.toLowerCase())) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers["Content-Type"] = "application/json";
    }
  }
  try {
    let response;
    if (typeFetch === "blob") {
      response = await fetch(fullURL, fetchOptions);
    } else {
      response = await $fetch(fullURL, fetchOptions);
    }
    
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
