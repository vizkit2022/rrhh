/**
 * stores/firmas.js
 * ─────────────────────────────────────────────────────────────────
 * Módulo de firmas digitales y manuales para contratos, finiquitos
 * y liquidaciones. Persistencia: localStorage → MongoDB.
 * ─────────────────────────────────────────────────────────────────
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRrhhStorage, STORAGE_KEYS, genId } from '@/composables/useRrhhStorage'

export const useFirmasStore = defineStore('firmas', () => {

  const solicitudes = ref([])
  const firmasSt    = useRrhhStorage(STORAGE_KEYS.firmas)

  // ── Cargar desde localStorage ─────────────────────────────────────────────
  function init() {
    solicitudes.value = firmasSt.getAll()
  }

  function reload() {
    solicitudes.value = firmasSt.getAll()
  }

  // ── Crear solicitud de firma ──────────────────────────────────────────────
  /**
   * @param {Object} params
   * @param {string} params.tipo_documento  'contrato' | 'finiquito' | 'liquidacion'
   * @param {string} params.documento_id    _id del documento
   * @param {string} params.trabajador_id
   * @param {string} params.trabajador_nombre
   * @param {string} params.trabajador_email
   * @param {string} params.tipo_firma      'digital' | 'manual'
   * @param {Object} params.resumen         Snapshot del documento para mostrarlo en el portal
   */
  function crearSolicitud({
    tipo_documento, documento_id,
    trabajador_id, trabajador_nombre, trabajador_email,
    tipo_firma = 'manual',
    resumen = {},
  }) {
    const token = `${genId('firma')}_${Math.random().toString(36).slice(2, 10)}`
    const solicitud = {
      id:                genId('firma'),
      token,
      tipo_documento,
      documento_id,
      trabajador_id,
      trabajador_nombre,
      trabajador_email:  trabajador_email || '',
      tipo_firma,
      estado:            'pendiente',       // pendiente | firmado | rechazado
      fecha_solicitud:   new Date().toISOString(),
      fecha_firma:       null,
      firma_data:        null,              // base64 del trazo para firma manual
      firma_tipo_trazo:  null,              // 'canvas' | 'digital'
      ip_firma:          null,
      resumen,                              // snapshot para mostrar en el portal
    }
    firmasSt.save(solicitud)
    reload()
    return solicitud
  }

  // ── Marcar como firmado ───────────────────────────────────────────────────
  function firmarDocumento({ token, firma_data = null, ip = null }) {
    const all = firmasSt.getAll()
    const idx = all.findIndex(s => s.token === token)
    if (idx === -1) return null
    const updated = {
      ...all[idx],
      estado:          'firmado',
      fecha_firma:     new Date().toISOString(),
      firma_data:      firma_data || null,
      firma_tipo_trazo: firma_data ? 'canvas' : 'digital',
      ip_firma:        ip,
    }
    firmasSt.save(updated)
    reload()
    return updated
  }

  // ── Marcar como rechazado ─────────────────────────────────────────────────
  function rechazarFirma({ token, motivo = '' }) {
    const all = firmasSt.getAll()
    const idx = all.findIndex(s => s.token === token)
    if (idx === -1) return null
    const updated = {
      ...all[idx],
      estado:        'rechazado',
      fecha_firma:   new Date().toISOString(),
      motivo_rechazo: motivo,
    }
    firmasSt.save(updated)
    reload()
    return updated
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  function getSolicitudByToken(token) {
    return solicitudes.value.find(s => s.token === token) || null
  }

  function getSolicitudesTrabajador(trabajador_id) {
    return solicitudes.value.filter(s => s.trabajador_id === trabajador_id)
  }

  function getSolicitudesDocumento(documento_id) {
    return solicitudes.value.filter(s => s.documento_id === documento_id)
  }

  function getEstadoFirma(documento_id) {
    const solis = getSolicitudesDocumento(documento_id)
    if (!solis.length) return null
    const firmada = solis.find(s => s.estado === 'firmado')
    if (firmada) return { estado: 'firmado', fecha: firmada.fecha_firma, tipo: firmada.firma_tipo_trazo }
    const pendiente = solis.find(s => s.estado === 'pendiente')
    if (pendiente) return { estado: 'pendiente', fecha: pendiente.fecha_solicitud, tipo: pendiente.tipo_firma }
    return { estado: 'rechazado', fecha: solis[0].fecha_firma }
  }

  // ── URL del portal de firma ───────────────────────────────────────────────
  function getPortalUrl(token) {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${base}/portal/firma/${token}`
  }

  return {
    solicitudes,
    init, reload,
    crearSolicitud,
    firmarDocumento,
    rechazarFirma,
    getSolicitudByToken,
    getSolicitudesTrabajador,
    getSolicitudesDocumento,
    getEstadoFirma,
    getPortalUrl,
  }
})
