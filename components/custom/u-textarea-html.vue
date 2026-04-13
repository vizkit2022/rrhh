<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  defineProps,
  defineEmits,
  watch,
  nextTick,
} from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  heightCustom: { type: String, default: "200px" },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  success: { type: Boolean, default: false },
  warning: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  isExpand: { type: Boolean, default: false },
  tooltipsConfig: {
    type: Object,
    default: () => ({
      bold: true,
      italic: true,
      underline: true,
      strike: true,
      font: true,
      size: true,
      listOrdered: true,
      listBullet: true,
      align: true,
      link: false,
      image: false,
      clean: true,
    }),
  },
});
const emit = defineEmits(["update:modelValue", "change"]);

const isFocused = ref(false);
const editorRef = ref(null);
const lastSavedValue = ref("");
const isUserInteraction = ref(false);
let quillInstance = null;

const borderColor = computed(() =>
  props.disabled
    ? "var(--neutral-text-disabled)"
    : props.error
      ? "var(--danger-text-default)"
      : props.success
        ? "var(--success-text-default)"
        : props.warning
          ? "var(--warning-text-default)"
          : "var(--neutral-border-subtle)",
);

const toolbarOptions = computed(() => {
  const options = [];
  const fontSizeRow = [];
  if (props.tooltipsConfig.font) fontSizeRow.push({ font: [] });
  if (props.tooltipsConfig.size) fontSizeRow.push({ size: [] });
  if (fontSizeRow.length) options.push(fontSizeRow);

  const formatRow = [];
  if (props.tooltipsConfig.bold) formatRow.push("bold");
  if (props.tooltipsConfig.italic) formatRow.push("italic");
  if (props.tooltipsConfig.underline) formatRow.push("underline");
  if (props.tooltipsConfig.strike) formatRow.push("strike");
  if (formatRow.length) options.push(formatRow);

  const listRow = [];
  if (props.tooltipsConfig.listOrdered) listRow.push({ list: "ordered" });
  if (props.tooltipsConfig.listBullet) listRow.push({ list: "bullet" });
  if (listRow.length) options.push(listRow);

  if (props.tooltipsConfig.align) options.push([{ align: [] }]);

  const mediaRow = [];
  if (props.tooltipsConfig.link) mediaRow.push("link");
  if (props.tooltipsConfig.image) mediaRow.push("image");
  if (mediaRow.length) options.push(mediaRow);

  if (props.tooltipsConfig.clean) options.push(["clean"]);

  return options;
});

function normalizeLinks() {
  if (!quillInstance) return;
  const anchors = quillInstance.root.querySelectorAll("a");
  anchors.forEach((a) => {
    const href = a.getAttribute("href");
    if (href && !/^https?:\/\//i.test(href)) {
      a.setAttribute("href", `https://${href}`);
    }
  });
}

onMounted(async () => {
  const Quill = (await import("quill")).default;
  await import("quill/dist/quill.snow.css");

  quillInstance = new Quill(editorRef.value, {
    theme: "snow",
    readOnly: props.disabled,
    modules: {
      toolbar: toolbarOptions.value,
    },
    placeholder: props.placeholder,
    bounds: editorRef.value,
  });

  // Establecer contenido inicial (puede estar vacío si la petición aún no ha llegado)
  quillInstance.root.innerHTML = props.modelValue;
  lastSavedValue.value = props.modelValue;

  // Eventos que indican interacción del usuario
  quillInstance.root.addEventListener("focus", () => {
    isFocused.value = true;
    isUserInteraction.value = true; // Marcar que el usuario está interactuando
  });

  quillInstance.root.addEventListener("blur", () => {
    isFocused.value = false;
    const html = quillInstance.root.innerHTML;
    normalizeLinks();

    if (quillInstance._changeTimeout) {
      clearTimeout(quillInstance._changeTimeout);
    }

    // Solo emitir si hubo interacción del usuario
    if (isUserInteraction.value && html !== lastSavedValue.value) {
      emit("change", html);
      lastSavedValue.value = html;
    }
  });

  // Evento de cambio de texto
  quillInstance.on("text-change", (delta, oldDelta, source) => {
    const html = quillInstance.root.innerHTML;

    // Siempre emitir update:modelValue para mantener sincronización
    emit("update:modelValue", html);

    // Solo emitir 'change' si es una interacción del usuario
    if (source === "user") {
      isUserInteraction.value = true;

      if (quillInstance._changeTimeout) {
        clearTimeout(quillInstance._changeTimeout);
      }

      quillInstance._changeTimeout = setTimeout(() => {
        if (html !== lastSavedValue.value) {
          emit("change", html);
          lastSavedValue.value = html;
        }
      }, 5000);
    }
  });
});

