<script setup>
import { defineProps } from "vue";
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// STORES
const globalStore = useGlobalStore();
const permissionStore = usePermissionStore();
const organizationStore = useOrganizationStore();

// Props
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
});

// CONSTANTS
const { t } = useI18n();
const KEY_LABLES =
  "modules.organizations.settings.members.modal.permissions.sections.labels";

// FUNCTIONS
const getIcon = (option) => {
  const icons = {
    projects_global: "projects",
    grid_global: "network",
    outcomes_global: "shopping-cart",
    catalog_global: "book",
    settings_global: "settings",
  };
  return icons[option.code] || "projects";
};
const getSubIcon = (option) => {
  const icons = {
    grid_global: "info-outlined",
    outcomes_global: "info-outlined",
    settings_global: "warning-outlined",
  };
  return icons[option.code] || "";
};
const getTotalPermissionByModule = (op) => {
  const CODE = op?.code?.replace("_global", "") || "unknown";
  if (CODE === "unknown") return "-";

  const module = organizationStore.permissionsProfile.create.permissions.find(
    (op) => op.area_code === CODE,
  );
  if (!module) return "-";

  let total = 0;
  module.groups.forEach((g) => {
    g.subcategories.forEach((s) => {
      total += s.permissions.length;
    });
  });
  return total;
};
</script>

<template>
  <div class="permission__system">
    <button
      class="permission__system-item"
      v-for="option in props.item.groups[0].subcategories[0].permissions"
      :key="option.prop"
    >
      <div class="permission__system-item-element">
        <u-switch
          v-model="option.activate"
          @click="permissionStore.modalPermissions.change = true"
          :disabled="
            !organizationStore.permissionsProfile.create.actions.edit ||
            option.code === 'projects_global'
          "
        />
      </div>
      <div class="permission__system-item-text">
        <div>
          <span class="text">{{ option.name[globalStore.lang] }}</span>
          <span
            v-if="option.subIcon"
            :class="`u u-${getSubIcon(option)}`"
          ></span>
        </div>
        <span class="sub">{{
          t(KEY_LABLES + ".subMin", {
            total: getTotalPermissionByModule(option),
          })
        }}</span>
      </div>
      <div class="permission__system-item-element">
        <span
          :class="`u u-${getIcon(option)} permission__system-item-icon`"
        ></span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.permission__system {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 864px;
  padding: 20px 0px 12px;
}

.permission__system-item {
  display: grid;
  grid-template-columns: 48px 1fr 36px;
  align-items: center;
  border: 1px solid var(--neutral-border-light);
  border-radius: 12px;
  padding: 8px 12px;
  gap: 12px;
}

.permission__system-item-element {
  display: flex;
  justify-content: center;
  align-items: center;
}

.permission__system-item-text {
  display: flex;
  flex-direction: column;
}

.permission__system-item-text div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission__system-item-text .text {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.permission__system-item-text .sub {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
  text-align: start;
}

.permission__system-item-icon {
  font-size: 22px;
  line-height: 22px;
  color: var(--neutral-text-caption);
}

@media only screen and (max-width: 884px) {
  .permission__system {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media only screen and (max-width: 534px) {
  .permission__system {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
