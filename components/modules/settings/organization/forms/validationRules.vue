<script setup>
import { ref } from "vue";
import configValidationRules  from "@/utils/configTables/validationRules.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useValidationStore from '@/stores/validations';
import useUserStore from "@/stores/user";


// STORE SIN USAR
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const validationStore = useValidationStore();
const userStore = useUserStore();

// Translations
const { t } = useI18n();
const module = "modules.organizations.settings.validationRules";

//modals delete
const showModalDelete = ref(false);

const hidenModalDelete = () => {
  showModalDelete.value = false;
}

// Constants - Dimensiones fijas para evitar movimiento del dialog
const dimensions = ref({
  width: "1000px",
  height: "720px"
})
const search = ref("");
const selectAll = ref(false);
const createValidationRule = ref(false);
const edit = ref(false);
const editItem = ref(null);
const lockModal = ref(false);
const validationRules = ref([]);

// Tooltip/Menu states
const showTooltip = ref(false);
const currentRule = ref(null);
const tooltipPosition = ref({ x: '0px', y: '0px' });
const isTransitioning = ref(false);

//functions
// Función comentada para evitar cambios dinámicos de dimensión
 const updateDimensions = (newDimensions) => {
   dimensions.value = newDimensions
 }

const hideModal = () => {
  if (!lockModal.value) {
    createValidationRule.value = false;
    lockModal.value = false;
    edit.value = false;
    validationStore.cleanValidationsReason();
    validationStore.cleanCreateValidationRule();
  }
};

const lock = (state) => {
  lockModal.value = state;
};

const showDocumentTooltip = (event, rule) => {
  event.preventDefault();
  event.stopPropagation();
  
  // Si ya está mostrando el tooltip de la misma regla, cerrarlo
  if (showTooltip.value && currentRule.value && currentRule.value.id === rule.id) {
    showTooltip.value = false;
    currentRule.value = null;
    return;
  }
  
  // Si ya hay un tooltip visible pero es de otra regla, hacer transición
  if (showTooltip.value && currentRule.value && currentRule.value.id !== rule.id) {
    isTransitioning.value = true;
    showTooltip.value = false;
    
    // Esperar a que termine la animación de cierre antes de abrir el nuevo
    setTimeout(() => {
      openTooltip(event, rule);
      isTransitioning.value = false;
    }, 300);
    return;
  }
  
  // Si no hay tooltip visible, abrirlo directamente
  openTooltip(event, rule);
};

const openTooltip = (event, rule) => {
  // Buscar el botón específico (affectedMembers__button) en lugar del target del click
  const buttonElement = event.target.closest('.affectedMembers__button');
  const containerRect = event.target.closest('.containerSection').getBoundingClientRect();
  
  if (buttonElement) {
    const buttonRect = buttonElement.getBoundingClientRect();
    
    tooltipPosition.value = {
      x: `${buttonRect.left - containerRect.left - 400}px`,
      y: `${buttonRect.bottom - containerRect.top + 0}px`   
    };
  }
  
  currentRule.value = rule;
  showTooltip.value = true;
};

const hideTooltip = (event) => {
  // esta la transicion? no hara nada ok
  if (isTransitioning.value) return;
  
  // si no hay tooltip visible, no hacer nada
  if (!showTooltip.value) return;
  
  // Si el evento existe, verificar si el click fue fuera del tooltip
  if (event) {
    const tooltipElement = event.target.closest('.documentTooltip');
    const buttonElement = event.target.closest('.affectedMembers__button');
    
    // Si el click fue dentro del tooltip o en el botón que lo activa, no cerrar
    if (tooltipElement || buttonElement) {
      return;
    }
  }
  
  showTooltip.value = false;
  currentRule.value = null;
};


// FUNCTIONS
const filteredValidationRules = computed(() => {
  if (!search.value.trim()) {
    return validationRules.value;
  }

  const term = search.value.toLowerCase();

  return validationRules.value.filter(rule => {
    // 1) Construye el mismo texto que renderizas en el template
    let texto = rule.reason?.[globalStore.lang] || '';

    if (rule.amount?.value) {
      // añade el sufijo " a X" en español o " X" en inglés, igual que en el template
      texto += (globalStore.lang === 'es' ? ' a ' : ' ') + rule.amount.value.trim();
    }

    // 2) Busca el término dentro de ese texto completo
    return texto.toLowerCase().includes(term);
  });
});



