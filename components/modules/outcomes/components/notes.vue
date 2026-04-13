<script setup>
import { ref, onUnmounted } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.information.groups[1].texts";
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;

// Vars
const loadings = ref({
  observation: false,
  internal: false,
});
const change = ref(false);

// Functions
const save = async (prop) => {
  if(outcomesStore.outcome.status !== 'voided') {
    try {
      change.value = true;
      let body = { ...outcomesStore.outcome };
      body[prop] = outcomesStore.outcome[prop];
      await outcomesStore.updateOutcome(body);
    } catch (error) {
      console.error(error);
    }
  }
};

// onUnMounted
onUnmounted(async () => {
  if(change.value) {
    await outcomesStore.get_outcomes(idOC);
  }
});

const noActions = computed(() => !["closed","voided"].includes(outcomesStore.outcome.status));
</script>

<template>
  <div class="notes">
    <div class="notes__box">
      <span class="label">{{ t(module + ".text1.label") }} <strong>{{ t(module + ".text1.text") }}</strong></span>
      <u-textarea-html
        v-model="outcomesStore.outcome.observation"
        :disabled="!noActions || loadings.observation"
        heightCustom="180px"
        @change="save('observation')"
      />
    </div>
    <div class="notes__box">
      <span class="label">{{ t(module + ".text2.label") }} <strong>{{ t(module + ".text2.text") }}</strong></span>
      <u-textarea-html
        v-model="outcomesStore.outcome.observationInternal"
        :disabled="!noActions || loadings.internal"
        heightCustom="180px"
        @change="save('observationInternal')"
      />
    </div>
  </div>
</template>

<style scoped>
.notes {
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.notes__box {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.notes__box .label {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 10%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.notes__box .label strong {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
