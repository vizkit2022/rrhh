<script setup>
import { ref } from "vue";
import usePaymentsStore from "@/stores/payments";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();

// EventBus
const { $bus } = useNuxtApp();

// Constants
const { t } = useI18n();
const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits.step4.search";
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];
const hasSupplier = ref(false);

// Variables
const search = ref("");
const loading = ref(false);
const results = ref([]);
const searchTimeout = ref(null);
const lastSearch = ref("");

// Functions
const searchUsers = (e) => {
  const val = e.target.value.trim();

  results.value = [];

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
      // outcomesStore.formPO.processing = true;
      const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
        archived: true,
        onlyContacts: true,
      });

      results.value = resp?.length ? mapperSearchResultUsers(resp) : [];
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
      // outcomesStore.formPO.processing = false;
    }
  }, 600);
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

const createSupplier = () => {
  // Aqui debo pasar los datos al store
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "create";
    userStore.showBtnBack = true;
    setTimeout(async () => {
      userStore.dataSheet.data.data.legalName = search.value;
    }, 10);
    $bus.$on("receiveContact", async (receiveContact) => {
      hasSupplier.value = true;
      paymentsStore.formDeposits.supplier = {
        data: {
          address: receiveContact?.data?.address ?? "",
          idNumber: receiveContact?.data?.idNumber ?? "",
          legalName: receiveContact?.data?.legalName ?? "",
          nickName: receiveContact?.data?.nickName ?? "",
          type: receiveContact?.data?.type ?? "",
          typeName: "", // Falta
          icon: "building", // Talta
        },
        email: receiveContact?.email ?? "",
        imgUrl: receiveContact?.imgUrl ?? "",
        isUser: receiveContact?.isUser ?? false,
        _id: receiveContact?._id ?? "", // Falta - body.user._id
      };
      
      await nexStep();
    });
  }, 10);
};
const selectedSupplier = async (obj) => {
  hasSupplier.value = true;
  const body = obj.oldData;
  paymentsStore.formDeposits.supplier = {
    data: {
      address: body?.data?.address ?? "",
      idNumber: body?.data?.idNumber ?? "",
      legalName: body?.data?.legalName ?? "",
      nickName: body?.data?.nickName ?? "",
      type: body?.data?.type ?? "",
      typeName: "", // Falta
      icon: "building", // Talta
    },
    email: body?.email ?? "",
    imgUrl: body?.imgUrl ?? "",
    _id: body?._id ?? "",
  };
  
  await nexStep();
};

const nexStep = async () => {
  globalStore.loading = true;

  const idSupplier = paymentsStore?.formDeposits?.supplier?._id || null;
  if(idSupplier) {
    const resDestination = await paymentsStore.getBankAccountsByUser(idSupplier, true);
    paymentsStore.formDeposits.originBankAccounts = resDestination || [];
  }

  globalStore.loading = false;
  paymentsStore.formDeposits.step = 5;
};
</script>

<template>
  <div class="step">
    <div class="step__search">
      <img src="/img/default-user.png" alt="avatar">
      <u-search-by-type
          size="s"
          v-model="search"
          :placeholder="t(BASE_KEY)"
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
    </div>
  </div>
</template>

<style scoped>
.step {
  width: 650px;
  height: 453px;
}
.step__search {
  display: grid;
  grid-template-columns: 80px 1fr;
  column-gap: 16px;
  align-items: center;
}
.step__search img {
  width: 80px;
  height: 80px;
}
</style>
