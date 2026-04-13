<script setup>
import { defineProps, defineEmits, ref } from "vue";
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useAuthStore from "@/stores/auth";
import useGlobalStore from "@/stores/global";
const authStore = useAuthStore();
const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const router = useRouter();
const config = useRuntimeConfig();
// EMITS
const emit = defineEmits(["dropdownUpdated"]);
// PROPS
const props = defineProps({
  dropdown: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => {},
  },
});
// CONSTATNS
const { t } = useI18n();
const module = "global.text";

const notificationsFakes = [
  {
    id: 1,
    issueDate: "2026-01-02T10:15:30Z",
    img: {
      src: "/img/notifications/ok.png",
      alt: "valid",
    },
    message: "Tu compra ha sido validada",
    submessage:
      "En el negocio Camapaña Falabella Jeans del proyecto Falabella 2025 ",
    typeNotification: "purchase",
    read: false,
  },
  {
    id: 2,
    issueDate: "2026-01-01T09:05:45Z",
    img: {
      src: "/img/notifications/mujer.png",
      alt: "avatar",
    },
    message:
      "Mariana Herrera creó una compra largaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    submessage:
      "En el negocio Comercial Día del Niño del proyecto Paris Campañas largoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo",
    typeNotification: "purchase",
    read: true,
  },
  {
    id: 3,
    issueDate: "2025-08-25T09:05:45Z",
    img: {
        src: "/img/notifications/await.png",
        alt: "await",
    },
    message: "Tienes una validación pendiente",
    submessage:
      "En la compra Gastos de Movilización del negocio Evento Salcobrand Fest",
    typeNotification: "validation",
    read: false,
  },
  {
    id: 4,
    issueDate: "2025-06-03T09:09:55Z",
    img: {
        src: "/img/notifications/error.png",
        alt: "error",
    },
    message: "Tu compra ha sido rechazada",
    submessage:
      "En el negocio Lanzamiento cuenta Fan del proyecto Banco de Chile",
    typeNotification: "purchase",
    read: true,
  },
  {
    id: 5,
    issueDate: "2025-12-24T10:15:30Z",
    img: {
      src: "/img/notifications/ok.png",
      alt: "valid",
    },
    message: "Tu compra ha sido validada",
    submessage:
      "En el negocio Camapaña Falabella Jeans del proyecto Falabella 2025 ",
    typeNotification: "purchase",
    read: false,
  },
    {
    id: 6,
    issueDate: "2025-06-03T09:09:55Z",
    img: {
        src: "/img/notifications/error.png",
        alt: "error",
    },
    message: "Tu compra ha sido rechazada",
    submessage:
      "En el negocio Lanzamiento cuenta Fan del proyecto Banco de Chile",
    typeNotification: "purchase",
    read: true,
  },
  {
    id: 7,
    issueDate: "2025-08-25T09:05:45Z",
    img: {
        src: "/img/notifications/await.png",
        alt: "await",
    },
    message: "Tienes una validación pendiente",
    submessage:
      "En la compra Gastos de Movilización del negocio Evento Salcobrand Fest",
    typeNotification: "validation",
    read: false,
  },
];

// ACTIONS
const goToPage = (path) => {
  if (path === "notifications") {
  router.push(`/${path}` || "/home");
  }
  emit("dropdownUpdated", false);
};
const getCompanyWithSettings = async (id) => {
  await getCompany(id);
  goToPage(`settings/${id}/organization`);
};

