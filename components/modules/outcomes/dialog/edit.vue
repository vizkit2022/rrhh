<script setup>
import { ref, computed, defineEmits, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";

// Stores
const outcomesStore = useOutcomesStore(); 
const paymentsStore = usePaymentsStore(); 
const globalStore = useGlobalStore();
const userStore = useUserStore();

// Emits
const emit = defineEmits(["closeModal"]);

// EventBus
const { $bus } = useNuxtApp();

// Constants
const { t } = useI18n();
const color = "--neutral-text-caption";
const module = "modules.outcomes.pages.oc.modals.edit"
const withDocs = (outcomesStore?.outcome?.numbers?.documented?.number || 0) > 0;
const withPayments = (outcomesStore?.outcome?.numbers?.paid?.number || 0) > 0;
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// Vars
const states = ref({search: false, form: true});
const search = ref("");
const results = ref([]);
const loading = ref(false);
const form = ref({reference: "", paymentTermName: "", contactName: ""});
const showAlert = ref(false);
const searchTimeout = ref(null);
const lastSearch = ref("");

// Mounted
onMounted(() => {
  form.value = JSON.parse(JSON.stringify(outcomesStore.outcome));
  form.value.paymentTermName = outcomesStore.outcome.paymentTerm.name[globalStore.lang];
  form.value.contactName = "";
});

// Computed
const supplier = computed(() => ({
  name: form?.value?.supplier?.data?.legalName || "-",
  src: form?.value?.supplier?.imgUrl || null,
  alias: form?.value?.supplier?.data?.nickName || "-",
  email: form?.value?.supplier?.contact?.email || form?.value?.supplier?.email || "-",
}));
const conditionOfPayOptions = computed(() => {
  return paymentsStore.paymentTerms.map((item) => {
    return {
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    };
  });
});
const isValidForm = computed(() => {
  const ref = form.value.reference?.trim();
  const term = form.value.paymentTermName?.trim();

  return !!ref && !!term;
});

// Functions
const close = () => emit("closeModal");
const changeSupplier = () => {
  if(outcomesStore.outcome?.type === "OC" && withDocs) {
    showAlert.value = true;
    return;
  } else {
    showAlert.value = false;
    states.value.search = true;
    states.value.form = false;
    search.value = "";
  }
};
const cancelSearch = () => {
  states.value.search = false;
  states.value.form = true;
  search.value = "";
};
const handleChangeCondition = (condition) => {
  form.value.paymentTerm = condition.data;
  form.value.paymentTermName = condition.label;
};
const searchUsers = (e) => {
  const val = e.target.value.trim();

  // Cancelar timeout anterior
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Si el valor no cambió, no buscar
  if (val === lastSearch.value) return;

  // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
  searchTimeout.value = setTimeout(async () => {
    if (val === "") {
      results.value = [];
      return;
    }

    lastSearch.value = val;
    loading.value = true;

    try {
      const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
        archived: true,
        onlyContacts: true,
      });

      results.value = resp?.length ? mapperSearchResultUsers(resp) : [];
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }, 300);
};
const mapperSearchResultUsers = (list) => {
  return list.map((item) => {
    return {
      label: item?.data?.legalName || "-",
      text: item?.email || "-",
      img: item?.imgUrl ?? null,
      oldData: { ...item },
    };
  });
};
const updatedTypeOp = (type) => {
  setTimeout(() => {
    userStore.dataSheet.data.data.type = type;
    const types = {
      personal: {
        es: "Personal",
        en: "Personal",
      },
      business: {
        es: "Empresa",
        en: "Business",
      },
    };
    userStore.dataSheet.data.data.typeName =
      types?.[type]?.[globalStore.lang] || "";
  }, 100);
};
// Falta ---> falla esto en el back: addDefaultOrganizationToOneUser is not a function - Status: 500
const createSupplier = () => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "create";
    userStore.showBtnBack = true;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = search.value;
    }, 10);
    $bus.$on("receiveContact", (receiveContact) => {
      console.log(receiveContact);
    });
  }, 10);
};
const selectedSupplier = async (obj) => {
  search.value = "";

  // Settear el PaymentTerm
  const payTerm = obj?.oldData?.payment?.paymentTerm;
  if(payTerm) {
    const newPayTerm = paymentsStore.paymentTerms.find(p => p._id === payTerm);
    if(newPayTerm) form.value.paymentTerm = newPayTerm;
    form.value.paymentTermName = newPayTerm.name[globalStore.lang];
  };
  
  form.value.supplier = {
    data: {
      address: obj.oldData?.data?.address ?? "",
      idNumber: obj.oldData?.data?.idNumber ?? "",
      legalName: obj.oldData?.data?.legalName ?? "",
      nickName: obj.oldData?.data?.nickName ?? "",
      type: obj.oldData?.data?.type ?? "",
      typeName: "",
      icon: "building",
    },
    email: obj.oldData?.email ?? "",
    imgUrl: obj.oldData?.imgUrl ?? "",
    payment: {
      paymentTerm: obj.oldData?.payment.paymentTerm,
      condition: obj.oldData?.payment.paymentTerm,
      document: obj.oldData?.payment?.document ?? "",
      documentName: form.value.paymentTermName,
    },
    _id: obj.oldData?._id ?? "",
  };

  states.value = {
    search: false,
    form: true
  }
};
const save = async () => {
  if(isValidForm.value) {
    try {
      globalStore.loading = true;
      const body = { ...form.value };
      const resp = await outcomesStore.updateOutcome(body);
      if(resp.success) {
        outcomesStore.outcome = resp.data;
        const newReference = resp.data.reference;
        globalStore.updatedTitle(newReference);
        emit("closeModal");
      }
    } catch (error) {
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};
</script>

<template>
  <div class="edit">
    <div class="edit__header">
      <span v-text="t(module + '.title')"></span>
      <u-button-icon icon="close" class="btnIconModify" :color="color" @click="close" type="outlined" />
    </div>
    <div class="edit__body">
      <div class="edit__body-search" v-if="states.search">
        <u-search-by-type
          size="s"
          v-model="search"
          :placeholder="t(module + '.inputs.search.placeholder')"
          :options="results"
          :loading="loading"
          :showSearchIcon="true"
          :avatar="true"
          :create="true"
          :updated="false"
          :snippet="true"
          :iconSelect="null"
          :types="typesUser"
          @input="searchUsers($event)"
          @updatedTypeOp="updatedTypeOp"
          @newOption="createSupplier"
          @cleanInput="search = ''"
          @selectedOption="selectedSupplier"
        />
        <u-button :text="t(module + '.buttons.back')" icon="undo" type="outlined" :color="color" size="s" @click="cancelSearch" />
      </div>
      <div class="edit__body-supplier" v-else>
        <u-avatar :user="supplier" :size="80" />
        <div class="edit__body-supplier-text">
            <span v-text="supplier.name"></span>
            <span v-text="supplier.alias"></span>
            <span v-text="supplier.email"></span>
        </div>
        <u-button size="s" type="outlined" icon="change" :text="t(module + '.buttons.change')" @click="changeSupplier" />
        <u-button-icon size="s" icon="edit" class="btnFloat" v-if="false" />
      </div>
      <div v-if="showAlert" class="alert">
        <span class="u u-warning-outlined"></span>
        <span class="body-s-sb" v-text="t(module + '.alert')"></span>
        <button @click="showAlert = false"><span class="u u-close"></span></button>
      </div>
      <div class="line"></div>
      <div class="edit__body-form" v-if="states.form">
        <span class="title" v-text="t(module + '.subtitle')"></span>
        <div class="group" v-if="outcomesStore.outcome?.type === 'OC' && form?.documentType?.name">
            <span class="u u-open-book"></span>
            <span v-text="t(module + '.inputs.typeDocument.label')"></span>
            <u-select
                v-model="form.documentType.name"
                :disabled="true"
                size="s"
            />
        </div>
        <div class="group">
            <span class="u u-star"></span>
            <span v-text="t(module + '.inputs.paymentTerm.label')"></span>
            <u-select
                v-model="form.paymentTermName"
                :options="conditionOfPayOptions || []"
                :disabled="withPayments && withDocs"
                :full-data="true"
                @full-data="handleChangeCondition"
                size="s"
            />
        </div>
        <div class="group">
            <span class="u u-user"></span>
            <span v-text="t(module + '.inputs.contact.label')"></span>
            <u-input v-model="form.contactName" :placeholder="t(module + '.inputs.contact.placeholder')" size="s" />
        </div>
        <div class="group">
            <span class="u u-new-project"></span>
            <span v-text="t(module + '.inputs.reference.label')"></span>
            <u-input v-model="form.reference" :placeholder="t(module + '.inputs.reference.placeholder')" size="s" />
        </div>
      </div>
    </div>
    <div class="edit__footer">
      <u-button :text="t(module + '.buttons.cancel')" type="outlined" class="mainBtnModify" @click="close" />
      <u-button :text="t(module + '.buttons.save')" class="mainBtnModify" @click="save" :disabled="!isValidForm" />
    </div>
  </div>
</template>

<style scoped>
.edit {
  width: 540px;
  height: 80vh;
  max-height: 600px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

/* header */
.edit__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.edit__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.edit__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  align-items: center;
}
.alert {
  border: 1px solid var(--warning-border-default);
  width: 100%;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.alert span:nth-child(1) {
  font-size: 18px;
}
.alert span:nth-child(2) {
  color: var(--neutral-text-body);
}
.alert button {
  height: 22px;
}
.alert button span {
  font-size: 22px !important;
  line-height: 20px !important;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.alert button:hover span {
  color: var(--warning-border-default);
}
.title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.group {
  display: grid;
  grid-template-columns: 16px 150px 1fr;
  gap: 10px;
}
.group span {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
  height: 32px;
  padding-top: 8px;
}
.group span:nth-child(2) {
  font-weight: 600;
}
.edit__body-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}
.edit__body-search {
    height: 80px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    width: 100%;
}
.edit__body-supplier {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    align-items: center;
    gap: 16px;
    position: relative;
    width: 100%;
}
.edit__body-supplier-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.edit__body-supplier-text span:nth-child(1) {
    font-weight: 600;
    font-size: 18px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
  color: var(--neutral-text-body);
}
.edit__body-supplier-text span:nth-child(2) {
    font-weight: 600;
    font-size: 12px;
    line-height: 12px;
    letter-spacing: 0%;
    vertical-align: middle;
  color: var(--neutral-text-caption);
}
.edit__body-supplier-text span:nth-child(3) {
    font-weight: 600;
    font-size: 12px;
    line-height: 12px;
    letter-spacing: 0%;
    vertical-align: middle;
  color: var(--primary-text-default);
}

/* footer */
.edit__footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify, .btnFloat {
  border-radius: 50%;
}
.btnFloat {
    position: absolute;
    left: 50px;
    bottom: 0;
}
.mainBtnModify {
  width: 135px;
}

/* Global */
.line {
  height: 1px;
  width: 100%;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
</style>
