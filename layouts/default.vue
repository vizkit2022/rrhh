<script setup>
// 📦 Imports
import { onMounted, onUnmounted, watch, ref } from "vue";
import { toast } from "vue3-toastify";
import { usePreferredDark } from "@vueuse/core";
import { changeTheme } from "~/utils/helpers";
import { useRouter, useRoute } from "vue-router";

// 📦 Pinia Stores
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useAuthStore from "@/stores/auth";
import useOrganizationStore from "@/stores/organization";
import useValidationStore from "@/stores/validations";
import usePermissionsStore from "@/stores/permissions";

// 🛠️ Composables de Nuxt
const config = useRuntimeConfig();

// 🔧 Stores instanciados
const globalStore = useGlobalStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const organizationStore = useOrganizationStore();
const validationStore = useValidationStore();
const permissionsStore = usePermissionsStore();

// 🧩 Estados locales
const validToken = ref(false);

// Router
const router = useRouter();
const route = useRoute();

// 🌙 Modo oscuro
const themeCookie = useCookie("localTheme");
const isDarkMode = ref(themeCookie.value);
globalStore.isDark = isDarkMode.value === "dark";

// id org cookie
const orgCookie = useCookie("organization");
const accessTokenCookie = useCookie("access_token");

// 📄 Head del layout
useHead({
  titleTemplate: "%s - Unabase",
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com" },
  ],
});

// 👀 Watcher para cambio de tema
watch(
  () => globalStore.isDark,
  (newVal) => changeTheme(newVal ? "dark" : "light"),
);

// ⏰ Inicializar el Loading
// globalStore.loading = true;

// 🔑 Inicialización en el montaje
onMounted(async () => {
  globalStore.loading = true;

  try {
    // Tema: Si el cookie de tema no es válido, ajustamos según preferencia del sistema
    if (!["dark", "light"].includes(isDarkMode.value)) {
      const prefersDark = usePreferredDark();
      isDarkMode.value = prefersDark.value ? "dark" : "light";
    }
    // Aplicar tema global
    changeTheme(isDarkMode.value);
    globalStore.isDark = isDarkMode.value === "dark";
    themeCookie.value = isDarkMode.value;

    // Validar token del usuario
    validToken.value = await userStore.getUserByToken();
    if (!validToken.value) {
      if (config.public.API_URL !== "production") {
        toast.error("Token inválido.", { autoClose: 1500 });
      }
      setTimeout(() => authStore.logOut(), 1500);
      return;
    }

    // Aplicar fecha del localStore
    globalStore.initDate();
    globalStore.initFiltersCalendar();
    // Obtener organizaciones del usuario
    await organizationStore.getAllOrganizationsByUser(
      userStore.userSession._id,
    );
    // Establecer idioma desde cookie
    const langCookie = useCookie("i18n_redirected");
    if (langCookie?.value) globalStore.lang = langCookie;
    // Selección de organización activa
    const orgCookie = useCookie("organization");
    const orgDefault = organizationStore.organizationsByUser.find(
      (o) => o?.default,
    );
    const existOrg = organizationStore.organizationsByUser.find(
      (o) => o?._id === orgCookie.value,
    );
    // Si no existe organización activa, tomar la default
    if (!existOrg) orgCookie.value = orgDefault?._id || "";

    globalStore.organizationId = orgCookie.value;
    await organizationStore.getOrganizationById();

    // Verificar si el usuario es owner de la organización
    checkIfOwner();
    // Escuchar cuando el usuario vuelve a la pestaña
    document.addEventListener("visibilitychange", onVisibilityChange);
  } catch (err) {
    console.error("Error en layout:", err);
    toast.error("Error al inicializar la sesión");
    authStore.logOut();
  } finally {
    globalStore.loading = false;
  }
});

// 🔌 Limpieza de eventos
onUnmounted(() => {
  document.removeEventListener("visibilitychange", onVisibilityChange);
});

const { data, error, pending } = await useAsyncData("unabase", () =>
  permissionsStore.getSessionPermissions([
    "project",
    "movement",
    "surcharges",
    "outcomes",
    "settings",
  ]),
);

