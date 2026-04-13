<script setup>
import { ref, defineEmits, onMounted, defineProps } from "vue";

import { debounce } from "@/utils/helpers";
import { createProject, createMovement } from "@/utils/labels/incomes.json";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useIncomesStore from "@/stores/incomes";
import useOrganizationStore from "@/stores/organization";
import useBusinessAreasStore from "@/stores/businessAreas";
import usePermissionsStore from "@/stores/permissions";
// import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const incomesStore = useIncomesStore();
const organizationStore = useOrganizationStore();
const businessAreasStore = useBusinessAreasStore();
const permissionsStore = usePermissionsStore();
import { transformaDateIsoWithTime } from "@/utils/helpers";

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
const emit = defineEmits(["closeModal", "lockModal"]);

// CONSTANTS
const rawInputs = createProject.inputs;
const loadingCurrency = ref(true);
const defaultDate = new Intl.DateTimeFormat("sv-SE").format(new Date());
const inputs = reactive({
  state: {
    options: rawInputs.state.options.map((op) => ({
      name: op.name,
      value: op.value,
      disabled: op.disabled,
    })),
  },
});
const saving = ref(false);
const tabSelected = ref(0);
const currencies = ref([]);
const tabs = computed(() => [
  {
    label: "Inf. General",
    tab: 0,
  },
  {
    label: "Inf. Adicional",
    tab: 1,
    disabled: loadingCurrency.value,
  },
]);
const errors = ref({});
const form = ref({
  projectName: incomesStore.currentProject.name,
  projectId: incomesStore.currentProject._id,
  name: "",
  state: props.state,
  executive: {
    name: incomesStore?.currentProject?.executive?.data?.legalName || "",
    id: incomesStore?.currentProject?.executive?.contact?._id || "",
    email: incomesStore?.currentProject?.executive?.email || "",
    img: incomesStore?.currentProject?.executive?.imgUrl || null,
  },
  businessArea: {
    name: "",
    id: "",
  },
  client: {
    name: incomesStore?.currentProject?.client?.data?.legalName || "",
    id: incomesStore?.currentProject?.client?.contact?._id || "",
    email: incomesStore?.currentProject?.client?.email || "",
    img: incomesStore?.currentProject?.client?.imgUrl || null,
  },
  contact: {
    name: incomesStore?.currentProject?.contact?.data?.legalName || "",
    id: incomesStore?.currentProject?.contact?.contact?._id || "",
    email: incomesStore?.currentProject?.contact?.email || "",
    img: incomesStore?.currentProject?.contact?.imgUrl || null,
  },
  completionDate: "",
  assignmentDate: "",
  currency: {},
  currencyName: "",
});
const results = ref([]);
const resultsBusinessArea = ref([]);
const loadingSearch = ref(false);
const helpersConst = ref({});
const typesUser = [
  { name: { es: "Empresa", en: "Business" }, value: "business" },
  { name: { es: "Persona", en: "Personal" }, value: "personal" },
];

// FUNCTIONS

const permissionsFormBudgetBusiness = () => {
  permissionDisablesFormOptions();
  permissionDisablesFormValue();
};

const permissionDisablesFormOptions = () => {
  inputs.state.options = inputs.state.options.map((op) => {
    if (op.value === "budget") {
      return {
        ...op,
        disabled: !permissionsStore.myPermissions?.income_create_budget,
      };
    } else if (op.value === "business") {
      return {
        ...op,
        disabled: !permissionsStore.myPermissions?.income_create_business,
      };
    } else {
      return { ...op, disabled: false };
    }
  });
};

const permissionDisablesFormValue = () => {
  if (
    permissionsStore.myPermissions?.income_create_budget &&
    !permissionsStore.myPermissions?.income_create_business
  ) {
    form.value.state = "budget";
  } else if (
    permissionsStore.myPermissions?.income_create_business &&
    !permissionsStore.myPermissions?.income_create_budget
  ) {
    form.value.state = "business";
  }
};

