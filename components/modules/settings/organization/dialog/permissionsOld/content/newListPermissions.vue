<script setup>
import { onMounted } from 'vue';
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";

// COMPOSABLES
import { useHeaderPermissions } from "@/components/modules/settings/organization/dialog/permissions/composables/useHeaderPermissions";
import { useRadioButtonsManager } from "@/components/modules/settings/organization/dialog/permissions/composables/useRadioButtonsManager";
import { usePermissionsTable } from "@/components/modules/settings/organization/dialog/permissions/composables/usePermissionsTable";
import { useDropdownAreas } from "@/components/modules/settings/organization/dialog/permissions/composables/useDropdownAreas";

//STORES
const globalStore = useGlobalStore();
const permissionStore = usePermissionStore();

//EMITS
const emit = defineEmits(["updatedMembers"]);

//::::::HEADER-CAMBIOS DE PERMISOS::::::::

// COMPOSABLES

const {
  initializeHeaderProfilePermissions,
  selectProfile,
  isOwnerOrAdmin,
  optionsProfilePermissions,
  handleSelectProfile,
  isChangeProfile,
  currentButtonSaveEdit,
  showWarningTypeSavePermission,
  buttonsWarningTypePermissions,
  showWarningNewRoleUser,
  nameNewRole,
  handleChangeProfile,
  handleSaveNewProfile,
} = useHeaderPermissions(emit);

//::::::BODY-TABLA DE PERMISOS::::::::

// COMPOSABLES

const {
  getConfigForGroup,
  getPermissionsFromGroup,
  initializePermissionsProfileUser
} = usePermissionsTable();

const {
  statesDropdownsAreas,
  openDropdownAreas,
  isOpenDropdownAreas,
  initDropdownsAreas
} = useDropdownAreas(permissionStore);

const {
  getRadioSlots,
  isPermissionActive,
  isDisabledRadioPermission,
  handleChangeRadioPermission,
  hasPermissionChanges
} = useRadioButtonsManager();

// FUNCTIONS
function formatTooltip(text) {
  if (!text) return "";
  return text
}


// CYCLES
watch(() => permissionStore.propsListPermissions.idPermissions, () => {
  permissionStore.propsListPermissions.isChangePermissions = hasPermissionChanges();
}, { deep: true });


onMounted(async () => {
  try {
    globalStore.loading = true;
    await initializePermissionsProfileUser();
    initializeHeaderProfilePermissions();
    initDropdownsAreas();
  } catch (e) {
    console.log(e);
  } finally {
    globalStore.loading = false;
  }
});

</script>

