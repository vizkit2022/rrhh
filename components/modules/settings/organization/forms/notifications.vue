<script setup>
import useGlobalStore from "@/stores/global";
import configTable from "@/utils/configTables/notifications.json";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();

// Variables
const showEditNotification = ref(false);
const selectedArea = ref(null);
const lockModal = ref(false);
// Traducción
const { t } = useI18n();
const module = "modules.organizations.settings.notifications";

const arrayConfigNotifications = ref([
  {
    area: "purchases",
    reason: "Factura creada",
    notifiedMembers: [
      {
        name: "Creator",
        avatar: "",
      },
      {
        name: "Juan Camilo Rodríguez",
        avatar: "",
      },
      {
        name: "María Gómez",
        avatar: "",
      },
    ],
    notifications: {
      system: true,
      email: false,
    },
  },
  {
    area: "sales",
    reason: "Documento creado",
    notifiedMembers: [
      {
        id: 1,
        name: "Creator",
        imgUrl: "",
      },
      {
        id: 2,
        name: "Juan Camilo Rodríguez",
        imgUrl: "",
      },
      {
        id: 3,
        name: "María Gómez",
        imgUrl: "",
      },
            {
        id: 1,
        name: "Creator",
        imgUrl: "",
      },
      {
        id: 2,
        name: "Juan Camilo Rodríguez",
        imgUrl: "",
      },
      {
        id: 3,
        name: "María Gómez",
        imgUrl: "",
      },
            {
        id: 1,
        name: "Creator",
        imgUrl: "",
      },
      {
        id: 2,
        name: "Juan Camilo Rodríguez",
        imgUrl: "",
      },
      {
        id: 3,
        name: "María Gómez",
        imgUrl: "",
      },
    ],
    notifications: {
      system: false,
      email: true,
    },
  },
]);

// Functions
const hideModal = () => {
  if (!lockModal.value) {
    showEditNotification.value = false;
    lockModal.value = false;
  }
};

const lock = (state) => {
  lockModal.value = state;
};

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

const toggleNotification = (row, key) => {
  row.notifications[key] = !row.notifications[key];
};

// const openEditModal = () => {

//   const selected = businessAreasStore.businessAreas.filter((area) => area.selected);
//   if (selected.length === 1) {
//     console.log("selected", selected);
//     selectedArea.value = selected[0];
//     showModalEdit.value = true;
//   } else {
//     console.log("No se ha seleccionado ninguna área de negocio");
//   }
// };

// const fetchBusinessAreas = async () => {
//   await businessAreasStore.getBusinessAreaForOrganization();
// };

// onMounted(async () => {
//   await fetchBusinessAreas();
// });

const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    dialogEditNotification: () => {
    //   toggleNotification(data, pos);
      showEditNotification.value = true;
    },
  };
  emits[emit]();
};

</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>Notificaciones</h2>
    </div>

    <TableBasic
      :configTable="configTable.notificationsConfig"
      :content="arrayConfigNotifications"
      @action-table="actionTable"
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

      <template #notifiedMembers="item">
        <div class="avatar-stack">
          <u-avatar
            v-for="member in item.item.notifiedMembers.slice(0, 6)"
            :key="member.id"
            :user="{
              name: member?.name ?? 'Sin Nombre',
              src: member?.imgUrl ?? null,
            }"
            :size="32"
            class="avatar"
          />

          <div v-if="item.item.notifiedMembers.length > 6" class="more-members">
            <span>+{{ item.item.notifiedMembers.length - 6 }}</span>
          </div>
        </div>
      </template>

      <template #notifications="item">
        <div class="containerNotifications">
          <u-button
            v-for="btn in notificationButtons"
            :key="btn.key"
            :style="{
              border: item.item.notifications[btn.key]
                ? '1px solid var(--secondary-border-darker)'
                : '1px solid var(--neutral-border-subtle)',
            }"
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
                ? '--secondary-surface-softer'
                : '--neutral-surface-subtle'
            "
            :colorTextHover="
              item.item.notifications[btn.key]
                ? '--secondary-text-default'
                : '--neutral-text-caption'
            "
            :colorActive="
              item.item.notifications[btn.key]
                ? '--secondary-surface-harder'
                : '--neutral-surface-subtle'
            "
            :colorTextActive="
              item.item.notifications[btn.key]
                ? '--secondary-text-default'
                : '--neutral-text-caption'
            "
            @click="toggleNotification(item.item, btn.key)"
          />
        </div>
      </template>
    </TableBasic>

    <u-dialog 
      :showModal="showEditNotification"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="auto"
      height="auto"
    >
    <SettingsOrganizationDialogEditNotification @closeModal="hideModal"  />
    </u-dialog>
  </div>
</template>

<style scoped>
h2,
span {
  font-family: Nunito;
}

.containerSection {
  display: grid;
  grid-template-rows: 36px 1fr;
  height: calc(100vh - 56px - 80px - 40px - 40px - 32px - 20px);
  gap: 24px;
  padding-right: 20px;
}

.containerSection__header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
}

.containerSection__header span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-surface-default);
}

.containerNotifications {
  display: flex;
  gap: 8px;
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar {
  margin-left: -16px;
  position: relative;
}
.avatar:first-child {
  margin-left: 0;
}

.more-members {
    color: var(--neutral-text-default);
  background-color: var(--neutral-surface-harder); 
  font-weight: bold;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  top: 10px;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  display: flex;
  position: relative;
  z-index: 1;
  justify-content: center;
  align-items: center;
}

</style>
