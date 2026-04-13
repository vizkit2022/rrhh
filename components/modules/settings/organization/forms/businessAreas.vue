<script setup>
import useGlobalStore from "@/stores/global";
import useBusinessAreasStore from "@/stores/businessAreas";
import configBusinessArea from "@/utils/configTables/businessAreas.json";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

// Stores
const globalStore = useGlobalStore();
const businessAreasStore = useBusinessAreasStore();

// Variables
const search = ref("");
const selectAll = ref(false);
const createArea = ref(false);
const showModalDelete = ref(false);
const showModalEdit = ref(false);
const selectedArea = ref(null);
// Traducción
const { t } = useI18n();
const module = "modules.organizations.settings.businessAreas";

// Computed
const filteredAreas = computed(() => {
  return businessAreasStore.businessAreas.filter((area) => {
    return area.name.toLowerCase().includes(search.value.toLowerCase());
  });
});

const getState = (state) =>
  state
    ? t(module + ".buttonState.activo")
    : t(module + ".buttonState.inactivo");

const lockModal = ref(false);
const hideModal = () => {
  if (!lockModal.value) {
    createArea.value = false;
    showModalEdit.value = false;
    lockModal.value = false;
  }
};

const lock = (state) => {
  lockModal.value = state;
};

const handleDelete = async () => {
  try {
    globalStore.loading = true;

    const selectedAreas = businessAreasStore.businessAreas.filter(
      (area) => area.selected,
    );
    const allSelected = businessAreasStore.businessAreas.every(
      (area) => area.selected,
    );

    if (selectedAreas.length > 0) {
      await businessAreasStore.deleteBusinessArea({
        ids: selectedAreas.map((area) => area._id),
      });
    } else if (allSelected) {
      await businessAreasStore.deleteBusinessArea({
        ids: businessAreasStore.businessAreas.map((area) => area._id),
      });
    } else {
      console.log("No se han seleccionado áreas");
    }

    await fetchBusinessAreas();
  } catch (error) {
    console.error("Error al eliminar áreas de negocio:", error);
  } finally {
    globalStore.loading = false;
  }
};

const openEditModal = (dataBusinessArea) => {
  console.log("selected", dataBusinessArea);
  selectedArea.value = dataBusinessArea;
  showModalEdit.value = true;
};

const toggleState = async (area) => {
  try {
    globalStore.loading = true;
    if (area.isActive === true) {
      await businessAreasStore.updatedActiveArea(area._id);
    } else {
      await businessAreasStore.updatedDesactiveArea(area._id);
    }
    await fetchBusinessAreas();
  } catch (error) {
    console.error(
      "Error al actualizar el estado de la área de negocio:",
      error,
    );
  } finally {
    globalStore.loading = false;
  }
};

const fetchBusinessAreas = async () => {
  await businessAreasStore.getBusinessAreaForOrganization();
};

const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    editBusinessArea: () => {
      openEditModal(data);
    },
  };
  emits[emit]?.();
};

onMounted(async () => {
  await fetchBusinessAreas();
});
</script>

<template>
  <div class="containerSection">
    <div class="containerSection__header">
      <h2>{{ t(module + ".title") }}</h2>
      <span>{{ t(module + ".descripcion") }}</span>
    </div>
    <div class="containerSection__filters">
      <div class="containerSection__filters-search">
        <u-input
          v-model="search"
          class="search"
          icon="search"
          :revers="true"
          :placeholder="t(module + '.searchPlaceholder')"
          :class="{ expanded: globalStore.sliderExpand }"
        />
      </div>

      <div class="containerSection__filters-actions">
        <!-- <u-button v-if="!globalStore.sliderExpand" text="Editar" type="outlined" icon="edit" :disabled="true" /> -->
        <!-- <u-button-icon text="Editar" type="outlined" icon="edit" :disabled="businessAreasStore.businessAreas.filter((area) => area.selected).length !== 1" @action-btn="openEditModal" /> -->
        <u-button-icon
          @action-btn="showModalDelete = true"
          color="--danger-surface-default"
          colorHover="--danger-surface-darker"
          colorActive="--danger-surface-darker"
          icon="folder-open"
          type="outlined"
          :disabled="
            !businessAreasStore.businessAreas.some((area) => area.selected)
          "
        />
        <u-button
          :text="t(module + '.businessCreate')"
          icon="new"
          @click="createArea = true"
        />
        <!-- <u-button-icon icon="more" color="--neutral-text-caption" type="outlined" /> -->
      </div>
    </div>

    <TableBasic
      :configTable="configBusinessArea.businessAreas"
      :content="filteredAreas"
      :loading="businessAreasStore.loading"
      @actionTable="actionTable"
    >
      <template v-slot:members="item">
        <div class="avatar-stack">
          <u-avatar
            v-for="member in item.item.users.slice(0, 6)"
            :key="member._id"
            :user="{
              name: member?.name?.first ?? 'Sin Nombre',
              src: member?.imgUrl ?? null,
            }"
            :size="32"
            class="avatar"
          />

          <div v-if="item.item.users.length > 6" class="more-members">
            <span>+{{ item.item.users.length - 6 }}</span>
          </div>
        </div>
      </template>

      <template v-slot:state="item">
        <div class="containerSection__table-item">
          <div class="col contTag">
            <div :class="`tag ${item.item.isActive ? 'active' : 'inactive'}`">
              <span>{{ getState(item.item.isActive) }}</span>
              <u-radio
                v-model="item.item.isActive"
                @click.stop="toggleState(item.item)"
                color="--success-text-default"
                color-hover="--success-text-darker"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-slot:default="item">
        <u-checkbox
          v-model="item.item.default"
          :height="16"
          class="margCheckBox"
        />
      </template>
    </TableBasic>

    <dialog-confirm
      width="600px"
      height="auto"
      title="Archivar Areas de Negocio"
      description="¿Desea Archivar las areas de negocio seleccionadas?"
      customTextBtnDelete="Archivar"
      :actionModal="handleDelete"
      :showModal="showModalDelete"
      @close-modal="showModalDelete = false"
    />

    <u-dialog
      :showModal="createArea"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="600px"
      height="600px"
    >
      <SettingsOrganizationDialogCreateArea
        @closeModal="hideModal"
        @lockModal="lock"
        @updated="fetchBusinessAreas"
      />
    </u-dialog>

    <u-dialog
      :showModal="showModalEdit"
      :lockModal="lockModal"
      @closeModal="hideModal"
      width="600px"
      height="auto"
    >
      <SettingsOrganizationDialogEditArea
        :businessAreaToEdit="selectedArea"
        @closeModal="hideModal"
        @lockModal="lock"
        @updated="fetchBusinessAreas"
      />
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
  grid-template-rows: 60px 36px 1fr;
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

.containerSection__filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.containerSection__filters-search {
  display: flex;
  align-items: center;
}

.containerSection__filters-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
}

.containerSection__filters .search {
  width: 28dvw;
  transition: width 0.3s ease-in-out;
}

.contTag {
  position: relative;
}

.contTag .tag {
  width: 85px;
  padding: 3px 3px 3px 10px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contTag .tag span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
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

.containerSection__table-item .active {
  background-color: var(--success-surface-shadow-12a);
  color: var(--success-text-default);
}

.containerSection__table-item .inactive {
  background-color: var(--neutral-surface-shadow-12a);
  color: var(--neutral-text-subtitle);
}

.margCheckBox {
  margin: 0 auto;
}
</style>
