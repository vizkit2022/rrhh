<script setup>
import { computed, ref, onMounted } from "vue";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";
import api from "@/composables/api";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";

// STORES
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const organizationStore = useOrganizationStore();
const permissionsStore = usePermissionsStore();

// CONSTANTS
const config = useRuntimeConfig();
const apiUrl = useCookie("apiUrl");
const idOrganization = useCookie("organization").value;
const router = useRouter();

// Determinar módulos habilitados por ambiente
const getEnabledModulesByEnv = () => {
  const env = apiUrl.value || config.public.API_URL?.trim() || api() || "";

  // Módulos habilitados en PRODUCCIÓN
  if (
    env.includes("production") ||
    env.includes("https://api.unabase.cc/app")
  ) {
    return [
      "incomes",
      "purchase",
      "salesDocuments",
      "banking-transactions",
      "validations",
      "contacts",
      "catalog",
      "settings-id-organization",
      "rrhh",
    ];
  }

  // Módulos habilitados en TEST/LOCAL
  if (
    env.includes("test") ||
    env.includes("https://apitest.unabase.cc/app") ||
    env.includes("local")
  ) {
    return [
      "incomes",
      "purchase",
      "salesDocuments",
      "banking-transactions",
      "validations",
      "contacts",
      "catalog",
      "settings-id-organization",
      "rrhh",
    ];
  }

  // Por defecto todos habilitados en desarrollo
  return null; // null = no aplicar filtro de ambiente
};

const enabledModules = getEnabledModulesByEnv();