onBeforeUnmount(() => {
  if (quillInstance?._changeTimeout) {
    clearTimeout(quillInstance._changeTimeout);
  }
  quillInstance = null;
});

watch(
  () => props.modelValue,
  (val) => {
    if (!quillInstance) return;

    const currentContent = quillInstance.root.innerHTML;

    // Solo actualizar si el contenido es diferente
    if (currentContent !== val) {
      // Guardar el estado del cursor
      const selection = quillInstance.getSelection();

      quillInstance.root.innerHTML = val;
      lastSavedValue.value = val;

      // Restaurar el cursor si el usuario estaba escribiendo
      if (selection && isUserInteraction.value) {
        nextTick(() => {
          try {
            quillInstance.setSelection(selection);
          } catch (e) {
            // Ignorar si la posición ya no es válida
          }
        });
      }
    }
  },
);

watch(
  () => props.placeholder,
  (val) => {
    if (!quillInstance) return;
    quillInstance.root.dataset.placeholder = val;
  },
);
</script>
<template>
  <div class="richTextWrapper" :class="{ focused: isFocused }">
    <div ref="editorRef" class="editor" />
  </div>
</template>

<style scoped>
.richTextWrapper {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  transition: border-color 0.3s;
  overflow: hidden;
  width: 100%;
  min-height: v-bind("props.isExpand ? props.heightCustom : 'unset'");
  max-height: v-bind("props.isExpand ? '100%' : 'unset'");
  height: v-bind("props.isExpand ? 'auto' : props.heightCustom");
  background-color: var(--neutral-background-default);
  display: flex;
  flex-direction: column;
  box-shadow: var(--elevation-xs);
}
.richTextWrapper.focused {
  border-color: var(--primary-border-light);
}
.richTextWrapper:hover {
  border-color: var(--primary-border-light);
}

.editor {
  display: flex;
  flex-direction: column;
}

.ql-container {
  flex: 1;
  overflow-y: auto !important;
  border: none;
}

.ql-container.ql-snow {
  border: none;
}

