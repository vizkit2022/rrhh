<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import useLinesStore from "@/stores/lines";
import usePermissionsStore from "@/stores/permissions";
import useGrillaStore from "@/stores/grilla";

// Stores
const linesStore = useLinesStore();
const permissionsStore = usePermissionsStore();
const grillaStore = useGrillaStore();

// Contants
const { t } = useI18n();
const module = "grilla.dialogs.infoLine";

// Variables
const savePending = ref(false);

// Functions
const save = async () => {
  if (savePending.value) {
    return;
  }
  savePending.value = true;
  const data = await linesStore.putLine(linesStore.line);
  linesStore.lines[linesStore.line.pos] = data;
  savePending.value = false;
};

</script>

<template>
  <div class="containerDialog__form">
    <div class="containerDialog__form-group">
      <span>{{ t(module + ".label1") }}</span>
      <div style="height: 200px">
        <u-textarea-html
          v-model="linesStore.line.description.htmlText"
          :disabled="
            grillaStore.configModalInfoLine.loading ||
            !permissionsStore?.myPermissions?.income__grid_line_modify_name
          "
          heightCustom="200px"
          :placeholder="t(module + '.label1placeholder')"
          @change="save"
          :tooltipsConfig="{
            bold: true,
            italic: false,
            underline: true,
            strike: false,
            font: false,
            size: false,
            listOrdered: false,
            listBullet: true,
            align: false,
            link: true,
            image: false,
            clean: false,
          }"
        />
      </div>
    </div>
    <div class="containerDialog__form-group">
      <span>{{ t(module + ".label2") }}</span>
      <div style="height: 200px">
        <u-textarea
          v-model="linesStore.line.observation"
          :disabled="
            grillaStore.configModalInfoLine.loading ||
            !permissionsStore?.myPermissions?.income__grid_line_modify_name
          "
          :heightCustom="200"
          :placeholder="t(module + '.label2placeholder')"
          @change="save"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.containerDialog__form {
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.containerDialog__form-group {
  gap: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.containerDialog__form-group span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.containerDialog__form-group-x {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.containerDialog__form-group-x .label {
  font-size: 16px;
  line-height: 16px;
  font-weight: 600;
  color: var(--neutral-text-body);
}

.containerDialog__form-group-x .valMain {
  font-weight: 700;
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-body);
}

.containerDialog__form-groupDouble {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
}
</style>
