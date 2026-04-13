<script setup>
import configTable from "@/utils/configTables/notifications.json";
import { transformedDate } from "@/utils/helpers";
import useGlobalStore from "@/stores/global";

// STORE
const globalStore = useGlobalStore();

const notificationsFakes = [
  {
    id: 1,
    issueDate: "2024-06-01T10:15:30Z",
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
    issueDate: "2024-12-02T14:20:00Z",
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
    issueDate: "2024-06-03T09:05:45Z",
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
    issueDate: "2024-06-03T09:09:55Z",
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
];

const orderNotificationsFake = computed(() => {
  return notificationsFakes.sort(
    (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
  );
})

// utils
const formatHourDate = (dateString) => {
  const date = new Date(dateString);
  const isSpanish = globalStore.lang === "es";

  const time = date.toLocaleTimeString(
    isSpanish ? "es-ES" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );

  const cleanAmPm = (text) => {
    return text
      .replace(/a[\.\s\u202F]*m\.?/i, "am")
      .replace(/p[\.\s\u202F]*m\.?/i, "pm");
  };

  return isSpanish ? cleanAmPm(time) : time;
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

const infoStatus = (readBoolean) => {
  const lang = globalStore.lang || "es";

  const texts = {
    es: { read: "Leído", unread: "No leído" },
    en: { read: "Read", unread: "Unread" },
  };

  const infoRead = {
    text: texts[lang].read,
    color: "success",
  };

  const infoUnread = {
    text: texts[lang].unread,
    color: "--neutral-text-caption",
    backgroundColor: "--neutral-surface-light",
  };

  return readBoolean ? infoRead : infoUnread;
};
</script>

<template>
  <TableBasic
    :configTable="configTable.notificationsLogs"
    :content="orderNotificationsFake"
  >
    <template #date="item">
      <div class="container-date">
        <span class="body-m-sb">{{
          transformedDate(item?.item?.issueDate, globalStore.lang)
        }}</span>
        <span class="body-m-r">{{
          formatHourDate(item?.item?.issueDate)
        }}</span>
      </div>
    </template>

    <template #notification="item">
      <div class="container-notification">
        <div>
          <div>
            <u-avatar :user="{ name: item?.item?.img?.alt, src: item?.item?.img?.src }" :size="32" />
          </div>
          <div>
            <span
              class="truncateText body-m-sb"
              style="color: var(--neutral-text-body)"
              :title="item?.item?.message"
              >{{ item?.item?.message }}</span
            >
            <span
              class="truncateText body-m-r"
              style="color: var(--neutral-text-caption)"
              :title="item?.item?.submessage"
              >{{ item?.item?.submessage }}</span
            >
          </div>
        </div>
        <div>
          <u-button
            :text="
              infoButtonTypeNotification(item?.item?.typeNotification).text
            "
            size="xs"
            icon="open"
            :color="
              infoButtonTypeNotification(item?.item.typeNotification)
                .colorBackground
            "
            :colorText="
              infoButtonTypeNotification(item?.item.typeNotification).colorText
            "
            :colorHover="
              infoButtonTypeNotification(item?.item?.typeNotification)
                .colorHover
            "
            :colorTextHover="
              infoButtonTypeNotification(item?.item?.typeNotification)
                .colorTextHover
            "
            :colorActive="
              infoButtonTypeNotification(item?.item?.typeNotification)
                .colorActive
            "
            :colorTextActive="
              infoButtonTypeNotification(item?.item?.typeNotification)
                .colorTextActive
            "
          />
        </div>
      </div>
    </template>

    <template #status="item">
      <div style="margin: 0 auto">
        <u-tags
          :text="infoStatus(item?.item?.read).text"
          :background="
            item?.item?.read === false
              ? infoStatus(item?.item?.read).backgroundColor
              : undefined
          "
          :color="
            item?.item?.read === false
              ? infoStatus(item?.item?.read).color
              : undefined
          "
          size="xs"
          :delete="false"
        />
      </div>
    </template>

    <template #actions="item">
      <u-button
        v-if="item?.item?.read === false"
        text="Marcar Leida"
        size="xs"
        icon="check"
        color="--info-surface-shadow-12a"
        colorText="--info-text-darker"
        colorHover="--info-surface-shadow-8a"
        colorTextHover="--info-text-darker"
        colorActive="--info-surface-shadow-12a"
      />
    </template>
  </TableBasic>
</template>

<style scoped>
.container-date {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.container-date span:first-child {
  color: var(--neutral-text-body);
}

.container-date span:last-child {
  color: var(--neutral-text-caption);
}
.container-notification {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  width: 100%;
  align-items: center;
  gap: 12px;
}

.container-notification > div:first-child {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.container-notification > div:first-child > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.container-notification > div:nth-child(2) {
  display: flex;
  justify-content: center;
}
</style>
