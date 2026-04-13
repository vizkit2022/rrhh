<script setup>
import { onMounted, computed, ref } from 'vue';
import configTable from '@/utils/configTables/validations.json';
import { formatNormalDate } from '@/utils/helpers';

import useValidationStore from '@/stores/validations';
import useOrganizationStore from '@/stores/organization';
import useGlobalStore from '@/stores/global';
import useUserStore from '@/stores/user';

// 1. Stores
const validationStore = useValidationStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();

// 2. Map de estados y de textos
const statusKeyMap = { 0: 'pending', 1: 'rejected', 2: 'approved' };
const statusMap = {
  pending:  { text: 'Pendiente', color: '--neutral-text-caption', background: '--neutral-surface-light' },
  approved: { text: 'Aprobada', color: '--success-text-darker', background: '--success-surface-light' },
  rejected: { text: 'Rechazada', color: '--danger-text-darker', background: '--danger-surface-light' },
};
// const applicationAreaMap = {
//   outcomes:   'Ingresos',
//   accounting: 'Contabilidad',
//   projects:   'Proyectos',
//   payments:   'Pagos',
// };

// 3. Funciones de mapeo

// Función para obtener el area de aplicación
// function getApplicationArea(area) {
//   return applicationAreaMap[area] ?? 'N/A';
// }

// Función para mapear los validadores
function mapValidators(validators, status) {
  return validators.map(v => {
    return {
      id: v.user._id || 'N/A',
      name: v.user.data?.legalName ?? 'N/A',
      imgUrl: v.user.imgUrl,
      status: v.approved,
      statusValidation: status,
    };
  });
}

// Función para formatear la razon
function formatReason(item) {
  return item.reasonData?.name[ globalStore.lang ] ?? 'N/A';
}

// Función para mapear el itemValidation
function mapValidationItem(item) {
  return {
    _id: item._id,
    selected: false,
    userRequester: { 
      name: item.applicant.at(0).data?.legalName ?? 'N/A',
      avatar: item.applicant.at(0).imgUrl ?? 'N/A',},
    project: {
      text1: item.outcome.income.at(0).name,
      text2: item.outcome.income.at(0).project.name ?? 'N/A',
    },
    reason: formatReason(item),
    date: item.updatedAt,
    validationRule: {
      id: item.ruleData?._id ?? 'N/A',
      type: item.ruleData?.validation_type ?? 'N/A',
      avatars: mapValidators(item.validators, item.status),
    },
    status: item.status,
    fullData: item,
  };
}


// 4. Carga de validaciones
async function loadValidations() {
  globalStore.loading = true;
  try {
    await validationStore.getValidations();
    validationStore.typeValidation = "validation";
  } finally {
    globalStore.loading = false;
  }
}

// 5. Computed filtrado y mapeado en un sólo lugar
const filteredValidations = computed(() => {
  const sel  = validationStore.selectedIndicator;
  const raw  = validationStore.validations.docs || [];
  const key  = statusKeyMap[sel];
  const data = raw
    .filter(i => sel === 3 || i.status === key)
    .map(mapValidationItem);
  validationStore.validationsRef = data;
  return data;
});


onMounted(async () => {
  await loadValidations();

  if(validationStore.validationQuery){
    validationStore.idValidationDetail = validationStore.validationQuery;
    modalData.value = filteredValidations.value.filter(i => i._id === validationStore.validationQuery).at(0);
    showDetailsModal.value = true
  }
})

onUnmounted(() => {
  validationStore.idValidationDetail = '';
  validationStore.validationQuery = '';
})



// 6. Estados UI para modales
const showConfirmModal = ref(false);
const showUnconfirmModal = ref(false);
const showDetailsModal = ref(false);
const modalData = ref(null);

// 7. Función para manejar acciones de la tabla

