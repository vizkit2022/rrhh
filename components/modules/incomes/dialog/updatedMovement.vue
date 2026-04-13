<script setup>
import { ref, defineEmits, defineProps, computed } from "vue";

import { debounce } from "@/utils/helpers";
import { updatedMovement } from "@/utils/labels/incomes.json";

import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useIncomesStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";
import useOrganizationStore from "@/stores/organization";
import useBusinessAreasStore from "@/stores/businessAreas";
import usePermissionsStore from "@/stores/permissions";
import { transformaDateIsoWithTime } from "@/utils/helpers";
// import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const incomesStore = useIncomesStore();
const linesStore = useLinesStore();
const organizationStore = useOrganizationStore();
const businessAreasStore = useBusinessAreasStore();
const permissionsStore = usePermissionsStore();

// EVENT BUS
const { $bus } = useNuxtApp();

// PROPS
const props = defineProps({
  state: {
    type: String,
    default: "budget",
  },
});

// EMITS
const emit = defineEmits(["closeModal", "lockModal", "refreshTable"]);

// CONSTANTS
const inputs = updatedMovement.inputs;
const headers = updatedMovement.table.headers;
const loadingCurrency = ref(false);
const searchCurrency = ref("");
const saving = ref(false);
const tabSelected = ref(0);
const tabs = ref([
  {
    label: "Inf. General",
    tab: 0,
  },
  {
    label: "Inf. Adicional",
    tab: 1,
    disabled: false,
  },
  {
    label: "Monedas",
    tab: 2,
    disabled: true,
  },
]);
const errors = ref({});
const infoProject = JSON.parse(JSON.stringify(incomesStore.currentProject));
const infoIncome = JSON.parse(JSON.stringify(incomesStore.income));
const dataCreatedAt = infoIncome?.createdAt || new Date() || "";
const form = ref({
  projectName: infoProject?.name ?? "",
  projectId: infoProject?._id ?? "",
  state: infoIncome?.state ?? "budget",
  name: infoIncome?.name ?? "",
  id: infoIncome?._id ?? "",
  completionDate: infoIncome?.completionDate || new Date(),
  assignmentDate: infoIncome?.assignmentDate || new Date(),
  businessArea: {
    name: infoIncome?.businessArea?.[0]?.name || "",
    id: infoIncome?.businessArea?.[0]?._id || "",
  },
  executive: {
    name: infoIncome?.executive?.data?.legalName || "",
    id: infoIncome?.executive?.contact?._id || "",
    email: infoIncome?.executive?.email || "",
    img: infoIncome?.executive?.imgUrl || "",
  },
  client: {
    name: infoIncome?.client?.data?.legalName || "",
    id: infoIncome?.client?.contact?._id || "",
    email: infoIncome?.client?.email || "",
    img: infoIncome?.client?.imgUrl || "",
  },
  contact: {
    name: infoIncome?.contact?.data?.legalName || "",
    id: infoIncome?.contact?.contact?._id || "",
    email: infoIncome?.contact?.email || "",
    img: infoIncome?.contact?.imgUrl || "",
  },
  currency: {
    default: {},
    defaultName: "",
    print: {},
    printName: "",
    others: [],
  },
});
const results = ref([]);
const changeCurrency = ref(false);
const resultsBusinessArea = ref([]);
const loadingSearch = ref(false);
const helpersConst = ref({
  client: true,
  contact: true,
});
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// FUNCTIONS
const getBreadcrumb = () => {
  const { fullPath } = useRoute();
  const breadcrumb = [
    { name: "Ventas", path: "/incomes" },
    {
      name: form.value.projectName,
      path: `/incomes/project/${form.value.projectId}`,
    },
    { name: form.value.name, path: fullPath },
  ];
  globalStore.updatedBreadcrumb(breadcrumb);
  globalStore.updatedTitle(form.value.name);
};
const save = async () => {
  if (isValidForm()) {
    saving.value = true;
    globalStore.loading = true;

    const body = formatData(form.value);

    try {
      let resp = null;
      // Si hay edición de la sección Monedas - montos manuales
      const endpointName = changeCurrency.value
        ? "updateMovementExchange"
        : "updateMovement";
      resp = await incomesStore?.[endpointName](body);

      if (resp) {
        incomesStore.income.completionDate = resp.completionDate;
        incomesStore.income.assignmentDate = resp.assignmentDate;
        incomesStore.income.name = resp.name;
        incomesStore.income.client = resp.client;
        incomesStore.income.contact = resp.contact;
        incomesStore.income.executive = resp.executive;
        incomesStore.income.numbers = resp.numbers;
        incomesStore.income.state = resp.state;
        incomesStore.income.currency = resp.currency;
        incomesStore.income.businessArea = resp.businessArea;
        globalStore.tag = resp.state;
        incomesStore.currencyFormat = resp.currency;
      }

      // SI un monto manual fue modificado
      if (changeCurrency.value) {
        globalStore.createTable = true;
        // Get de lineas
        if (incomesStore.hollywood) {
          await linesStore.getAllLinesIncomes({ parent: "null" });
        } else {
          await linesStore.getAllLinesIncomes();
        }

        // Actualizar metricas
        incomesStore.loadings.metrics = true;
        await linesStore.updateDataGrid();

        getBreadcrumb();

        // // Actualizar la tabla
        // emit("refreshTable");

        emit("closeModal");
      } else {
        getBreadcrumb();
        emit("closeModal");
      }

      // Revizar porque no se cierra el modal y el breadcrumb
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
    } finally {
      globalStore.loading = false;
      globalStore.title = incomesStore.income.name;
      globalStore.tag = incomesStore.income.state;
      saving.value = false;
    }
  }
};
const isValidForm = () => {
  // ProjectName
  errors.value.projectName = !form.value.projectName.trim();

  // Name
  errors.value.name = !form.value.name.trim();

  //businessArea
  errors.value.businessAreaEmpty = false;
  errors.value.businessAreaInvalid = false;

  const name = form.value.businessArea?.name?.trim();
  const id = form.value.businessArea?.id;

  if (!name) {
    errors.value.businessAreaEmpty = true;
  } else {
    const matchedArea = businessAreasStore.businessAreas.find((area) => {
      return area._id === id && area.name.toLowerCase() === name.toLowerCase();
    });

    if (!matchedArea) {
      errors.value.businessAreaInvalid = true;
    }
  }

  // Executive
  // Nombre obligatorio
  errors.value.executive = form.value.executive.id === null;

  // Client
  // Nombre opcional
  errors.value.client =
    form.value.client.name.trim() !== "" && form.value.client.id === null;

  // Contact
  /// Nombre opcional
  errors.value.contact =
    form.value.contact.name.trim() !== "" && form.value.contact.id === null;

  return !Object.values(errors.value).some((e) => e);
};
const formatData = (obj) => {
  const currentOrg = useCookie("organization");
  let body = {
    projectName: obj.projectName,
    projectId: obj.projectId,
    name: obj.name,
    businessArea: obj.businessArea.id,
    organization: currentOrg.value,
    _id: obj.id,
    state: obj.state,
    completionDate: transformaDateIsoWithTime(obj.completionDate),
    assignmentDate: transformaDateIsoWithTime(obj.assignmentDate),
    executive: {},
    client: {},
    contact: {},
    currency: {
      default: obj.currency.default,
      print: obj.currency.print,
      others: obj.currency.others.map((oth) => ({
        currency: oth?.currency?._id,
        valueToday: toNumber(oth.valueToday),
        valueManual: toNumber(oth.valueManual),
      })),
    },
    informationForm: incomesStore.informationForm,
  };

  function toNumber(value) {
    if (typeof value === "string") {
      // Detectamos la primera coma o punto
      const match = value.match(/[.,]/);
      if (match) {
        const firstSepIndex = match.index;
        // Reemplazamos ese primero por "."
        value =
          value.slice(0, firstSepIndex) +
          "." +
          value.slice(firstSepIndex + 1).replace(/[.,]/g, "");
      }
    }
    return Number(value);
  }

  // BusinessArea
  if (obj.businessArea && obj.businessArea.id) {
    body.businessArea = obj.businessArea.id;
  }

  // Executive
  if (obj.executive.id) {
    body.executive.contact = obj.executive.id;
    body.executive.data = { legalName: obj.executive.name };
    if (obj.executive.email !== "") {
      body.executive.email = obj.executive.email;
    }
    if (obj.executive.img !== "") body.executive.imgUrl = obj.executive.img;
  } else {
    delete body.client;
  }

  // Client
  if (obj.client.id) {
    body.client.contact = obj.client.id;
    body.client.data = { legalName: obj.client.name };
    if (obj.client.email !== "") {
      body.client.email = obj.client.email;
    }
    if (obj.client.img !== "") body.client.imgUrl = obj.client.img;
  } else {
    delete body.client;
  }

  // Contact
  if (obj.contact.id) {
    body.contact.contact = obj.contact.id;
    body.contact.data = { legalName: obj.contact.name };
    if (obj.contact.email !== "") {
      body.contact.email = obj.contact.email;
    }
    if (obj.contact.img !== "") body.contact.imgUrl = obj.contact.img;
  } else {
    delete body.contact;
  }

  return body;
};
const cleanInput = (input) => {
  const empyValues = {
    name: "",
    id: "",
    email: "",
    img: null,
  };

  const empyValuesBusinessArea = {
    name: "",
    id: "",
  };

  const inputs = {
    businessArea: () => {
      form.value.businessArea = empyValuesBusinessArea;
    },

    executive: () => {
      form.value.executive = empyValues;
    },
    client: () => {
      form.value.client = empyValues;
    },
    contact: () => {
      form.value.contact = empyValues;
    },
  };

  if (inputs[input]) inputs[input]();
};
const selectedOption = (input, op) => {
  const inputs = {
    businessArea: () => {
      const obj = op?.oldData || {};
      form.value.businessArea = {
        name: op?.label ?? "",
        id: obj?._id || "",
      };
    },

    executive: () => {
      const obj = op?.oldData || {};

      form.value.executive = {
        name: op?.label ?? "",
        id: obj?._id || "",
        email: obj?.email ?? "",
        img: obj?.imgUrl,
      };
    },
    client: () => {
      const obj = op?.oldData || {};

      form.value.client = {
        name: op?.label ?? "",
        id: obj?._id || "",
        email: obj?.email ?? "",
        img: obj?.imgUrl,
      };

      // Dar valor al contacto (solo si esta vacio)
      if (form.value.contact.name === "") {
        form.value.contact = { ...form.value.client };
        helpersConst.value.contact = true;
      }
    },
    contact: () => {
      const obj = op?.oldData || {};

      form.value.contact = {
        name: op?.label ?? "",
        id: obj?._id || "",
        email: obj?.email ?? "",
        img: obj?.imgUrl,
      };
    },
  };

  if (inputs[input]) inputs[input]();
};
const newOption = (input) => {
  const inputs = {
    client: () => contactFromDataSheet("client"),
    contact: () => contactFromDataSheet("contact"),
  };

  if (inputs[input]) inputs[input]();
};
const contactFromDataSheet = (type, id = null) => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    if (id) userStore.userDataSheetId = id;
    userStore.dataSheet.state = id ? "edit" : "create";
    userStore.showBtnBack = true;
    errors.value[type] = false;
    setTimeout(() => {
      userStore.dataSheet.data.data.legalName = form.value[type].name;
    }, 10);
    $bus.$on("receiveContact", (receiveContact) => {
      form.value[type] = {
        name: receiveContact?.data?.legalName || "",
        id: receiveContact?._id || null,
        email: receiveContact?.email || "",
        img: receiveContact?.imgUrl || "",
      };
    });
  }, 10);
};
const getIconByType = (type) => {
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
// Buscar Contactos
const searchContacts = async (toSearch, type) => {
  form.value[type].id = null;
  form.value[type].email = "";
  form.value[type].img = "";

  if (toSearch !== "") {
    loadingSearch.value = true;
    const query = { onlyContacts: true };
    const resp = await userStore.findByUsersByNameOrEmail(
      true,
      false,
      toSearch,
      query,
    );
    results.value = resp.length ? mapperResults(resp) : [];
    loadingSearch.value = false;
  }
};
// Buscar Miembros
const searchMembers = async (toSearch) => {
  form.value.executive.id = null;
  form.value.executive.email = "";
  form.value.executive.img = "";

  if (toSearch !== "") {
    loadingSearch.value = true;
    const resp = await organizationStore.findUserByOrganization(toSearch);
    results.value = resp.length ? mapperResults(resp) : [];
    loadingSearch.value = false;
  }
};

// Buscar Areas de Negocio
const searchbusinessArea = async (toSearch) => {
  const areas = businessAreasStore.businessAreas;
  if (toSearch !== "") {
    loadingSearch.value = true;
    try {
      const filtered = areas.filter((area) =>
        area.name.toLowerCase().includes(toSearch.toLowerCase()),
      );

      // Si hay coincidencias, se muestran; si no, se vacía la tabla
      resultsBusinessArea.value = filtered.map((area) => ({
        label: area.name,
        id: area._id,
        oldData: area,
      }));
    } catch (error) {
      resultsBusinessArea.value = [];
    } finally {
      loadingSearch.value = false;
    }
  } else {
    resultsBusinessArea.value = areas.map((area) => ({
      label: area.name,
      id: area._id,
      oldData: area,
    }));
  }
};

const preloadBusinessAreas = () => {
  const areas = businessAreasStore.businessAreas;
  resultsBusinessArea.value = areas.map((area) => ({
    label: area.name,
    id: area._id,
    oldData: area,
  }));
};

// BUSCADOR
const search = debounce(async (event, input) => {
  const toSearch = event.target.value.trim();
  helpersConst.value[input] = false;

  const inputs = {
    businessArea: () => searchbusinessArea(toSearch),
    executive: () => searchMembers(toSearch),
    client: () => searchContacts(toSearch, "client"),
    contact: () => searchContacts(toSearch, "contact"),
  };

  if (inputs[input]) inputs[input]();
}, 600);

/* *** Mappers - results ********/
const mapperResults = (list, type = "users") => {
  const resp = [];
  const types = {
    users: () => {
      list.forEach((l) => {
        resp.push({
          label: l?.data?.legalName,
          text: l?.email || l?.contactMethods?.emails?.[0] || "",
          img: l?.imgUrl,
          oldData: { ...l },
        });
      });
    },
  };
  types[type]();
  return resp;
};

// CURRENCY
const currencies = ref([]);
const moveInput = (e, pos) => {
  const limit = form.value.currency.others.length - 1;
  const options = [
    "ArrowDown",
    "ArrowUp",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Enter",
  ];
  if (options.indexOf(e.key) > -1) {
    const inputPositions = {
      ArrowDown: () => moveInputNext(pos, limit),
      ArrowUp: () => moveInputBack(pos, limit),
      ArrowLeft: () => moveInputBack(pos, limit),
      ArrowRight: () => moveInputNext(pos, limit),
      Tab: () => moveInputNext(pos, limit),
      Enter: () => moveInputNext(pos, limit),
    };
    const newId = inputPositions[e.key]();
    const newInput = document.getElementById(newId);
    newInput.focus();
    setTimeout(() => newInput.select(), 0);
  }
};
const moveInputBack = (pos, limit) => {
  const newPos = pos === 0 ? limit : pos - 1;
  return `input-${newPos}`;
};
const moveInputNext = (pos, limit) => {
  const newPos = pos === limit ? 0 : pos + 1;
  return `input-${newPos}`;
};
const selectCurrency = async (op, prop) => {
  form.value.currency[prop] = op;
  if (prop === "default") {
    form.value.currency.printName = op.label;
    form.value.currency.print = op;
    const currencyBase = op._id;
    loadingCurrency.value = true;
    tabs.value[0].disabled = true;
    tabs.value[1].disabled = true;
    tabs.value[2].disabled = true;
    if (currencyBase !== organizationStore?.organization?.currency?._id) {
      await globalStore.getMyCurrencies(true, currencyBase);
    } else {
      await globalStore.getMyCurrencies(true);
    }
    loadingCurrency.value = false;
    tabs.value[0].disabled = false;
    tabs.value[1].disabled = false;
    tabs.value[2].disabled = false;
    form.value.currency.others = [];
    currencies.value = [];
    globalStore.currencies.forEach((cur) => {
      currencies.value.push({
        label: cur.name?.[globalStore.lang],
        ...cur,
      });
    });
  }
};

onMounted(async () => {
  await businessAreasStore.getBusinessAreaForOrganization();
  form.value.currency.default = infoIncome?.currency?.default || {};
  form.value.currency.defaultName =
    infoIncome?.currency?.default?.name?.[globalStore.lang] || "";
  form.value.currency.print = infoIncome?.currency?.print || {};
  form.value.currency.printName =
    infoIncome?.currency?.print?.name?.[globalStore.lang] || "";
  form.value.currency.others = infoIncome?.currency?.others;
  preloadBusinessAreas();

  // if (infoIncome?.completionDate) {
  //   const d = infoIncome.completionDate;
  //   const dateStr =
  //     typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);

  //   form.value.completionDate = dateStr;
  // }

  const currentCurrency = form?.value?.currency?.default?._id || null;
  if (currentCurrency !== organizationStore.organization.currency._id) {
    await globalStore.getMyCurrencies(true, currentCurrency);
  } else {
    await globalStore.getMyCurrencies(true);
  }
  tabs.value[2].disabled = false;
});

watch(
  () => globalStore.currencies,
  (newCurrencies) => {
    currencies.value = newCurrencies.map((cur) => ({
      label: cur.name?.[globalStore.lang],
      ...cur,
    }));
  },
);

// search
function normalize(str) {
  return str
    .normalize("NFD") // separa letras y acentos
    .replace(/[\u0300-\u036f]/g, "") // elimina los acentos
    .toLowerCase();
}

const currenciesFiltered = computed(() => {
  const toSearch = normalize(searchCurrency.value.trim());
  if (!toSearch) return [];

  const excludedIds = form.value.currency.others.map((o) => o.currency._id);
  const defaultId = form.value.currency.default._id;

  return currencies.value.filter(
    (cur) =>
      normalize(cur.label).includes(toSearch) &&
      !excludedIds.includes(cur._id) &&
      cur._id !== defaultId,
  );
});

const addCurrency = (op) => {
  const obj = {
    currency: op,
    valueManual: Number(op.value.replace(",", "")) || 1,
    valueToday: Number(op.value.replace(",", "")) || 1,
  };
  form.value.currency.others.push(obj);
  setTimeout(() => {
    searchCurrency.value = "";
  }, 10);
};

const onlyNumbersLocal = (e) => {
  let valor = e.target.value;
  changeCurrency.value = true;

  // Paso 1: Eliminar todo lo que no sea número o punto
  valor = valor.replace(/[^0-9.]/g, "");
  // Paso 2: Asegurar solo un punto
  const partes = valor.split(".");
  if (partes.length > 2) {
    valor = partes[0] + "." + partes.slice(1).join("");
  }
  // Actualizar el valor del input
  e.target.value = valor;
};
</script>

<template>
  <div class="createModal">
    <div class="createModal__header">
      <span>{{ updatedMovement.title[globalStore.lang] }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        :disabled="saving"
        @action-btn="emit('closeModal')"
        type="outlined"
      />
    </div>
    <u-tabs
      :disabled="saving"
      :tabs="tabs"
      v-model="tabSelected"
      :fullscreen="false"
      class="containerTabsModify"
    />
    <div class="createModal__content" id="containerForm">
      <template v-if="tabSelected === 0">
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.projectName.label") }}</label>
            <span v-if="errors.projectName" class="error">{{
              $t("createProject.inputs.projectName.msg.required")
            }}</span>
          </div>
          <u-input v-model="form.projectName" :disabled="true" />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.name.label") }}</label>
            <span v-if="errors.name" class="error">{{
              $t("createProject.inputs.name.msg.required")
            }}</span>
          </div>
          <u-input
            v-model="form.name"
            :placeholder="$t('createProject.inputs.name.placeholder')"
            :error="errors.name"
            :disabled="
              saving || !permissionsStore.myPermissions.income_edit_project_name
            "
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.state.label") }}</label>
          </div>
          <div class="createModal__content-types">
            <u-button
              v-for="(op, o) in inputs.state.options"
              :key="o"
              :text="$t('createProject.inputs.state.options.' + op.value)"
              @action-btn="form.state = op.value"
              :type="form.state === op.value ? 'normal' : 'text'"
              style="width: 50%"
              :disabled="saving"
            />
          </div>
        </div>

        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.businessArea.label") }}</label>
            <span v-if="errors.businessAreaEmpty" class="error">{{
              $t("createProject.inputs.businessArea.msg.required")
            }}</span>
            <span v-else-if="errors.businessAreaInvalid" class="error">
              {{ $t("createProject.inputs.businessArea.msg.invalid") }}
            </span>
          </div>
          <u-select
            v-model="form.businessArea.name"
            :create="false"
            :loading="loadingSearch"
            :placeholder="$t('createProject.inputs.businessArea.placeholder')"
            :options="resultsBusinessArea"
            :alert="
              errors.businessAreaEmpty || errors.businessAreaInvalid
                ? 'error'
                : ''
            "
            :disabled="saving"
            :parent="'containerForm'"
            :alwaysShowOptions="true"
            :full-data="true"
            @full-data="(op) => selectedOption('businessArea', op)"
          />
          <!-- <u-search
            v-model="form.businessArea.name"
            :create="false"
            :loading="loadingSearch"
            :placeholder="$t('createProject.inputs.businessArea.placeholder')"
            :options="resultsBusinessArea"
            :error="errors.businessAreaEmpty || errors.businessAreaInvalid"
            :disabled="saving"
            :parent="'containerForm'"
            :alwaysShowOptions="true"
            @newOption="newOption('businessArea')"
            @selectedOption="(op) => selectedOption('businessArea', op)"
            @cleanInput="
              () => {
                cleanInput('businessArea');
                preloadBusinessAreas();
              }
            "
            @input="search($event, 'businessArea')"
          /> -->
        </div>

        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.executive.label") }}</label>
            <span v-if="errors.executive" class="error">{{
              $t("createProject.inputs.executive.msg.required")
            }}</span>
          </div>
          <u-search
            v-model="form.executive.name"
            :create="false"
            :snippet="true"
            :loading="loadingSearch"
            :avatar="true"
            :img="form.executive.img"
            :placeholder="$t('createProject.inputs.executive.placeholder')"
            :options="results"
            :error="errors.executive"
            :disabled="saving"
            :parent="'containerForm'"
            @newOption="newOption('executive')"
            @selectedOption="(op) => selectedOption('executive', op)"
            @cleanInput="cleanInput('executive')"
            @input="search($event, 'executive')"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.client.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.contact.subLabel")
            }}</span>
          </div>
          <u-search-by-type
            v-model="form.client.name"
            :create="!helpersConst.client"
            :update="!helpersConst.client"
            :snippet="true"
            :loading="loadingSearch"
            :avatar="true"
            :img="form.client.img"
            :placeholder="$t('createProject.inputs.client.placeholder')"
            :options="results"
            :error="errors.client"
            :disabled="
              saving ||
              !permissionsStore.myPermissions.income_edit_project_client
            "
            :parent="'containerForm'"
            :iconSelect="null"
            :types="typesUser"
            @updatedTypeOp="getIconByType"
            @newOption="newOption('client')"
            @selectedOption="(op) => selectedOption('client', op)"
            @cleanInput="cleanInput('client')"
            @input="search($event, 'client')"
          />
          <button
            class="moreDetails"
            v-if="form.client.id && form.client.img"
            @click="contactFromDataSheet('client', form.client.id)"
          >
            <u-avatar
              :user="{ name: form.client.name, src: form.client.img }"
              :size="25"
            />
            <div class="icon"><span class="u u-click"></span></div>
          </button>
          <button
            v-if="form.client.id && form.client.img === ''"
            class="moreDetailsText"
            @click="contactFromDataSheet('client', form.client.id)"
          >
            <span class="truncateText">
              Ver ficha de: <strong>{{ form.client.name }}</strong>
            </span>
          </button>
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.contact.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.contact.subLabel")
            }}</span>
          </div>
          <u-search-by-type
            v-model="form.contact.name"
            :create="!helpersConst.contact"
            :update="!helpersConst.contact"
            :snippet="true"
            :img="form.contact.img"
            :loading="loadingSearch"
            :avatar="true"
            :placeholder="$t('createProject.inputs.contact.placeholder')"
            :options="results"
            :error="errors.contact"
            :disabled="saving"
            :parent="'containerForm'"
            :iconSelect="null"
            :types="typesUser"
            @updatedTypeOp="getIconByType"
            @newOption="newOption('contact')"
            @selectedOption="(op) => selectedOption('contact', op)"
            @cleanInput="cleanInput('contact')"
            @input="search($event, 'contact')"
          />
          <button
            class="moreDetails"
            v-if="form.contact.id && form.contact.img"
            @click="contactFromDataSheet('contact', form.contact.id)"
          >
            <u-avatar
              :user="{ name: form.contact.name, src: form.contact.img }"
              :size="25"
            />
            <div class="icon"><span class="u u-click"></span></div>
          </button>
          <button
            v-if="form.contact.id && form.contact.img === ''"
            class="moreDetailsText"
            @click="contactFromDataSheet('contact', form.contact.id)"
          >
            <span class="truncateText">
              Ver ficha de: <strong>{{ form.contact.name }}</strong>
            </span>
          </button>
        </div>
      </template>
      <template v-if="tabSelected === 1">
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.createAt.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.createAt.subLabel")
            }}</span>
          </div>
          <u-calendar
            v-model="dataCreatedAt"
            :disabled="true"
            :use-iso="true"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.completionDate.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.completionDate.subLabel")
            }}</span>
          </div>
          <u-calendar
            v-model="form.completionDate"
            :disabled="saving"
            :use-iso="true"
            :error="errors.completionDate"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.assignmentDate.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.assignmentDate.subLabel")
            }}</span>
          </div>
          <u-calendar
            v-model="form.assignmentDate"
            :disabled="saving"
            :use-iso="true"
            :error="errors.assignmentDate"
          />
        </div>
      </template>
      <template v-if="tabSelected === 2">
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ inputs.currency.default.label[globalStore.lang] }}</label>
          </div>
          <u-select
            v-model="form.currency.defaultName"
            :placeholder="inputs.currency.default.placeholder[globalStore.lang]"
            :options="currencies"
            :disabled="loadingCurrency || linesStore.lines.length !== 0"
            :full-data="true"
            @full-data="(op) => selectCurrency(op, 'default')"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ inputs.currency.print.label[globalStore.lang] }}</label>
          </div>
          <u-select
            v-model="form.currency.printName"
            :placeholder="inputs.currency.print.placeholder[globalStore.lang]"
            :disabled="loadingCurrency || saving"
            :options="currencies"
            :full-data="true"
            @full-data="(op) => selectCurrency(op, 'print')"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ inputs.currency.add.label[globalStore.lang] }}</label>
          </div>
          <u-search
            v-model="searchCurrency"
            :placeholder="inputs.currency.add.placeholder[globalStore.lang]"
            :disabled="loadingCurrency || saving"
            :options="currenciesFiltered"
            @cleanInput="searchCurrency = ''"
            @selectedOption="addCurrency"
          />
        </div>
        <div class="createModal__content-table">
          <div class="createModal__content-table-mainHeader">
            <div class="createModal__content-table-header">
              <div class="createModal__content-table-col first">
                <span>{{ headers.currency[globalStore.lang] }}</span>
              </div>
              <div class="createModal__content-table-col">
                <span>{{ headers.valueToday[globalStore.lang] }}</span>
              </div>
              <div class="createModal__content-table-col">
                <span>{{ headers.assignedValue[globalStore.lang] }}</span>
              </div>
            </div>
          </div>
          <div class="createModal__content-table-list">
            <div
              class="createModal__content-table-item"
              v-for="(currency, i) in form.currency.others.filter(
                (ot) => ot?.currency?._id !== form?.currency?.default?._id,
              )"
              :key="i"
            >
              <div class="createModal__content-table-col first">
                <span class="truncateText">{{
                  currency?.currency?.name?.[globalStore.lang] || "-"
                }}</span>
              </div>
              <div class="createModal__content-table-col">
                <span class="truncateText">{{
                  currency?.valueToday || "-"
                }}</span>
              </div>
              <div class="createModal__content-table-col">
                <input
                  width="86px"
                  type="text"
                  :id="`input-${i}`"
                  v-model="currency.valueManual"
                  @input="onlyNumbersLocal($event)"
                  @blur="
                    currency.valueManual = currency.valueManual.trim() || '0'
                  "
                  @keydown="moveInput($event, i)"
                />
              </div>
            </div>
            <div
              v-if="form?.currency?.others?.length === 0"
              class="noCurrenciesBox"
            >
              <span class="noCurrenciesSpan">{{
                updatedMovement.table.noData.main[globalStore.lang]
              }}</span>
              <img
                src="../../../../public/img/banking-transactions/lupa.svg"
                alt="lupa"
              />
              <span class="noCurrenciesSpan second">{{
                updatedMovement.table.noData.second[globalStore.lang]
              }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="createModal__actions">
      <u-button
        :text="$t('createProject.buttons.cancel')"
        type="outlined"
        class="mainBtnModify"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
      <u-button
        :text="
          saving
            ? $t('createProject.buttons.saving')
            : $t('createProject.buttons.save')
        "
        class="mainBtnModify"
        :disabled="saving"
        @click="save"
      />
    </div>
  </div>
</template>

<style scoped>
.createModal {
  height: calc(100vh - 80px);
  display: grid;
  grid-template-rows: 40px 42px 1fr 32px;
  gap: 16px;
}

/* header */
.createModal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.createModal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* Content */
.createModal__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 5px;
}