const infoButtonTypeNotification = (typeNotification) => {
  const lang = globalStore.lang || "es";

  const texts = {
    es: {
      purchase: "Ver Compra",
      validation: "Ver Validación",
    },
    en: {
      purchase: "View Purchase",
      validation: "View Validation",
    },
  };

  const colors = {
    purchase: {
      colorText: "--secondary-text-default",
      colorBackground: "--secondary-surface-light",
      colorHover: "--secondary-surface-softer",
      colorTextHover: "--secondary-text-default",
      colorActive: "--secondary-surface-harder",
      colorTextActive: "--secondary-text-default",
    },
    validation: {
      colorText: "--secondary-text-default",
      colorBackground: "--secondary-surface-light",
      colorHover: "--secondary-surface-softer",
      colorTextHover: "--secondary-text-default",
      colorActive: "--secondary-surface-harder",
      colorTextActive: "--secondary-text-default",
    },
  };

  return {
    text: texts[lang][typeNotification] || "",
    colorText: colors[typeNotification]?.colorText || "--neutral-text-body",
    colorBackground:
      colors[typeNotification]?.colorBackground || "--neutral-surface-light",
    colorHover:
      colors[typeNotification]?.colorHover || "--secondary-surface-harder",
    colorTextHover:
      colors[typeNotification]?.colorTextHover || "--neutral-text-body",
    colorActive:
      colors[typeNotification]?.colorActive || "--secondary-surface-harder",
    colorTextActive:
      colors[typeNotification]?.colorTextActive || "--neutral-text-body",
  };
};

// UTILS (mover a utils.js)

function formatNotificationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  // Función auxiliar interna para limpiar formato AM/PM
  const cleanAmPm = (text) => {
    return text
      .replace(/\s+/g, " ")
      .replace(/a\.\s*m\./gi, "AM")
      .replace(/p\.\s*m\./gi, "PM");
  };

  // Función auxiliar interna para formatear hora
  const formatTime = (d) => {
    return cleanAmPm(
      new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d)
    );
  };

  // Normalizamos a inicio del día
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffDays =
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return `HOY A LAS ${formatTime(date)}`;
  }

  if (diffDays === 1) {
    return `AYER A LAS ${formatTime(date)}`;
  }

  if (diffDays < 7) {
    const dayFormatter = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
    });

    return `${dayFormatter
      .format(date)
      .toUpperCase()} A LAS ${formatTime(date)}`;
  }

  // Fecha completa si es más antigua
  const fullFormatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return cleanAmPm(fullFormatter.format(date).toUpperCase());
}

const handleEsc = (event) => {
  if (event.key === "Escape" && props.dropdown) {
    emit("dropdownUpdated", false);
  }

    if (
    event.ctrlKey &&
    event.key.toLowerCase() === "n"
  ) {
    event.preventDefault(); // evita "Nueva ventana" del navegador
    emit("dropdownUpdated", true);
  }
}

  onMounted(() => {
    window.addEventListener("keydown", handleEsc);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleEsc);
  });
</script>

<template>
  <div
    class="headerMenu"
    :style="`transform: scale(${props.dropdown ? 1 : 0})`"
  >
    <div class="headerMenu__header">
      <div>
        <span class="headerMenu__title body-l-sb">Notificaciones</span>
        <span class="headerMenu__subtitle body-m-r">4 sin leer</span>
      </div>
      <div>
        <u-button
          text="Marcar como leídas"
          size="xs"
          icon="open"
          color="--secondary-surface-light"
          colorText="--secondary-text-default"
          colorHover="
          --secondary-surface-softer
        "
          colorTextHover="
         --secondary-text-default
        "
          colorActive="
          --secondary-surface-harder
        "
          colorTextActive="
        --secondary-text-default
        "
        />
      </div>
    </div>
    <!-- <div class="line"></div> -->
    <div class="headerMenu__list">
      <div
        class="headerMenu__item"
        v-for="noti in notificationsFakes"
        :key="noti.id"
        :class="
          noti.read ? 'headerMenu__item--read' : ''
        "
      >
        <!-- Primer div del item -->
        <div>
          <div>
            <u-avatar size="36" :user="{ src: noti.img, alt: noti.name }" />
          </div>
          <div>
            <span
              class="body-m-sb truncateText"
              :title="noti.message"
               v-text="noti.message"></span
            >
            <span
              class="body-m-r"
              :title="noti.submessage"
              v-text="noti.submessage"
              ></span
            >
          </div>
        </div>
        <!-- Segundo div del item -->
        <div>
          <u-button
            :text="infoButtonTypeNotification(noti.typeNotification).text"
            size="xs"
            icon="open"
            color="--secondary-surface-light"
            colorText="--secondary-text-default"
            colorHover="--secondary-surface-softer"
            colorTextHover="--secondary-text-default"
            colorActive="--secondary-surface-harder"
            colorTextActive="--secondary-text-default"
          />
        </div>
        <!-- Tercer div del item -->
        <div>
          <span class="body-xs-r">{{
            formatNotificationDate(noti.issueDate)
          }}</span>
        </div>
      </div>
    </div>
    <div class="line"></div>
    <div class="headerMenu__footer" v-if="props.user">
      <u-button
        text="Ver todas las notificaciones"
        icon="open"
        type="text"
        size="xs"
        color="--info-text-default"
        color-hover="--info-text-subtle"
        color-active="--info-text-darker"
        @click="goToPage('notifications')"
      />
    </div>
  </div>
