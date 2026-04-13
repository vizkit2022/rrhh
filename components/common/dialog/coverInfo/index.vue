<!-- 
Bus utlizado para recibir el contact los componente exterior
deben encargarse de crear la escucha pero no es necesario Apagarla
este componente ya lo hace por sigo mismo

$bus.$on("receiveContact")


Ejemplo:

const showContact = () => {
  //apertura
  userStore.showModalDataSheet = true;
  userStore.dataSheet.state = "create";
  //levantamiento escucha
  console.log("Encendiendo Escucha Al hacer click")
  $bus.$on("receiveContact", (receiveContact) => {
    console.log("receiveContact",receiveContact)
  });
};

-->

<script setup>
import {
  ref,
  onMounted,
  onBeforeMount,
  computed,
  onUnmounted,
  watch,
} from "vue";

import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useContactStore from "@/stores/contacts";
import usePaymentsStore from "@/stores/payments";

import {
  DialogCoverInfoContentGeneral,
  DialogCoverInfoContentCommercial,
  DialogCoverInfoContentContrato,
  DialogCoverInfoCardsMsgUseContact,
  DialogCoverInfoCardsMsgUseUser,
} from "#components";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts";

//BUS
const { $bus } = useNuxtApp();

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const contactStore = useContactStore();
const paymentsStore = usePaymentsStore();

