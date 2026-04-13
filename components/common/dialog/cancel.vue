<script setup>
import { defineProps, defineEmits, computed, ref, watch } from "vue";
import { formatTitle, debounce } from "@/utils/helpers";

import useGlobalStore from "@/stores/global";
const globalStore = useGlobalStore();
const { t } = useI18n({
  useScope: "local",
});
  
const emit = defineEmits(["closeModal"]);
const showDialog = ref(false);
const loading = ref(false);
const confirm = ref("");
const props = defineProps({
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
  customTextBtnDelete: {
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
    setTimeout(() => {
      showDialog.value = newVal;
    }, 100);
  }
);

const confirmationTextComputed = computed(() => {
  return formatTitle(
    props.confirmationText || t("cancel.modal.confirmationText")
  );
});

const deleteAction = computed(() => {
  if (props.showInput) {
    return !(confirm.value === confirmationTextComputed.value);
  } else {
    return false;
  }
});

const deleteDialog = async () => {
  loading.value = true;
  closeModalAction();
  await props.actionModal();
  loading.value = false;
};

const closeModalAction = () => {
  showDialog.value = false;
  confirm.value = "";
  setTimeout(() => {
    emit("closeModal");
  }, 250);
};

const deleteBtnText = computed(() => {
  return props.customTextBtnDelete.trim() === '' ? t('cancel.modal.deleteButton') : props.customTextBtnDelete;
});

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    closeModalAction();
  }
};

const handleEnter = debounce(async (event) => {
  if(!loading.value && !deleteAction.value) {
    await deleteDialog();
  }
}, 10);
</script>

<template>
  <div class="dialog" v-if="props.showModal">
    <button
      class="dialog__close"
      @click="closeModalAction"
      :disabled="loading"
    ></button>
    <div class="dialog__container">
      <div class="dialog__icon">
        <img :src="`/img/cancel${globalStore.isDark ? '-dark' : ''}.gif`" alt="Delete Icon" />
      </div>
      <div class="dialog__label body-l-sb">
        <span>{{ props.title || t("cancel.modal.title") }}</span>
      </div>
      <div class="dialog__description">
        <span class="u u-info-circle"></span>
        <!-- Utilizar t() para la descripción si no se proporciona -->
        <span class="body-m-r">{{
          props.description || t("cancel.modal.description")
        }}</span>
      </div>
      <div class="line"></div>
      <div class="dialog__input" v-if="props.showInput">
        <span class="body-s-sb">
          {{ $t("cancel.pre") }}
          <strong style="color: var(--danger-text-default); font-weight: 800"> {{ confirmationTextComputed }}</strong>
          {{ t("cancel.despues", {deleteButton: deleteBtnText})}}
        </span>
        <u-input
          :placeholder="t('cancel.modal.placeholder', {confirmationText: confirmationTextComputed})"
          size="l"
          class="inputModify"
          v-model="confirm"
          :disabled="loading"
          @keyup.enter="handleEnter"
        />
      </div>
      <div class="dialog__actions">
        <u-button
          type="outlined"
          color="--neutral-text-caption"
          :text="t('cancel.modal.cancelButton')"
          class="btnMainModify"
          :disabled="loading"
          @click="closeModalAction"
        />
        <u-button
          :text="deleteBtnText"
          color="--danger-text-default"
          colorHover="--danger-text-darker"
          colorActive="--danger-text-darker"
          class="btnMainModify"
          :disabled="loading || deleteAction"
          @click="deleteDialog"
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
  padding: 48px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  transition: 0.3s;
  transform: scale(v-bind("showDialog ? 1 : 0"));
  transform-origin: center;
}
.dialog__icon {
  display: flex;
  justify-content: center;
}
.dialog__description {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  width: 100%;
}
.dialog__input {
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
  width: 100%;
}
.dialog__actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
}

.dialog__icon img {
  height: 80px;
}
.dialog__label span {
  color: var(--neutral-text-body);
}
.dialog__description span:nth-child(1) {
  color: var(--danger-text-default);
  font-size: 14px;
  padding-top: 2px;
}
.dialog__description span:nth-child(2) {
  color: var(--neutral-text-caption);
  line-height: 16px !important;
}
.dialog__input span {
  color: var(--neutral-text-body);
}
.line {
  width: 100%;
  height: 1px;
  background-color: var(--neutral-border-subtle);
}
/* Modidy customs */
.dialog__input .inputModify::v-deep(input) {
  font-size: 16px;
}
.btnMainModify {
  width: 120px;
}
</style>
