<script setup>
import { ref, computed } from "vue";
import useOrganizationStore from "@/stores/organization";
import usePermissionStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useBusinessAreasStore from "@/stores/businessAreas";
import configMembers from "@/utils/configTables/members.json";
import { transformedDate } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// STORE
const organizationStore = useOrganizationStore();
const permissionStore = usePermissionStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const businessAreasStore = useBusinessAreasStore();

// I18N
const { t } = useI18n();
const module = "modules.organizations.settings.members";

// CONSTANTS
const search = ref("");
const newMember = ref(false);
const editPermission = ref(false);
const deactivateMember = ref(false);
const deleteMember = ref(false);

//FUNCTIONS

const getColorState = (status) => {
  const states = {
    active: "--bg-success",
    deactivated: "--bg-neutral",
    pending: "--bg-info",
  };
  return states[status.toLowerCase()] || "--bg-primary";
};

const lockModal = ref(false);

const hideModal = () => {
  if (!lockModal.value) {
    newMember.value = false;
    deactivateMember.value = false;
    deleteMember.value = false;
    lockModal.value = false;
  }
};
const lock = (status) => {
  lockModal.value = status;
};

const actionTable = (obj) => {
  const { emit, data, pos } = obj;

  const emits = {
    showPermission: () => {
      if (!permissionStore.myPermissions.members_listPermissions_edit) return;
      showModalPermission(data, 1);
    },

    showBuisnessArea: () => {
      if (permissionStore.myPermissions?.settings_business_areas) {
        showModalPermission(data, 2);
      }
    },
  };
  emits[emit]();
};

const showModalPermission = async (member, tab) => {
  const isOwner = member.user?._id === organizationStore.organization.owner._id;
  if (member.permissions == null || isOwner) return;

  try {
    globalStore.loading = true;
    const areas = member.businessArea;

    if (member.user._id === userStore.userSession?._id) {
      const profilePromise = permissionStore.getProfileByUserId(
        member.user._id,
        true,
        true,
        areas,
      );

      let businessAreasPromise = Promise.resolve();

      if (permissionStore.myPermissions?.settings_business_areas) {
        permissionStore.loadingBusinessAreas = true;

        businessAreasPromise = businessAreasStore
          .getBusinessAreaForOrganization()
          .finally(() => {
            permissionStore.loadingBusinessAreas = false;
          });
      }

      await Promise.all([profilePromise, businessAreasPromise]);
    } else {
      await permissionStore.getProfileByUserId(
        member.user._id,
        true,
        false,
        areas,
      );

      if (permissionStore.myPermissions?.settings_business_areas) {
        permissionStore.loadingBusinessAreas = true;

        try {
          await businessAreasStore.getBusinessAreaForOrganization();
        } finally {
          permissionStore.loadingBusinessAreas = false;
        }
      }
    }

    permissionStore.modalPermissions.tab = tab;
    permissionStore.modalPermissions.member = JSON.parse(
      JSON.stringify(member),
    );

    // Construir el objeto de permisos para el miembro seleccionado
    permissionStore.getUiPermissions();
    editPermission.value = true;
  } catch (error) {
    console.error("Error loading permissions:", error);
  } finally {
    globalStore.loading = false;
  }
};

const lockModalPermission = ref(false);

const lockPermissions = (status) => {
  lockModalPermission.value = status;
};

const hideModalPermission = () => {
  if (!lockModalPermission.value) {
    editPermission.value = false;
    lockModalPermission.value = false;
    permissionStore.propsListPermissions.memberSelected = {};
  }
  permissionStore.cleanModalPermissions();
};

const filteredMembers = computed(() => {
  const searchTerm = search.value.trim().toLowerCase();

  if (searchTerm === "") {
    return organizationStore.organization.users;
  }

  return organizationStore.organization.users.filter((user) => {
    if (user.id) {
      const fullName = `${user?.id?.name?.first?.toLowerCase() ?? ""} ${
        user?.id?.name?.last?.toLowerCase() ?? ""
      }`;
      const nickname = user?.id?.name?.nickName?.toLowerCase() ?? "";

      const primaryEmail = user?.id?.emails[0]?.email?.toLowerCase() ?? "";

      return (
        fullName.includes(searchTerm) ||
        nickname.includes(searchTerm) ||
        primaryEmail.includes(searchTerm)
      );
    } else {
      const email = user.email.toLowerCase();
      return email.includes(searchTerm);
    }
  });
});

const loadMembers = async () => {
  await organizationStore.getOrganizationById();
};

// scroll
const handleHorizontalScroll = (event) => {
  const element = event.currentTarget;

  if (element.scrollWidth > element.clientWidth) {
    event.preventDefault();
    element.scrollLeft += event.deltaY;
  }
};

// Configurar event listeners manualmente para evitar violaciones
const setupHorizontalScroll = () => {
  const containers = document.querySelectorAll(".containerTags");

  containers.forEach((container) => {
    // event listener con passive: false solo cuando sea necesario
    container.addEventListener("wheel", handleHorizontalScroll, {
      passive: false,
      capture: false,
    });
  });
};

// Limpiar event listeners
const cleanupHorizontalScroll = () => {
  const containers = document.querySelectorAll(".containerTags");
  containers.forEach((container) => {
    container.removeEventListener("wheel", handleHorizontalScroll);
  });
};

onMounted(async () => {
  // Configurar scroll horizontal primer render
  nextTick(() => {
    setupHorizontalScroll();
  });
});

onUnmounted(() => {
  cleanupHorizontalScroll();
  // if (observer) {
  //   observer.disconnect();
  // }
});
</script>

