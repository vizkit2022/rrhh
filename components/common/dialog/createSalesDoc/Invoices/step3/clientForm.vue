<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";
import {
  debounce,
  searchLocationByGoogleMaps,
  testGoogleMapsPlaces,
} from "@/utils/helpers";

const { t } = useI18n();
const module = "modules.sales.createSale";

const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();

// ── Google Maps ───────────────────────────────────────────────────────────────
const googleMapsAvailable = ref(true);
const options = ref([]);
const loading = ref(false);

const preFetchAvailableGoogle = async () => {
  googleMapsAvailable.value = await testGoogleMapsPlaces();
  if (!googleMapsAvailable.value) {
    const countries = await globalStore.getCountries();
    options.value.countryOriginal = countries.map((country) => ({
      label: country.name[globalStore.lang],
      place_id: country.place_id || "",
      fullData: country,
    }));
  }
};

const searchCountry = debounce(async (toSearch) => {
  try {
    const resp = await searchLocationByGoogleMaps({
      str: toSearch,
      type: "country",
    });
    options.value = resp;
  } catch (error) {
    options.value = [];
  } finally {
    loading.value = false;
  }
}, 600);

const searchCity = debounce(async (toSearch) => {
  try {
    const resp = await searchLocationByGoogleMaps({
      str: toSearch,
      type: "city",
      countryCode:
        salesStore?.formDocInvoice?.formRegister?.formDataClient?.dataAddress
          ?.country?.short_name ||
        organizationStore?.organization?.address?.country?.short_name ||
        "",
    });
    options.value = resp;
  } catch (error) {
    options.value = [];
  } finally {
    loading.value = false;
  }
}, 600);

const searchAddress = debounce(async (toSearch) => {
  try {
    const resp = await searchLocationByGoogleMaps({
      str: toSearch,
      type: "street",
      countryCode:
        salesStore?.formDocInvoice?.formRegister?.formDataClient?.dataAddress
          ?.country?.short_name ||
        organizationStore?.organization?.address?.country?.short_name ||
        "",
    });
    options.value = resp;
  } catch (error) {
    options.value = [];
  } finally {
    loading.value = false;
  }
}, 600);

const searchGoogle = (code) => {
  loading.value = true;
  const toSearch =
    salesStore?.formDocInvoice?.formRegister?.formDataClient?.[code];
  if (!toSearch) {
    options.value = [];
    return;
  }

  switch (code) {
    case "country":
      searchCountry(toSearch);
      break;
    case "city":
      searchCity(toSearch);
      break;
    case "address":
      searchAddress(toSearch);
      break;
  }
};

const selectedGoogle = (item, code) => {
  switch (code) {
    case "country":
      Object.assign(
        salesStore.formDocInvoice.formRegister.formDataClient.dataAddress
          .country,
        {
          name: item?.countryName,
          place_id: item?.place_id,
          short_name: item?.countryCode,
        },
      );
      break;
    case "city":
      Object.assign(
        salesStore.formDocInvoice.formRegister.formDataClient.dataAddress.city,
        { name: item?.label, place_id: item?.place_id },
      );
      break;
    case "address":
      salesStore.formDocInvoice.formRegister.formDataClient.dataAddress.street =
        item.label;
      break;
  }
};

const cleanInputGoogle = (code) => {
  options.value = [];
  switch (code) {
    case "country":
      salesStore.formDocInvoice.formRegister.formDataClient.country = "";
      salesStore.cleanDataAddress();
      break;
    case "city":
      salesStore.formDocInvoice.formRegister.formDataClient.city = "";
      Object.assign(
        salesStore.formDocInvoice.formRegister.formDataClient.dataAddress.city,
        { name: "", place_id: "" },
      );
      break;
    case "address":
      salesStore.formDocInvoice.formRegister.formDataClient.address = "";
      salesStore.formDocInvoice.formRegister.formDataClient.dataAddress.street =
        "";
      break;
  }
};

const disabledAddress = (code) => {
  const dataAddress =
    salesStore?.formDocInvoice?.formRegister?.formDataClient?.dataAddress;
  if (code === "address" || code === "city") {
    return !dataAddress?.country?.name || dataAddress?.country?.name === "";
  }
  return false;
};

// ── Field helpers ─────────────────────────────────────────────────────────────
const filterNumbers = (event, field, numeric) => {
  const value = event.target.value;
  if (!numeric) {
    salesStore.formDocInvoice.formRegister.formDataClient[field] = value;
    return;
  }
  salesStore.formDocInvoice.formRegister.formDataClient[field] = value.replace(
    /\D/g,
    "",
  );
};

// ── Form definition ───────────────────────────────────────────────────────────
const fields = [
  { icon: "user", code: "legalName", type: "text", disabled: false },
  { icon: "id", code: "numberID", type: "text", disabled: false },
  { icon: "work", code: "economicActivity", type: "text", disabled: false },
  { icon: "world", code: "country", type: "searchGoogle", disabled: false },
  { icon: "address", code: "city", type: "searchGoogle", disabled: false },
  { icon: "location", code: "address", type: "searchGoogle", disabled: false },
];

