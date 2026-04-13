<script setup>
import useGlobalStore from "@/stores/global";
import configTable from "@/utils/configTables/notifications.json";

// STORES
const globalStore = useGlobalStore();

//CONSTANTS
const arrayNotifications = ref([
  {
    area: "purchases",
    reason: "Creación de compra",
    notifications: {
      system: true,
      email: true,
    },
    status: true,
  },
    {
    area: "purchases",
    reason: "Compra validada",
    notifications: {
      system: true,
      email: true,
    },
    status: false,
  },
    {
    area: "purchases",
    reason: "Compra rechazada",
    notifications: {
      system: true,
      email: false,
    },
    status: false,
  },
    {
    area: "purchases",
    reason: "Solicitud de pago",
    notifications: {
      system: false,
      email: true,
    },
    status: true,
  },
    {
    area: "sales",
    reason: "Documento creado",
    notifications: {
      system: false,
      email: false,
    },
    status: true,
  },
]);

const notificationButtons = [
  {
    key: "system",
    text: "Sistema",
    icon: "notification",
  },
  {
    key: "email",
    text: "Email",
    icon: "notification",
  },
];

// FUCTIONS
const infoTagsType = (state) => {
  switch (state) {
    case "purchases":
      return {
        text: {
          es: "Compras",
          en: "Purchases",
        },
        background: "--danger-surface-light",
        color: "--danger-text-default",
      };
    case "sales":
      return {
        text: {
          es: "Ventas",
          en: "Sales",
        },
        background: "--success-surface-light",
        color: "--success-text-default",
      };
    default:
      return {
        text: {
          es: "''",
          en: "''",
        },
        background: "--neutral-surface-light",
        color: "--neutral-text-default",
      };
  }
};

const infoTagsStatus = (state) => {
  switch (state) {
    case true:
      return {
        text: {
          es: "Activada",
          en: "Active",
        },
        background: "--success-surface-light",
        color: "--success-text-default",
      };
    default:
      return {
        text: {
          es: "Desactivada",
          en: "Inactive",
        },
        background: "--danger-surface-light",
        color: "--danger-text-default",
      };
  }
};
// PARA ACTIVAR NOTIFICACIONES
// const toggleNotification = (row, key) => {
//   row.notifications[key] = !row.notifications[key];
// };
// // PARA ACTIVAR NOTIFICACIONES DESDE EL BOTON
//           @click="toggleNotification(item.item, btn.key)"
</script>

<template>
<div class="container">
  <TableBasic
    :configTable="configTable.notificationsMembers"
    :content="arrayNotifications"
  >
    <template #area="item">
      <u-tags
        :text="infoTagsType(item?.item?.area)?.text?.[globalStore?.lang]"
        :background="infoTagsType(item?.item?.area).background"
        :color="infoTagsType(item?.item?.area)?.color"
        :delete="false"
        size="xs"
        :title="infoTagsType(item?.item?.area)?.text?.[globalStore?.lang]"
        max-width="70px"
      />
    </template>

    <template #reason="item">
      <span class="body-m-s" style="color: var(--neutral-text-body)">{{
        item?.item?.reason
      }}</span>
    </template>

    <template #notifications="item">
      <div class="containerNotifications">
        <u-button
          v-for="btn in notificationButtons"
          :key="btn.key"
          :no-span-text-z-index="true"
          :style="{
            border: item.item.notifications[btn.key]
              ? '1px solid var(--secondary-border-darker)'
              : '1px solid var(--neutral-border-subtle)',
          }"
          style="cursor: initial;"
          :text="btn.text"
          size="xs"
          :icon="btn.icon"
          :color="
            item.item.notifications[btn.key]
              ? '--secondary-surface-light'
              : '--neutral-background-default'
          "
          :colorText="
            item.item.notifications[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
          :colorHover="
            item.item.notifications[btn.key]
              ? '--secondary-surface-light'
              : '--neutral-background-default'
          "
          :colorTextHover="
            item.item.notifications[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
          :colorActive="
            item.item.notifications[btn.key]
              ? '--secondary-surface-light'
              : '--neutral-background-default'
          "
          :colorTextActive="
            item.item.notifications[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
        />
      </div>
      
    </template>

    <template #status="item">
      <u-tags
        :text="infoTagsStatus(item?.item?.status)?.text?.[globalStore?.lang]"
        :background="infoTagsStatus(item?.item?.status).background"
        :color="infoTagsStatus(item?.item?.status).color"
        size="xs"
        :delete="false"
      />
    </template>
  </TableBasic>
  </div>
</template>

<style scoped>

.container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
}

.containerNotifications {
  display: flex;
  gap: 8px;
}
</style>
