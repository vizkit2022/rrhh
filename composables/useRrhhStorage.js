/**
 * composables/useRrhhStorage.js
 * ─────────────────────────────────────────────────────────────────
 * Capa de persistencia LocalStorage para el módulo RRHH.
 * Temporal — diseñado para migrar a MongoDB con mínimos cambios.
 *
 * Cada colección vive en su propia clave localStorage.
 * Se exportan funciones CRUD genéricas + helpers específicos.
 *
 * Uso:
 *   const { getAll, save, remove, clear } = useRrhhStorage('rrhh_marcaciones')
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Keys de colecciones ────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  trabajadores:  'rrhh_trabajadores',
  contratos:     'rrhh_contratos',
  liquidaciones: 'rrhh_liquidaciones',
  turnos:        'rrhh_turnos',
  marcaciones:   'rrhh_marcaciones',
  proyectos:     'rrhh_proyectos',
  tokens:        'rrhh_portal_tokens',
  firmas:        'rrhh_firmas',
}

// ─── UUID simple (sin dependencia) ─────────────────────────────────────────
export const genId = (prefix = 'id') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ─── CRUD genérico ───────────────────────────────────────────────────────────

/**
 * Devuelve el composable CRUD para una colección.
 * @param {string} key  — clave en STORAGE_KEYS o clave custom
 */
export function useRrhhStorage(key) {
  // ── Leer todo ────────────────────────────────────────────────────────────
  function getAll() {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }

  // ── Leer por id ──────────────────────────────────────────────────────────
  function getById(id) {
    return getAll().find(r => r.id === id) || null
  }

  // ── Guardar / crear o actualizar ─────────────────────────────────────────
  function save(record) {
    const all = getAll()
    if (!record.id) {
      // Nuevo registro
      const newRecord = { ...record, id: genId(), creado: new Date().toISOString() }
      all.push(newRecord)
      _write(all)
      return newRecord
    } else {
      // Actualizar existente
      const idx = all.findIndex(r => r.id === record.id)
      if (idx === -1) {
        all.push({ ...record, creado: record.creado || new Date().toISOString() })
      } else {
        all[idx] = { ...all[idx], ...record, actualizado: new Date().toISOString() }
      }
      _write(all)
      return record
    }
  }

  // ── Eliminar por id ──────────────────────────────────────────────────────
  function remove(id) {
    const all = getAll().filter(r => r.id !== id)
    _write(all)
  }

  // ── Reemplazar toda la colección ─────────────────────────────────────────
  function setAll(records) {
    _write(records)
  }

  // ── Vaciar colección ─────────────────────────────────────────────────────
  function clear() {
    localStorage.removeItem(key)
  }

  function _write(data) {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(data))
  }

  return { getAll, getById, save, remove, setAll, clear }
}

// ─── Seed data inicial ───────────────────────────────────────────────────────
// Se llama una vez desde useAsistenciaStore si la colección está vacía.

export function seedTurnos() {
  const { getAll, setAll } = useRrhhStorage(STORAGE_KEYS.turnos)
  if (getAll().length > 0) return
  setAll([
    {
      id: 'turno_001',
      nombre: 'Jornada Completa (Ley)',
      descripcion: '40 hrs semanales, lunes a viernes',
      hora_entrada: '09:00',
      hora_salida: '18:00',
      horas_diarias: 8,
      horas_semanales: 40,
      colacion_min: 60,
      dias_semana: [1, 2, 3, 4, 5],
      tipo: 'completa',
      tolerancia_atraso_min: 5,
      activo: true,
      creado: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'turno_002',
      nombre: 'Rodaje Largo (12 hrs)',
      descripcion: 'Turno extendido para días de rodaje',
      hora_entrada: '07:00',
      hora_salida: '20:00',
      horas_diarias: 12,
      horas_semanales: 60,
      colacion_min: 60,
      dias_semana: [1, 2, 3, 4, 5, 6],
      tipo: 'especial',
      tolerancia_atraso_min: 15,
      activo: true,
      creado: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'turno_003',
      nombre: 'Part Time Mañana',
      descripcion: 'Media jornada, 20 hrs semanales',
      hora_entrada: '09:00',
      hora_salida: '13:00',
      horas_diarias: 4,
      horas_semanales: 20,
      colacion_min: 0,
      dias_semana: [1, 2, 3, 4, 5],
      tipo: 'part_time',
      tolerancia_atraso_min: 5,
      activo: true,
      creado: '2026-01-01T00:00:00.000Z',
    },
  ])
}

