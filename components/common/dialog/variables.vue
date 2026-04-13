<script setup>
import { defineProps, defineEmits, computed, ref, watch } from "vue";
import { formatTitle } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";
const globalStore = useGlobalStore();
const { t } = useI18n({
  useScope: "local",
});

const emit = defineEmits(["closeModal", "updatedVariables"]);
const showDialog = ref(false);
const loading = ref(false);
const variables = ref("");
const props = defineProps({
  valueInput: {
    type: String,
    default: "",
  },
  valuePrintGroup: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: "400px",
  },
  height: {
    type: String,
    default: "200px",
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  confirmationText: {
    type: String,
    default: "", // Texto a escribir en el input
  },
  customTextBtnVariables: {
    type: String,
    default: "", // Si viene vacio no cambia el texto del boton eliminar
  },
  showInput: {
    type: Boolean, // Determina si se valida mediante un input
    default: false,
  },
  actionModal: {
    type: Function, // Funcion que ejecuta el Boton Eliminar
  },
  showModal: {
    type: Boolean,
    default: false, // Es la variable del padre que hacer que se muestre o no el modal
  },
});

watch(
  () => props.showModal,
  (newVal) => {
    if (newVal) {
      name.value = props.valueInput;
      printGroup.value = props.valuePrintGroup;
    }
    setTimeout(() => {
      showDialog.value = newVal;
    }, 100);
  }
);

const name = ref(props.valueInput);
const printGroup = ref(props.valuePrintGroup);

const confirmationTextComputed = computed(() => {
  return formatTitle(props.valueInput || t("variables.modal.confirmationText"));
});

const funtionDialog = () => {
  loading.value = true;
  closeModalAction();
  emit("updatedVariables", name.value, printGroup.value);
  loading.value = false;
};

const closeModalAction = () => {
  showDialog.value = false;
  setTimeout(() => {
    emit("closeModal");
  }, 250);
};

const deleteBtnText = computed(() => {
  return props.customTextBtnVariables.trim() === ""
    ? t("variables.modal.editButton")
    : props.customTextBtnVariables;
});

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
  console.log("props", props);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    closeModalAction();
  }
};
</script>

<template>
  <div class="dialog" v-if="props.showModal">
    <button
      class="dialog__close"
      @click="closeModalAction"
      :disabled="loading"
    ></button>
    <div class="dialog__container">
      <div class="dialog__label body-l-sb">
        <span>{{ props.title || t("variables.modal.title") }}</span>
      </div>
      <div class="dialog__icon">
        <img :src="`/img/saveTemplate.svg`" alt="Delete Icon" />
      </div>
      <div class="dialog__description">
        <!-- Utilizar t() para la descripción si no se proporciona -->
        <span class="body-m-r">{{
          props.description || t("variables.modal.description")
        }}</span>
      </div>
      <div class="dialog__input" v-if="props.showInput">
        <u-input
          :placeholder="t('variables.modal.placeholder')"
          size="l"
          class="inputModify"
          v-model="name"
          :disabled="loading"
        />
      </div>
      <div class="dialog__checkbox">
        <u-checkbox :height="20" v-model="printGroup" />
        <span class="body-s-sb">Imprimir grupo</span>
      </div>
      <div class="dialog__actions">
        <u-button
          type="outlined"
          color="--neutral-text-caption"
          :text="t('variables.modal.cancelButton')"
          class="btnMainModify"
          :disabled="loading"
          @click="closeModalAction"
        />
        <u-button
          :text="deleteBtnText"
          color="--primary-surface-default"
          colorHover="--primary-text-darker"
          colorActive="--primary-text-darker"
          class="btnMainModify"
          :disabled="loading || name.trim() === ''"
          @click="funtionDialog"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.dialog {
  position: absolute;
  height: 100vh;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.dialog__close {
  width: 100vw;
  height: 100vh;
  background-color: var(--neutral-background-shadow);
  position: absolute;
  z-index: -1;
}
.dialog__close:disabled {
  cursor: not-allowed;
}
.dialog__container {
  transition: 0.3s;
  width: v-bind("props.width");
  height: v-bind("props.height");
  background-color: var(--neutral-background-default);
  border-radius: 24px;
  box-shadow: var(--elevation-l);
  padding: 28px 48px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 15px;
  transition: 0.3s;
  transform: scale(v-bind("showDialog ? 1 : 0"));
  transform-origin: center;
}
.dialog__icon {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
.dialog__description {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.dialog__checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  margin-bottom: 10px;
}

.dialog__checkbox span {
  color: var(--neutral-text-body);
}

.dialog__input {
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
}
.dialog__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog__icon img {
  height: 80px;
}
.dialog__label span {
  color: var(--neutral-text-body);
}

.dialog__description span:nth-child(1) {
  color: var(--neutral-text-caption);
  line-height: 16px !important;
}
.dialog__input span {
  color: var(--neutral-text-body);
}

/* Modidy customs */
.dialog__input .inputModify::v-deep(input) {
  font-size: 16px;
}
.btnMainModify {
  width: auto;
}
</style>
