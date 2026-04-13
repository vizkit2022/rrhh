<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { salesDocument } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal", "initData"]);

// PROPS
const props = defineProps({
  document: {
    type: Object,
    default: () => {},
  },
  edit: {
    type: Boolean,
    default: false,
  },
});

// CONSTANTS

// fomulario
const form = ref({
  name: {
    value: "",
    error: false,
  },
  modality: {},
  code: {
    label: "",
    value: "",
  },
  tag: {
    value: "",
    error: false,
  },
  // color: {
  //   value: "",
  //   error: false
  // },
  isActive: true,
  description: "",
  global: false,
  creator: userStore.userSession._id || "",
  country: organizationStore.organization?.country?._id || "",
  taxDefault: [],
  taxes: [],
  currency: organizationStore.organization?.currency._id || "",
  archived: false,
});

// opciones
const options = ref({
  code: [
    { label: { es: "Documento Base", en: "Base Document" }, value: "invoice" },
    {
      label: { es: "Corrección Positiva", en: "Positive Correction" },
      value: "debit",
    },
    {
      label: { es: "Corrección Negativa", en: "Negative Correction" },
      value: "credit",
    },
  ].map((op) => {
    return { label: op.label[globalStore.lang], value: op.value };
  }),
});

//COMPUTED
const lang = computed(() => globalStore.lang);
const modalCreate = computed(() => salesDocument.modalCreate);

// FUNCTIONS

const handleInputtag = () => {
  if (form.value.tag.value.length > 6) {
    form.value.tag.value = form.value.tag.value.slice(0, 6);
  }
};

const isValid = () => {
  let valid = true;

  if (form.value.name.value.trim() === "") {
    form.value.name.error = true;
    valid = false;
  } else {
    form.value.name.error = false;
  }

  if (form.value.tag.value.trim() === "") {
    form.value.tag.error = true;
    valid = false;
  } else {
    form.value.tag.error = false;
  }

  // if (form.value.color.value.trim() === "") {
  //   form.value.color.error = true;
  //   valid = false;
  // } else {
  //   form.value.color.error = false;
  // }

  return valid;
};

const isFormValid = computed(() => {
  return (
    form.value.name.value.trim() !== "" &&
    form.value.tag.value.trim() !== "" &&
    form.value.code.value.trim() !== ""
    // &&
    // form.value.color.value.trim() !== ""
  );
});

const cleanForm = () => {
  form.value = {
    name: {
      value: "",
      error: false,
    },
    code: {
      label: "",
      value: "",
    },
    tag: {
      value: "",
      error: false,
    },
    // color: {
    //   value: "",
    //   error: false
    // },
    isActive: true,
    description: "",
    global: false,
    creator: "",
    country: "",
    taxDefault: [],
    taxes: [],
    currency: "",
    archived: false,
  };
};

const save = async () => {
  globalStore.loading = true;
  if (!isValid()) {
    globalStore.loading = false;
    return;
  }

  const body = {
    name: form.value.name.value,
    code: form.value.code.value,
    tag: form.value.tag.value,
    isActive: form.value.isActive,
    description: form.value.description,
    // color: form.value.color.value,
    global: form.value.global,
    creator: form.value.creator,
    country: form.value.country,
    taxDefault: form.value.taxDefault,
    taxes: form.value.taxes,
    currency: form.value.currency,
    archived: form.value.archived,
  };

  if (props.edit) {
    const bodyUpdate = {
      name: form.value.name.value,
      code: form?.value?.code?.value,
      tag: form.value.tag.value,
      description: form.value.description,
      color: form.value.color.value,
      isActive: form.value.isActive,
    };

    // UPDATE
    await organizationStore.updateTypeSalesDocument(
      props.document._id,
      bodyUpdate,
    );
  } else {
    // CREATE
    await organizationStore.createTypeSalesDocument(body);
    cleanForm();
  }

  emit("initData");
  emit("closeModal");
  globalStore.loading = false;
};

const handleChangecode = (op) => {
  form.value.code.value = op.value;
};

