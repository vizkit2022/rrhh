<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useOutcomesStore from "@/stores/outcomes";
import { useI18n } from "vue-i18n";
import { debounce } from "@/utils/helpers";

const { t } = useI18n();
const module = "modules.sales.createSale";

const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const outcomesStore = useOutcomesStore();

const props = defineProps({
  stepsFormData: { type: String, default: "none" },
});

const emit = defineEmits(["changeClient"]);

const { $bus } = useNuxtApp();

// ── State ─────────────────────────────────────────────────────────────────────
const searchClient = ref("");
const resultsClient = ref([]);
const loadingClient = ref(false);

const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// ── Computed ──────────────────────────────────────────────────────────────────
const hasSameClient = computed(
  () => !!salesStore.formDocInvoice?.formRegister?.client,
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDocumentName = (id) => {
  const doc = outcomesStore.documentTypes.find((doc) => doc._id === id);
  return doc ? capitalizeName(doc.name) : "";
};

const mapperSearchResultUsers = (list) =>
  list.map((item) => ({
    label: item?.data?.legalName || "-",
    text: item?.email || "-",
    img: item?.imgUrl ?? null,
    oldData: { ...item },
  }));

// ── Search ────────────────────────────────────────────────────────────────────
const searchClients = debounce(async (e) => {
  const text = e.target.value;
  try {
    loadingClient.value = true;
    const resp = await userStore.findByUsersByNameOrEmail(true, true, text, {
      archived: true,
      onlyContacts: true,
    });
    resultsClient.value = resp?.length ? mapperSearchResultUsers(resp) : [];
  } catch (error) {
    console.error(error);
  } finally {
    loadingClient.value = false;
  }
}, 300);

// ── Selection ─────────────────────────────────────────────────────────────────
const selectedClient = async (obj) => {
  const body = obj.oldData;
  salesStore.formDocInvoice.formRegister.client = {
    data: {
      address: body?.address ?? "",
      idNumber: body?.data?.idNumber ?? "",
      legalName: body?.data?.legalName ?? "",
      nickName: body?.data?.nickName ?? "",
      type: body?.data?.type ?? "",
      typeName: "",
      icon: "building",
    },
    email: body?.email ?? "",
    imgUrl: body?.imgUrl ?? "",
    payment: {
      paymentTerm: body?.payment.paymentTerm,
      condition: body?.payment.paymentTerm,
      document: body?.payment?.document ?? "",
      documentName: getDocumentName(body?.payment?.document),
    },
    _id: body?._id ?? "",
  };
  searchClient.value = "";
};

const updatedTypeOp = (type) => {
  setTimeout(() => {
    userStore.dataSheet.data.data.type = type;
    const types = {
      personal: { es: "Personal", en: "Personal" },
      business: { es: "Empresa", en: "Business" },
    };
    userStore.dataSheet.data.data.typeName =
      types?.[type]?.[globalStore.lang] || "";
  }, 100);
};

const createClient = () => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "create";
    userStore.showBtnBack = true;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = searchClient.value;
    }, 10);
    $bus.$on("receiveContact", (receiveContact) => {
      salesStore.formDocInvoice.formRegister.client = {
        data: {
          address: receiveContact?.data?.address ?? "",
          idNumber: receiveContact?.data?.idNumber ?? "",
          legalName: receiveContact?.data?.legalName ?? "",
          nickName: receiveContact?.data?.nickName ?? "",
          type: receiveContact?.data?.type ?? "",
          typeName: "",
          icon: "building",
        },
        email: receiveContact?.email ?? "",
        imgUrl: receiveContact?.imgUrl ?? "",
        isUser: receiveContact?.isUser ?? false,
        payment: {
          condition: receiveContact?.payment.condition,
          document: receiveContact?.payment?.document ?? "",
          documentName: getDocumentName(receiveContact?.payment?.document),
        },
        _id: receiveContact?._id ?? "",
      };
    });
  }, 10);
};

const changeClient = () => {
  salesStore.formDocInvoice.formRegister.client = null;
  emit("changeClient");
};
</script>

<template>
  <div class="container_search_client">
    <u-avatar
      :user="{ src: salesStore.formDocInvoice.formRegister?.client?.imgUrl }"
      :size="hasSameClient ? 64 : 76"
    />

    <!-- Cliente seleccionado -->
    <div v-if="hasSameClient" class="body-header-snippet">
      <div class="container_snippet">
        <div class="container_legalName">
          <span
            class="truncateText body-xl-sb"
            v-text="
              salesStore?.formDocInvoice?.formRegister?.client?.data?.legalName
            "
          />
          <img
            src="/img/TempMiguelPendienteAMigrar/verified.svg"
            alt="verified"
          />
        </div>
        <span class="truncateText body-xl-sb">
          {{ salesStore?.formDocInvoice?.formRegister?.client?.data?.nickName }}
        </span>
        <span
          class="truncateText body-l-sb"
          v-text="salesStore?.formDocInvoice?.formRegister?.client?.email"
        />
      </div>
      <u-button
        v-if="stepsFormData === 'client'"
        icon="change"
        :text="t(module + '.step3.client.buttons.changeClient')"
        type="outlined"
        size="s"
        @click="changeClient"
      />
    </div>

    <!-- Búsqueda de cliente -->
    <u-search-by-type
      v-if="!hasSameClient"
      v-model="searchClient"
      :options="resultsClient"
      :loading="loadingClient"
      style="flex-grow: 1"
      size="s"
      :placeholder="t(module + '.step3.none.input.placeholder')"
      :showSearchIcon="true"
      :avatar="true"
      :create="true"
      :updated="false"
      :snippet="true"
      :iconSelect="null"
      :types="typesUser"
      @input="searchClients($event)"
      @updatedTypeOp="updatedTypeOp"
      @newOption="createClient"
      @cleanInput="searchClient = ''"
      @selectedOption="selectedClient"
    />
  </div>
</template>

<style scoped>
.container_search_client {
  display: flex;
  flex-direction: row;
  height: 80px;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.body-header-snippet {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.body-header-snippet .container_snippet {
  display: flex;
  flex-direction: column;
}

.container_snippet .container_legalName {
  display: flex;
  width: 335px;
  align-items: center;
  height: 24px;
  gap: 8px;
  color: var(--neutral-text-body);
}

.container_snippet > span:nth-child(1) {
  color: var(--primary-text-default);
}
.container_snippet > span:nth-child(2) {
  width: 271px;
  height: 24px;
  color: var(--neutral-text-caption);
}
.container_snippet > span:nth-child(3) {
  width: 271px;
  color: var(--primary-text-default);
  height: 20px;
}

.truncateText {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
