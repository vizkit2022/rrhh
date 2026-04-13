export default function apiUrl() {
  const config = useRuntimeConfig();
  const apis = new Map();
  apis.set("local", "http://localhost:4000/app");
  apis.set("development", "https://apidev.unabase.cc/app");
  apis.set("dev", "https://apidev.unabase.cc/app");
  apis.set("test", "https://apitest.unabase.cc/app");
  apis.set("production", "https://api.unabase.cc/app");
  const apiUrl = useCookie("apiUrl");
  // apiUrl.value == undefined ? (apiUrl.value = "dev") : "";

  let env = apiUrl.value || config.public.API_URL.trim();
  const api = apis.get(env);
  return api;
}