const sections = computed(() => [
  {
    title: "Secciones",
    items: [
      {
        page: "Home",
        icon: "u u-inicio",
        path: "/",
        disabled: true, // Siempre deshabilitado
        name: "home",
        subItems: [],
      },
      {
        page: "Network",
        icon: "u u-network",
        path: "/",
        disabled: true, // Siempre deshabilitado
        name: "network",
        subItems: [],
      },
      {
        page: "Consolidado",
        icon: "u u-network",
        path: "/consolidated",
        disabled: true, // Siempre deshabilitado
        name: "consolidated",
        subItems: [],
      },
      {
        page: "Mis Proyectos",
        icon: "u u-projects",
        path: "/incomes",
        // Combinar permisos + ambiente
        disabled:
          !permissionsStore.myPermissions.page_projects ||
          (enabledModules && !enabledModules.includes("incomes")),
        name: "incomes",
        subItems: [
          {
            subPage: "Proyectos",
            path: "",
            direct: true,
            action: "projects",
            name: "",
            tab: 0,
          },
          {
            subPage: "Cotizaciones",
            path: "",
            direct: true,
            action: "budgets",
            name: "",
            tab: 1,
          },
          {
            subPage: "Negocios",
            path: "",
            direct: true,
            action: "business",
            name: "",
            tab: 2,
          },
        ],
      },
      {
        page: "Compras",
        icon: "u u-compras",
        path: "/outcomes",
        disabled:
          !permissionsStore.myPermissions.page_outcomes ||
          (enabledModules && !enabledModules.includes("purchase")),
        name: "purchase",
        subItems: [],
      },
      {
        page: "Documentos de Ventas",
        icon: "u u-ventas",
        path: "/salesDocuments",
        disabled: enabledModules && !enabledModules.includes("salesDocuments"),
        name: "salesDocuments",
        subItems: [],
      },
      {
        page: "Contabilidad",
        icon: "u u-contabilidad",
        path: "/",
        disabled: true, // Siempre deshabilitado
        name: "accounting",
        subItems: [],
      },
      {
        page: "Transacciones Bancarias",
        icon: "u u-cobros-y-pagos",
        path: "/banking-transactions",
        disabled:
          enabledModules && !enabledModules.includes("banking-transactions"),
        name: "banking-transactions",
        subItems: [],
      },
      {
        page: "Bandeja De Documentos",
        icon: "u u-folder-open",
        path: "/document-tray",
        disabled: true, // Siempre deshabilitado
        name: "document-tray",
        subItems: [],
      },
      {
        page: "Validaciones",
        icon: "u u-permisos",
        path: "/validations",
        disabled: enabledModules && !enabledModules.includes("validations"),
        name: "validations",
        subItems: [],
      },
      {
        page: "Contactos",
        icon: "u u-usuarios",
        path: "/contacts",
        disabled: enabledModules && !enabledModules.includes("contacts"),
        name: "contacts",
        subItems: [],
      },
      {
        page: "Catálogo",
        icon: "u u-book",
        path: "/catalog",
        disabled:
          !permissionsStore.myPermissions.page_catalog ||
          (enabledModules && !enabledModules.includes("catalog")),
        name: "catalog",
        subItems: [
          {
            subPage: "Items",
            path: "",
            direct: true,
            action: "items",
            name: "",
            tab: 0,
          },
          {
            subPage: "Categorías",
            path: "",
            direct: true,
            action: "categories",
            name: "",
            tab: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Recursos Humanos",
    items: [
      {
        page: "Trabajadores",
        icon: "u u-usuarios",
        path: "/rrhh/trabajadores",
        disabled: enabledModules && !enabledModules.includes("rrhh"),
        name: "rrhh-trabajadores",
        subItems: [],
      },
      {
        page: "Contratos",
        icon: "u u-folder-open",
        path: "/rrhh/contratos",
        disabled: enabledModules && !enabledModules.includes("rrhh"),
        name: "rrhh-contratos",
        subItems: [],
      },
      {
        page: "Liquidaciones",
        icon: "u u-cobros-y-pagos",
        path: "/rrhh/liquidaciones",
        disabled: enabledModules && !enabledModules.includes("rrhh"),
        name: "rrhh-liquidaciones",
        subItems: [],
      },
      {
        page: "Reportes",
        icon: "u u-ventas",
        path: "/rrhh/reportes",
        disabled: enabledModules && !enabledModules.includes("rrhh"),
        name: "rrhh-reportes",
        subItems: [],
      },
    ],
  },
  {
    title: "Ajustes",
    items: [
      {
        page: "Ajustes",
        icon: "u u-settings",
        path: `/settings/${idOrganization}/organization`,
        disabled:
          !permissionsStore.myPermissions.page_settings ||
          (enabledModules &&
            !enabledModules.includes("settings-id-organization")),
        name: `settings-id-organization`,
        subItems: [1, 2, 3],
      },
      {
        page: "Matriz de Permisos",
        icon: "u u-permisos",
        path: "/",
        disabled: true, // Siempre deshabilitado
        name: "network3",
        subItems: [],
      },
    ],
  },
]);

// MOUNTED
onMounted(() => {
  const storedSliderExpand = localStorage.getItem("sliderExpand");
  if (storedSliderExpand !== null) {
    globalStore.sliderExpand = storedSliderExpand === "true";
  }
});

// FUNCTIONS
const expand = () => {
  globalStore.sliderExpand = !globalStore.sliderExpand;
  localStorage.setItem("sliderExpand", globalStore.sliderExpand);
};

const actionSubPage = (action) => {
  const actions = {
    // Incomes
    projects: () => goToIncomes("projects"),
    budgets: () => goToIncomes("budgets"),
    business: () => goToIncomes("business"),
    // Category
    items: () => goToCatalog("items"),
    categories: () => goToCatalog("categories"),
  };

  if (actions[action] && action) actions[action]();
};

const logOut = () => {
  const idOrganization = useCookie("organization").value;
  if (idOrganization) organizationStore.saveLastOrganization(idOrganization);
  setTimeout(() => authStore.logOut(), 100);
};

// Incomes
const goToIncomes = (page) => {
  const tabs = {
    projects: 0,
    budgets: 1,
    business: 2,
  };
  router.replace("/incomes");
  setTimeout(() => {
    globalStore.tab = tabs[page] || 0;
  }, 10);
};

// Catalog
const goToCatalog = (page) => {
  const tabs = {
    items: 0,
    categories: 1,
  };
  router.replace("/catalog");
  setTimeout(() => {
    globalStore.tab = tabs[page] || 0;
  }, 10);
};

// COMPUTED
const widthSlider = computed(() => {
  return globalStore.sliderExpand ? "240px" : "80px";
});
const widthSliderItem = computed(() => {
  return globalStore.sliderExpand ? "208px" : "48px";
});
const posBtnExpand = computed(() => {
  return globalStore.sliderExpand ? "224px" : "64px";
});
const rotatedIcon = computed(() => {
  return globalStore.sliderExpand ? "180deg" : "0deg";
});
const colorIconExpand = computed(() => {
  return globalStore.sliderExpand
    ? "var(--primary-text-default)"
    : "var(--neutral-text-body)";
});
const paddingTitleSection = computed(() => {
  return globalStore.sliderExpand ? "0px 16px" : "auto";
});
</script>

<template>
  <div class="slider">
    <div class="slider__top">
      <NuxtLink to="/" class="slider__top-logo">
        <div class="logo center-x-y">
          <u-logo style="width: 31px" />
        </div>
        <div class="logoTextContainer">
          <u-logo-text class="logoText" />
        </div>
      </NuxtLink>
    </div>
    <div class="slider__content">
      <div
        class="slider__section"
        v-for="(section, s) in sections"
        :key="section.title"
      >
        <div class="slider__section-header">
          <span class="slider__section-title">{{ section.title }}</span>
        </div>
        <SliderItem
          v-for="item in section.items"
          :key="item.page"
          :data="item"
          @actionSubPage="actionSubPage"
        />
        <div
          v-if="sections.length - 1 !== s"
          class="slider__section-spacer"
        ></div>
      </div>
    </div>
    <button @click="expand" class="slider__btnExpand center-x-y">
      <span class="u u-chevron-right"></span>
    </button>
    <div class="slider__bottom">
      <div class="slider__bottom-container">
        <button
          class="slider__bottom-item-box"
          :disabled="true"
          @click="actionItem"
        >
          <NuxtLink to="/" class="slider__bottom-item-a">
            <div class="slider__bottom-icon">
              <span class="u u-soporte"></span>
            </div>
            <span class="label">Soporte</span>
          </NuxtLink>
        </button>
        <button
          class="slider__bottom-item-box"
          :disabled="false"
          @click="logOut"
        >
          <div class="slider__bottom-item-a">
            <div class="slider__bottom-icon">
              <span class="u u-log-out"></span>
            </div>
            <span class="label">Cerrar Sesión</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider {
  background-color: var(--neutral-background-default);
  width: v-bind("widthSlider");
  height: 100vh;
  position: relative;
  z-index: 999;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--elevation-l);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.slider::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.slider__top {
  background-color: var(--neutral-background-default);
  position: fixed;
  top: 0px;
  width: v-bind("widthSlider");
  height: 88px;
  flex-shrink: 0;
  padding: 0 16px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 10;
}
.slider__top-logo {
  width: v-bind("widthSliderItem");
  height: 88px;
  border-bottom: 2px solid var(--neutral-border-light);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  display: grid;
  grid-template-columns: 48px 1fr;
  overflow: hidden;
}
.slider__top-logo .logo {
  width: 48px;
  cursor: pointer;
}
.slider__top-logo .logoTextContainer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px;
  cursor: pointer;
}
.slider__top-logo .logoTextContainer .logoText {
  height: 28px;
  cursor: pointer;
}
.slider__top-logo .logoTextContainer svg {
  cursor: pointer;
  width: auto;
}
.slider__bottom {
  background-color: var(--neutral-background-default);
  position: fixed;
  bottom: 0px;
  width: v-bind("widthSlider");
  height: 114px;
  flex-shrink: 0;
  padding: 0 16px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slider__bottom-container {
  padding-top: 20px;
  width: v-bind("widthSliderItem");
  height: 114px;
  border-top: 2px solid var(--neutral-border-light);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.slider__bottom-item-box {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: v-bind("widthSliderItem");
  background-color: var(--neutral-background-default);
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}
.slider__bottom-item-box:disabled .slider__bottom-item-a {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider__bottom-item-box:not(:disabled):hover,
.slider__bottom-item-box:not(:disabled).active {
  background-color: var(--primary-surface-shadow-8a);
}

.slider__bottom-item-box:not(:disabled):hover span,
.slider__bottom-item-box:not(:disabled).active span {
  color: var(--primary-text-default) !important;
}

.slider__bottom-item-box .btn-moreOptions {
  position: absolute;
  width: 20px;
  height: 20px;
  right: 14px;
  z-index: 9;
  top: 6px;
  opacity: v-bind("showBtnSubItem");
}

.slider__bottom-item-box .btn-moreOptions:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.slider__bottom-item-a {
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  width: v-bind("widthSliderItem");
  height: 32px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.slider__bottom-item-a span.label {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
}

.slider__bottom-icon {
  width: 48px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.slider__bottom-icon span {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-body);
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slider__btnExpand {
  background-color: var(--neutral-background-default);
  position: fixed;
  left: v-bind("posBtnExpand");
  top: 30px;
  width: 28px;
  height: 28px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 8px;
  border: 1px solid var(--neutral-border-light);
  z-index: 11;
}

.slider__section-spacer {
  width: v-bind("widthSliderItem");
  height: 2px;
  background: var(--neutral-border-light);
  margin-left: 16px;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin-top: 10px;
}

.slider__btnExpand span {
  color: v-bind("colorIconExpand");
  font-size: 18px;
  transform: rotate(v-bind("rotatedIcon"));
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slider__content {
  flex-grow: 1;
  padding: 88px 0px 120px;
}

/* Sections */
.slider__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.slider__section-header {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  box-sizing: border-box;
}
.slider__section-title {
  margin-top: 25px;
  width: 80px;
  text-align: center;
  font-family: Nunito;
  padding: v-bind("paddingTitleSection");
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0.03em;
  color: var(--neutral-text-body);
  text-transform: uppercase;
}

/* Global Class */
.center-x-y {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