:deep(.ql-toolbar.ql-snow) {
  border: none !important;
  border-bottom: 1px solid var(--neutral-border-subtle) !important;
  padding: 8px !important;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

:deep(.ql-toolbar.ql-snow:hover) {
  border-bottom: 1px solid var(--primary-border-light) !important;
}

.richTextWrapper::v-deep(.ql-snow .ql-picker) {
  color: var(--neutral-text-body);
}
.richTextWrapper::v-deep(.ql-size:hover .ql-picker-label),
.richTextWrapper::v-deep(.ql-size .ql-picker-label.ql-active),
.richTextWrapper::v-deep(.ql-font:hover .ql-picker-label),
.richTextWrapper::v-deep(.ql-font .ql-picker-label.ql-active) {
  color: var(--primary-text-default);
}
.richTextWrapper::v-deep(.ql-size:hover .ql-picker-label .ql-stroke),
.richTextWrapper::v-deep(.ql-font:hover .ql-picker-label .ql-stroke) {
  stroke: var(--primary-text-default);
}
.richTextWrapper::v-deep(.ql-clean:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-clean .ql-picker-label.ql-active .ql-stroke),
.richTextWrapper::v-deep(.ql-align .ql-picker-item:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-align .ql-picker-label:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-align .ql-picker-label.ql-active .ql-stroke),
.richTextWrapper::v-deep(
  .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke
) {
  stroke: var(--primary-text-default);
}
.richTextWrapper::v-deep(.ql-picker-options .ql-selected),
.richTextWrapper::v-deep(.ql-picker-options .ql-picker-item:hover) {
  color: var(--primary-text-default);
}

.richTextWrapper::v-deep(
  .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke
) {
  stroke: var(--primary-text-default);
}

.richTextWrapper::v-deep(.ql-snow .ql-stroke) {
  stroke: var(--neutral-text-body);
}
.richTextWrapper::v-deep(.ql-bold:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-bold.ql-active .ql-stroke) {
  stroke: var(--primary-text-default);
}

.richTextWrapper::v-deep(.ql-italic:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-italic.ql-active .ql-stroke),
.richTextWrapper::v-deep(.ql-underline:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-underline.ql-active .ql-stroke),
.richTextWrapper::v-deep(.ql-strike:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-strike.ql-active .ql-stroke),
.richTextWrapper::v-deep(.ql-clean:hover .ql-stroke) {
  stroke: var(--primary-text-default);
}
.richTextWrapper::v-deep(.ql-clean:hover .ql-fill),
.richTextWrapper::v-deep(.ql-underline:hover .ql-fill),
.richTextWrapper::v-deep(.ql-underline.ql-active .ql-fill),
.richTextWrapper::v-deep(.ql-strike:hover .ql-fill),
.richTextWrapper::v-deep(.ql-strike.ql-active .ql-fill),
.richTextWrapper::v-deep(.ql-list:hover .ql-fill),
.richTextWrapper::v-deep(.ql-list.ql-active .ql-fill) {
  fill: var(--primary-text-default);
}

.richTextWrapper::v-deep(.ql-snow .ql-fill) {
  fill: var(--neutral-text-body);
}

.richTextWrapper::v-deep(.ql-list:hover .ql-stroke),
.richTextWrapper::v-deep(.ql-list.ql-active .ql-stroke) {
  stroke: var(--primary-text-default);
}

.richTextWrapper::v-deep(
  .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label
),
.richTextWrapper::v-deep(
  .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options
) {
  border: none !important;
}

.richTextWrapper::v-deep(.ql-toolbar.ql-snow .ql-picker-options) {
  box-shadow: var(--elevation-s);
}

.richTextWrapper::v-deep(.ql-snow .ql-picker-options) {
  background-color: var(--neutral-background-default);
  border-radius: 12px;
}

.ql-editor {
  padding: 8px 16px;
  font-family: Nunito, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  background-color: var(--neutral-background-default);
  outline: none;
  min-height: 100px;
}

.richTextWrapper::v-deep(.ql-editor ol) {
  padding-left: 0px;
}

:deep(.ql-editor.ql-blank::before) {
  font-size: 14px;
  font-weight: 400;
  color: var(--neutral-border-default);
  font-family: Nunito, sans-serif;
  font-style: normal;
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip) {
  background-color: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-default);
  box-shadow: none;
  color: var(--neutral-text-body);
  border-radius: 12px;
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip input[type="text"]) {
  background-color: var(--neutral-background-default);
  border: 1px solid var(--neutral-border-default);
  box-shadow: none;
  color: var(--neutral-text-body);
  border-radius: 12px;
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip input[type="text"]:hover) {
  border: 1px solid var(--primary-border-default);
}

.richTextWrapper::v-deep(.ql-tooltip::before) {
  content: "Enlace:";
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip.ql-editing a.ql-action::after) {
  content: "Guardar";
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip a.ql-action::after) {
  content: "Editar";
  color: var(--primary-text-default);
}

.richTextWrapper::v-deep(.ql-snow .ql-tooltip a.ql-remove::before) {
  content: "Eliminar";
  color: var(--danger-text-default);
}
</style>
