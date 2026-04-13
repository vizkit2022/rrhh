<script setup>
import { ref } from "vue";
import configPermissionProfiles from "@/utils/configTables/permissionProfiles.json";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// Translations
const { t, locale } = useI18n();
const module = "modules.organizations.settings.permissionsProfile";

// STORE
const organizationStore = useOrganizationStore();

// CONSTANTS
const loadingTable = ref(false);
const search = ref("");
const permissionProfile = ref(null);

// dialogs
const lockModal = ref(false);
const showModalDelete = ref(false);
const showCreatePermissionProfile = ref(false);
const showEditPermissionProfile = ref(false);

// COMPUTED
const disableDelete = computed(() => {
  const selectedProfiles = organizationStore.permissionsProfile.profiles.filter(
    (profile) => profile?.selected,
  );

  const hasSelected = selectedProfiles.length > 0;

  const hasInvalid = selectedProfiles.some((profile) =>
    ["guest", "admin"].includes(profile?.code),
  );

  return !hasSelected || hasInvalid;
});

// FUNCTIONS

const handleSearchPermissionProfile = debounce(async () => {
  try {
    loadingTable.value = true;
    search.value = search.value.trim();
    await organizationStore.searchPermissionsProfile(search.value);
  } catch (error) {
    console.error(error);
  } finally {
    loadingTable.value = false;
  }
}, 600);

const hideModal = () => {
  if (!lockModal.value) {
    showCreatePermissionProfile.value = false;
    showEditPermissionProfile.value = false;
    lockModal.value = false;
  }
};

const actionTable = (obj) => {
  const { emit, data } = obj;

  const emits = {
    editPermissionProfile: () => {
      showEditPermissionProfile.value = true;
      permissionProfile.value = data;
    },
  };

  emits[emit]?.();
};

// CYCLES
onMounted(async () => {
  try {
    loadingTable.value = true;
    await organizationStore.getPermissionsProfile();
  } catch (error) {
    console.error(error);
  } finally {
    loadingTable.value = false;
  }
});
</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>{{ t(`${module}.title`) }}</h2>
      <span>{{ t(`${module}.description`) }}</span>
    </div>
    <div class="containerSection__filters">
      <div class="containerSection__filters-space">
        <u-input
          style="width: 350px"
          v-model="search"
          class="selecteddocTypes"
          icon="search"
          :revers="true"
          :placeholder="t(`${module}.searchPlaceholder`)"
          @input="handleSearchPermissionProfile"
        />
      </div>
      <div class="containerSection__filters-space">
        <u-button-icon
          icon="delete"
          color="--bg-danger-500"
          colorHover="--bg-danger-600"
          colorActive="--bg-danger-700"
          type="outlined"
          :disabled="disableDelete"
          @click="showModalDelete = true"
        />
        <u-button
          :text="t(`${module}.buttons.createProfile`)"
          icon="new"
          @click="showCreatePermissionProfile = true"
        />
      </div>
    </div>

    <TableBasic
      :configTable="configPermissionProfiles.permissionProfiles"
      :content="organizationStore.permissionsProfile.profiles"
      @actionTable="actionTable"
      :key="organizationStore.permissionsProfile.profiles.length"
      :loading="loadingTable"
      ref="tableRef"
    >
      <template #profile="item">
        <span>{{ item?.item?.name?.[locale] }}</span>
      </template>

      <template #users="item">
        <div class="avatar-stack">
          <u-avatar
            v-for="member in item?.item?.members?.slice(0, 6)"
            :key="member._id"
            :user="{
              name: member?.legalName ?? 'Sin Nombre',
              src: member?.imgUrl ?? null,
            }"
            :size="32"
            class="avatar"
          />

          <div v-if="item?.item?.members?.length > 6" class="more-members">
            <span>+{{ item?.item?.members?.length - 6 }}</span>
          </div>
        </div>
      </template>

      <template #numberOfPermissions="item">
        <span
          >{{
            item?.item?.permissionsCount ??
            item?.item?.permissions?.permissionsCount ??
            item?.item?.permissions?.length ??
            "-"
          }}
        </span>
      </template>
    </TableBasic>
  </div>

  <!--DIALOGS-->
  <!-- Create -->
  <u-dialog
    :showModal="showCreatePermissionProfile"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <SettingsOrganizationDialogCreatePermissionProfiles
      @closeModal="hideModal"
    />
  </u-dialog>

  <!-- Delete -->
  <u-dialog
    :showModal="showModalDelete"
    @closeModal="showModalDelete = false"
    width="auto"
    height="auto"
  >
    <SettingsOrganizationDialogDeleteProfilePermissions
      :loadingTable="loadingTable"
      @closeModal="showModalDelete = false"
    />
  </u-dialog>

  <!-- Edit -->
  <u-dialog
    :showModal="showEditPermissionProfile"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <SettingsOrganizationDialogEditPermissionProfiles
      :permissionProfile="permissionProfile"
      @closeModal="hideModal"
    />
  </u-dialog>
</template>

<style scoped>
h2,
span {
  font-family: Nunito;
}
.containerSection {
  display: grid;
  grid-template-rows: 60px 36px calc(100% - 150px);
  height: calc(100vh - 50px - 52px - 86px - 90px);
  gap: 24px;
  padding-right: 20px;
  position: relative;
}
.containerSection__header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
}
.containerSection__header span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.containerSection__filters {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.containerSection__filters-space {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
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
  background-color: var(--neutral-surface-default);
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