.createModal__content-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.createModal__content-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.createModal__content-group .createModal__content-label label,
.createModal__content-group .createModal__content-label span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.createModal__content-group .createModal__content-label label {
  color: var(--neutral-text-body);
}

.createModal__content-group .createModal__content-label span.normal {
  color: var(--neutral-text-caption);
}

.createModal__content-group .createModal__content-label span.error {
  color: var(--danger-text-default);
}

/* Type */
.createModal__content-types {
  display: flex;
  align-items: center;
  background-color: var(--primary-surface-shadow-12a);
  border-radius: 14px;
  height: 46px;
  padding: 0 4px;
}

/* Actions */
.createModal__actions {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}

.mainBtnModify {
  width: 135px;
}

.btnAddEmailModify {
  transform: scale(0.8);
  transform-origin: left;
  margin-left: -10px;
}

span,
label {
  font-family: Nunito;
}

.moreDetails {
  position: absolute;
  border-radius: 12px;
  left: 18px;
  bottom: 6px;
  box-shadow: var(--shadow-2);
}

.moreDetails .icon {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background-color: var(--secondary-text-default);
  height: 16px;
  width: 16px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 1.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

.moreDetails .icon span {
  color: var(--neutral-background-default);
  font-size: 14px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0.3);
  }

  70% {
    box-shadow: 0 0 0 8px rgb(76, 75, 224, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0);
  }
}