// CONSTANTS
const tabs = ref([
  {
    label: t(`${module}.modalContacts.tabs.tab1`),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
]);
const views = {
  0: DialogCoverInfoContentGeneral,
  1: DialogCoverInfoContentCommercial,
  2: DialogCoverInfoContentContrato,
};
const additionalViews = {
  msgContact: DialogCoverInfoCardsMsgUseContact,
  msgUser: DialogCoverInfoCardsMsgUseUser,
};
const isEmptyForm =  !userStore.userDataSheetId || userStore.dataSheet.state === "create" 

// COMPUTED
const contentView = computed(() => views[userStore.dataSheet.tab]);
const additionalView = computed(() => {
  if (userStore.dataSheet.additionalView) {
    return additionalViews[userStore.dataSheet.additionalView];
  }
  return null;
});
const showFooter = computed(() => userStore.dataSheet.state === "create");

// Defaults for laboral data (contract / payroll info)
const laboralDefaults = {
  tipo_contrato: "indefinido",
  fecha_ingreso: "",
  fecha_termino: "",
  cargo: "",
  departamento: "",
  sueldo_base: 0,
  movilizacion: 50000,
  colacion: 40000,
  afp: "",
  sistema_salud: "FONASA",
  gratificacion: "mensual",
  vacaciones_dias: 15,
};

// Helper to add "Info Contrato" tab if not already present
const addContratoTab = () => {
  if (!tabs.value.find((t) => t.tab === 2)) {
    tabs.value.push({
      label: "Info Contrato",
      icon: "",
      tab: 2,
      indicator: false,
      disabled: false,
      main: false,
    });
  }
};

// onBeforeMounted
onBeforeMount(() => {
  if (isEmptyForm) {
    userStore.dataSheet.state = "create";
    const formattedData = userStore.fillMissingProperties();
    // Pre-set type if coming from RRHH context
    if (userStore.dataSheet.fromRrhh) {
      formattedData.data.type = "trabajador";
      formattedData.data.typeName = "Trabajador";
    }
    // Ensure laboral sub-object exists
    if (!formattedData.laboral) {
      formattedData.laboral = { ...laboralDefaults };
    }
    userStore.dataSheet.data = JSON.parse(JSON.stringify(formattedData));
    userStore.dataSheet.dataOriginal = JSON.parse(
      JSON.stringify(formattedData)
    );
    // If worker context, add "Info Contrato" tab immediately
    if (userStore.dataSheet.fromRrhh) {
      addContratoTab();
    }
  }
});

// onMounted
onMounted(async () => {
  document.addEventListener('keydown', (e) => {
    if(['Escape','Esc'].includes(e.key)) {
      if(!globalStore.loading) userStore.showModalDataSheet = false;
    };
  })

  if (isEmptyForm) return;

  globalStore.loading = true;
  tabs.value = [
    ...tabs.value,
    {
      label: t(module + ".modalContacts.tabs.tab2"),
      icon: "",
      tab: 1,
      indicator: false,
      disabled: false,
      main: false,
    }
  ];
  try {
    await userStore.initializeDataSheet();
    if(userStore?.dataSheet?.data?.user?._id) {
      userStore.dataSheet.disabled = true;
    }
    paymentsStore.bankAccountsByUser = userStore?.dataSheet?.data?.payment?.bankAccounts || [];
    // Ensure laboral sub-object for existing contacts
    if (!userStore.dataSheet.data.laboral) {
      userStore.dataSheet.data.laboral = { ...laboralDefaults };
    }
    // Show "Info Contrato" tab for existing workers
    if (userStore.dataSheet.data?.data?.type === "trabajador") {
      addContratoTab();
    }
  } catch (error) {
    console.error(error);
    userStore.showModalDataSheet = false;
  } finally {
    globalStore.loading = false;
  }
});

// onUnMounted
onUnmounted(() => {
  userStore.dataSheet = {
    change: false,
    tab: 0,
    alert: false,
    state: "edit",
    data: {},
    dataOriginal: {},
    dataTemp: {},
    errors: {},
    disabled: false,
    additionalView: "",
    additionalViewType: "",
    alertCustom: {
      msg: "",
      buttons: [],
      type: "",
      close: true,
      autoClose: true,
      time: 5000,
      show: false
    },
  };
  console.log("apagando receiveContact desde componente")
  setTimeout(() => {
    $bus.$off("receiveContact");
  }, 10);
  
  userStore.userDataSheetId = null;
  userStore.showBtnBack = false;
  userStore.showModalDataSheet = false;  
});

// Evaluar estado de tabs, no dejar cambiar si hay cambios
const isUpdating = ref(false);

// Agregar tab "Info Contrato" cuando el tipo cambia a "trabajador"
watch(
  () => userStore.dataSheet.data?.data?.type,
  (newType) => {
    if (newType === "trabajador") {
      // Ensure laboral sub-object is initialized
      if (userStore.dataSheet.data && !userStore.dataSheet.data.laboral) {
        userStore.dataSheet.data.laboral = { ...laboralDefaults };
      }
      addContratoTab();
    }
  }
);

watch(
  () => userStore.dataSheet.tab,
  (newVal, oldVal) => {
    if(newVal === 0) {
      userStore.dataSheet.showFormBankAccount = false;
    }

    if (isUpdating.value) {
      isUpdating.value = false;
      return;
    }

    if (userStore.dataSheet.change) {
      isUpdating.value = true;
      userStore.dataSheet.tab = oldVal;
      userStore.dataSheet.alert = true;

      if (oldVal == 0) {
        userStore.dataSheet.alertCustom = {
          // msg: "Inf. General - Hay cambios sin guardar.",
          msg: t(`${module}.modalContacts.alerts.infGeneral.text`),
          buttons: [],
          type: "warning",
          close: true,
          autoClose: true,
          time: 5000,
          show: true
        };
      }
      return;
    }
  }
);

const actionAlert = async (action) => {
  const actions = {
    dataSheetSaveFormInfGeneral: async () =>
      await dataSheetSaveFormInfGeneral(),
    dataSheetCleanFormInfGeneral: async () =>
      await dataSheetCleanFormInfGeneral(),
    close: () => closeAlert(),
    getContact: async () => {
      console.log("Aqui")
    }
  };

  await actions[action]();
};

const dataSheetSaveFormInfGeneral = async () => {
  globalStore.loading = true;
  const { data } = userStore.dataSheet;

  try {
    contactStore.loading = true;
    const upsertContact = await userStore.upsertContact(data);
    const pos = contactStore.contacts.findIndex(
      (contact) => contact._id === upsertContact._id
    );
    if (pos === -1) {
      contactStore.contacts.push(upsertContact);
      contactStore.contactsAll.push(upsertContact);
    } else {
      contactStore.contacts[pos] = upsertContact;
    }
    userStore.dataSheet.change = false;
  } catch (error) {
    console.error("Error create contact:", error);
  } finally {
    contactStore.loading = false;
    globalStore.loading = false;
  }
};

const dataSheetCleanFormInfGeneral = async () => {
  const defaultData = userStore.dataSheet.dataOriginal;
  userStore.dataSheet.data = JSON.parse(JSON.stringify(defaultData));
  userStore.dataSheet.change = false;
};

const closeAlert = () => {
  userStore.closeAlert()
};
</script>

<template>
  <div class="cover">
    <DialogCoverInfoTopBar v-if="userStore.showBtnBack" />
    <DialogCoverInfoHeader />
    <u-tabs
      class="cover__tabs"
      :tabs="tabs"
      v-model="userStore.dataSheet.tab"
    />
    <div class="cover__container">
      <div class="additionalViewClass" v-if="contentView">
        <component :is="additionalView" />
      </div>
      <component v-if="contentView" :is="contentView" />
    </div>
    <u-alert
      :data="userStore?.dataSheet?.alertCustom || {}"
      class="alert"
      @actionAlert="actionAlert"
    />
    <DialogCoverInfoFooter v-if="showFooter" />
  </div>
</template>

<style scoped>
.cover {
  width: 90vw;
  max-width: 1200px;
  height: calc(90vh - 60px);
  max-height: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.cover__tabs {
  height: 32px;
}

.cover__container {
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
  transition: 0.3s;
  position: relative;
}

.additionalViewClass {
  position: absolute;
  z-index: 2;
  overflow: hidden;
  transition: 0.3s;
  backdrop-filter: blur(2px);
  width: 100%;
  height: 100%;
  transform: translateY(
    v-bind("userStore.dataSheet.additionalView !== '' ? '0' : '-100%'")
  );
}
</style>
