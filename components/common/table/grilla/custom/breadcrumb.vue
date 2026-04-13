<script setup>
import useGrillaStore from "@/stores/grilla";
import useLineStore from "@/stores/lines";
import { useI18n } from "vue-i18n";

// Stores
const grillaStore = useGrillaStore();
const linesStore = useLineStore();

// Constants
const { t } = useI18n();
const color = "--neutral-text-caption";

// Functions
const goToParent = async (b, btn) => {
  if (b === grillaStore.breadcrumb.length - 1) null;

  grillaStore.goToParentFromBreadcrumb(b, btn);
};
</script>

<template>
  <div class="breadcrumb-container">
    <div class="breadcrumb">
      <button
        class="breadcrumb__btn"
        :disabled="grillaStore.updating"
        @click="grillaStore.goToInitParent()"
      >
        <span class="u u-folder"></span>
        <span>{{ t("grilla.breadcrumb.title") }}</span>
      </button>
      <template v-for="(btn, b) in grillaStore.breadcrumb" :key="b">
        <span class="divider">/</span>
        <button
          @click="goToParent(b, btn)"
          :class="`breadcrumb__btn ${
            b === grillaStore.breadcrumb.length - 1 ? 'last' : ''
          }`"
          :disabled="btn.disabled"
        >
          <span class="breadcrumb__btn-text">{{ btn.text }}</span>
        </button>
      </template>
    </div>
    <u-button
      class="btnInfo"
      icon="info-circle"
      text="Ver totales"
      type="text"
      size="s"
      :color="color"
    />
    <table-grilla-custom-totals v-if="false" />
  </div>
</template>

<style scoped>
.breadcrumb-container {
  padding-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}
.breadcrumb {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  height: 18px;
  min-width: 0;
}
.breadcrumb__btn {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  font-weight: 600;
  transition: 0.3s;
  max-width: 200px;
  min-width: 0;
  gap: 8px;
}
.breadcrumb .divider,
.breadcrumb__btn .u {
  font-size: 16px;
  font-weight: 600;
  color: var(--neutral-text-disabled);
}
.breadcrumb__btn:not(:disabled):hover span {
  color: var(--primary-text-subtle);
}
.breadcrumb__btn:disabled span {
  color: var(--neutral-text-disabled) !important;
}
.breadcrumb__btn:not(:disabled).last span {
  color: var(--neutral-text-body);
}
.breadcrumb__btn-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  min-width: 0;
  width: 100%;
}
.btnInfo {
  font-size: 14px;
  padding: 0px;
}
.btnInfo::v-deep(.u) {
  font-size: 18px;
}
</style>
