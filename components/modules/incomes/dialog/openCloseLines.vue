<script setup>
import useGlobalStore from "@/stores/global";
import useLinesStore from "@/stores/lines";
import useGrillaStore from "@/stores/grilla";

//STORE
const globalStore = useGlobalStore();
const linesStore = useLinesStore();
const grillaStore = useGrillaStore();

// EMIT
const emit = defineEmits(["closeModal","load"]);

// CONSTANTS
const { t } = useI18n();
const uiLabel = "ui.income.sections.lines.modals.openClose";
const type = grillaStore.configCloseOpen.type; // closePurchase, openPurchase, closeMovement, openMovement
const img = `/img/${type.includes("open") ? "shopping" : "locked"}_${globalStore.isDark ? "dark" : "light"}.gif`;
const all = grillaStore.configCloseOpen.all;

// FUNCTIONS

const handleCloseEsc = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(async () => {
  document.addEventListener("keydown", handleCloseEsc);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleCloseEsc);
});

const texts = computed(() => {
  let propTitle = "";
  let propText = "";
  let propBtn = "";

  // Para movimientos
  if(type.includes("Movement")) {
    const typeIncome = grillaStore.configCloseOpen.state;
    if(typeIncome === "budget") {
      propTitle = type.includes("open") ? "openMovementBudget" : "closeMovementBudget";
      propText = type.includes("open") ? "openMovementBudget" : "closeMovementBudget";
      propBtn = type.includes("open") ? "openMovementBudget" : "closeMovementBudget";
    }
    else {
      propTitle = type.includes("open") ? "openMovementBusiness" : "closeMovementBusiness";
      propText = type.includes("open") ? "openMovementBusiness" : "closeMovementBusiness";
      propBtn = type.includes("open") ? "openMovementBusiness" : "closeMovementBusiness";
    }
  } else {
    // Para Lineas
    // Abrir
    if(type.includes("open")) {
      propTitle = all ? "openPurchaseAll" : "openPurchaseSelected";
      propText = all ? "openPurchaseAll" : "openPurchaseSelected";
    } else {
      // Cerrar
      propTitle = all ? "closePurchaseAll" : "closePurchaseSelected";
      propText = all ? "closePurchaseAll" : "closePurchaseSelected";
    }
    propBtn = type.includes("open") ? "openPurchase" : "closePurchase";
  }
  return {
    title: t(uiLabel + '.title.' + propTitle),
    text: t(uiLabel + '.title.' + propText),
    subText: t(uiLabel + '.subText'),
    buttons: {
      cancel: t(uiLabel + '.buttons.cancel'),
      save: t(uiLabel + '.buttons.' + propBtn)
    }
  }
});

const save = async () => {
  try {
    globalStore.loading = true;

    if(type.includes("Movement")) {
      // Aqui es otro endpoint
    } else {
      const close = type.includes("close");
      await linesStore.toggleLinesStatus(close, all);
      emit("load");
    }

  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
}
</script>

<template>
  <div class="closeOpenLines">
    <div class="closeOpenLines__body">
      <img :src="img" alt="gif">
      <span class="title">{{ texts.title }}</span>
      <div class="text">
        <span class="u u-danger-outlined"></span>
        <span>{{ texts.text }}</span>
      </div>
      <div class="text">
        <u-checkbox :height="16" />
        <span class="subText">{{ texts.subText }}</span>
      </div>
    </div>
    <div class="closeOpenLines__actions">
      <u-button
        :text="texts.buttons.cancel"
        type="outlined"
        size="s"
        @click="emit('closeModal')"
      />
      <u-button :text="texts.buttons.save" size="s" @click="save" />
    </div>
  </div>
</template>

<style scoped>
.closeOpenLines {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 437px;
  height: 310px;
}

/* Body */
.closeOpenLines__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.closeOpenLines__body img {
  height: 84px;
  width: 84px;
  margin: 0 auto;
}

.closeOpenLines__body .title {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: center;
  color: var(--neutral-text-body);
}

.closeOpenLines__body .text {
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: 16px;
  align-items: center;
}

.closeOpenLines__body .text .u {
  font-size: 18px;
  font-weight: 400;
}

.closeOpenLines__body .text span {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.closeOpenLines__body .text .subText {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}

/* Actions */
.closeOpenLines__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.closeOpenLines__actions button {
  min-width: 150px;
}
</style>
