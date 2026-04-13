<script setup>
import { ref, defineEmits, onMounted, defineProps } from "vue";

import { debounce } from "@/utils/helpers";
import { createProject } from "@/utils/labels/incomes.json";
import { transformaDateIsoWithTime } from "@/utils/helpers";

// import middlewarePermisssionActivation from "~/composables/usePermissionActivation";

import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useIncomesStore from "@/stores/incomes";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import useBusinessAreasStore from "@/stores/businessAreas";

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const incomesStore = useIncomesStore();
const organizationStore = useOrganizationStore();
const permissionsStore = usePermissionsStore();
const businessAreasStore = useBusinessAreasStore();

// EVENT BUS
const { $bus } = useNuxtApp();

// PROPS
const props = defineProps({
  state: {
    type: String,
    default: "budget",
  },
  isCreateProjects: {
    type: Boolean,
  },
});

// EMITS
const emit = defineEmits(["closeModal", "lockModal"]);

// CONSTANTS
const inputs = createProject.inputs;
const defaultDate = new Intl.DateTimeFormat("sv-SE").format(new Date());
const saving = ref(false);
const loadingCurrency = ref(true);
const loadersForms = ref({
  executive: false,
});
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
  projectName: "",
  projectId: null,
  state: props.state,
  name: "",
  executive: {
    name: "",
    id: "",
    email: "",
    img: null,
  },
  client: {
    name: "",
    id: "",
    email: "",
    img: null,
  },
  contact: {
    name: "",
    id: "",
    email: "",
    img: null,
  },
  completionDate: "",
  assignmentDate: "",
  currency: {},
  currencyName: "",
  businessArea: {
    name: "",
    id: "",
  },
});
const results = ref([]);
const resultsBusinessArea = ref([]);
const loadingSearch = ref(false);
const helpersConst = ref({});
const typesUser = [
  {
    name: { es: "Empresa", en: "Business" },
    value: "business",
    icon: "building",
  },
  { name: { es: "Persona", en: "Personal" }, value: "personal", icon: "user" },
];