function actionTable({ emit, data }) {
  modalData.value = data;
  
  const emits = {
    openConfirm: async () => {
      if(validationStore.viewModalStatusValidacions.showConfirm) {
        try {
          globalStore.loading = true;
          await validationStore.updateValidatorUserStatus(data._id, { approved : true });
          await validationStore.getValidations();
          } catch (error) {
            console.log(error);
          } finally { globalStore.loading = false;}
        }
        else {
          showConfirmModal.value = true
        }
    },
    openUnconfirm: async () => {
      if(validationStore.viewModalStatusValidacions.showUnconfirm) {
        try {
          globalStore.loading = true;
          await validationStore.updateValidatorUserStatus(data._id, { approved: false });
          await validationStore.getValidations();
        } catch (error) {
          console.log(error);
        } finally {
          globalStore.loading = false;
        }
      } else {
        showUnconfirmModal.value = true
      } 
    },
    showDetailsValidation: () => {
      showDetailsModal.value = true;
      validationStore.idValidationDetail = data._id;
    },
    desactiveApproval: () => console.log('desactiveApproval'),
  };

  emits[emit]();
}

// Función para poner en disabled los botones de validación
function rules(item, prop) {
  const idUser = userStore.userSession._id;
  const validators = item.validationRule.avatars;
  const type = item.validationRule.type; 

  const myValidator = validators.find(v => v.id === idUser);
  const nextPendingIndex = validators.findIndex(v => v.status == null);
  const nextValidator = nextPendingIndex >= 0
    ? validators[nextPendingIndex]
    : null;

  const rulesProps = {
    statusDisabled: () => {

      if (type === 'simple') {
        return myValidator?.status != null;
      }

      if (type === 'exclusive') {
        return myValidator?.status != null || item.status !== 'pending';
      }

      if (type === 'inclusive' ) {
        return myValidator?.status!= null 
            || item.status !== 'pending';
      }

      if (type === 'hierarchical') {
        if (['rejected', 'approved'].includes(item.status)) {
          return true; 
        }

        if (!nextValidator) {
          return false;
        }

        if (nextValidator.id === idUser) {
          return false;
        }

        return true;
      }

      return false;
    }
  }
  return rulesProps[prop] ? rulesProps[prop]() : null;
}


</script>

<template>
  <TableBasic
    :configTable="configTable.validations"
    :content="filteredValidations"
    :rules="rules"
    @action-table="actionTable"
  >
    <template #userRequester="{ item }">
      <div class="userRequester">
      <u-avatar :user="{ name: item.userRequester.name, src: item.userRequester.avatar }" :size="32" />
      <span class="nameUser truncateText">{{ item.userRequester.name }}</span>
      </div>
    </template>

    <template #project="{ item }">
      <div class="truncateText origin">
        <span class="truncateText textMovement">{{ item.project.text1 }}</span>
        <span class="truncateText textProject">{{ item.project.text2 }}</span>
      </div>
    </template>

    <template #date="{ item }">
      <span class="date">
        {{ item.date ? formatNormalDate(item.date) : 'N/A' }}
      </span>
    </template>

    <template #validationRule="{ item }">
      <ComponentsAvatarValidator
        :avatars="item.validationRule.avatars"
        :type="item.validationRule.type"
      />
    </template>

    <template #status="{ item }">
      <u-tags
        :text="statusMap[item.status].text"
        size="s"
        :color="statusMap[item.status].color"
        :background="statusMap[item.status].background"
        :delete="false"
      />
    </template>
  </TableBasic>

  <!-- Modales -->
  <u-dialog :showModal="showConfirmModal"   @closeModal="showConfirmModal = false"   persistent width="518px" height="376px" padding="24px">
    <ValidationsDialogConfirm   @close-modal="showConfirmModal = false"   :data="modalData" />
  </u-dialog>

  <u-dialog :showModal="showUnconfirmModal" @closeModal="showUnconfirmModal = false" persistent width="518px" height="376px" padding="24px">
    <ValidationsDialogUnconfirm @close-modal="showUnconfirmModal = false" :data="modalData" />
  </u-dialog>

  <u-dialog position="right" :showModal="showDetailsModal" @closeModal="showDetailsModal = false" width="696px" height="376px" padding="24px 48px">
    <ValidationsDialogDetailsValidation @close-modal="showDetailsModal = false" :data="modalData" />
  </u-dialog>
</template>



<style scoped>

    .userRequester {
        display: grid;
        grid-template-columns: 32px auto;
        gap: 12px;
        align-items: center;
        justify-content: start;
        width: 100%;
        height: 100%;
    }

    .userRequester .span {
        text-align: left;
    }

    .nameUser {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        color: var(--neutral-text-body);
    }

    .origin {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .textMovement {
        width: 100%;
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .textProject {
        width: 100%;
        font-size: 14px;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .date {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

</style>