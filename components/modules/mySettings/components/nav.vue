<script setup>
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

//  Translation
const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleNav = module + ".nav";

// Stores
const userStore = useUserStore();

// Constants

// Computed
const options = computed(() => [
  { label: t(`${moduleNav}.nav1`), value: 0 },
  { label: t(`${moduleNav}.nav2`), value: 1 },
  { label: t(`${moduleNav}.nav3`), value: 2 },
  { label: t(`${moduleNav}.nav4`), value: 3 },
]);
const selected = (option) => userStore.mySettings.tab === option;
</script>

<template>
  <div class="nav">
    <button
      :class="`nav__option ${selected(option.value) ? 'selected' : ''}`"
      v-for="option in options"
      :key="option.value"
      @click="userStore.mySettings.tab = option.value"
    >
      <span v-text="option.label"></span>
    </button>
  </div>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.nav__option {
  width: 100%;
  height: 40px;
  background-color: var(--neutral-background-default);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-radius: 14px;
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
}
.nav__option.selected,
.nav__option:hover {
  background-color: var(--primary-surface-shadow-12a);
}
.nav__option span {
  font-family: Nunito;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--neutral-text-caption);
  transition: 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
}
.nav__option.selected span,
.nav__option:hover span {
  color: var(--primary-text-default);
}
</style>
