<script setup>
import { ref, onMounted, computed } from "vue";
import useDocumentTrayStore from "@/stores/documentTray";

// STORE
const documentTrayStore = useDocumentTrayStore();

// EMITS
const emit = defineEmits(["closeModal", "changeStep"]);

// CONSTANTS
const progress = ref(0);
const isUploading = ref(false);
const showManualOption = ref(false); // bandera para mostrar textos y botones
const headerText = ref(""); // texto arriba de la barra
const bottomText = ref(""); // texto largo abajo

// COMPUTED
const totalFiles = computed(() => documentTrayStore.forms.updaloadDocument.files.length);

// FUNCTIONS
const startUpload = () => {
  if (totalFiles.value === 0) return;

  isUploading.value = true;
  progress.value = 0;

  // Mensaje inicial según cantidad de archivos
  if (totalFiles.value > 1) {
    headerText.value = `1 DE ${totalFiles.value} DOCUMENTOS SUBIDOS`;
  } else {
    headerText.value = "SUBIENDO EL DOCUMENTO";
  }

  let currentFile = 1;

  const interval = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 2.5;
    } else {
      clearInterval(interval);
      isUploading.value = false;
      emit("closeModal");
    }
  }, 300);

  // Mostrar opción manual y actualizar textos después de 5 segundos
// Mostrar opción manual después de 5 segundos
setTimeout(() => {
  showManualOption.value = true;

  if (totalFiles.value > 1) {
    bottomText.value =
      "Si no deseas esperar mientras se extrae la información, haz clic en el botón para salir. Los documentos se procesarán en segundo plano.";

    // Actualizar texto arriba de la barra progresivamente
    let currentFile = 1;
    let processedInterval = setInterval(() => {
      if (currentFile < totalFiles.value) {
        currentFile++;
        headerText.value = `${currentFile} DE ${totalFiles.value} ARCHIVOS PROCESADOS`;
      } else {
        clearInterval(processedInterval);
      }
    }, 1000);

  } else if (totalFiles.value === 1) {
    // Para 1 archivo
    headerText.value = "PROCESANDO DOCUMENTO...";
    bottomText.value =
      "Si no quieres esperar que el sistema extraiga la información, puedes ingresar la información de manera manual haciendo clic en el botón.";
  }
}, 5000);

};

// Función para botón
const nextStep = () => {
  emit("changeStep", true);
};

onMounted(() => {
  startUpload();
});
</script>

<template>
  <div class="container_step2">
    <div class="header">
      <span class="body-l-sb">Subir Documentos</span>
      <u-button-icon
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        size="l"
        style="border-radius: 50%"
        @click="emit('closeModal')"
      />
    </div>

    <div class="body">
      <img
        v-if="!showManualOption"
        style="margin: 0 auto"
        src="/img/personUpload.svg"
        alt="person upload"
      />
      <img
        v-if="showManualOption"
        style="margin: 0 auto"
        src="/img/personAwait.svg"
        alt="person await"
      />

      <div class="container_progress">
        <span class="body-s-r">{{ headerText }}</span>
        <div class="container_progress_bar">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <div class="container_textProccess" :class="{ 'show': showManualOption }" v-if="showManualOption">
        <span class="body-l-sb">{{ bottomText }}</span>
      </div>
    </div>

    <div class="actions">
      <!-- Botón siempre disponible para ingresar manualmente -->
      <u-button
        v-if="showManualOption && totalFiles === 1"
        text="Ingresar información manualmente"
        icon="information"
        type="outlined"
        @click="nextStep"
      />

      <!-- Botón solo si hay más de 1 archivo -->
      <u-button
        v-if="showManualOption && totalFiles > 1"
        text="Procesar en segundo plano"
        icon="information"
        type="outlined"
        @click="emit('closeModal')"
      />
    </div>
  </div>
</template>

<style scoped>
.container_step2 {
  display: grid;
  grid-template-rows: 40px 1fr;
  gap: 24px;
  height: 650px;
  width: 679px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.body {
  display: grid;
  grid-template-rows: 200px 40px 64px;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  height: 100%;
  margin-top: 64px;
}

.container_progress {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.container_progress span {
  color: var(--neutral-text-caption);
}

.container_progress_bar {
  width: 511px;
  height: 12px;
  background: var(--neutral-surface-light);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: var(--secondary-surface-harder);
  width: 0;
  transition: width 0.3s linear;
  position: relative;
  border-radius: 6px;
}

.container_textProccess {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 511px;
  color: var(--neutral-text-caption);
  text-align: justify;
}

.container_textProccess span:first-child {
  color: var(--neutral-text-body);
}

.container_textProccess span:last-child {
  color: var(--neutral-text-caption);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
