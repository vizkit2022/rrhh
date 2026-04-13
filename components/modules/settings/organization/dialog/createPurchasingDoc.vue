<script setup>
import { ref, defineEmits, computed, defineProps, onMounted } from "vue";
import { purchasingDocuments } from "@/utils/labels/settings.json";
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
  isActive: true,
  name: "",
  type: "",
  typeName: "",
  code: { value: "", error: false },
  color: "#3ac7a5",
  description: "",
});
const options = computed(() => {
  return [
    { label: { es: "Único Proveedor", en: "Uni-Vendor" }, value: "OC" },
    { label: { es: "Multiproveedor", en: "Multi-Vendor" }, value: "FXR" },
  ].map((op) => {
    return { label: op.label[globalStore.lang], value: op.value };
  });
});
// FUNCTIONS
const save = async () => {
  globalStore.loading = true;
  let body = {
    name: form.value.name,
    description: form.value.description,
    code: form.value.code.value,
    isActive: form.value.isActive,
    type: form.value.type,
    color: form.value.color,
  };
  if (props.edit) body._id = form.value._id;
  const respFetch = await organizationStore[props.edit ? "updateDoc" : "createDoc"](body);

  if (respFetch.status === 409) {
    form.value.code.error = true;
    globalStore.loading = false;
    return;
  }

  const resp = await organizationStore.getDocs();
  if (resp) organizationStore.docs = resp;
  emit("closeModal");
  globalStore.loading = false;
};
const handleInputAbbr = () => {
  form.value.code.error = false;
  if (form.value.code.value.length > 3) {
    form.value.code.value = form.value.code.value.slice(0, 3);
  }
};
const getTypeName = (type) => {
  return options.value.find((op) => (op.value === type)).label;
};

//COMPUTED
const lang = computed(() => globalStore.lang);
const title = computed(
  () => purchasingDocuments.modal[props.edit ? "title2" : "title"]
);
const buttons = computed(() => purchasingDocuments.buttons);
const inputs = computed(() => purchasingDocuments.modal.inputs);
const isValidForm = computed(() => {
  if (!props.document.global) {
    const { name, code, description, type, color } = form.value;
    return (
      name?.trim() !== "" &&
      code?.value?.trim() !== "" &&
      description?.trim() !== "" &&
      color?.trim() !== "" &&
      type?.trim() !== ""
    );
  }
  return true;
});
const changeType = (data) => {
  if(!(props.document.global || props.edit)) {
    form.value.type = data.value;
  }
};

//MOUNTED
onMounted(() => {
  if (props.edit) {
    const doc = JSON.parse(
      JSON.stringify({
        ...props.document,
        typeName: getTypeName(props.document.type),
      })
    );

    // Normalizando
    form.value = {
      ...doc,
      code: {
        value: typeof doc.code === "string" ? doc.code : doc.code?.value || "",
        error: false,
      },
    };
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
          :disabled="props.document.global"
        />
      </div>
      <div class="groupInputDoubleMin">
        <div class="groupInput">
          <label>
            {{ inputs.modality[lang] }}
          </label>
          <u-select
            v-model="form.typeName"
            :placeholder="inputs.modality.placeholder[lang]"
            :options="options"
            :full-data="true"
            @full-data="changeType"
            :disabled="props.document.global || props.edit"
          />
        </div>
        <div class="groupInput">
          <label>
            {{ inputs.state[lang] }}
          </label>
          <div style="display: flex; align-items: center; height: 100%">
            <u-checkbox v-model="form.isActive" />
          </div>
        </div>
      </div>
      <div class="groupInputDouble">
        <div class="groupInput">
          <label class="labelAbbr">
            <span>{{ inputs.abbr[lang] }}</span>
            <span v-if="form.code.error" class="label-error">Ya existe</span>
          </label>
          <u-input
            v-model="form.code.value"
            :placeholder="inputs.abbr.placeholder[lang]"
            @input="handleInputAbbr()"
            :disabled="props.document.global"
            :error="form.code.error"
          />
        </div>
        <div class="groupInput">
          <label>
            {{ inputs.color[lang] }}
          </label>
          <!-- <u-input
            v-model="form.color"
            :placeholder="inputs.color.placeholder[lang]"
            :disabled="props.document.global"
          /> -->
          <u-colorpicker
            v-model="form.color"
            :disabled="props.document.global"
            :width="199"
            :height="35"
          />
        </div>
      </div>
      <div class="groupInput">
        <label>
          {{ inputs.description[lang] }}
        </label>
        <u-textarea
          v-model="form.description"
          style="height: 130px"
          :placeholder="inputs.description.placeholder[lang]"
          :disabled="props.document.global"
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
        @action-btn="save"
        :disabled="!isValidForm"
      />
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.modal {
  height: 520px;
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
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-right: 1px;
}
.groupInputDouble {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.groupInputDoubleMin {
  display: grid;
  grid-template-columns: 1fr 100px;
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
.labelAbbr {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label-error {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  color: var(--danger-text-default);
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
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>