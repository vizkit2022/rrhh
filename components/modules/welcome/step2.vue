<script setup>
import { ref } from "vue";
import useWizardStore from "@/stores/wizard";
import useGlobalStore from "@/stores/global";
// Stores
const wizardStore = useWizardStore();
const globalStore = useGlobalStore();


const { t } = useI18n();
const module = "modules.wizard.steps.main";
const button = "modules.wizard.buttons";

// Variables
const type = ref("");
const options = [
  {
    img: `/img/individual${globalStore.isDark ? "-dark" : ""}.svg`,
    text: t(module + ".cards.card1.title"),
    description: t(module + ".cards.card1.text"),
    type: "normal",
  },
  {
    img: `/img/equipo${globalStore.isDark ? "-dark" : ""}.svg`,
    text: t(module + ".cards.card2.title"),
    description: t(module + ".cards.card2.text"),
    type: "member",
  },
  {
    img: `/img/lider${globalStore.isDark ? "-dark" : ""}.svg`,
    text: t(module + ".cards.card3.title"),
    description: t(module + ".cards.card3.text"),
    type: "company",
  },
];

const getPosByType = (type) => {
  const types = {
    normal: 2,
    member: 6,
    company: 7,
  };
  return types[type];
};
</script>

<template>
  <div class="containerPage__card">
    <div class="logo">
      <u-logo class="img" />
      <u-logo-text class="text" />
    </div>
    <div class="content">
      <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
      <p class="subtitle"></p>
      <div class="options">
        <div class="option-wrapper" v-for="(option, op) in options" :key="op">
          <button
            :class="option.type === type ? 'btnSelected' : ''"
            @click="type = option.type"
            :disabled="op === 1"
          >
            <div>
              <img :src="option.img" :alt="option.text" />
            </div>
            <span class="text body-l-sb">{{ option.text }}</span>
            <span class="description body-m-sb">{{ option.description }}</span>
          </button>
          <span v-if="op === 1" class="pill">{{ t(module + ".cards.card2.text2") }}</span>
        </div>
      </div>
    </div>
    <div class="actions">
      <u-button
        size="xl"
        :text="t(button + '.next')"
        @action-btn="
          (wizardStore.step = getPosByType(type)),
            (wizardStore.oldStep = 1),
            (wizardStore.type = type),
            wizardStore.cleanOrganization()
        "
        style="width: 280px"
        :disabled="!type"
      ></u-button>
    </div>
  </div>
</template>

<style scoped>
span,
label,
p,
h2,
button {
  font-family: Nunito;
}
.containerPage__card {
  width: 820px;
  height: 85vh;
  max-height: 780px;
  min-height: 690px;

  padding: 48px 24px;
  box-sizing: border-box;
  border-radius: 24px;
  gap: 10px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  animation: section 0.8s ease-in;
}
@keyframes section {
  0%,
  5% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.logo {
  display: flex;
  justify-content: center;
  align-items: center;
}
.logo .img {
  height: 28px;
  width: 28px;
}
.logo .text {
  height: 24px;
  width: 124px;
}
.title {
  color: var(--neutral-text-body);
  text-align: center;
  margin: 10px 0 5px;
}
.subtitle {
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  text-align: left;
  color: var(--neutral-text-caption);
  text-align: center;
}
.options {
  display: flex;
  gap: 25px;
  margin: 30px 0;
}
.option-wrapper {
  position: relative;
  width: 230px;
}
.options button {
  height: 286px;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 15px 25px 15px;
  box-shadow: var(--elevation-xs);
  transition: 0.3s;
}
.options button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.options button div {
  width: 100%;
  height: 165px;
  overflow: hidden;
  transition: 0.3s;
  z-index: 2;
}
.options button div img {
  width: 100%;
  height: 165px;
  transition: 0.3s;
  transform: scale(1);
  z-index: 2;
}
.options button .text {
  color: var(--neutral-text-body);
  text-align: center;
  margin: 15px 0 5px;
  transition: 0.3s;
  z-index: 2;
}
.options button .description {
  color: var(--neutral-text-caption);
  text-align: center;
  z-index: 2;
}
.options button:not(:disabled):not(.btnSelected):hover {
  box-shadow: var(--elevation-m) !important;
}
.btnSelected {
  box-shadow: var(--secondary-border-subtle) 0px 2px 16px 0px !important;
}
.options button:hover .text,
.btnSelected .text {
  color: var(--bg-primary-500) !important;
}
.options button:hover div img,
.btnSelected div img {
  transform: scale(1.2) !important;
}
.actions {
  width: 100%;
  display: flex;
  justify-content: center;
}

.pill {
  position: absolute;
  top: 21px;
  right: 14px;
  background: var(--secondary-surface-light);
  color: var(--secondary-text-darker);
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  z-index: 3;
  pointer-events: none;
}
</style>
