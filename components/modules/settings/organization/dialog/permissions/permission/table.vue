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

// PROPS
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

// COMPUTED
const posComputed = computed(() => {
  const code = props.item.area_code;
  const index = permissionStore.permissionsUser.findIndex(
    (pU) => pU.area_code === code,
  );
  if (index === -1) return 0;
  return index;
});
const isActive = computed(() => {
  const CODE =
    props.item.area_code === "globals"
      ? "globals"
      : props.item.area_code + "_global";
  const globals = permissionStore.permissionsUser.find(
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

// FUNCTIONS
const getText1 = (group) => {
  const prop =
    group?.group_info?.group_type === "default" ? ".text3" : ".text1";
  return t(KEY_LABLES + prop);
};
const getText2 = (group) => {
  const prop =
    group?.group_info?.group_type === "default" ? ".text4" : ".text2";
  return t(KEY_LABLES + prop);
};
function formatTooltip(text) {
  if (!text) return "";
  return text;
}
// CONTROL DE PERMISOS
const changeState = (
  g,
  s,
  p,
  permission,
  state = "activate",
  state2 = "noActivate",
) => {
  permissionStore.modalPermissions.change = true;

  const config = { g, s, p, permission, state, state2 };
  if (permission.area.area_code === "projects") validityProject(config);
  else if (permission.area.area_code === "settings") validitySettings(config);
  else if (permission.area.area_code === "outcomes") validityOutcomes(config);
  else {
    const pos = posComputed.value;
    permissionStore.permissionsUser[pos].groups[g].subcategories[s].permissions[
      p
    ][state2] =
      !permissionStore.permissionsUser[pos].groups[g].subcategories[s]
        .permissions[p][state];
  }
};
// PROJECTS
const validityProject = (config) => {
  const { g, s, p, permission, state, state2 } = config;
  const pos = posComputed.value;

  permissionStore.permissionsUser[pos].groups[g].subcategories[s].permissions[
    p
  ][state2] =
    !permissionStore.permissionsUser[pos].groups[g].subcategories[s]
      .permissions[p][state];

  let codes = [];
  let values = { activate: false, noActivate: true };
  const CODE = permission.code;

  if (CODE === "create_projects" && permission.noActivate) {
    codes = ["create_budgets", "create_business"];
  } else if (CODE === "create_projects" && permission.activate) {
    codes = ["create_budgets", "create_business"];
    values = { activate: true, noActivate: false };
  } else if (
    ["create_budgets", "create_business"].includes(CODE) &&
    permission.noActivate
  ) {
    const perm = permissionStore.permissionsUser[pos].groups[g].subcategories[
      s
    ].permissions.find((perm) => perm.code === "create_projects");
    if (perm.activate) {
      const _CODE =
        CODE === "create_budgets" ? "create_business" : "create_budgets";
      const permSecond = permissionStore.permissionsUser[pos].groups[
        g
      ].subcategories[s].permissions.find((p) => p.code === _CODE);
      permSecond.activate = true;
      permSecond.noActivate = false;
    }
    return;
  } else if (CODE === "edit_projects" && permission.noActivate) {
    codes = ["edit_project_name", "edit_project_client"];
  } else if (CODE === "edit_project_client" && permission.activate) {
    codes = ["edit_projects"];
    values = { activate: true, noActivate: false };
  }

  codes.forEach((code) => {
    const perm = permissionStore.permissionsUser[pos].groups[g].subcategories[
      s
    ].permissions.find((perm) => perm.code === code);
    if (perm) {
      perm.activate = values.activate;
      perm.noActivate = values.noActivate;
    }
  });
};
// SETTINGS
const validitySettings = (config) => {
  let { g, s, p, permission, state, state2 } = config;
  const pos = posComputed.value;

  permissionStore.permissionsUser[pos].groups[g].subcategories[s].permissions[
    p
  ][state2] =
    !permissionStore.permissionsUser[pos].groups[g].subcategories[s]
      .permissions[p][state];

  let codes = [];
  let values = { activate: false, noActivate: true };
  const CODE = permission.code;

  if (CODE === "configs" && permission.noActivate) {
    codes = ["configure_business_area", "config_validations"];
    g = g + 1; // Porque estan en subcategories diferentes
  } else if (
    ["configure_business_area", "config_validations"].includes(CODE) &&
    permission.activate
  ) {
    codes = ["configs"];
    g = g - 1; // Porque estan en subcategories diferentes
    values = { activate: true, noActivate: false };
  }

  codes.forEach((code) => {
    const perm = permissionStore.permissionsUser[pos].groups[g].subcategories[
      s
    ].permissions.find((perm) => perm.code === code);
    if (perm) {
      perm.activate = values.activate;
      perm.noActivate = values.noActivate;
    }
  });
};
// OUTCOMES
const validityOutcomes = (config) => {
  const { g, s, p, permission, state, state2 } = config;
  const pos = posComputed.value;

  permissionStore.permissionsUser[pos].groups[g].subcategories[s].permissions[
    p
  ][state2] =
    !permissionStore.permissionsUser[pos].groups[g].subcategories[s]
      .permissions[p][state];

  let codes = [];
  const CODE = permission.code;
  let values = { activate: false, noActivate: true };

  if (CODE === "cancel_purchases" && permission.noActivate) {
    codes = ["cancel_purchases_with_docs"];
    values = { activate: false, noActivate: true };
  } else {
    if (CODE === "cancel_purchases_with_docs" && permission.activate) {
      codes = ["cancel_purchases"];
      values = { activate: true, noActivate: false };
    }
  }

  codes.forEach((code) => {
    const perm = permissionStore.permissionsUser[pos].groups[g].subcategories[
      s
    ].permissions.find((perm) => perm.code === code);
    if (perm) {
      perm.activate = values.activate;
      perm.noActivate = values.noActivate;
    }
  });
};
</script>

<template>
  <div class="permissionContainer">
    <div class="permissionTable" v-for="(group, g) in item.groups" :key="g">
      <div class="permissionTable__header">
        <div class="permissionTable__header-title">
          <span class="title">{{
            group?.group_info?.group_name?.[globalStore.lang] || ""
          }}</span>
        </div>
        <div class="permissionTable__header-col">
          <span>{{ getText1(group) }}</span>
        </div>
        <div class="permissionTable__header-col">
          <span>{{ getText2(group) }}</span>
        </div>
      </div>
      <template v-for="(subcategory, s) in group.subcategories" :key="s">
        <template v-for="(permission, p) in subcategory.permissions" :key="p">
          <div class="permissionTable__item">
            <div class="permissionTable__item-colName">
              <span class="truncateText">
                {{ permission.name[globalStore.lang] }}
                <strong v-if="permission?.sub_title?.[globalStore.lang]">
                  ({{ permission?.sub_title?.[globalStore.lang] }})
                </strong>
              </span>
              <div
                class="permissionTable__item-colName-text"
                v-if="
                  permission?.careIsRequired ||
                  permission?.tooltip?.[globalStore.lang]
                "
              >
                <span class="main" v-if="permission?.careIsRequired">
                  {{ t(KEY_LABLES + ".text5") }}
                </span>
                <u-tooltip
                  v-if="permission?.tooltip?.[globalStore.lang]"
                  :teleport="true"
                  :width-tooltip="
                    permission?.tooltip?.[globalStore.lang] ? '350px' : 'auto'
                  "
                  :text="formatTooltip(permission?.tooltip?.[globalStore.lang])"
                  color="--neutral-text-darker"
                  backgroundColor="var(--neutral-surface-light)"
                  customTextClass="body-l-sb tooltipTextMsg"
                >
                  <span class="u u-question-outlined tooltipMsg"></span>
                </u-tooltip>
              </div>
            </div>
            <div class="permissionTable__item-col">
              <u-radio
                v-model="permission.activate"
                @select="
                  changeState(g, s, p, permission, 'activate', 'noActivate')
                "
                :disabled="!permissionStore.modalPermissions.edit && isActive"
              />
            </div>
            <div class="permissionTable__item-col">
              <u-radio
                v-model="permission.noActivate"
                @select="
                  changeState(g, s, p, permission, 'noActivate', 'activate')
                "
                :disabled="!permissionStore.modalPermissions.edit && isActive"
              />
            </div>
          </div>
        </template>
        <div
          v-if="
            s !== group.subcategories.length - 1 &&
            group.subcategories.length > 1
          "
          class="permissionTable__divider"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.permissionContainer {
  overflow: auto;
  width: calc(100vw - 245px);
  display: grid;
  row-gap: 12px;
  max-width: 950px;
}
.permissionTable {
  width: calc(100vw - 245px);
  max-width: 950px;
}
.permissionTable__header,
.permissionTable__item {
  min-width: 600px;
  display: grid;
  grid-template-columns: 1fr repeat(2, 140px);
  height: 32px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.permissionTable__header {
  border-radius: 10px 10px 0 0;
  border-top: 1px solid var(--neutral-border-subtle);
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
}
.permissionTable__item {
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
}
.permissionTable__item:last-child {
  border-radius: 0 0 10px 10px;
}
.permissionTable__header {
  background-color: var(--neutral-surface-softer);
}
.permissionTable__header-col,
.permissionTable__item-col {
  border-left: 1px solid var(--neutral-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}
.permissionTable__header-col span {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-body);
}
.permissionTable__item-colName {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr auto;
  padding: 0 12px;
}
.permissionTable__item-colName span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.permissionTable__item-colName span strong {
  font-size: 10px;
  line-height: 10px;
  font-weight: 400;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.permissionTable__item-colName-text {
  display: flex;
  align-items: center;
  gap: 10px;
}
.permissionTable__item-colName-text .main {
  color: var(--danger-text-default);
  text-transform: uppercase;
  font-size: 10px;
  line-height: 10px;
}
.permissionTable__divider {
  min-width: 600px;
  height: 8px;
  background-color: var(--neutral-surface-softer);
  border: 1px solid var(--neutral-border-subtle);
  border-top: none;
}
.permissionTable__header-title {
  padding: 0 12px;
  display: flex;
  align-items: center;
}
.permissionTable__header-title .title {
  font-size: 12px;
  line-height: 12px;
  color: var(--neutral-text-body);
  font-weight: 600;
}

@media only screen and (max-width: 768px) {
  .permissionContainer {
    width: calc(100vw - 85px);
  }
  .permissionTable {
    overflow: auto;
    width: calc(100vw - 85px);
  }
}
</style>