const loadValidationRules = async () => {
  try {
    globalStore.loading = true;

    await validationStore.getValidationsRules();

    validationRules.value = validationStore.validatonsRules.docs.map((rule) => {
      return {
        id: rule._id,
        selected: false,
        area: rule.application_area,
        idReason: rule.reason?._id,
        codeReason: rule.reason?.code,
        reason: {
          es: rule.reason?.name.es,
          en: rule.reason?.name.en,
        },
        amount: rule.amount,
        type: rule.validation_type,
        validators: rule.validators.map((validator) => ({
          name: validator.data.legalName,
          imgUrl: validator.imgUrl,
        })),
        validatorsFull: rule.validators,
        affectedMembers: rule.affected_members,
        status: rule.active ? "Activada" : "Desactivada",
        // Agregar datos simulados para el tooltip
        documentsInfo: {
          total: rule.affected_members?.length || 0,
          pending: Math.floor(Math.random() * (rule.affected_members?.length || 0)),
          completed: 0
        }
      };
    });
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};

const deleteValidationRules = async () => {
  const seleccionadas = validationRules.value.filter(r => r.selected)
  const body = {
    ids: seleccionadas.map(r => r.id),
  };
  try{
    globalStore.loading = true
    await validationStore.deleteValidationAllRule(body);
    await loadValidationRules();
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
}

const editValidationRule = (item) => {
  edit.value = true;
  editItem.value = item;
}

const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    editValidationRule: () => {
      editValidationRule(data);
    },
  };
  emits[emit]();
};

const tableRef = ref(null); 

const onScrollHideTooltip = () => {
  hideTooltip(); 
};


onMounted(() => {
  loadValidationRules();
  // Esperar a que el componente esté montado y el ref disponible
  nextTick(() => {
    const el = tableRef.value?.$el || tableRef.value;
    if (el) {
      el.addEventListener('scroll', onScrollHideTooltip);
    }
  });
  document.addEventListener('click', hideTooltip);
});

onBeforeUnmount(() => {
  // Remover el event listener cuando el componente se desmonte
  const el = tableRef.value?.$el || tableRef.value;
  if (el) {
    el.removeEventListener('scroll', hideTooltip);
  }
  document.removeEventListener('click', hideTooltip);
});
</script>

<template>
  <div class="containerSection" @click="hideTooltip">
    <div class="containerSection__header">
      <h2>{{ t(`${module}.title`) }}</h2>
      <span>{{ t(`${module}.description`) }}</span>
    </div>
    <div class="containerSection__filters">
      <div class="containerSection__filters-space">
        <u-input
          style="width: 350px"
          v-model="search"
          class="selecteddocTypes"
          icon="search"
          :revers="true"
          :placeholder="t(`${module}.searchPlaceholder`)"
        />
        <u-button
            :text="t(`${module}.buttons.filter`)"
            icon="filter"
            :revers="true"
            type="outlined"
            color="--neutral-surface-default"
          />
      </div>
      <div class="containerSection__filters-space">
        <u-button-icon
        icon="delete"
          color="--bg-danger-500"
          colorHover="--bg-danger-600"
          colorActive="--bg-danger-700"
          type="outlined"
          :disabled="!validationRules.some(r => r.selected)"
          @click="showModalDelete = true"
        />
        <u-button
          :text="t(`${module}.buttons.createRule`)"
          icon="new"    
          @click="createValidationRule = true"
        />
      </div>
    </div>

    <TableBasic
      :configTable="configValidationRules.validationRules"
      :content="filteredValidationRules"
      @actionTable="actionTable"
      ref="tableRef"
    >

    <!-- <template v-slot:edit="item">
      <u-button-icon
        type="text"
        icon="edit"
        :disabled="!item.item.selected || validationRules.filter(r => r.selected).length > 1"
        size="s"
        :textSize="20"
        color="--neutral-text-caption"
        @click="editValidationRule(item.item);" 
        class="btnEdit" 
      />
    </template> -->

    <template v-slot:area="item">
      <span :class="['bubble', `bubble--${item.item.area}`]">
        {{ t(module + `.applicationArea.${item.item.area}`) }}
      </span>
    </template>

<template v-slot:reason="item">
  <span class="containerSection__table-itemArea truncateText">
    {{
      item.item.reason[globalStore.lang] +
      (item.item.amount?.value && item.item.codeReason === 'higher_amount'
        ? (globalStore.lang === 'es' ? ' a ' : ' ') + item.item.amount.value.trim()
        : '')
    }}
  </span>
