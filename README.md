# Unabase RRHH

Módulo de Recursos Humanos — Gestión de trabajadores, contratos, liquidaciones, asistencia y firmas digitales.

## Stack
- **Nuxt 3** + Vue 3 (Composition API)
- **Pinia** — gestión de estado con persistencia en localStorage
- **Python + ReportLab** — generación de PDFs (contratos, liquidaciones, finiquitos)

## Módulos incluidos
- Ficha de trabajadores (foto, datos personales, previsión)
- Contratos (indefinido, plazo fijo, proyecto, honorarios, part-time)
- Liquidaciones de sueldo
- Finiquitos
- Asistencia (portal móvil con marcaciones)
- Firmas digitales (portal móvil con canvas touch)

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy (Railway)

```bash
npm run build
# Start: node .output/server/index.mjs
```

## Variables de entorno

Ver `.env.example`
