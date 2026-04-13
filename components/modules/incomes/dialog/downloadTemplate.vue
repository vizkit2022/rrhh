<script setup>
import { defineEmits, ref } from "vue";

import useIncomesStore from "@/stores/incomes";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";

// Traductor
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.modal.shareMovement";
const custom = "global.text";

//const
const incomesStore = useIncomesStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const emit = defineEmits(["closeModal", "lockModal"]);
const saving = ref(false);

// computed

const namesState = computed(() => ({
  opportunity: "Oportunidad",
  budget: t(custom + ".budget"),
  business: t(custom + ".business"),
}));

const buttonsOrigin = ref([
{
    prop: "unabase",
    icon: "download",
    label: t(module + ".buttons.downloadPdf"),
    subLabel: "",
    disabled: false,
    loading: false,
  },
  {
    prop: "central",
    icon: "download",
    label: t(module + ".buttons.downloadPdfCentral"),
    subLabel: "",
    disabled: false,
    loading: false,
  },
  {
    prop: "email",
    icon: "email",
    label: t(module + ".buttons.sendEmailPdf"),
    subLabel: "",
    disabled: true,
    loading: false,
  },
  {
    prop: "xml",
    icon: "file-code",
    label: t(module + ".buttons.downloadXml"),
    subLabel: "",
    disabled: true,
    loading: false,
  }
]);

const buttons = computed(() => [
  ...buttonsOrigin.value
]);

const save = async (button, pos) => {
  if (!button.disabled) {
    const actions = {
      unabase: async () => {
        await normalPDF("unabase", button, pos);
      },
      central: async () => {
        await normalPDF("central", button, pos);
      },
      defaultProp: async () => {
        console.log(button);
      },
    };
    globalStore.loading = true;
    emit("lockModal", true);
    saving.value = true;
    await actions[button.prop] ? actions[button.prop]() : actions["defaultProp"]();
    saving.value = false;
    globalStore.loading = false;
    emit("lockModal", false);
  }
};

const normalPDF = async (type, btn, pos) => {
  try {
    buttonsOrigin.value[pos].loading = true;
    buttonsOrigin.value[pos].disabled = true;
    incomesStore.currentIncome.type_print = type;
    const response = await incomesStore.generarPDF(incomesStore.currentIncome);

    // const contentDisposition = response.headers.get('Content-Disposition');
    if (response) {
      //abrir link de response en una nueva pestaña (no usar blob, solo abrir link, con vue)
      window.open(response, "_blank");
    } else {
      console.error("No se pudo generar el Blob para la descarga del PDF.");
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
    [];
  } finally {
    buttonsOrigin.value[pos].loading = false;
    buttonsOrigin.value[pos].disabled = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span class="body-xl-sb">{{ t(module + ".title") }}</span>
      <u-button-icon icon="close" class="btnIconModify" color="--neutral-text-caption" size="s" :disabled="saving"
        @action-btn="emit('closeModal')" type="outlined" />
    </div>
    <div class="modal__title">
      <span class="body-l-sb">{{ t(module + '.subtitle', { type: namesState[globalStore.tag] }) }}</span>
    </div>

    <div class="modal__content">

      <u-button-process v-for="(button, b) in buttons" :key="b" :icon="button.icon" :text="button.label"
        :loading="button.loading" :disabled="button.disabled || button.loading" @click="save(button, b)" size="l" />
    </div>


    <div class="modal__announcement">
      <span class="u u-info-outlined"></span>
      <p class="">
        {{ t(module + ".textAnnouncement") }} </p>
    </div>

    <div class="modal__actions">

      <u-button :text="t(module + '.buttons.configDoc')" type="text" icon="settings"
        @click="organizationStore.printPdf.showModal = true" />
    </div>
  </div>
</template>

<style scoped>
.modal {
  display: grid;
  grid-template-rows: 40px auto auto 1fr 36px;
  width: 100%;
  height: 100%;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal__announcement {
  display: flex;
  flex-direction: row;
  margin-top: 30px;
  gap: 10px;
  font-size: small;
}

.modal__announcement p {
  color: var(--neutral-text-body);
}

.modal__announcement .u {
  font-size: 18px;
}

.modal__actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal__header span {
  color: var(--neutral-text-body);
}

.modal__title {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 58px;
  margin-bottom: 28px;
}

.modal__title span {
  color: var(--neutral-text-body);
}

.modal__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 20px;
}


/* .modal__content button:not(:disabled) {
  background-color: var(--bg-primary-300);
}

.modal__content button:not(:disabled):hover {
  background-color: var(--bg-primary-200);
}

.modal__content button:not(:disabled):active {
  background-color: var(--bg-primary-200);
}

.modal__content button:disabled {
  background-color: var(--bg-primary-50);
  cursor: not-allowed;
} */

.btnCustom {
  display: flex;
  padding: 0 20px;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.btnCustom span:nth-child(1) {
  font-size: 30px;
  line-height: 20px;
}


.btnCustom span:nth-child(2),
.loading span {
  font-size: 12px;
  line-height: 12px;
  text-align: start;
}

.btnCustom span:nth-child(2) b {
  font-size: 25px;
  line-height: 10px;
  text-align: start;
}

/* .modal__content button:not(:disabled) .btnCustom span,
.loading span {
  color: var(--bg-neutral-600);
}

.modal__content button:disabled .btnCustom span {
  color: var(--bg-neutral-400);
} */

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.loadingBtn {
  cursor: not-allowed !important;
  background-color: var(--bg-primary-100) !important;
}


/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}

.btnConfigDoc {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
}


.btnConfigDoc {
  color: var(--primary-surface-default);
  transition: 0.3s;
}

.btnConfigDoc span {
  font-size: 30px;

}

.btnConfigDoc p {
  font-size: large;
}

.btnConfigDoc:hover {
  color: var(--primary-surface-harder);
}

.btnConfigDoc:active {
  color: var(--success-surface-default);
}
</style>
