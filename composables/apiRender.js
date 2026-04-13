export default function apiUrl() {
  const config = useRuntimeConfig();
  const apis = new Map();
  apis.set("local", "http://localhost:4000/app");
  apis.set("development", "https://desarrollo-i953.onrender.com/app");
  apis.set("dev", "https://desarrollo-i953.onrender.com/app");
  apis.set("test", "https://desarrollo-i953.onrender.com/app");
  apis.set("production", "https://vxpdfprod.unabase.com/vxback/app");
  const apiUrl = useCookie("apiUrl");
  // apiUrl.value == undefined ? (apiUrl.value = "dev") : "";

  let env = apiUrl.value || config.public.API_URL.trim();
  const api = apis.get(env);
  return api;
}
