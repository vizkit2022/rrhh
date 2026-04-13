export default function apiUrlRome() {
  const config = useRuntimeConfig();
  const apis = new Map();
  console.log(config.public.ROME_URL);
  apis.set("local", "http://localhost:5000/v1");
  apis.set("development", "http://localhost:5000/v1");
  apis.set("dev", "http://localhost:5000/v1");
  apis.set("test", "http://localhost:5000/v1");
  apis.set("produccion", "https://roma.unabase.cc/v1");

  let env = config.public.ROME_URL.trim();
  const api = apis.get(env);
  return api;
}
