<script setup>
import { defineProps, computed, ref } from "vue";
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// STORES
const globalStore = useGlobalStore();
const permissionStore = usePermissionStore();
const organizationStore = useOrganizationStore();

// PROPS
const props = defineProps({
  title: {
    type: Object,
    default: () => ({
      main: "",
      sub: "",
      icon: "information",
    }),
  },
  permission: {
    type: Object,
    default: () => ({}),
  },
});

// CONSTANTS
const { t } = useI18n();
const colorBtn = "--neutral-text-caption";
const KEY_LABLES =
  "modules.organizations.settings.members.modal.permissions.sections.labels";

// VARIABLES
const expand = ref(false);

if (props.permission.area_code === "globals") expand.value = true;

// FUNCTIONS
const toggleExpand = () => {
  if (isActive.value) {
    expand.value = !expand.value;
  }
};

// COMPUTED
const countPermissionsSummary = computed(() => {
  let applied = 0;
  let total = 0;
  props.permission.groups.forEach((group) => {
    if (group?.group_info?.group_type === "general") {
      applied += 1;
      total += 1;
    } else {
      group.subcategories.forEach((subcategory) => {
        subcategory.permissions.forEach((perm) => {
          if (perm.activate) applied += 1;
          total += 1;
        });
      });
    }
  });

  if (props.permission.area_code === "globals") {
    return t(KEY_LABLES + ".subNormal");
  }
  return t(KEY_LABLES + ".sub", { count: applied, total });
});
const isActive = computed(() => {
  const CODE =
    props.permission.area_code === "globals"
      ? "globals"
      : props.permission.area_code + "_global";
  const globals = organizationStore.permissionsProfile.edit.permissions.find(
    (p) => p.area_code === "globals",
  );
  if (CODE === "globals") return true;
  if (globals) {
    const perm = globals.groups[0].subcategories[0].permissions.find(
      (p) => p.code === CODE,
    );
    return perm?.activate || false;
  } else {
    return false;
  }
});
</script>

<template>
  <div class="permission__card">
    <button
      :class="`permission__card-header ${expand && isActive ? 'expanded' : ''}`"
      :disabled="!isActive"
      @click="toggleExpand"
    >
      <span :class="`u u-${props.title.icon}`"></span>
      <div class="permission__card-header-title">
        <span>{{ props.title.main[globalStore.lang] }}</span>
        <span>{{ countPermissionsSummary }}</span>
      </div>
      <span class="u u-chevron-down" :class="{ rotated: expand }"></span>
    </button>
    <div class="permission__card-content" v-if="expand && isActive">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.permission__card {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  padding: 20px 16px;
  width: 100%;
}
.permission__card-header {
  display: grid;
  grid-template-columns: 24px 1fr 20px;
  column-gap: 8px;
  align-items: center;
  padding: 0px 8px 0px;
  border-bottom: none;
  margin-bottom: 0px;
  width: 100%;
  cursor: pointer;
}
.permission__card-header.expanded {
  border-bottom: 1px solid var(--neutral-border-subtle);
  margin-bottom: 8px;
  padding: 0px 8px 8px;
}
.permission__card-header-title {
  display: flex;
  flex-direction: column;
}
.permission__card-header-title span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  color: var(--neutral-text-body);
  text-align: start;
}
.permission__card-header-title span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-align: start;
}
.permission__card-header .u {
  color: var(--secondary-text-default);
  font-size: 24px;
  line-height: 24px;
}
.permission__card-header:disabled span {
  color: var(--neutral-text-disabled);
}
.permission__card-header:disabled {
  cursor: not-allowed;
}
.permission__card-header :deep(.rotated) {
  transition: transform 0.25s ease;
  transform: rotate(180deg);
}

.permission__card-header :deep(.u-button-icon) {
  transition: transform 0.25s ease;
}
</style>
