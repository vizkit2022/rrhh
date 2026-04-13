<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { taxDocument, general } from "@/utils/labels/settings.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//EMITS
const emit = defineEmits(["closeModal", "lockModal"]);

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
const form = ref({
  tax: "",
  name: "",
  isActive: true,
  code: "",
  color: "",
  description: "",
  taxes: [],
  taxDefault: null,
});
// FUNCTIONS
const save = async () => {
  globalStore.loading = true;
  let body = {
    name: form.value.name,
    description: form.value.description || "",
    code: form.value.code,
    isActive: form.value.isActive,
    taxes: form.value.taxes,
    taxDefault: form.value.taxDefault,
  };
  if (props.edit) body._id = form.value._id;
  await organizationStore[props.edit ? "updateDocType" : "createDocType"](body);
  const resp = await organizationStore.getDocsType();
  if (resp) organizationStore.docsType = resp;
  emit("closeModal");
  globalStore.loading = false;
};
const handleInputAbbr = () => {
  if (form.value.code.length > 6) {
    form.value.code = form.value.code.slice(0, 6);
  }
};
const isValidForm = computed(() => {
  if (!props.document.global) {
    const { name, code, description, type, color } = form.value;
    return (
      name?.trim() !== "" &&
      code?.trim() !== "" &&
      color?.trim() !== "" &&
      type?.trim() !== ""
    );
  }
  return true;
});

//COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(
  () => taxDocument.modal[props.edit ? "title2" : "title"]
);
const buttons = computed(() => taxDocument.buttons);
const inputs = computed(() => taxDocument.modal.inputs);

// MOUNTED
onMounted(() => {
  if (props.edit) {
    form.value = JSON.parse(JSON.stringify(props.document));
  }
});
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>{{ title[lang] }}</span>
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
          {{ inputs.name[lang] }}
        </label>
        <u-input
          v-model="form.name"
          :placeholder="inputs.name.placeholder[lang]"
          :disabled="props.edit && props.document.global"
        />
      </div>
      <div class="groupInputDouble">
        <div class="groupInput">
          <label>
            {{ inputs.color[lang] }}
          </label>
          <u-input
            v-model="form.color"
            :placeholder="inputs.color.placeholder[lang]"
            :disabled="props.edit && props.document.global"
          />
        </div>
        <div class="groupInput">
          <label>
            {{ inputs.active[lang] }}
          </label>
          <div style="display: flex; align-items: center; height: 100%">
            <u-checkbox v-model="form.isActive" />
          </div>
        </div>
      </div>
      <div class="groupInput">
        <label>
          {{ inputs.code[lang] }}
        </label>
        <u-input
          v-model="form.code"
          :placeholder="inputs.code.placeholder[lang]"
          :disabled="props.edit && props.document.global"
          @input="handleInputAbbr()"
        />
      </div>
      <div class="groupInput">
        <label>
          {{ inputs.description[lang] }}
        </label>
        <u-textarea
          v-model="form.description"
          style="height: 130px"
          :placeholder="inputs.description.placeholder[lang]"
          :disabled="props.edit && props.document.global"
        />
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        :text="buttons.cancel[lang]"
        type="outlined"
        class="mainBtnModify"
        size="l"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="buttons.save[lang]"
        class="mainBtnModify"
        size="l"
        :disabled="!isValidForm"
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