</template>


    
    <template v-slot:type="item">
      <span class="bubblePurple">{{ t(module + `.typeValidation.${item.item.type}`) }}</span>
    </template>

    <template v-slot:validators="item">
      <ComponentsAvatarValidator
      :type="item.item.type"
      :avatars="item.item.validators"
      :show-status="false"
    />
    </template>

    <template v-slot:affectedMembers="item">
      <div class="affectedMembers">
        <button 
          class="affectedMembers__button"
          @click="showDocumentTooltip($event, item.item)"
          :title="'Ver los miembros afectados'"
        >
          <span class="truncateText" style="color: var(--neutral-text-body);">{{ item.item.affectedMembers.length }}</span>
          <span class="u u-user"></span>
        </button>
      </div>
    </template>

    <template v-slot:status="item">
      <span >{{ item.item.status}}</span>
    </template>

    </TableBasic>
    
    <!-- Tooltip de affectedMembers -->
    <transition name="tooltip">
      <div
        v-if="showTooltip"
        class="affectedMembersTooltip"
        :style="{ top: tooltipPosition.y, left: tooltipPosition.x }"
      >
        <div
          v-for="(member, index) in currentRule?.affectedMembers"
          :key="index"
          class="affectedMembersTooltip__member"
        >
          <u-avatar
            :user="{ name: member.data.legalName, src: member.imgUrl }"
            :size="36"
          />
          <span>{{ member.data.legalName }}</span>
        </div>
      </div>
    </transition>

    <dialog-confirm 
      width="600px"
      height="auto"
      title="¿Deseas eliminar la regla de validación?" 
      description="Estas regla de validacion se eliminara permanentemente"
      customTextBtnDelete="Eliminar"
      :showModal="showModalDelete"    
      :actionModal="deleteValidationRules"
      @close-modal="showModalDelete = false"
      @lockModal="lock"
      class="fixed-dialog"
      />
    
    <u-dialog
      :showModal="createValidationRule || edit"
      :lockModal="lockModal"
      @closeModal="hideModal"
      :persistent="true"
      :width="dimensions.width"
      :height="dimensions.height"
      padding="24px 48px"
      class="fixed-dialog"
    >
      <SettingsOrganizationDialogCreateValidationRule
        :edit="edit"
        :editItem="editItem"
        @closeModal="hideModal"
        @lockModal="lock"
        @updateValidationRules="loadValidationRules"
        @updateDimensions="updateDimensions"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
h2,
span {
  font-family: Nunito;
}
.containerSection {
  display: grid;
  grid-template-rows: 60px 36px calc(100% - 150px);
  height: calc(100vh - 50px - 52px - 86px - 90px);
  gap: 24px;
  padding-right: 20px;
  position: relative;
}
.containerSection__header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__header span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.containerSection__filters {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.containerSection__filters-space {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.affectedMembers {
  display: flex;
  width: 100%;
  justify-content: right;
  align-items: center;
  gap: 8px;
}

.affectedMembers__button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.affectedMembers__button:hover {
  background-color: var(--neutral-surface-light);
}

/* Dialog con posición fija */
.fixed-dialog {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* Tooltip de documentación */
.affectedMembersTooltip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: absolute;
  width: 420px;
  height: auto;
  max-height: 162px;
  overflow-y: auto;
  background-color: var(--neutral-background-default);
  border-radius: 6px;
  box-shadow: var(--elevation-s);
  padding: 6px;
  z-index: 10;

}
.tooltip-enter-active,
.tooltip-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: top right;
}
.tooltip-enter-from,
.tooltip-leave-to {
  transform: scale(0);
}
.tooltip-enter-to,
.tooltip-leave-from {
  transform: scale(1);
}

.affectedMembersTooltip__member {
  display: grid;
  grid-template-columns: 40px 1fr;
  width: 100%; 
  height: 46px; 
  align-items: center;
  padding: 4px 8px;
  border: 1px solid var(--neutral-surface-default); 
  border-radius: 6px; 
  gap: 8px;
}

.affectedMembersTooltip__member span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-body);
}


.bubble {
  display: inline-flex;
  text-wrap: nowrap;
  position: relative;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 4px 8px;
  width: auto;
  height: 24px;
  border-radius: 15px;
}

.bubble--outcomes {
  background-color: var(--danger-surface-light);
  color: var(--danger-text-darker);
}

.bubble--accounting {
  background-color: var(--info-surface-light);
  color: var(--info-text-darker);
}

.bubble--projects {
  background-color: var(--warning-surface-light);
  color: var(--warning-text-darker);
}

.bubble--payments {
  background-color: var(--primary-surface-light);
  color: var(--primary-text-darker);
}

.bubblePurple {
  display: inline-flex;
  text-wrap: nowrap;
  position: relative;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding:  12px 6px ;
  width: auto;
  height: 24px;
  border-radius: 15px;
  background-color: var(--secondary-surface-light);
  color: var(--secondary-text-darker);
}

.bubble--green {
  background-color: var(--success-surface-light);
  color: var(--success-text-darker);
}

.bubble--red {
  background-color: var(--danger-surface-light);
  color: var(--danger-text-darker);
}

.containerSection__table-itemArea span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0%;
  color: var(--danger-text-darker);
}

.btnEdit {
  right: 20px;
}

</style>
