<script setup>
import { ref, watch } from "vue";

// Props para v-model
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

// Emit para v-model
const emit = defineEmits(["update:modelValue"]);

const isDragging = ref(false);
const notAllowed = ref(false);

// Trabajamos directamente sobre modelValue
const files = ref([...props.modelValue]);

// Mantener sincronización si el padre cambia el valor
watch(
  () => props.modelValue,
  (newVal) => {
    files.value = [...newVal];
  }
);

// Función para actualizar modelValue
const updateFiles = (newFiles) => {
  files.value = [...newFiles];
  emit("update:modelValue", files.value);
};

// Eventos de arrastre
const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};
const handleDragLeave = () => {
  isDragging.value = false;
};
const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  handleFiles(Array.from(e.dataTransfer.files));
};

// Manejo de archivos
const handleFiles = (selectedFiles) => {
  const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  const newFiles = [...files.value];

  selectedFiles.forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      notAllowed.value = true;
      setTimeout(() => (notAllowed.value = false), 1500);
      return;
    }
    if (file.size > maxSize) {
      alert(`El archivo excede el tamaño máximo de 10 MB: ${file.name}`);
      return;
    }

    // Evitar duplicados de archivos arrastrados o seleccionados que se añadan
    const exists = newFiles.some(
      (f) =>
        f.name === file.name && f.size === file.size && f.type === file.type
    );
    if (!exists) newFiles.push(file);
  });

  updateFiles(newFiles);
};

const removeFile = (index) => {
  const newFiles = [...files.value];
  newFiles.splice(index, 1);
  updateFiles(newFiles);
};

// Abrir selector de archivos
const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".png, .jpg, .jpeg, .pdf";
  fileInput.multiple = true;
  fileInput.onchange = (e) => handleFiles(Array.from(e.target.files));
  fileInput.click();
};

// Obtener icono por tipo
const getMimeType = (file) => {
  const extension = file.name.split(".").pop().toLowerCase();
  const types = {
    pdf: "/img/iconsFile/PDF.svg",
    jpg: "/img/iconsFile/JPG.svg",
    jpeg: "/img/iconsFile/JPG.svg",
    png: "/img/iconsFile/PNG.svg",
  };
  return types[extension] || "unknown";
};
</script>

<template>
  <div
    class="container_fileDropZone"
    :class="{ active: isDragging, notAllowed: notAllowed }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="container_select_file" v-if="!isDragging && !notAllowed">
      <div class="header_text">
        <span>Arrastra y suelta tu documento aquí</span>
        <span>o haz clic en el botón para seleccionar un archivo</span>
      </div>

      <span
        v-if="files.length === 0"
        class="u u-upload"
        style="font-size: 66px; color: var(--neutral-text-caption)"
      ></span>

      <!-- Lista de archivos -->
      <div
        v-if="files.length && !isDragging"
        :class="['container_files', { multiple: files.length > 1 }]"
      >
        <div v-if="files.length === 1" class="one-file">
          <img
            class="imgMimeType"
            :src="getMimeType(files[0])"
            :alt="files[0].name"
          />
          <span :title="files[0].name" class="body-s-sb truncateText"
            >{{ files[0].name }}
          </span>
          <!-- <span class="body-s-sb">{{ getFileSize(files[0]) }}</span> -->
          <u-button-icon
            icon="close"
            type="text"
            color="--danger-border-default"
            color-hover="--danger-border-subtle"
            color-active="--danger-surface-shadow-12a"
            @action-btn="removeFile(0)"
          />
        </div>

        <div
          v-if="files.length > 1"
          v-for="(file, i) in files"
          :key="i"
          class="files"
        >
          <img class="imgMimeType" :src="getMimeType(file)" :alt="file.name" />
          <span :title="file.name" class="body-s-sb truncateText">{{
            file.name
          }}</span>
          <!-- <span class="body-s-sb">{{ getFileSize(file) }}</span> -->
          <u-button-icon
            icon="close"
            type="text"
            color="--danger-border-default"
            color-hover="--danger-border-subtle"
            color-active="--danger-surface-shadow-12a"
            @action-btn="removeFile(i)"
          />
        </div>
      </div>

      <u-button
        text="Seleccionar archivo"
        icon="attach"
        type="outlined"
        color="--secondary-border-default"
        color-text="--secondary-text-default"
        color-hover="--secondary-border-subtle"
        color-active="--secondary-surface-shadow-12a"
        @click="handleFileUpload"
      />
    </div>

    <div v-if="isDragging">
      <span class="body-l-sb" style="color: var(--neutral-text-body)"
        >¡Suéltalo!</span
      >
    </div>

    <div v-if="notAllowed">
      <span class="body-l-sb" style="color: var(--danger-border-default)"
        >Formato no permitido</span
      >
    </div>
  </div>
</template>

<style scoped>
.container_fileDropZone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 100%;
  width: 100%;
  border: 2px dashed var(--neutral-border-subtle);
  border-radius: 24px;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Estado activo (cuando se arrastra un archivo encima) */
.container_fileDropZone.active {
  border-color: var(--secondary-border-default);
  background-color: var(--secondary-surface-shadow-8a);
  transform: scale(1.02);
}

.container_fileDropZone::after {
  content: "";
  position: absolute;
  top: -150%;
  left: -150%;
  width: 400%;
  height: 400%;
  background: repeating-linear-gradient(
    135deg,
    transparent 0 8px,
    var(--secondary-border-default) 12px 14px
  );
  opacity: 0;
  animation: diagonal-sweep 28s linear infinite;
  transition: opacity 0.3s linear;
  pointer-events: none;
}

.container_fileDropZone.active::after {
  opacity: 0.3;
}

.container_fileDropZone.notAllowed {
  border-color: var(--danger-border-default);
  background-color: var(--danger-surface-shadow-8a);
}

/* Animación del barrido */
@keyframes diagonal-sweep {
  from {
    transform: translateX(-25%) translateY(-25%);
  }
  to {
    transform: translateX(25%) translateY(25%);
  }
}

/* Contenedor interno */
.container_select_file {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  width: 90%;
}

.container_select_file .header_text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.container_select_file .header_text span:first-child {
  color: var(--neutral-text-body);
}

.container_select_file .header_text span:last-child {
  color: var(--neutral-text-caption);
}

/* Input oculto */
.hidden-input {
  display: none;
}

/* Lista de archivos */

.container_files {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: auto;
  max-height: 168px;
  overflow: auto;
}

  .container_files::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .container_files::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: var(--neutral-border-subtle);
  }

  .container_files::-webkit-scrollbar-track {
    background-color: var(--neutral-border-darker);
    border-radius: 4px;
  }



.container_files .one-file {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  justify-content: center;
  align-items: center;
  padding: 0px 12px;
  gap: 12px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 16px;
  width: 100%;
  flex-shrink: 0;
  height: 48px;
}

.imgMimeType {
  width: 26px;
  height: 32px;
}

.container_files .one-file span {
  color: var(--neutral-text-body);
}

.container_files .files {
  display: grid;
  grid-template-columns: auto 1fr auto;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: 100%;
  flex-shrink: 0;
  height: 48px;
}

.container_files.multiple {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
}

.container_files.multiple .files {
  display: grid;
  grid-template-columns: auto 1fr auto;
  width: calc(32.5% - 6px);
  justify-content: flex-start;
  align-items: center;
  padding: 0px 12px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 16px;
  height: 48px;
  box-sizing: border-box;
}

.file_size {
  color: var(--neutral-text-subtle);
  font-size: 12px;
}
</style>
