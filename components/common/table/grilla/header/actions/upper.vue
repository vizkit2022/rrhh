<script setup>
import { computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import usePermissionsStore from "@/stores/permissions";
import useIncomesStore from "@/stores/incomes";

// Store
const grillaStore = useGrillaStore();
const permissionsStore = usePermissionsStore();
const incomesStore = useIncomesStore();

// Computed
const disabledBtn = computed(() => {
  return (
    grillaStore.updating ||
    grillaStore.loading ||
    grillaStore.selectedIds.size === 0
  );
});

// Constants
const { t } = useI18n();
const uiLabel = "grilla.headers.actions";

// Functions
const showModalDelete = () => {
  grillaStore.showModal = true;
  grillaStore.showModalType = "delete";
  grillaStore.showModalPosition = "center";
};
const showModalCloseOpen = (close) => {
  grillaStore.configCloseOpen.type = close ? "closePurchase" : "openPurchase";
  grillaStore.configCloseOpen.all = false;
  grillaStore.configCloseOpen.state = incomesStore.income.state;
  grillaStore.configCloseOpen.show = true;
};

// Computed
const deletePemission = computed(
  () => permissionsStore?.myPermissions?.income__grid_line_delete,
);
</script>

<template>
  <th :style="grillaStore.getColumnStyle('actions')" class="actions">
    <div class="actions__sup">
      <button
        :disabled="disabledBtn"
        :title="t(uiLabel + '.open')"
        @click="showModalCloseOpen()"
      >
        <span class="u u-buy-yes"></span>
      </button>
      <button
        :disabled="disabledBtn"
        :title="t(uiLabel + '.close')"
        @click="showModalCloseOpen(true)"
      >
        <span class="u u-buy-no"></span>
      </button>
      <button
        :disabled="!deletePemission || disabledBtn"
        :title="t(uiLabel + '.delete')"
        @click="showModalDelete"
      >
        <span class="u u-delete"></span>
      </button>
    </div>
  </th>
</template>

<style scoped>
.actions__sup {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}
.actions__sup button {
  width: 26px;
  height: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--neutral-border-default);
  border-radius: 8px;
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}
.actions__sup button span {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
  transition: 0.3s;
}
.actions__sup button:not(:disabled):hover {
  border: 1px solid var(--primary-border-subtle);
}
.actions__sup button:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}
.actions__sup button:disabled {
  border: 1px solid var(--neutral-border-disabled);
  cursor: not-allowed;
}
.actions__sup button:disabled span {
  color: var(--neutral-text-disabled);
}
</style>