onMounted(async () => {
  globalStore.loading = true;
  const resp = await organizationStore.taxesByOrganization();
  organizationStore.taxes = resp;

  if (props.edit && props.document) {
    const matchedOptionCode = options.value.code.find(
      (op) => op.value === props.document.code,
    );

    form.value = {
      name: {
        value: props.document.name || "",
        error: false,
      },
      code: {
        label: matchedOptionCode ? matchedOptionCode.label : "",
        value: props.document.code || "",
      },
      tag: {
        value: props.document.tag || "",
        error: false,
      },
      isActive: props.document.isActive || false,
      global: props.document.global || false,
      creator: props.document.creator || userStore.userSession._id || "",
      country:
        props.document.country || organizationStore.organization?.country || "",
      color: props.document.color || "",
      // isActive: props.document.isActive !== undefined ? props.document.isActive : true,
      description: props.document.description || "",
      taxDefault: props.document.taxDefault || [],
      taxes: props.document.taxes || [],
      currency:
        props.document.currency ||
        organizationStore.organization?.currency._id ||
        "",
      archived: props.document.archived || false,
    };
  }
  globalStore.loading = false;
});
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>{{
        edit ? modalCreate?.title2?.[lang] : modalCreate?.title?.[lang]
      }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        type="outlined"
        size="m"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__form">
      <div class="groupInput">
        <label>
          {{ modalCreate?.inputs?.name?.[lang] }}
        </label>
        <u-input
          v-model="form.name.value"
          :placeholder="modalCreate?.inputs?.name?.placeholder?.[lang]"
          :error="form.name.error"
        />
      </div>
      <!-- <div class="groupInputDouble">
        <div class="groupInput">
          <label>
            {{ modalCreate?.inputs?.color?.[lang] }}
          </label>
          <u-input
            v-model="form.color.value"
            :placeholder="modalCreate?.inputs?.color?.placeholder?.[lang]"
          />
        </div>
        <div class="groupInput">
          <label>
            {{ modalCreate?.inputs?.active?.[lang] }}
          </label>
          <div style="display: flex; align-items: center; height: 100%">
            <u-checkbox v-model="form.isActive"  />
          </div>
        </div>
      </div> -->
      <div class="groupInputDouble">
        <div class="groupInput">
          <label>
            {{ modalCreate?.inputs?.code?.[lang] }}
          </label>
          <u-select
            v-model="form.code.label"
            :placeholder="modalCreate?.inputs?.code?.placeholder?.[lang]"
            :options="options.code"
            :full-data="true"
            @full-data="handleChangecode"
          />
        </div>
        <div class="groupInput">
          <label>
            {{ modalCreate?.inputs?.active?.[lang] }}
          </label>
          <div style="display: flex; align-items: center; height: 100%">
            <u-checkbox v-model="form.isActive" />
          </div>
        </div>
      </div>
      <div class="groupInput">
        <label>
          {{ modalCreate?.inputs?.tag?.[lang] }}
        </label>
        <u-input
          v-model="form.tag.value"
          :placeholder="modalCreate?.inputs?.tag?.placeholder?.[lang]"
          :error="form.tag.error"
          @input="handleInputtag"
        />
      </div>
      <div class="groupInput">
        <label>
          {{ modalCreate?.inputs?.description?.[lang] }}
        </label>
        <u-textarea
          v-model="form.description"
          style="height: 130px"
          placeholder="Ingrese una descripción del documento de venta"
        />
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        :text="modalCreate?.buttons?.cancel?.[lang]"
        type="outlined"
        class="mainBtnModify"
        size="l"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="
          props.edit
            ? modalCreate?.buttons?.update?.[lang]
            : modalCreate?.buttons?.create?.[lang]
        "
        class="mainBtnModify"
        size="l"
        :disabled="!isFormValid"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.modal {
  max-height: 80vh;
  display: grid;
  grid-template-rows: 40px 1fr 50px;
  gap: 16px;
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}
.modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.modal__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}
.modal__form {
  display: grid;
  gap: 20px;
  padding-right: 1px;
}
.groupInputDouble {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 20px;
}
.groupInput {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.groupInput label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.addInput {
  display: grid;
  grid-template-columns: 35px 1fr;
  align-items: center;
}
.addInput span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.addInput.first {
  margin-top: 10px;
}
.modal__table {
  border-radius: 14px;
  max-height: 500px;
  overflow: auto;
  position: relative;
  border: 1px solid var(--neutral-border-light);
}
.modal__table::-webkit-scrollbar,
.containerModal__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.modal__table::-webkit-scrollbar-thumb,
.containerModal__content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-light);
}

.modal__table::-webkit-scrollbar-track,
.containerModal__content::-webkit-scrollbar-track {
  background: var(--neutral-surface-subtle);
  border-radius: 4px;
}
.modal__table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
.modal__table-header .col {
  background-color: var(--neutral-surface-softer);
}
.modal__table-header,
.modal__table-item {
  display: grid;
  grid-template-columns: 1fr 120px;
  height: 40px;
}
.modal__table-header .col,
.modal__table-item .col {
  padding: 0 10px;
  display: flex;
  align-items: center;
}
.modal__table-item {
  transition: 0.3s;
}
.modal__table-item:hover .col {
  background-color: var(--primary-surface-shadow-12a);
}
.center {
  justify-content: center;
}
.left {
  justify-content: flex-start;
}
.colGrid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
}
.modal__table-header .col span,
.noTaxes span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.noTaxes {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal__table-item .col span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}
.modal__table-item .col span.name {
  color: var(--neutral-text-body);
}
.modal__table-item .col span.percentage {
  color: var(--neutral-text-caption);
}
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
