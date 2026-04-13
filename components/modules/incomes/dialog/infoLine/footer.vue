<script setup>
import { defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";

// Stores
const linesStore = useLinesStore();
const grillaStore = useGrillaStore();

// Emits
const emit = defineEmits(["update:change"]);

// Props
const props = defineProps({
  change: {
    type: Boolean,
    required: true
  }
});

// Contants
const { t } = useI18n();
const module = "grilla.dialogs.infoLine";

// Functions
const changeLine = async (state) => {
  // state true -> siguiente
  const index = grillaStore.configModalInfoLine.index;
  const newIndex = index + (state ? 1 : -1);

  if (index === -1) return;

  grillaStore.configModalInfoLine.data = linesStore.lines[newIndex];
  grillaStore.configModalInfoLine.index = newIndex;

  linesStore.line = grillaStore.configModalInfoLine.data;

  await updatedSwitchs();
  emit("update:change", false);
};

const updatedSwitchs = async () => {
  grillaStore.configModalInfoLine.loading = true;
  linesStore.switches = [];
  for (let i = 0; i < linesStore.linesSurcharges.length; i++) {
    if (
      linesStore.line.surchargesLines.includes(
        linesStore.linesSurcharges[i]._id,
      )
    ) {
      linesStore.switches.push(true);
    } else {
      linesStore.switches.push(false);
    }
  }
  await linesStore.calculateTotalLine();
  if (props.change) {
    await linesStore.getAllLinesIncomes();
  }
  grillaStore.configModalInfoLine.loading = false;
};
</script>

<template>
  <div class="infoLine__footer">
    <u-button
      :text="t(module + (grillaStore.configModalInfoLine.loading ? '.load' : '.btn1'))"
      :title="t(module + '.btn1tooltip')"
      size="s"
      icon="chevron-up"
      :disabled="grillaStore.configModalInfoLine.loading || grillaStore.configModalInfoLine.index === 0"
      @click="changeLine(false)"
    />
    <u-button
      :text="t(module + (grillaStore.configModalInfoLine.loading ? '.load' : '.btn2'))"
      :title="t(module + '.btn2tooltip')"
      size="s"
      icon="chevron-down"
      :disabled="
        grillaStore.configModalInfoLine.loading ||
        linesStore.lines.length - 1 === grillaStore.configModalInfoLine.index
      "
      @click="changeLine(true)"
    />
  </div>
</template>

<style scoped>
.infoLine__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
