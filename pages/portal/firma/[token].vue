<template>
  <div class="firma-portal">

    <!-- Loading -->
    <div v-if="step === 'loading'" class="step-center">
      <div class="spinner-lg"></div>
      <p>Cargando documento…</p>
    </div>

    <!-- Error -->
    <div v-else-if="step === 'error'" class="step-center">
      <div class="error-icon">✕</div>
      <h2>Link inválido</h2>
      <p>{{ errorMsg }}</p>
    </div>

    <!-- Firmado OK -->
    <div v-else-if="step === 'firmado'" class="step-center">
      <div class="ok-icon">✓</div>
      <h2>Documento Firmado</h2>
      <p>{{ solicitud.trabajador_nombre }}, tu firma fue registrada el {{ fmtFecha(solicitud.fecha_firma) }}.</p>
      <div class="firma-preview" v-if="solicitud.firma_data">
        <img :src="solicitud.firma_data" alt="Tu firma" />
      </div>
      <p class="muted">Puedes cerrar esta ventana.</p>
    </div>

    <!-- Rechazado -->
    <div v-else-if="step === 'rechazado'" class="step-center">
      <div class="warn-icon">!</div>
      <h2>Documento Rechazado</h2>
      <p>Notificamos a RRHH tu decisión.</p>
      <p class="muted">Puedes cerrar esta ventana.</p>
    </div>

    <!-- Listo para firmar -->
    <template v-else-if="step === 'listo' || step === 'firmando'">

      <!-- Header -->
      <header class="portal-header">
        <div class="header-logo">
          <div class="logo-dot"></div>
          <span>Unabase RRHH</span>
        </div>
        <div class="header-badge" :class="`badge-tipo-${solicitud.tipo_documento}`">
          {{ labelTipoDoc(solicitud.tipo_documento) }}
        </div>
      </header>

      <!-- Documento resumen -->
      <div class="doc-card">
        <div class="doc-header">
          <div class="doc-icon-wrap">
            <span class="doc-icon">{{ iconTipoDoc(solicitud.tipo_documento) }}</span>
          </div>
          <div class="doc-info">
            <h2>{{ solicitud.resumen?.titulo || labelTipoDoc(solicitud.tipo_documento) }}</h2>
            <p class="doc-trabajador">{{ solicitud.trabajador_nombre }}</p>
          </div>
          <div class="doc-estado-badge" :class="badgeEstado">
            {{ labelEstado }}
          </div>
        </div>

        <div class="doc-details">
          <div class="dd-row" v-if="solicitud.resumen?.cargo">
            <span class="dd-label">Cargo</span>
            <span class="dd-value">{{ solicitud.resumen.cargo }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.fecha_inicio">
            <span class="dd-label">Inicio</span>
            <span class="dd-value">{{ fmtFecha(solicitud.resumen.fecha_inicio) }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.fecha_termino">
            <span class="dd-label">Término</span>
            <span class="dd-value">{{ fmtFecha(solicitud.resumen.fecha_termino) }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.sueldo_base">
            <span class="dd-label">Remuneración</span>
            <span class="dd-value teal">{{ fmtCLP(solicitud.resumen.sueldo_base) }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.negocio">
            <span class="dd-label">Proyecto</span>
            <span class="dd-value">{{ solicitud.resumen.negocio }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.periodo">
            <span class="dd-label">Período</span>
            <span class="dd-value">{{ solicitud.resumen.periodo }}</span>
          </div>
          <div class="dd-row" v-if="solicitud.resumen?.liquido_pagar">
            <span class="dd-label">Líquido</span>
            <span class="dd-value teal">{{ fmtCLP(solicitud.resumen.liquido_pagar) }}</span>
          </div>
        </div>

        <div class="doc-legal">
          Al firmar este documento, {{ solicitud.trabajador_nombre }} declara haber leído y
          aceptado el contenido del {{ labelTipoDoc(solicitud.tipo_documento).toLowerCase() }}
          indicado arriba. La firma tiene validez legal conforme a la Ley 19.799 sobre
          documentos electrónicos.
        </div>
      </div>

      <!-- ── FIRMA DIGITAL ─────────────────────────────────────────────── -->
      <div v-if="solicitud.tipo_firma === 'digital'" class="firma-digital-card">
        <div class="fd-icon">✉</div>
        <h3>Firma Electrónica Simple</h3>
        <p>
          Al presionar <strong>Confirmar Firma</strong>, aceptas el documento y tu
          confirmación quedará registrada con fecha, hora e identificador único.
        </p>
        <div class="fd-meta">
          <span>🕐 {{ horaActual }}</span>
          <span>📅 {{ fechaHoy }}</span>
        </div>
      </div>

      <!-- ── FIRMA MANUAL (canvas) ─────────────────────────────────────── -->
      <div v-else class="firma-manual-card">
        <div class="fm-header">
          <h3>Firma en Pantalla</h3>
          <button class="btn-clear-firma" @click="clearCanvas">Borrar</button>
        </div>
        <p class="fm-instruccion">Firma dentro del recuadro con tu dedo o stylus</p>
        <div class="canvas-wrap" ref="canvasWrap">
          <canvas
            ref="canvasEl"
            class="firma-canvas"
            :width="canvasW"
            :height="canvasH"
            @mousedown="startDraw"
            @mousemove="draw"
            @mouseup="stopDraw"
            @mouseleave="stopDraw"
            @touchstart.prevent="startDrawTouch"
            @touchmove.prevent="drawTouch"
            @touchend.prevent="stopDraw"
          ></canvas>
          <div v-if="!hasDrawn" class="canvas-placeholder">
            <span>✍ Firma aquí</span>
          </div>
        </div>
        <p class="fm-hint" v-if="hasDrawn">Firma capturada — puedes ajustarla o confirmar</p>
      </div>

      <!-- Footer de acciones -->
      <div class="firma-actions">
        <button class="btn-rechazar" :disabled="procesando" @click="rechazar">
          Rechazar
        </button>
        <button
          class="btn-firmar"
          :disabled="procesando || (solicitud.tipo_firma === 'manual' && !hasDrawn)"
          @click="confirmarFirma"
        >
          <span v-if="procesando">Procesando…</span>
          <span v-else>{{ solicitud.tipo_firma === 'manual' ? '✍ Enviar Firma' : '✓ Enviar Firma' }}</span>
        </button>
      </div>

      <!-- Hora en tiempo real -->
      <p class="portal-time">{{ horaActual }} · {{ fechaHoy }}</p>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useFirmasStore } from '@/stores/firmas'

definePageMeta({ layout: false })

const route      = useRoute()
const firmasStore = useFirmasStore()

// ── Estado ────────────────────────────────────────────────────────────────
const step       = ref('loading')
const errorMsg   = ref('')
const solicitud  = ref(null)
const procesando = ref(false)

// Canvas (firma manual)
const canvasEl   = ref(null)
const canvasWrap = ref(null)
const canvasW    = ref(340)
const canvasH    = ref(180)
const hasDrawn   = ref(false)
let drawing      = false
let ctx          = null
let lastX        = 0
let lastY        = 0

// Reloj
const horaActual = ref('')
const fechaHoy   = ref('')
let clockInterval = null

// ── Helpers ───────────────────────────────────────────────────────────────
function tick() {
  const now = new Date()
  horaActual.value = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  fechaHoy.value   = now.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtFecha(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return d }
}

function fmtCLP(n) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function labelTipoDoc(tipo) {
  return { contrato: 'Contrato', finiquito: 'Finiquito', liquidacion: 'Liquidación' }[tipo] || tipo
}

function iconTipoDoc(tipo) {
  return { contrato: '📄', finiquito: '📋', liquidacion: '💰' }[tipo] || '📄'
}

const labelEstado = computed(() => {
  if (!solicitud.value) return ''
  return { pendiente: 'Pendiente de firma', firmado: 'Firmado', rechazado: 'Rechazado' }[solicitud.value.estado] || ''
})

const badgeEstado = computed(() => {
  if (!solicitud.value) return ''
  return `estado-${solicitud.value.estado}`
})

// ── Canvas — inicializar ──────────────────────────────────────────────────
async function initCanvas() {
  await nextTick()
  if (!canvasEl.value) return

  // Ajustar al ancho del contenedor
  if (canvasWrap.value) {
    canvasW.value = canvasWrap.value.clientWidth || 340
  }

  ctx = canvasEl.value.getContext('2d')
  ctx.strokeStyle = '#1a2535'
  ctx.lineWidth   = 2.5
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  // Fondo blanco
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
}

function getPos(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  const scaleX = canvasEl.value.width  / rect.width
  const scaleY = canvasEl.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  }
}

function getTouchPos(e) {
  const touch = e.touches[0]
  const rect  = canvasEl.value.getBoundingClientRect()
  const scaleX = canvasEl.value.width  / rect.width
  const scaleY = canvasEl.value.height / rect.height
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top)  * scaleY,
  }
}

function startDraw(e) {
  drawing = true
  const { x, y } = getPos(e)
  lastX = x; lastY = y
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e) {
  if (!drawing) return
  const { x, y } = getPos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x; lastY = y
  hasDrawn.value = true
}

function startDrawTouch(e) {
  drawing = true
  const { x, y } = getTouchPos(e)
  lastX = x; lastY = y
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function drawTouch(e) {
  if (!drawing) return
  const { x, y } = getTouchPos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x; lastY = y
  hasDrawn.value = true
}

function stopDraw() {
  drawing = false
}

function clearCanvas() {
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
  hasDrawn.value = false
}

// ── Confirmar firma ───────────────────────────────────────────────────────
async function confirmarFirma() {
  if (procesando.value) return
  procesando.value = true

  try {
    let firma_data = null

    if (solicitud.value.tipo_firma === 'manual' && canvasEl.value) {
      firma_data = canvasEl.value.toDataURL('image/png')
    }

    firmasStore.firmarDocumento({
      token: route.params.token,
      firma_data,
      ip: null,
    })

    solicitud.value = firmasStore.getSolicitudByToken(route.params.token)
    step.value = 'firmado'
  } catch (e) {
    console.error(e)
  } finally {
    procesando.value = false
  }
}

async function rechazar() {
  if (procesando.value) return
  if (!confirm('¿Confirmas que deseas rechazar este documento?')) return
  procesando.value = true

  firmasStore.rechazarFirma({ token: route.params.token })
  step.value = 'rechazado'
  procesando.value = false
}

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  tick()
  clockInterval = setInterval(tick, 1000)

  firmasStore.init()
  const token = route.params.token
  const sol   = firmasStore.getSolicitudByToken(token)

  if (!sol) {
    errorMsg.value = 'Este link de firma no existe o ya expiró. Solicita uno nuevo a RRHH.'
    step.value = 'error'
    return
  }

  solicitud.value = sol

  if (sol.estado === 'firmado') {
    step.value = 'firmado'
    return
  }
  if (sol.estado === 'rechazado') {
    step.value = 'rechazado'
    return
  }

  step.value = 'listo'

  // Inicializar canvas si es firma manual
  if (sol.tipo_firma === 'manual') {
    await initCanvas()
  }
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0f1923;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #f3f4f6;
  min-height: 100vh;
}
</style>

<style scoped>
.firma-portal {
  min-height: 100vh;
  background: linear-gradient(160deg, #0f1923 0%, #162030 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 40px;
  max-width: 480px;
  margin: 0 auto;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.portal-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
}

.logo-dot {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #2a9d8f, #3ac7a5);
  border-radius: 8px;
}

.header-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge-tipo-contrato    { background: rgba(58,199,165,0.15); color: #3ac7a5; }
.badge-tipo-finiquito   { background: rgba(239,68,68,0.15);  color: #f87171; }
.badge-tipo-liquidacion { background: rgba(251,191,36,0.15); color: #fbbf24; }

/* ── Documento card ─────────────────────────────────────────────────────── */
.doc-card {
  width: calc(100% - 32px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  margin: 20px 16px 0;
  overflow: hidden;
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.doc-icon-wrap {
  width: 44px; height: 44px;
  background: rgba(58,199,165,0.12);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.doc-info { flex: 1; }
.doc-info h2 { font-size: 15px; font-weight: 700; color: #f3f4f6; line-height: 1.3; }
.doc-trabajador { font-size: 12px; color: #9ca3af; margin-top: 2px; }

.doc-estado-badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 9px; border-radius: 12px;
  text-transform: uppercase; letter-spacing: 0.05em;
  flex-shrink: 0;
}
.estado-pendiente { background: rgba(251,191,36,0.15); color: #fbbf24; }
.estado-firmado   { background: rgba(58,199,165,0.15); color: #3ac7a5; }
.estado-rechazado { background: rgba(239,68,68,0.15);  color: #f87171; }

.doc-details {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dd-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.dd-row:last-child { border-bottom: none; padding-bottom: 0; }
.dd-label { color: #9ca3af; }
.dd-value { font-weight: 600; color: #f3f4f6; }
.dd-value.teal { color: #3ac7a5; }

.doc-legal {
  padding: 12px 16px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
  border-top: 1px solid rgba(255,255,255,0.04);
  background: rgba(0,0,0,0.15);
}

/* ── Firma Digital ──────────────────────────────────────────────────────── */
.firma-digital-card {
  width: calc(100% - 32px);
  background: rgba(58,199,165,0.06);
  border: 1px solid rgba(58,199,165,0.2);
  border-radius: 16px;
  margin: 16px 16px 0;
  padding: 20px;
  text-align: center;
}

.fd-icon {
  font-size: 36px;
  margin-bottom: 10px;
  opacity: 0.8;
}

.firma-digital-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #3ac7a5;
  margin-bottom: 8px;
}

.firma-digital-card p {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
}

.fd-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 14px;
  font-size: 12px;
  color: #6b7280;
}

/* ── Firma Manual (canvas) ──────────────────────────────────────────────── */
.firma-manual-card {
  width: calc(100% - 32px);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  margin: 16px 16px 0;
  padding: 16px;
}

.fm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.fm-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
}

.btn-clear-firma {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-clear-firma:hover { background: rgba(239,68,68,0.2); }

.fm-instruccion {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.canvas-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 2px dashed rgba(58,199,165,0.3);
  background: #ffffff;
  width: 100%;
}

.firma-canvas {
  display: block;
  width: 100%;
  height: 180px;
  cursor: crosshair;
  touch-action: none;
}

.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.canvas-placeholder span {
  font-size: 20px;
  color: #c0c0c0;
  font-weight: 300;
}

.fm-hint {
  font-size: 11px;
  color: #3ac7a5;
  margin-top: 8px;
  text-align: center;
}

/* ── Actions ────────────────────────────────────────────────────────────── */
.firma-actions {
  position: sticky;
  bottom: 0;
  z-index: 10;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
  padding: 14px 16px 20px;
  margin: 0;
  background: linear-gradient(to top, #111827 80%, transparent);
  box-sizing: border-box;
}

.btn-rechazar {
  background: rgba(239,68,68,0.08);
  border: 1.5px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 12px;
  padding: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-rechazar:hover:not(:disabled) { background: rgba(239,68,68,0.18); }
.btn-rechazar:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-firmar {
  background: linear-gradient(135deg, #2a9d8f, #3ac7a5);
  border: none;
  color: #fff;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  box-shadow: 0 4px 16px rgba(42,157,143,0.3);
}
.btn-firmar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-firmar:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* ── Portal time ────────────────────────────────────────────────────────── */
.portal-time {
  font-size: 11px;
  color: #4b5563;
  text-align: center;
  margin-top: 20px;
}

/* ── States (loading / error / firmado) ─────────────────────────────────── */
.step-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 14px;
}

.spinner-lg {
  width: 48px; height: 48px;
  border: 3px solid rgba(58,199,165,0.2);
  border-top-color: #3ac7a5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ok-icon {
  width: 64px; height: 64px;
  background: rgba(58,199,165,0.15);
  border: 2px solid #3ac7a5;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #3ac7a5;
}

.error-icon {
  width: 64px; height: 64px;
  background: rgba(239,68,68,0.12);
  border: 2px solid #f87171;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; color: #f87171;
}

.warn-icon {
  width: 64px; height: 64px;
  background: rgba(251,191,36,0.12);
  border: 2px solid #fbbf24;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #fbbf24;
}

.step-center h2 { font-size: 20px; font-weight: 700; }
.step-center p   { font-size: 14px; color: #9ca3af; max-width: 300px; line-height: 1.5; }
.step-center .muted { font-size: 12px; color: #6b7280; }

.firma-preview {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  width: 240px;
}
.firma-preview img { width: 100%; height: auto; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive — aprovechar toda la pantalla en móvil */
@media (max-width: 480px) {
  .firma-portal { max-width: 100%; }
  .firma-actions { grid-template-columns: 1fr 1.8fr; }
}
</style>