// ── Init client form data ─────────────────────────────────────────────────────
const initFormDataClient = async () => {
  const client = salesStore.formDocInvoice?.formRegister?.client;
  const clientStore = salesStore.formDocInvoice.formRegister.formDataClient;
  const respRequest = ref({});

  if (client && (client?._id || client?.contact)) {
    if (client?.data?.legalName !== clientStore?.legalName) {
      salesStore.cleanDataAddress();
      globalStore.loading = true;
      respRequest.value = await userStore?.getDataSheet(
        client?.contact || client?._id,
      );
      globalStore.loading = false;
    }
  }

  const baseAddress = {
    city: { name: "", place_id: "" },
    country: { name: "", place_id: "", short_name: "" },
    street: "",
  };

  const orgHasValidAddress = Boolean(
    organizationStore?.organization?.address?.country?.short_name,
  );

  let dataAddress;
  if (respRequest?.value?.address && !orgHasValidAddress) {
    dataAddress = {
      city: {
        name: respRequest.value.address.city?.name || "",
        place_id: respRequest.value.address.city?.place_id || "",
      },
      country: {
        name: respRequest.value.address.country?.name || "",
        place_id: respRequest.value.address.country?.place_id || "",
        short_name: respRequest.value.address.country?.short_name || "",
      },
      street: respRequest.value.address.street || "",
    };
  } else if (orgHasValidAddress) {
    dataAddress = {
      city: {
        name: organizationStore.organization.address.city?.name || "",
        place_id: organizationStore.organization.address.city?.place_id || "",
      },
      country: {
        name: organizationStore.organization.address.country?.name || "",
        place_id:
          organizationStore.organization.address.country?.place_id || "",
        short_name:
          organizationStore.organization.address.country?.short_name || "",
      },
      street: organizationStore.organization.address.street?.name || "",
    };
  } else if (clientStore?.dataAddress) {
    dataAddress = clientStore.dataAddress;
  } else {
    dataAddress = baseAddress;
  }

  const getVal = (reqPath, orgPath, fallback) =>
    reqPath || (orgHasValidAddress ? orgPath : fallback) || "";

  salesStore.formDocInvoice.formRegister.formDataClient = client
    ? {
        legalName:
          respRequest?.value?.data?.legalName ??
          client?.data?.legalName ??
          clientStore?.legalName ??
          "",
        numberID:
          respRequest?.value?.data?.idNumber ?? clientStore?.numberID ?? "",
        economicActivity:
          respRequest?.value?.data?.businessActivity ??
          clientStore?.economicActivity ??
          "",
        country: getVal(
          respRequest?.value?.address?.country?.name,
          organizationStore.organization?.address?.country?.name,
          clientStore?.country,
        ),
        address: getVal(
          respRequest?.value?.address?.street,
          organizationStore.organization?.address?.street?.name,
          clientStore?.address,
        ),
        city: getVal(
          respRequest?.value?.address?.city?.name,
          organizationStore.organization?.address?.city?.name,
          clientStore?.city,
        ),
        dataAddress,
      }
    : {
        legalName: "",
        numberID: "",
        economicActivity: "",
        country: "",
        address: "",
        city: "",
        dataAddress: baseAddress,
      };
};

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(
  () => salesStore.formDocInvoice.formRegister.client,
  (newValue, oldValue) => {
    if (newValue?.data.legalName !== oldValue?.data.legalName) {
      initFormDataClient();
    }
  },
  { deep: true, immediate: true },
);

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await preFetchAvailableGoogle();
});
</script>

<template>
  <div class="container_data_client">
    <div class="header_body">
      <div class="izq">
        <span class="body-l-sb" v-text="t(`${module}.step3.client.subTitle`)" />
      </div>
    </div>

    <div class="container_data">
      <div v-for="item in fields" :key="item.code" class="data">
        <div class="data_izq">
          <span :class="`u u-${item.icon}`" />
          <span class="body-m-sb">
            {{ t(`${module}.step3.client.inputsForm.${item.code}.label`) }}
          </span>
        </div>

        <div class="data_der">
          <!-- Text input -->
          <u-input
            v-if="item.type === 'text'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataClient[item.code]
            "
            :placeholder="
              t(`${module}.step3.client.inputsForm.${item.code}.placeholder`)
            "
            size="m"
            style="width: 100%"
            :disabled="item.disabled"
            @input="(e) => filterNumbers(e, item.code, item.numeric)"
          />

          <!-- Google search input -->
          <u-search
            v-if="item.type === 'searchGoogle'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataClient[item.code]
            "
            :placeholder="
              t(`${module}.step3.client.inputsForm.${item.code}.placeholder`)
            "
            size="m"
            style="width: 100%"
            :options="options"
            :loading="loading"
            :disabled="disabledAddress(item.code)"
            @input="searchGoogle(item.code)"
            @selectedOption="selectedGoogle($event, item.code)"
            @cleanInput="cleanInputGoogle(item.code)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container_data_client {
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  height: 100%;
  padding-top: 24px;
  gap: 24px;
  overflow: hidden;
  min-height: 0;
}

.header_body {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  justify-content: space-between;
}

.header_body .izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.header_body .izq span:nth-child(1) {
  color: var(--neutral-text-body);
}

.container_data {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.data {
  display: grid;
  grid-template-columns: 180px 376px;
  height: 48px;
}

.data_izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
}

.data_der {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
}
</style>