export function seedProyectos() {
  const { getAll, setAll } = useRrhhStorage(STORAGE_KEYS.proyectos)
  if (getAll().length > 0) return
  setAll([
    {
      id: 'proj_001',
      nombre: 'Serie Patagonia',
      codigo: 'PROD-001',
      descripcion: 'Producción serie documental Patagonia 2026',
      color: '#3ac7a5',
      activo: true,
      lineas: [
        { id: 'lp_001', nombre: 'Director de Arte',    codigo: '1100', tipo: 'gasto', cuenta: '33222' },
        { id: 'lp_002', nombre: 'Fotografía',          codigo: '1101', tipo: 'gasto', cuenta: '33222' },
        { id: 'lp_003', nombre: 'Producción General',  codigo: '1102', tipo: 'gasto', cuenta: '33222' },
        { id: 'lp_004', nombre: 'Postproducción',      codigo: '1103', tipo: 'gasto', cuenta: '33222' },
      ],
      creado: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'proj_002',
      nombre: 'Campaña Verano 2026',
      codigo: 'MKT-003',
      descripcion: 'Campaña publicitaria Verano',
      color: '#f4a261',
      activo: true,
      lineas: [
        { id: 'lp_005', nombre: 'Dirección Creativa', codigo: '2100', tipo: 'gasto', cuenta: '33222' },
        { id: 'lp_006', nombre: 'Producción',         codigo: '2101', tipo: 'gasto', cuenta: '33222' },
      ],
      creado: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'proj_000',
      nombre: 'Gastos RRHH Generales',
      codigo: 'RRHH-GEN',
      descripcion: 'Centro de costo para sueldos sin proyecto asignado',
      color: '#858cf0',
      activo: true,
      lineas: [
        { id: 'lp_007', nombre: 'Sueldos',       codigo: '33222', tipo: 'gasto', cuenta: '33222' },
        { id: 'lp_008', nombre: 'Horas Extra',   codigo: '33223', tipo: 'gasto', cuenta: '33223' },
        { id: 'lp_009', nombre: 'Bonificaciones',codigo: '33224', tipo: 'gasto', cuenta: '33224' },
      ],
      creado: '2026-01-01T00:00:00.000Z',
    },
  ])
}

export function seedTokens(trabajadores = []) {
  const { getAll, setAll } = useRrhhStorage(STORAGE_KEYS.tokens)
  if (getAll().length > 0) return

  // IDs de trabajadores mock — rrhh.js usa _id: "1","2","3","4"
  const mockIds = trabajadores.length > 0
    ? trabajadores.map(t => t._id || t.id)
    : ['1', '2', '3', '4']

  const tokens = mockIds.map(wid => ({
    id: `token_${wid}`,
    token: `w${wid}_${Math.random().toString(36).slice(2, 10)}`,
    trabajador_id: wid,
    activo: true,
    creado: '2026-01-01T00:00:00.000Z',
  }))
  setAll(tokens)
}

