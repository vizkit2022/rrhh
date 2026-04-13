<script setup>
import { ref, defineEmits, watch } from "vue";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";

// Variables
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionStore();

const options = computed(() => {
  return {
    0: [
      {
        label: {
          es: "Información Comercial",
          en: "Commercial Information",
        },
        disabled: false,
        id: 0,
      },
      {
        label: {
          es: "Ubicación",
          en: "Location",
        },
        disabled: !permissionsStore.myPermissions?.page_settings,
        id: 1,
      },
      {
        label: {
          es: "Información de Contacto",
          en: "Contact Information",
        },
        disabled: !permissionsStore.myPermissions?.page_settings,
        id: 2,
      },
      {
        label: {
          es: "Perfil de la Organización",
          en: "Organization Profile",
        },
        disabled: !permissionsStore.myPermissions?.page_settings,
        id: 3,
      },
      {
        label: {
          es: "Desactivar Organización",
          en: "Deactivate Organization",
        },
        disabled: !permissionsStore.myPermissions?.page_settings,
        id: 4,
      },
    ],
    2: [
      {
        label: {
          es: "Logo y Colores",
          en: "Logo and Colors",
        },
        disabled: false,
        id: 0,
      },
      {
        label: {
          es: "Información Adicional",
          en: "Additional Information",
        },
        disabled: false,
        id: 1,
      },
    ],
    3: [
      {
        label: {
          es: "Áreas de Negocio",
          en: "Business Areas",
        },
        disabled: !permissionsStore.myPermissions?.settings_business_areas,
        id: 0,
      },
      {
        label: {
          es: "Configuración Regional",
          en: "Regional Settings",
        },
        disabled: true,
        id: 1,
      },
      {
        label: {
          es: "Reglas de Validación",
          en: "Validation Rules",
        },
        disabled: !permissionsStore.myPermissions?.settings_validations,
        id: 2,
      },
      {
        label: {
          es: "Perfiles de Permisos",
          en: "Permission Profiles",
        },
        disabled: false,
        id: 3,
      },

      {
        label: {
          es: "Tipos de Compras",
          en: "Types of Purchases",
        },

        disabled: false,
        id: 4,
      },
      {
        label: {
          es: "Tipos de Documentos",
          en: "Types of Documents",
        },
        disabled: false,
        id: 5,
      },
      {
        label: {
          es: "Impuestos y Sobrecargos",
          en: "Taxes and Surcharges",
        },
        disabled: false,
        id: 6,
      },
      {
        label: {
          es: "Monedas",
          en: "Currencies",
        },
        disabled: false,
        id: 7,
      },
      {
        label: {
          es: "Cuentas",
          en: "Accounts",
        },
        disabled: false,
        id: 8,
      },
      {
        label: {
          es: "Notificaciones",
          en: "Notifications",
        },
        disabled: true,
        id: 9,
      },
    ],
  };
});

const emit = defineEmits(["selectedOption"]);

watch(
  () => organizationStore.page.tab,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      organizationStore.page.option = 0;
    }
  },
);

const changeOp = (option, op) => {
  if (!(organizationStore.organization.default && [2].includes(option.id))) {
    organizationStore.page.option = op;
  }
};
</script>

<template>
  <div class="organizationNav">
    <button
      v-for="(option, op) in options[organizationStore.page.tab]"
      :key="op"
      :class="option.id == organizationStore.page.option ? 'selected' : ''"
      @click="changeOp(option, op)"
      :disabled="
        option.disabled ||
        (organizationStore.organization.default && [2].includes(option.id))
      "
    >
      {{ option.label[globalStore.lang] }}
    </button>
  </div>
</template>

<style scoped>
.organizationNav {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  border-right: 1px solid var(--neutral-border-subtle);
  padding-right: 20px;
}
.organizationNav button {
  height: 40px;
  width: 100%;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
  font-family: Nunito;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
  padding: 0 20px;
  border-radius: 8px;
}
.organizationNav button:not(:disabled):hover,
.organizationNav button:not(:disabled).selected {
  background-color: var(--primary-surface-shadow-8a);
  color: var(--primary-text-default);
}
.organizationNav button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
