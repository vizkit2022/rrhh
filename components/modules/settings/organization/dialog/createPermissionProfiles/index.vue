<script setup>
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t, locale } = useI18n();
const moduleCreate =
  "modules.organizations.settings.permissionsProfile.modals.createProfile";

//EMITS
const emit = defineEmits(["closeModal"]);

// STORES
const organizationStore = useOrganizationStore();
const permissionStore = usePermissionsStore();
const globalStore = useGlobalStore();

// CONSTANTS
const initialPermissionsState = ref([]);

const icons = {
  globals: "information",
  projects: "folder",
  incomes: "network",
  outcomes: "shopping-cart",
  settings: "settings",
  catalog: "book",
};

// FUNCTIONS

const getIdsPermissions = () => {
  let ids = [];
  organizationStore.permissionsProfile.create.permissions.forEach((p) => {
    p.groups.forEach((g) => {
      g.subcategories.forEach((s) => {
        s.permissions.forEach((perm) => {
          if (perm.activate) ids.push(perm._id);
        });
      });
    });
  });
  return ids;
};

const createPermissionProfile = async () => {
  try {
    globalStore.loading = true;
    const body = {
      code: organizationStore.permissionsProfile.create.nameProfile.trim(),
      description:
        organizationStore.permissionsProfile.create.nameProfile.trim(),
      isActive: true,
      name: {
        es: organizationStore.permissionsProfile.create.nameProfile.trim(),
        en: organizationStore.permissionsProfile.create.nameProfile.trim(),
      },
      permissions: getIdsPermissions(),
    };

    await permissionStore.createProfilePermissions(body);
    await organizationStore.getPermissionsProfile();
  } catch (error) {
    console.error(error);
  } finally {
    organizationStore.permissionsProfile.create.permissions = [];
    organizationStore.permissionsProfile.create.nameProfile = "";
    globalStore.loading = false;
    emit("closeModal");
  }
};

const reloadPermissions = () => {
  const base = JSON.parse(JSON.stringify(permissionStore.permissions));

  organizationStore.permissionsProfile.create.permissions = base.map((p) => {
    p.slotName = p.area_code === "globals" ? "system" : "table";

    p.title = {
      main: p.area_name,
      sub: "",
      icon: icons[p.area_code] || "information",
    };

    p.groups.forEach((g) => {
      g.subcategories.forEach((s) => {
        s.permissions.forEach((perm) => {
          perm.activate = true;
        });
      });
    });

    return p;
  });
};

const isDiffPermissions = computed(() => {
  return (
    JSON.stringify(initialPermissionsState.value) ===
    JSON.stringify(getIdsPermissions())
  );
});

const handleCloseModal = () => {
  organizationStore.permissionsProfile.create.permissions = [];
  organizationStore.permissionsProfile.create.nameProfile = "";
  emit("closeModal");
};

// CYCLES
onBeforeMount(() => {
  reloadPermissions();
  initialPermissionsState.value = getIdsPermissions();
});

organizationStore.permissionsProfile.create.actions.edit = true;
</script>

<template>
  <div class="container">
    <div class="container__header">
      <span>{{ t(`${moduleCreate}.title`) }}</span>
      <u-button-icon
        icon="close"
        type="outlined"
        color="--neutral-text-caption"
        size="s"
        class="btnIconModify"
        @click="handleCloseModal"
      />
    </div>
    <div class="container_actions">
      <u-input
        :placeholder="t(`${moduleCreate}.inputs.name.placeholder`)"
        size="s"
        style="width: 100%; max-width: 600px"
        v-model="organizationStore.permissionsProfile.create.nameProfile"
      />
      <div class="container_actions-buttons">
        <u-button-icon
          :title="t(`${moduleCreate}.buttons.reload`)"
          icon="change"
          type="outlined"
          title="Reiniciar permisos"
          color="--neutral-text-caption"
          size="s"
          :disabled="isDiffPermissions"
          @click="reloadPermissions"
        />
        <u-button
          :text="t(`${moduleCreate}.buttons.save`)"
          icon="save"
          size="s"
          :disabled="
            !organizationStore.permissionsProfile.create.actions.edit ||
            !organizationStore.permissionsProfile.create.nameProfile
          "
          @click="createPermissionProfile"
        />
      </div>
    </div>
    <div class="permission__cards">
      <SettingsOrganizationDialogCreatePermissionProfilesComponentsCard
        v-for="(card, c) in organizationStore.permissionsProfile.create
          .permissions"
        :key="c"
        :title="card.title"
        :permission="card"
        :pos="c"
      >
        <SettingsOrganizationDialogCreatePermissionProfilesComponentsSystem
          v-if="card.slotName === 'system'"
          :item="card"
        />
        <SettingsOrganizationDialogCreatePermissionProfilesComponentsTable
          v-if="card.slotName === 'table'"
          :item="card"
          ,
          :pos="c"
        />
      </SettingsOrganizationDialogCreatePermissionProfilesComponentsCard>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: calc(100vw - 200px);
  max-width: 1000px;
  height: calc(100vh - 200px);
  max-height: 800px;
  display: grid;
  grid-template-rows: 40px 32px 1fr;
  gap: 24px;
}

.container__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.container_actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  width: 100%;
  gap: 12px;
}

.container_actions-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permission__cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  width: 100%;
  height: 100%;
}

.permission__cards::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.permission__cards::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 10px;
}

.permission__cards::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 10px;
}

.btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

@media only screen and (max-width: 768px) {
  .container {
    width: calc(100vw - 40px);
    max-width: 100vw;
    height: calc(100vh - 40px);
    max-height: 100vh;
  }
}
</style>