export function seedMarcaciones() {
  const { getAll, setAll } = useRrhhStorage(STORAGE_KEYS.marcaciones)
  if (getAll().length > 0) return

  // Genera marcaciones de los últimos 14 días para 4 trabajadores
  // Los IDs corresponden a _id del store rrhh.js: "1","2","3","4"
  const trabajadores = [
    { id: '1', turno_id: 'turno_001', proyecto_id: 'proj_000', linea_id: 'lp_007' },
    { id: '2', turno_id: 'turno_002', proyecto_id: 'proj_001', linea_id: 'lp_001' },
    { id: '3', turno_id: 'turno_001', proyecto_id: 'proj_001', linea_id: 'lp_003' },
    { id: '4', turno_id: 'turno_002', proyecto_id: 'proj_002', linea_id: 'lp_005' },
  ]

  const marcaciones = []
  const hoy = new Date('2026-04-09')

  for (let d = 13; d >= 1; d--) {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - d)
    const dow = fecha.getDay() // 0=dom, 6=sab
    if (dow === 0 || dow === 6) continue // sin marcaciones fin de semana

    const fechaStr = fecha.toISOString().split('T')[0]

    for (const t of trabajadores) {
      const esTurno12 = t.turno_id === 'turno_002'
      const horaEntradaBase = esTurno12 ? 7 : 9
      const horaSalidaBase  = esTurno12 ? 20 : 18

      // Variación aleatoria determinista
      const seed = (parseInt(t.id.replace('w', '')) + d) % 10
      const atrasoMin = seed < 3 ? seed * 3 : 0 // 0, 3, o 6 minutos de atraso
      const minEntrada = atrasoMin

      const entradaH = horaEntradaBase
      const entradaM = minEntrada
      const salidaH  = horaSalidaBase
      const salidaM  = (seed % 3) * 10

      const entrada = `${String(entradaH).padStart(2,'0')}:${String(entradaM).padStart(2,'0')}`
      const salida  = `${String(salidaH).padStart(2,'0')}:${String(salidaM).padStart(2,'0')}`
      const horas   = (salidaH + salidaM/60) - (entradaH + entradaM/60)
      const horasExtra = Math.max(0, horas - (esTurno12 ? 12 : 8))

      marcaciones.push({
        id: `marc_${t.id}_${fechaStr}`,
        trabajador_id: t.id,
        turno_id: t.turno_id,
        proyecto_id: t.proyecto_id,
        linea_id: t.linea_id,
        fecha: fechaStr,
        entrada,
        salida,
        horas_trabajadas: Math.round(horas * 100) / 100,
        horas_extra: Math.round(horasExtra * 100) / 100,
        atraso_minutos: atrasoMin,
        tipo: horasExtra > 0 ? 'extra' : atrasoMin > 0 ? 'tardanza' : 'normal',
        estado: 'aprobado',
        observaciones: '',
        modificado_por_supervisor: false,
        ubicacion: null,
        creado: `${fechaStr}T${entrada}:00.000Z`,
      })
    }
  }

  // Hoy: solo entrada (sin salida todavía para algunos)
  const fechaHoy = '2026-04-09'
  const trabajadoresHoy = [
    { id: '1', turno_id: 'turno_001', proyecto_id: 'proj_000', linea_id: 'lp_007', entrada: '09:02' },
    { id: '2', turno_id: 'turno_002', proyecto_id: 'proj_001', linea_id: 'lp_001', entrada: '07:11' },
    { id: '3', turno_id: 'turno_001', proyecto_id: 'proj_001', linea_id: 'lp_003', entrada: null },   // ausente
    { id: '4', turno_id: 'turno_002', proyecto_id: 'proj_002', linea_id: 'lp_005', entrada: '07:00' },
  ]

  for (const t of trabajadoresHoy) {
    if (!t.entrada) {
      marcaciones.push({
        id: `marc_${t.id}_${fechaHoy}`,
        trabajador_id: t.id,
        turno_id: t.turno_id,
        proyecto_id: t.proyecto_id,
        linea_id: t.linea_id,
        fecha: fechaHoy,
        entrada: null,
        salida: null,
        horas_trabajadas: 0,
        horas_extra: 0,
        atraso_minutos: 0,
        tipo: 'ausencia',
        estado: 'pendiente',
        observaciones: '',
        modificado_por_supervisor: false,
        ubicacion: null,
        creado: `${fechaHoy}T09:00:00.000Z`,
      })
    } else {
      const [h, m] = t.entrada.split(':').map(Number)
      const turnoEntrada = t.turno_id === 'turno_002' ? 7 : 9
      const atraso = Math.max(0, (h * 60 + m) - turnoEntrada * 60)
      marcaciones.push({
        id: `marc_${t.id}_${fechaHoy}`,
        trabajador_id: t.id,
        turno_id: t.turno_id,
        proyecto_id: t.proyecto_id,
        linea_id: t.linea_id,
        fecha: fechaHoy,
        entrada: t.entrada,
        salida: null,
        horas_trabajadas: 0,
        horas_extra: 0,
        atraso_minutos: atraso,
        tipo: atraso > 5 ? 'tardanza' : 'normal',
        estado: 'pendiente',
        observaciones: '',
        modificado_por_supervisor: false,
        ubicacion: null,
        creado: `${fechaHoy}T${t.entrada}:00.000Z`,
      })
    }
  }

  setAll(marcaciones)
}
