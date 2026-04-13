<script setup>
import useValidationStore from '@/stores/validations';
import useGlobalStore from '@/stores/global';
import configOutcomesValidation from '@/utils/configTables/outcomesValidations.json';
import { formatNormalDate } from '@/utils/helpers';


// stores
const validationStore = useValidationStore();
const globalStore = useGlobalStore();

//const
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;
const showDetails = ref(false);
const modalData = ref(null);

const statusKeyMap = { 0: 'pending', 1: 'rejected', 2: 'approved' };
const statusMap = {
  pending:  { text: 'Pendiente', color: '--neutral-text-caption', background: '--neutral-surface-light' },
  approved: { text: 'Aprobada', color: '--success-text-darker', background: '--success-surface-light' },
  rejected: { text: 'Rechazada', color: '--danger-text-darker', background: '--danger-surface-light' },
};
const applicationAreaMap = {
  outcomes:   'Ingresos',
  accounting: 'Contabilidad',
  projects:   'Proyectos',
  payments:   'Pagos',
};

const validation = [
    {
        userRequester: 'Sergio',
        origin: 'Origen',
        reason: 'Motivo',
        date: 'Date',
        validationRule: 'Regla',
        status: 'Status'
    }
]

// funciones

// Función para obtener el area de aplicación
function getApplicationArea(area) {
  return applicationAreaMap[area] ?? 'N/A';
}


// Funciones de mapeo

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
      selected : false,
      userRequester: {
        avatar: item.applicant.at(0).imgUrl ?? 'N/A',
        name: item.applicant.at(0).data?.legalName ?? 'N/A',
      },
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
      fulldata : item
    }
}


// filtrado de validaciones
const filteredValidationsOutcome = computed(() => {
  const raw = validationStore.validationsOutcome
  const data = raw.map(mapValidationItem);
  return data
})


// Carga de validaciones
const loadValidationsOutcome = async () => {
    // await validationStore.getValidationOutcomeById(idOC);
    const body = { type: 'outcome', id: idOC };
    // await validationStore.getValidationOutcomeById();
    console.log('validationsOutcome', await validationStore.getValidationOutcomeById('outcome',idOC));
}

const actionTable = (obj) => {
  const {emit, data, pos} = obj;
  console.log('data',data)
  modalData.value = data

  const emits = {
    showDetailsOutcomeValidation: () => {
      showDetails.value = true
      validationStore.idValidationDetail = data._id
    },
  };
  emits[emit]();
}


//hooks
onMounted(async () => {
    globalStore.loading = true;
    try {
        await loadValidationsOutcome();
        validationStore.typeValidation = 'outcome';
    } catch (error) {
        console.error(error);
    }
    globalStore.loading = false;
});

</script>

<template>
    <TableBasic
    :content="filteredValidationsOutcome"
    :configTable="configOutcomesValidation.outcomesValidations"
    @action-table="actionTable"
    >

     <template #userRequester="{ item }">
      <u-avatar :user="{ name: item.userRequester.name, src: item.userRequester.avatar }" :size="32" />
      <span class="nameUser truncateText">{{ item.userRequester.name }}</span>
    </template>

    <!-- <template #origin="{ item }">
      <div class="origin">
        <span class="textMovement">Movimiento</span>
        <span class="textProject">{{ getApplicationArea(item.origin.text2) }}</span>
      </div>
    </template> -->

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

    <u-dialog position="right" :showModal="showDetails" @close-modal="showDetails = false" width="696px" padding="24px 48px">
        <ValidationsDialogDetailsValidation @close-modal="showDetails = false" :data="modalData"/>
    </u-dialog>


</template>

<style scoped>

.nameUser {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        color: var(--neutral-text-body);
    }

    .userRequester {
        display: grid;
        grid-template-columns: 32px auto;
        gap: 12px;
        align-items: center;
        height: 100%;
    }

    .userRequester .span {
        text-align: left;
    }

    .origin {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .textMovement {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .textProject {
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