</template>

<style scoped>
.headerMenu {
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  height: auto;
  width: 450px;
  right: -210px;
  z-index: 99;
  position: absolute;
  box-shadow: var(--elevation-m);
  padding: 16px 0px;
  box-sizing: border-box;
  transform-origin: top center;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.headerMenu__header {
  display: grid;
  grid-template-columns: 50% 50%;
  padding: 0px 16px 16px 16px;
  align-items: center;
  box-shadow: var(--elevation-xs);
}

.headerMenu__header div:first-child {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
}

.headerMenu__header div:last-child {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

span.headerMenu__title {
  color: var(--neutral-text-body);
}

span.headerMenu__subtitle {
  color: var(--neutral-text-caption);
}

.headerMenu__item {
  display: grid;
  grid-template-rows: 58px 28px 14px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  background-color: var(--secondary-surface-shadow-8a);
  height: 140px;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.headerMenu__item--read {
  background-color: transparent;
}

.headerMenu__item > div:first-child {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  min-width: 0;
}

.headerMenu__item > div:first-child > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.headerMenu__item > div:first-child > div:last-child > span:last-child {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  -webkit-line-clamp: 2;
  line-height: 1.4;
}

.headerMenu__item > div:first-child > div:last-child > span:first-child {
  color: var(--neutral-text-body);
}

.headerMenu__item > div:first-child > div:last-child > span:last-child {
  color: var(--neutral-text-caption);
}

.headerMenu__item > div:nth-child(2) {
  display: flex;
  align-items: center;
  padding: 0px 48px;
}

.headerMenu__item > div:nth-child(3) {
  display: flex;
  align-items: center;
  padding: 0px 48px;
  color: var(--neutral-text-caption);
}

.headerMenu__list {
  margin: 0px 0px;
  gap: 8px;
  height: auto;
  max-height: 560px;
  overflow-y: auto;
  /* overflow-y: hidden; con scroll es: hidden */
  scrollbar-gutter: stable;
  transition: overflow 0.2s;
}
/*CON SCROLL*/
/* .headerMenu__list:hover {
  overflow-y: auto;
}
.headerMenu__list::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-softer);
  border-radius: 20px;
}
.headerMenu__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-harder);
  border-radius: 5px;
} */
/* Chrome, Safari, Edge */
.headerMenu__list::-webkit-scrollbar {
  display: none;
}

/* Firefox */
.headerMenu__list {
  scrollbar-width: none;
}

/* IE / Edge legacy */
.headerMenu__list {
  -ms-overflow-style: none;
}

.headerMenu__btn {
  padding: 0 8px;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  height: 28px;
}
.headerMenu__btn span strong {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 12px;
}

.headerMenu__footer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.line {
  height: 1px;
  width: 100%;
  background-color: var(--neutral-border-subtle);
  margin: 0px 0px 8px;
}
</style>
