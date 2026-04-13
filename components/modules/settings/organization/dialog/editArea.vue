<script setup>
import { defineEmits, defineProps, onMounted, ref, watch } from "vue";
import useBusinessAreasStore from "@/stores/businessAreas";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// Store
const businessAreasStore = useBusinessAreasStore();
const organizationStore = useOrganizationStore();

// Props
const props = defineProps({
  businessAreaToEdit: {
    type: Object,
  },
});

// Emits
const emit = defineEmits(["closeModal", "lockModal", "updated"]);

// Traducción
const { t } = useI18n();
const module = "modules.organizations.settings.businessAreas";

// Inputs
const inputs = ref([
  {
    prop: "name",
    label: "Nombre",
    placeholder: "Ingrese el nombre nuevo",
    error: false,
    msgError: "Campo Obligatorio",
  },
  {
    prop: "description",
    label: "Descripción",
    placeholder: "Ingrese la descripción nueva",
    error: false,
    msgError: "Campo Obligatorio",
  },
  {
    prop: "abbreviation",
    label: "Abreviatura",
    placeholder: "Ingrese la abreviatura nueva",
    error: false,
    msgError: "Campo Obligatorio",
  },
]);

// Formulario
const form = ref({
  name: "",
  description: "",
  abbreviation: "",
  default: false,
  customDocument: false,
});

const saving = ref(false);
const searchMembers = ref("");
const members = ref([]);

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit("closeModal");
  }
};

// Cargar datos si es edición
onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);

  members.value = [...(props.businessAreaToEdit?.users || [])];

  if (props.businessAreaToEdit) {
    form.value.name = props.businessAreaToEdit.name || "";
    form.value.description = props.businessAreaToEdit.description || "";
    form.value.abbreviation = props.businessAreaToEdit.abbreviation || "";
  }
  console.log("props", props.businessAreaToEdit);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

// Validación
const isValidForm = () => {
  let isValid = true;
  inputs.value.slice(0, 3).forEach((input) => {
    const isEmpty = !form.value[input.prop].trim();
    input.error = isEmpty;
    if (isEmpty) isValid = false;
  });
  return isValid;
};

// Funciones de members
const filterMembers = (search) => {
  const searchTerm = search ? search.toLowerCase() : "";
  const members = organizationStore.organization.users;

  const selectedEmails = organizationStore.permissionsProfile.edit.info.members
    .map((member) => member.email || "")
    .filter((email) => email !== "");

  return members
    .filter(
      (member) =>
        member.user._id !== organizationStore.organization.owner._id &&
        !selectedEmails.includes(member.email) &&
        (member.data.legalName.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm)),
    )
    .map((member) => ({
      label: member.data.legalName,
      img: member.imgUrl,
      text: member.email,
      id: member.user._id,
      member,
    }));
};

const saveSelected = async (selectedMember) => {
  const formatMember = {
    imgUrl: selectedMember.img,
    legalName: selectedMember.label,
    email: selectedMember.text,
    user: selectedMember.id,
  };

  members.value.push(formatMember);

  await nextTick();
  searchMembers.value = "";
};

const cleanSearch = () => {
  searchMembers.value = "";
};

// Guardar (editar o crear)
const save = async () => {
  if (!isValidForm()) return;
  saving.value = true;

  const body = {
    name: form.value.name,
    description: form.value.description,
    abbreviation: form.value.abbreviation,
  };

  try {
    if (props.businessAreaToEdit?._id) {
      await businessAreasStore.updateBusinessArea(
        props.businessAreaToEdit._id,
        body,
      );

      const posBusinessArea = businessAreasStore.businessAreas.findIndex(
        (area) => area._id === props.businessAreaToEdit._id,
      );

      if (posBusinessArea !== -1) {
        businessAreasStore.businessAreas[posBusinessArea] = {
          ...businessAreasStore.businessAreas[posBusinessArea],
          ...body,
        };
      }
    }

    emit("closeModal");
  } catch (error) {
    console.error("Error al guardar:", error);
  } finally {
    saving.value = false;
  }
};

// Watchers para limpiar errores
watch(
  () => form.value.name,
  (newVal) => {
    if (newVal.trim()) inputs.value[0].error = false;
  },
);
watch(
  () => form.value.description,
  (newVal) => {
    if (newVal.trim()) inputs.value[1].error = false;
  },
);
watch(
  () => form.value.abbreviation,
  (newVal) => {
    if (newVal.trim()) inputs.value[2].error = false;
  },
);
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>Editar Area</span>
      <u-button-icon
        type="outlined"
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
    </div>

    <div class="modal__form">
      <div class="groupInput" v-for="input in inputs" :key="input.prop">
        <div class="groupInput__label">
          <label>{{ input.label }}</label>
          <span v-if="input.error" class="error">{{ input.msgError }}</span>
        </div>
        <u-input
          v-model="form[input.prop]"
          :placeholder="input.placeholder"
          :error="input.error"
        />
      </div>
      <div class="addMembers">
        <div class="addMembers__header">
          <span class="body-xs-r textColor"> Editar miembros </span>
          <u-search
            v-model="searchMembers"
            :options="filterMembers(searchMembers)"
            placeholder="Buscar miembros"
            size="m"
            icon="search"
            :avatar="true"
            :snippet="true"
            @selectedOption="saveSelected"
            @cleanInput="cleanSearch"
          />
        </div>
        <div class="members" v-if="members.length > 0">
          <div class="member" v-for="member in members" :key="member._id">
            <u-avatar
              :user="{ name: member?._id, src: member?.imgUrl }"
              :size="36"
              user="name"
            />
            <div class="member_info">
              <span class="body-m-sb truncateText textColor">{{
                member?.legalName || "-"
              }}</span>
              <span class="body-s-r truncateText textColorCaption">{{
                member?.email || "-"
              }}</span>
            </div>
            <u-button-icon
              icon="close"
              type="text"
              color="--neutral-text-caption"
              colorHover="--danger-text-default"
              colorActive="--danger-text-darker"
              size="s"
              @click="members = members.filter((m) => m._id !== member._id)"
            />
          </div>
        </div>
        <div class="noMembers" v-else>
          <u-tax :width="80" />
          <span class="body-xs-r textColor"> No hay miembros </span>
        </div>
      </div>
    </div>

    <div class="modal__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        class="mainBtnModify"
        size="l"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
      <u-button
        text="Guardar"
        class="mainBtnModify"
        size="l"
        :disabled="saving"
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
  height: 80vh;
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
}

.groupInput {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.groupInput__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.groupInput label {
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  color: var(--neutral-text-body);
}

.groupInput .error {
  font-size: 12px;
  font-weight: 600;
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
  text-align: left;
  color: var(--neutral-text-body);
}

.addInput.first {
  margin-top: 10px;
}

.addMembers {
  display: grid;
  grid-template-rows: 58px 1fr;
  gap: 16px;
  height: 100%;
  width: 100%;
  padding-top: 24px;
  padding-right: 24px;
  padding-left: 24px;
  border-top: 1px solid var(--neutral-border-light);
}

.addMembers__header {
  display: flex;
  flex-direction: column;
  height: 58px;
  gap: 8px;
  width: 100%;
}

.members {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

.member {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 12px;
  height: 36px;
  width: 100%;
}

.member_info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.noMembers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 30%;
  width: 100%;
}

.btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

.mainBtnModify {
  width: 135px;
}
</style>