<template>
  <div class="container_list-permissions">
    <!--HEADER-->
    <div class="container_header">
      <div class="change_header_permissions">
        <span>Perfil de permisos:</span>
        <u-select
          :model-value="selectProfile.label"
          style="width: 420px"
          size="m"
          :disabled="isOwnerOrAdmin"
          :options="optionsProfilePermissions"
          :full-data="true"
          @full-data="handleSelectProfile"  
          placeholder="Buscar perfil..."
        />
      </div>
            <div class="action_header_permissions"> 
        <u-button
         v-if="isChangeProfile"
          text="Asignar Perfil"
          icon="u u-check"
          type="outlined"
          size="xs"
          class="btnSave"
          :disabled="isOwnerOrAdmin"
          @click="handleChangeProfile"
        />
          <u-button
          v-else
          :text="currentButtonSaveEdit?.text"
          :icon="currentButtonSaveEdit?.icon"
          type="outlined"
          size="xs"
          class="btnSave"
          :disabled="currentButtonSaveEdit?.disabled"
          @click="currentButtonSaveEdit?.action"
        />
      </div>
    </div>

    <!--WARNINGS-->
    <div class="container_warning" v-if="showWarningTypeSavePermission">
      <div class="infoTypePermissions">
        <span class="u u-info-outlined"></span>
        <p class="textTypePermissions">
           Este perfil de permisos está asociado a más de un miembro de la organización ¿Deseas editarlo para todos los miembros o solo para este usuario?
        </p>
      </div>

      <div class="buttonsTypePermissions">
        <u-button
          v-for="(button, index) in buttonsWarningTypePermissions"
          :key="index"
          :text="button.text"
          :type="button.type"
          :size="button.size"
          :class="button.class"
          :color="button.color"
          @click="button.action"
        />
      </div>

    </div>

        <!--WARNINGS NEW PROFILE-->
        <div class="containerNewRolePermissions" v-if="showWarningNewRoleUser">
      <div class="infoNewRolePermissions">
        <span class="u u-info-outlined"></span>
        <p class="textNewRolePermissions">
         Los permisos modificados se guardarán bajo un nuevo perfil de permisos. Ingrese un nombre para el perfil.
        </p>
      </div>
      <div class="containerInputButtonNewRolePermissions">
        <u-input
          v-model="nameNewRole"
          class="inputNewRolePermissions"
          size="s"
          placeholder='Ingresa un nombre para el perfil de permisos'
        />
        <div class="buttonsNewRolePermissions">
          <u-button
              text="Guardar Perfil"
              icon= "save"
              type= "outlined"
              size= "xs"
              class= "btnSaveNewProfile"
              @click="handleSaveNewProfile"
          />
        </div>
      </div>
    </div>

   <!--BODY-->
    <div class="container_body">
      <div
        class="container-areas"
        v-for="(areas, indexAreas) in permissionStore.permissions"
        :key="indexAreas"
      >
        <div class="item-area" @click="openDropdownAreas(indexAreas)">
          <span class="u u-chevron-down arrow" :class="{ 'rotated': isOpenDropdownAreas(indexAreas)}"></span>
          <span class="title-area">
            {{ areas.area_name[globalStore.lang] }}
          </span>
        </div>

        <div
          class="dropdown-areas"
          :class="{ 'is-open': isOpenDropdownAreas(indexAreas) }"
        >
          <div class="container_groups">
            <template
              v-for="(groups, indexGroups) in areas.groups"
              :key="indexGroups"
            >
              <TableBasic
                :configTable="getConfigForGroup(groups)"
                :content="getPermissionsFromGroup(groups)"
                :showSeparator="true"
                :lazyRender="true"
              >
                <template v-slot:name="item">
                  <div class="containerTextPermission">
                    <div class="izq">
                      <span class="body-m-sb titlePermission">{{ item.item.name[globalStore.lang] }}</span>
                      <span
                        class="body-xs-r subTitle"
                        v-if="item?.item?.sub_title?.[globalStore.lang]"
                      >
                        ({{ item.item.sub_title[globalStore.lang] }})
                      </span>
                    </div>
                    <div class="der">
                      <span v-if="item?.item?.careIsRequired" class="body-xs-r">REQUIERE CUIDADO</span>
                      <div>
                        <u-tooltip v-if="item?.item?.tooltip?.[globalStore.lang]" :teleport="true" :width-tooltip="item?.item?.tooltip?.[globalStore.lang] ? '350px' : 'auto'" :text="formatTooltip(item?.item?.tooltip?.[globalStore.lang])" color="--neutral-text-darker" backgroundColor="var(--neutral-surface-light)" customTextClass="body-l-sb tooltipTextMsg">
                        <span class="u u-question-outlined tooltipMsg"></span>
                        </u-tooltip>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- RADIO BUTTONS CENTRALIZADOS -->
                <template
                  v-for="(slotName, indexSlots) in getRadioSlots(groups.group_info.group_type)" 
                  v-slot:[slotName]="item" 
                  :key="indexSlots"
                >
                  <u-radio 
                    class="margRadio" 
                    :model-value="isPermissionActive(item.item, slotName, groups.group_info.group_type)" 
                    :disabled="!permissionStore.propsListPermissions.isEdit" 
                    @click="handleChangeRadioPermission(item.item, slotName, groups.group_info.group_type)" 
                  />
                </template>
              </TableBasic>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CONTAINER BODY */
.container_list-permissions {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;
}

/* STYLE HEADER  */

.container_header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.change_header_permissions {
    display: flex;
    gap: 20px;
    align-items: center;
}