<template>
  <div class="containerPage">
    <div class="filters">
      <div class="space">
        <u-input
          v-model="search"
          style="width: 400px"
          placeholder="Buscar miembros..."
        />
        <u-button
          icon="filter"
          text="Filtrar"
          type="outlined"
          color="--neutral-text-caption"
          colorHover="--neutral-text-body"
          ccolorActivate="--neutral-text-body"
          style="display: none"
        />
      </div>
      <div class="space">
        <u-button-icon
          icon="delete"
          color="--bg-danger-500"
          colorHover="--bg-danger-600"
          colorActive="--bg-danger-700"
          type="outlined"
          @action-btn="deleteMember = true"
          :disabled="
            !organizationStore.organization.users.some((u) => u.selected)
          "
        />
        <u-button
          icon="user-remove"
          text="Estado de Miembros"
          :disabled="
            !organizationStore.organization.users.some((u) => u.selected)
          "
          type="outlined"
          color="--neutral-text-caption"
          colorHover="--neutral-text-body"
          ccolorActivate="--neutral-text-body"
          @click="deactivateMember = true"
        />
        <u-button
          icon="user-new"
          text="Agregar Miembros"
          @click="newMember = true"
        />
      </div>
    </div>

    <TableBasic
      :configTable="configMembers.members"
      :content="filteredMembers"
      @actionTable="actionTable"
    >
      <template v-slot:name="item">
        <div class="colName">
          <u-avatar
            :size="32"
            :user="{
              name: item.item?.data?.legalName ?? 'Invitado',
              src: item.item?.imgUrl ?? null,
            }"
          />
          <span class="textItemsTable">
            {{ item.item?.data?.legalName || "Invitación Pendiente" }}
          </span>
        </div>
      </template>

      <template v-slot:email="item">
        <span class="textItemsTable">{{ item.item?.email }}</span>
      </template>

      <template v-slot:businessAreas="item">
        <div class="containerTags">
          <u-tags
            v-for="(tag, t) in item.item.businessArea"
            :key="tag._id"
            :text="tag.name"
            size="s"
            color="--bg-primary-500"
            background="--bg-primary-100"
            :delete="false"
          />
          <u-tags
            v-if="item.item.isOwner"
            :text="t(module + '.businessArea.all')"
            size="s"
            :delete="false"
            color="--bg-secondary-500"
            background="--bg-secondary-100"
          />
        </div>

        <span v-if="item.item.businessArea.length === 0 && !item.item.isOwner"
          >-</span
        >
      </template>

      <template v-slot:permissions="item">
        <div class="btnPermission">
          <span class="truncateText">{{
            item.item?.permissionsProfile?.name
              ? item.item?.permissionsProfile?.name[globalStore.lang]
              : t(module + ".permissions.owner")
          }}</span>
          <span class="u u-selector_down"></span>
        </div>
      </template>

      <template v-slot:lastConnection="item">
        <span class="textItemsTable">{{
          transformedDate(item.item.lastConnection)
        }}</span>
      </template>

      <template v-slot:status="item">
        <u-tags
          :text="item.item.status"
          :delete="false"
          size="s"
          :color="`${getColorState(item.item.status)}-600`"
          :background="`${getColorState(item.item.status)}-100`"
        />
      </template>
    </TableBasic>
    <u-dialog
      :showModal="newMember"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="auto"
      height="auto"
    >
      <SettingsOrganizationDialogNewMemberOrg
        @closeModal="hideModal"
        @lockModal="lock"
      />
    </u-dialog>
    <u-dialog
      :showModal="deactivateMember"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="650px"
      height="485px"
    >
      <SettingsOrganizationDialogDeactivateMember
        @closeModal="hideModal"
        @lockModal="lock"
      />
    </u-dialog>
    <u-dialog
      :showModal="deleteMember"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="650px"
      height="485px"
    >
      <SettingsOrganizationDialogDeleteMember
        @closeModal="hideModal"
        @lockModal="lock"
      />
    </u-dialog>

    <!-- permission -->
    <u-dialog
      :showModal="editPermission"
      :lockModal="lockModalPermission"
      @closeModal="hideModalPermission"
      width="auto"
      height="auto"
      class="permissionModalMain"
    >
      <SettingsOrganizationDialogPermissions
        @closeModal="hideModalPermission"
        @lockModal="lockPermissions"
        @updatedMembers="loadMembers"
      />
    </u-dialog>
  </div>
</template>

<style scoped>
.containerPage {
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 24px;
  width: 100%;
  height: calc(100vh - 56px - 80px - 40px - 40px - 32px - 20px);
}
.filters {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.filters div.space {
  display: flex;
  gap: 20px;
}
.colName {
  display: grid;
  grid-template-columns: 32px 1fr;
  column-gap: 12px;
  align-items: center;
}
.textItemsTable {
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerTags {
  display: flex;
  gap: 10px;
  overflow-x: hidden;
}
.btnPermission {
  width: 140px;
  height: 28px;
  display: flex;
  padding: 2px 8px;
  margin: 0px auto;
  justify-content: space-between;
  text-align: left;
  border-radius: 30px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
  background-color: var(--neutral-surface-light);
}

.btnPermission:hover {
  color: var(--primary-surface-subtle);
}

.btnPermission span:nth-of-type(2) {
  font-size: 16px;
}

.permissionModalMain::v-deep(.dialog__container) {
  padding: v-bind(
    "permissionStore?.modalPermissions?.confirm ? '24px' : '40px'"
  );
}

@media only screen and (max-width: 768px) {
  .permissionModalMain::v-deep(.dialog__container) {
    padding: v-bind(
      "permissionStore?.modalPermissions?.confirm ? '24px' : '20px'"
    );
  }
}
</style>
