<script setup>
import { computed } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Computed
const colors = computed(() => ({
  primary: "#3ac7a5",
  primary_hover: "#61e1c5",
  caption: globalStore.isDark ? "#d6dae1" : "#98a2b3",
  body: globalStore.isDark ? "#f3f4f6" : "#545f72",
  backgroundCard: globalStore.isDark ? "#323D47" : "##ffffff",
  backgroundPage: globalStore.isDark ? "#1e272e" : "#f3f4f6",
  elevation_l: globalStore.isDark
    ? "0px 40px 80px -16px rgba(12, 12, 12, 0.40), 0px 2px 4px 0px rgba(75, 75, 75, 0.16);"
    : "0px 40px 80px -16px rgba(56, 64, 76, 0.16), 0px 2px 4px 0px rgba(56, 64, 76, 0.04)",
}));
const labels = computed(() => {
  if (globalStore.lang === "es") {
    return {
      title: "Tuvimos un problema al intentar completar tu solicitud",
      subtitle:
        "Algo no salió como esperábamos. Por favor, intenta nuevamente en un momento.",
      button: "Volver a intentar",
    };
  }
  return {
    title: "We had a problem trying to complete your request",
    subtitle: "Something didn’t go as expected. Please try again in a moment.",
    button: "Try again",
  };
});
</script>

<template>
  <div class="pageError">
    <div class="pageError__box">
      <img src="./public/img/error_tv.gif" alt="error UNABASE" />
      <img src="./public/img/error_girls.svg" alt="error UNABASE" />
      <h2>{{ labels.title }}</h2>
      <span>{{ labels.subtitle }}</span>
      <button @click="navigateTo('/incomes')">
        <span class="u u-change"></span>
        <span>{{ labels.button }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pageError {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-content: center;
  background-color: v-bind("colors.backgroundPage");
}

.pageError__box {
  display: flex;
  padding: 48px;
  gap: 48px;
  box-sizing: border-box;
  border-radius: 24px;
  box-shadow: v-bind("colors.elevation_l");
  flex-direction: column;
  align-items: center;
  background-color: v-bind("colors.backgroundCard");
}

.pageError__box img:nth-child(1) {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 375px;
  margin-left: -40px;
  margin-top: 12px;
  position: absolute;
  z-index: 0;
}
.pageError__box img:nth-child(2) {
  object-fit: cover;
  width: 700px;
  height: auto;
  z-index: 1;
}
.pageError__box h2 {
  font-weight: 600;
  font-size: 28px;
  line-height: 28px;
  letter-spacing: 0%;
  vertical-align: middle;
  text-align: center;
  color: v-bind("colors.body");
}
.pageError__box span {
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  text-align: center;
  color: v-bind("colors.caption");
}
.pageError__box button {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  gap: 12px;
  border-radius: 14px;
  border: 1px solid v-bind("colors.primary");
}
.pageError__box button:hover {
  border: 1px solid v-bind("colors.primary_hover") !important;
}
.pageError__box button:hover span {
  color: v-bind("colors.primary_hover") !important;
}
.pageError__box button span {
  font-weight: 400;
  transition: 0.3s;
}
.pageError__box button span:not(.u) {
  font-size: 18px;
  line-height: 18px;
  color: v-bind("colors.primary");
}
.pageError__box button span.u {
  font-size: 20px;
  line-height: 20px;
  color: v-bind("colors.primary");
}
@media only screen and (max-width: 840px) {
  .pageError__box {
    gap: 20px;
    box-shadow: none;
    background-color: v-bind("colors.backgroundPage");
  }
  .pageError__box img:nth-child(1) {
    width: 220px;
    margin-left: -20px;
    margin-top: 6px;
  }
  .pageError__box img:nth-child(2) {
    width: 400px;
  }
  .pageError__box h2 {
    font-size: 20px;
    line-height: 28px;
    margin-top: 20px;
  }
  .pageError__box span {
    font-size: 12px;
    line-height: 12px;
  }
}
@media only screen and (max-width: 480px) {
  .pageError__box img:nth-child(1) {
    width: 170px;
  }
  .pageError__box img:nth-child(2) {
    width: 320px;
  }
}
</style>