.moreDetailsText {
  display: inline;
  width: fit-content;
  text-align: left;
  transition: 0.3s;
}

.moreDetailsText span {
  color: var(--primary-text-default);
  font-size: 12px;
}

.moreDetailsText:hover span,
.moreDetailsText span:hover {
  color: var(--primary-text-subtle);
}

/* Table */
.createModal__content-table {
  position: relative;
  overflow-y: auto;
  max-height: calc(
    100vh - 80px - 40px - 16px - 42px - 16px - 40px - 16px - 58px - 58px -
      58px - 42px - 10px
  );
  padding-right: 1px;
}

.createModal__content-table::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.createModal__content-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.createModal__content-table-mainHeader {
  position: sticky;
  top: 0;
  background-color: var(--neutral-background-default);
}

.createModal__content-table-header {
  background-color: var(--neutral-background-darker);
  display: grid;
  grid-template-columns: 165px 84px 108px;
  height: 32px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px 8px 0 0;
}

.createModal__content-table-header .createModal__content-table-col,
.createModal__content-table-list .createModal__content-table-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
}

.createModal__content-table-header .createModal__content-table-col {
  height: 32px;
}

.createModal__content-table-list .createModal__content-table-col {
  height: 42px;
}

.createModal__content-table-header .createModal__content-table-col.first,
.createModal__content-table-list .createModal__content-table-col.first {
  justify-content: flex-start;
}

.createModal__content-table-header span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.createModal__content-table-list {
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 8px 8px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.createModal__content-table-item {
  display: grid;
  grid-template-columns: 165px 84px 108px;
  height: 42px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.createModal__content-table-item span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.createModal__content-table-item:last-child {
  border-bottom: none;
}

.createModal__content-table-col input {
  background-color: var(--neutral-background-default);
  width: 86px;
  height: 32px;
  padding: 0 12px;
  text-align: right;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
  font-size: 14px;
  line-height: 24px;
  color: var(--neutral-text-body);
  transition: 0.3s;
}

.createModal__content-table-col input:hover {
  border: 1px solid var(--primary-border-subtle);
}

.createModal__content-table-col input:active,
.createModal__content-table-col input:focus {
  border: none;
  box-shadow: inset 0px 0px 0px 2px rgba(58, 199, 165, 1);
  background-color: var(--primary-surface-shadow-8a);
}

.createModal__content-table-col input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}

.noCurrenciesBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.noCurrenciesSpan {
  color: var(--neutral-text-caption);
  font-size: 14px;
  line-height: 14px;
  text-align: center;
}
.noCurrenciesSpan.second {
  font-size: 12px;
  line-height: 12px;
}
</style>