const save = async () => {
  if (isValidForm()) {
    saving.value = true;
    globalStore.loading = true;

    const body = formatData(form.value);

    try {
      await incomesStore.createIncome(body);
      globalStore.edit = true;
      emit("closeModal");
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
    } finally {
      globalStore.loading = false;
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
    name: obj.name,
    organization: currentOrg.value,
    state: obj.state,
    businessArea: "",
    completionDate:
      transformaDateIsoWithTime(obj.completionDate) || defaultDate,
    assignmentDate:
      transformaDateIsoWithTime(obj.assignmentDate) || defaultDate,
    executive: {},
    client: {},
    contact: {},
    currency: { default: obj.currency._id || "" },
  };
  //  Project
  if (obj.projectId) {
    body.projectId = obj.projectId;
  } else {
    body.projectName = obj.projectName;
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
    projectName: () => {
      errors.projectName = true;
      form.value.projectName = "";
    },
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
    projectName: () => {
      form.value.projectName = op.label;
      errors.value.projectName = false;
      setTimeout(() => (form.value.projectId = op.oldData.id), 0);
    },

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
    projectName: () => {
      form.value.projectId = null;
      errors.value.projectName = form.value.projectName.trim() === "";
    },
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
      console.log(receiveContact);
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

// Buscar Proyectos
const searchProjects = async (toSearch) => {
  form.value.projectId = null;
  if (toSearch !== "") {
    loadingSearch.value = true;
    await incomesStore.filterProjectsSimpleName(toSearch, true);
    results.value = incomesStore.temp.length
      ? mapperResults(incomesStore.temp, "projectName")
      : [];
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

// Buscar Contactos
const searchContacts = async (toSearch, type) => {
  form.value[type].id = null;
  form.value[type].email = "";
  form.value[type].img = "";

  if (type === "contact") helpersConst.value.contact = false;

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

// BUSCADOR
const handleSearch = (event, input) => {
  results.value = [];
  const toSearch = event.target.value.trim();

  search(toSearch, input);
};

const search = debounce(async (toSearch, input) => {
  const inputs = {
    projectName: () => searchProjects(toSearch),
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
    projectName: () => {
      list.forEach((l) => {
        resp.push({
          label: l.name,
          oldData: { ...l },
        });
      });
    },
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
const changeCurrency = (currency) => {
  form.value.currency = currency;
  form.value.currencyName = currency.label;
};

onMounted(async () => {
  await businessAreasStore.getBusinessAreaForOrganization();

  preloadBusinessAreas();
  permissionsFormBudgetBusiness();

  form.value.completionDate = defaultDate;
  form.value.assignmentDate = defaultDate;

  loadCurrencies();
});

const loadCurrencies = async () => {
  const currencyObj = await globalStore.getMyCurrencies();
  currencies.value.push({
    ...currencyObj.currency,
    label: currencyObj?.currency?.name?.[globalStore.lang],
  });
  currencyObj.currencies.forEach((c) => {
    currencies.value.push({ ...c, label: c?.name?.[globalStore.lang] });
  });

  form.value.currency =
    currencies.value.find(
      (c) => c._id === incomesStore.currentProject?.currency?._id,
    ) || {};
  form.value.currencyName = form.value.currency?.label || "";
  loadingCurrency.value = false;
};
</script>

<template>
  <div class="createModal">
    <div class="createModal__header">
      <span>{{ createMovement.title[globalStore.lang] }}</span>
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
              :disabled="saving || op.disabled"
            />
          </div>
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.name.label") }}</label>
            <span v-if="errors.name" class="error">{{
              $t("createProject.inputs.name.msg.required")
            }}</span>
          </div>
          <u-input
            :autoFocus="true"
            id="nameMovement"
            v-model="form.name"
            :placeholder="$t('createProject.inputs.name.placeholder')"
            :error="errors.name"
            :disabled="saving"
          />
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
            @input="handleSearch($event, 'executive')"
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
            :iconSelect="null"
            :types="typesUser"
            :create="true"
            :snippet="true"
            :loading="loadingSearch"
            :avatar="true"
            :img="form.client.img"
            :placeholder="$t('createProject.inputs.client.placeholder')"
            :options="results"
            :error="errors.client"
            :disabled="saving"
            :parent="'containerForm'"
            @updatedTypeOp="getIconByType"
            @newOption="newOption('client')"
            @selectedOption="(op) => selectedOption('client', op)"
            @cleanInput="cleanInput('client')"
            @input="handleSearch($event, 'client')"
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
            :iconSelect="null"
            :types="typesUser"
            :snippet="true"
            :img="form.contact.img"
            :loading="loadingSearch"
            :avatar="true"
            :placeholder="$t('createProject.inputs.contact.placeholder')"
            :options="results"
            :error="errors.contact"
            :disabled="saving"
            :parent="'containerForm'"
            @updatedTypeOp="getIconByType"
            @newOption="newOption('contact')"
            @selectedOption="(op) => selectedOption('contact', op)"
            @cleanInput="cleanInput('contact')"
            @input="handleSearch($event, 'contact')"
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
      <template v-else>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.currency.label") }}</label>
          </div>
          <u-select
            v-model="form.currencyName"
            :disabled="saving"
            :options="currencies"
            :full-data="true"
            @full-data="changeCurrency"
          />
        </div>
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.createAt.label") }}</label>
            <span class="normal">{{
              $t("createProject.inputs.createAt.subLabel")
            }}</span>
          </div>
          <u-calendar v-model="defaultDate" :disabled="true" :use-iso="true" />
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
            ? $t('createProject.buttons.creating')
            : $t('createProject.buttons.create')
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
</style>