.change_header_permissions span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.action_header_permissions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action_header_permissions .btnSave,
.action_header_permissions .btnCancel {
  font-size: 14px;
}

/* STYLE WARNINGS */
.container_warning {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 82px;
  padding: 10px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 18px;
  justify-content: space-between;
  align-items: center;
}

.container_warning .u {
  font-size: 24px;
  margin-bottom: 17px;
}

.infoTypePermissions {
  display: flex;
  flex-direction: row;
  width: 550px;
  align-items: center;
  gap: 10px;
}

.textTypePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.buttonsTypePermissions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 10px 0;
}

.buttonsTypePermissions .btnEdit {
  width: 200px;
  border-radius: 10px;
}

.containerNewRolePermissions {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 82px;
  padding: 8px 10px 10px 10px;
  border: 1px solid var(--neutral-border-default);
  border-radius: 18px;
  gap: 4px;
  align-items: center;
}

.containerNewRolePermissions .u {
  font-size: 24px;
}

.infoNewRolePermissions {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: left;
  gap: 10px;
}

.textNewRolePermissions {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.containerInputButtonNewRolePermissions {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 36px;
  justify-content: space-between;
  gap: 10px;
}

.inputNewRolePermissions {
  margin-left: 25px;
  width: 561px;
}

.btnSaveNewProfile {
  border-radius: 8px;
  font-size: 16px;
}


/*STYLE BODY */

.container_body {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    gap: 20px;
    flex: 1;
    overflow-y: auto;
}

.container_body::-webkit-scrollbar {
    width: 8px;
    height: 0px;
    background: var(--neutral-surface-light);
    border-radius: 20px;
}

.container_body::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-darker);
    border-radius: 5px;
}

/* CONTAINER AREAS */
.container-areas {
    display: flex;
    flex-direction: column;
}

/* ITEM AREA */
.item-area {
  display: flex;
  height: 40px;
  padding: 15px 20px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  border: 1px solid var(--neutral-border-light);
  background-color: var(--neutral-surface-light);
  cursor: pointer;
  justify-content: left;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s ease;
}

.item-area:hover {
  border: 1px solid var(--neutral-border-default);
  background-color: var(--neutral-background-hover, rgba(0, 0, 0, 0.02));
}

/* FLECHA ITEM AREA */
.arrow {
  transition: transform 0.3s ease;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.title-area {
  color: var(--neutral-text-body);
  font-size: 14px;
  line-height: 18px;
  font-weight: 800;
}

/* DROPDOWN AREAS */
.dropdown-areas {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  border: 1px solid var(--neutral-border-light);
  border-top: none;
  border-radius: 0 0 8px 8px;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  background-color: transparent;
  transition: opacity 0.3s ease, max-height 0.3s ease;
}

.dropdown-areas.is-open {
  opacity: 1;
  max-height: 10000px;
}

.container_groups {
  display: flex;
  flex-direction: column;
  padding: 24px 24px 24px 24px;
  gap: 24px;
}

.containerTextPermission {
  display: grid;
  grid-template-columns: 1fr auto; 
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  height: 100%;
}

.titlePermission {
  text-align: left;
  color: var(--neutral-text-body);
}

.subTitle {
  white-space: nowrap;
  text-align: left;
  color: var(--neutral-text-caption);
  margin-top: 3px;
  letter-spacing: 0.5px;
}

.containerTextPermission .izq {
  display: grid;
  grid-template-columns: auto auto;
  white-space: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
}

.containerTextPermission .der {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

/* .container_list-permissions .tooltip {
  z-index: 10000 !important;
  position: fixed !important;
} */

.containerTextPermission .der span {
  letter-spacing: 1px;
  color: var(--danger-text-default);
}

.containerTextPermission .der div {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltipTextMsg {
  line-height: 96px;
}

.u.u-question-outlined.tooltipMsg:before {
  color: var(--secondary-text-default) !important;
}

.containerTextPermission .der .tooltipMsg {
  font-size: 20px;
}


/* TABLE */
.margRadio {
  margin: 0 auto;
}
</style>