// 🔄 Detectar cambios al volver a la pestaña
const onVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    const orgCookie = useCookie("organization");
    if (organizationStore.organization?._id !== orgCookie.value) {
      globalStore.organizationId = orgCookie.value;
      await organizationStore.getOrganizationById();
      globalStore.loading = true;
      window.location.reload();
      setTimeout(() => (globalStore.loading = false), 1000);
    }
  }
};

// 👀 Watcher de cambios en la organización activa
watch(
  () => orgCookie.value,
  async () => {
    // Si no hay cookie de organización, no hacemos nada por que no hay organización activa para obtener permisos
    if (accessTokenCookie.value === null) {
      return;
    }

    try {
      globalStore.changeOrg = true;
      await organizationStore.getOrganizationById();
      checkIfOwner();
      await permissionsStore.getSessionPermissions([
        "project",
        "movement",
        "surcharges",
        "outcomes",
        "settings",
      ]);
    } catch (err) {
      console.error("Error al obtener la organización o permisos:", err);
    } finally {
      globalStore.changeOrg = false;
    }

    if (globalStore.isRedirectConfig) {
      globalStore.isRedirectConfig = false;
      navigateTo(`/settings/${orgCookie.value}/organization`);
      return;
    }

    setTimeout(() => {
      navigateTo("/incomes");
    }, 100);
  },
);

// 👑 Validar si el usuario actual es owner de la organización
const checkIfOwner = () => {
  const idUser = userStore.userSession?._id;
  const idOwner = organizationStore?.organization?.owner?._id;
  globalStore.isOwner = idUser === idOwner;
};

watch(
  () => organizationStore.organization.default,
  (newValue) => {
    if (newValue === true) {
      organizationStore.organization.default = false;
    }
  },
);
</script>

<template>
  <div class="containerPage" v-if="validToken && !globalStore.changeOrg">
    <!-- Header -->
    <u-header class="containerPage__Header" />

    <!-- Navegación -->
    <u-var class="containerPage__Nav nav-desktop" />
    <u-var-mobile class="containerPage__Nav nav-mobile" />

    <!-- Contenido dinámico -->
    <NuxtPage />

    <!-- Modal: Ficha de datos -->
    <u-dialog
      :showModal="userStore.showModalDataSheet"
      @closeModal="userStore.showModalDataSheet = false"
      width="auto"
      height="auto"
    >
      <DialogCoverInfo @closeModal="userStore.showModalDataSheet = false" />
    </u-dialog>

    <!-- Modal: Comentarios de validación -->
    <u-dialog
      :showModal="validationStore.showModalComment"
      @closeModal="validationStore.showModalComment = false"
      width="800px"
      height="auto"
      padding="24px"
      :persistent="true"
    >
      <DialogCommentValidation
        @closeModal="validationStore.showModalComment = false"
      />
    </u-dialog>

    <!-- Filtros -->
    <u-filters
      :showFilter="globalStore.showFilters"
      @closeModal="globalStore.showFilters = false"
    />
    <!-- Loading -->
    <u-loading-page
      :style="`transform: scale(${globalStore.loading ? 1 : 0})`"
    />
  </div>
</template>

<style scoped>
.containerPage {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: v-bind(
    "globalStore.sliderExpand ? '240px 1fr' : '80px 1fr'"
  );
  grid-template-rows: 68px 1fr;
  grid-template-areas: "nav header" "nav slot";
  column-gap: 20px;
  row-gap: 16px;
  padding-right: 20px;
  box-sizing: border-box;
  background-color: var(--neutral-background-darker);
  overflow: hidden;
  transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.containerPage__Header {
  grid-area: header;
}

.containerPage__Nav {
  grid-area: nav;
  position: relative;
}

.nav-mobile {
  display: none;
}

@media only screen and (max-width: 768px) {
  .containerPage {
    grid-template-rows: 60px 1fr 40px;
    grid-template-columns: 1fr;
    grid-template-areas: "header" "slot" "nav";
    padding: 20px;
  }

  .nav-desktop {
    display: none;
  }

  .nav-mobile {
    display: flex;
  }
}
</style>