// FUNCTIONS
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

  return !Object.values(errors.value).some((e) => e);
};
const formatData = (obj) => {
  const currentOrg = useCookie("organization");
  let body = {
    name: obj.name,
    organization: currentOrg.value,
    state: obj.state,
    executive: {},
    completionDate:
      transformaDateIsoWithTime(obj.completionDate) || defaultDate,
    assignmentDate:
      transformaDateIsoWithTime(obj.assignmentDate) || defaultDate,
    client: {},
    contact: {},
    businessArea: "",
    currency: obj.currency._id || "",
  };
  //  Project
  if (obj.projectId) {
    body.projectId = obj.projectId;
  } else {
    body.projectName = obj.projectName;
  }

  // Executive
  if (obj.executive.id) {
    body.executive.contact = obj.executive.id;
    body.executive.data = { legalName: obj.executive.name };
    if (obj.executive.email !== "") {
      body.executive.email = obj.executive.email;
    }
    if (obj.executive.img !== "") body.executive.imgUrl = obj.executive.img;
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

  // BusinessArea
  if (obj.businessArea && obj.businessArea.id) {
    body.businessArea = obj.businessArea.id;
  }

  // Si no agrego la moneda, no envio para que se cree por defecto con la moneda de la organización
  if (body.currency === "") {
    delete body.currency;
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
    executive: () => {
      form.value.executive = empyValues;
    },
    client: () => {
      form.value.client = empyValues;
    },
    contact: () => {
      form.value.contact = empyValues;
    },
    businessArea: () => {
      form.value.businessArea = empyValuesBusinessArea;
    },
  };

  if (inputs[input]) inputs[input]();
};
const selectedOption = (input, op) => {
  const inputs = {
    projectName: () => {
      form.value.projectName = op.label;
      errors.value.projectName = false;
      form.value.currency =
        currencies.value.find((c) => c._id === op?.oldData?.currency?._id) ||
        {};
      form.value.currencyName = op.label;
      setTimeout(() => (form.value.projectId = op.oldData.id), 0);
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

    businessArea: () => {
      const obj = op?.oldData || {};
      form.value.businessArea = {
        name: op?.label ?? "",
        id: obj?._id || "",
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
const searchProjects = debounce(async (toSearch) => {
  form.value.projectId = null;
  if (toSearch !== "") {
    loadingSearch.value = true;
    await incomesStore.filterProjectsSimpleName(toSearch, true);
    results.value = incomesStore.temp.length
      ? mapperResults(incomesStore.temp, "projectName")
      : [];
    loadingSearch.value = false;
  }
}, 600);

// const searchProjects = async (toSearch) => {
//   form.value.projectId = null;
//   if (toSearch !== "") {
//     loadingSearch.value = true;
//     await incomesStore.filterProjectsSimpleName(toSearch, true);
//     results.value = incomesStore.temp.length
//       ? mapperResults(incomesStore.temp, "projectName")
//       : [];
//     loadingSearch.value = false;
//   }
// };

// Buscar Contactos
const searchContacts = debounce(async (toSearch, type) => {
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
}, 600);

// const searchContacts = async (toSearch, type) => {
//   form.value[type].id = null;
//   form.value[type].email = "";
//   form.value[type].img = "";

//   if (type === "contact") helpersConst.value.contact = false;

//   if (toSearch !== "") {
//     loadingSearch.value = true;
//     const query = { onlyContacts: true };
//     const resp = await userStore.findByUsersByNameOrEmail(
//       true,
//       false,
//       toSearch,
//       query
//     );
//     results.value = resp.length ? mapperResults(resp) : [];
//     loadingSearch.value = false;
//   }
// };

// Buscar Areas de Negocio
// Modificar la función searchbusinessArea para que maneje mejor la precarga
const searchbusinessArea = async (toSearch) => {
  const areas = businessAreasStore.businessAreas;

  if (toSearch !== "") {
    loadingSearch.value = true;
    try {
      // Filtra las áreas según el término de búsqueda
      const filtered = areas.filter((area) =>
        area.name.toLowerCase().includes(toSearch.toLowerCase()),
      );

      // Mapear los resultados al formato esperado
      resultsBusinessArea.value = filtered.length
        ? filtered.map((area) => ({
            label: area.name,
            id: area._id,
            oldData: area,
          }))
        : [];
    } catch (error) {
      console.error("Error al buscar áreas de negocio:", error);
      resultsBusinessArea.value = [];
    } finally {
      loadingSearch.value = false;
    }
  } else {
    // Si no hay término de búsqueda, mostrar todas las áreas
    resultsBusinessArea.value = areas.map((area) => ({
      label: area.name,
      id: area._id,
      oldData: area,
    }));
  }
};

// Función para precargar todas las áreas de negocio
const preloadBusinessAreas = () => {
  const areas = businessAreasStore.businessAreas;
  resultsBusinessArea.value = areas.map((area) => ({
    label: area.name,
    id: area._id,
    oldData: area,
  }));
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
const search = debounce(async (event, input) => {
  const toSearch = event.target.value.trim();
  results.value = [];

  const inputs = {
    projectName: () => searchProjects(toSearch),
    executive: () => searchMembers(toSearch),
    client: () => searchContacts(toSearch, "client"),
    contact: () => searchContacts(toSearch, "contact"),
    businessArea: () => searchbusinessArea(toSearch),
  };

  if (inputs[input]) inputs[input]();
}, 10);

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

const permissionsFormBudgetBusiness = () => {
  permissionDisablesFormOptions();
  permissionDisablesFormValue();
};

// controlar op.disabled
const permissionDisablesFormOptions = () => {
  inputs.state.options.forEach((op) => {
    if (op.value === "budget") {
      op.disabled = !permissionsStore.myPermissions?.income_create_budget;
    } else if (op.value === "business") {
      op.disabled = !permissionsStore.myPermissions?.income_create_business;
    } else {
      op.disabled = false;
    }
  });
};

const permissionDisablesFormValue = () => {
  if (permissionsStore.myPermissions?.income_create_budget) {
    form.value.state = "budget";
  } else if (permissionsStore.myPermissions?.income_create_business) {
    form.value.state = "business";
  } else {
    form.value.state = "budget"; // activa budget aunque no tenga permiso
  }
};

const changeCurrency = (currency) => {
  form.value.currency = currency;
  form.value.currencyName = currency.label;
};

// Controlar permisos del tipo de proyecto
// watch(
//   () => permissionsStore.profilePermissionsUserSession,
//   (newVal) => {
//     const permissions = newVal?.permissions || [];

//     const permissionMapping = {
//       budget: "create_budgets",
//       business: "create_business"
//     };

//     if (permissions.length === 0) {
//       inputs.state.options.forEach((op) => {
//         op.disabled = false;
//       });
//       return;
//     }

//     const hasBudgetPermission = permissions.some(p => p.code === permissionMapping.budget);
//     const hasBusinessPermission = permissions.some(p => p.code === permissionMapping.business);

//     // Controla el estado de habilitación
//     inputs.state.options.forEach((op) => {
//       if (op.value === 'budget') {
//         op.disabled = !hasBudgetPermission && hasBusinessPermission; // solo deshabilita si no tiene permiso y sí tiene el otro
//       } else if (op.value === 'business') {
//         op.disabled = !hasBusinessPermission;
//       } else {
//         op.disabled = false;
//       }
//     });

//     // Lógica para establecer el valor del formulario
//     if (hasBusinessPermission) {
//       form.value.state = 'business';
//     } else if (hasBudgetPermission) {
//       form.value.state = 'budget';
//     } else if (!hasBudgetPermission && !hasBusinessPermission) {
//       form.value.state = 'budget'; // activa budget aunque no tenga permiso
//     }

//   },
//   {
//     immediate: true,
//     deep: true
//   }
// );

// MOUNTED
onMounted(async () => {
  loadersForms.value.executive = true;

  try {
    const profile = userStore.userSession;
    await businessAreasStore.getBusinessAreaForOrganization();

    preloadBusinessAreas();

    permissionsFormBudgetBusiness();

    let resp = await organizationStore.findUserByOrganization(profile?.email);
    const executive = mapperResults(resp)[0];

    form.value.executive = {
      name: executive?.oldData?.data?.legalName || "",
      id: executive?.oldData?._id,
      email: executive?.oldData?.email || "",
      img: executive?.oldData?.imgUrl || profile.imgUrl || "",
      user: executive?.oldData?.user,
    };

    form.value.completionDate = defaultDate;
    form.value.assignmentDate = defaultDate;

    loadCurrencies();
  } catch (error) {
    console.error("Error al cargar los permisos:", error);
  } finally {
    loadersForms.value.executive = false;
  }
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

  form.value.currency = organizationStore?.organization?.currency || {};
  form.value.currencyName = form.value.currency?.name?.[globalStore.lang] || "";
  loadingCurrency.value = false;
};
</script>

<template>
  <div class="createModal">
    <div class="createModal__header">
      <span>{{ $t("createProject.title") }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        :disabled="saving"
        type="outlined"
        @action-btn="emit('closeModal')"
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
          <u-search
            :autoFocus="true"
            v-model="form.projectName"
            :create="true"
            :loading="loadingSearch"
            :placeholder="$t('createProject.inputs.projectName.placeholder')"
            :options="results"
            :error="errors.projectName"
            :disabled="saving"
            :parent="'containerForm'"
            @newOption="newOption('projectName')"
            @selectedOption="(op) => selectedOption('projectName', op)"
            @cleanInput="cleanInput('projectName')"
            @input="search($event, 'projectName')"
            :createLabel="$t('createProject.inputs.projectName.searchLabel')"
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
            :error="errors.businessAreaEmpty || errors.businessAreaInvalid"
            :disabled="saving"
            :parent="'containerForm'"
            :alert="
              errors.businessAreaEmpty || errors.businessAreaInvalid
                ? 'error'
                : ''
            "
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
            :disabled="saving || loadersForms.executive"
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
            :create="true"
            :snippet="true"
            :iconSelect="null"
            :types="typesUser"
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
            @input="search($event, 'client')"
            :createLabel="$t('createProject.inputs.client.searchLabel')"
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
            :iconSelect="null"
            :types="typesUser"
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
            @updatedTypeOp="getIconByType"
            @newOption="newOption('contact')"
            @selectedOption="(op) => selectedOption('contact', op)"
            @cleanInput="cleanInput('contact')"
            @input="search($event, 'contact')"
            :createLabel="$t('createProject.inputs.contact.searchLabel')"
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
        <!-- DATE CREATION -->
        <div class="createModal__content-group">
          <div class="createModal__content-label">
            <label>{{ $t("createProject.inputs.createAt.label") }}</label>
          </div>
          <u-calendar
            v-model="defaultDate"
            :disabled="true"
            :error="errors.createAt"
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
            :error="errors.date"
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
