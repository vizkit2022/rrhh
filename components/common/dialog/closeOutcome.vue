<script setup>
import { defineEmits, ref, defineProps } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeModal", "refresh"]);

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
})

// Constants
const img = `/img/locked_${globalStore.isDark ? "dark" : "light"}.gif`;
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.closeOpen"

// Variables
const select = ref(false);

// Functions
const close = async () => {
  try {
    globalStore.loading = true;
    let body = {};
    if(Object.keys(props.config).length) {
      body = {
        outcomesIds: props.config.ids,
        closed: props.config.closed,
      };
    } else {
      body = {
        outcomesIds: outcomesStore.outcomes
          ?.filter((outcome) => outcome.selected)
          .map((o) => o._id),
        closed: true,
      };
    }
    await outcomesStore.closedOutcome(body);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    emit("refresh");
    emit("closeModal");
  }
};

const texts = computed(() => {
  if(Object.keys(props.config).length) {
    if(props.config.closed) {
      return {
        title: t(module + '.titles.text1'),
        subText: t(module + '.texts.text1')
      }
    } else {
      // Textos para abir
      return {
        title: t(module + '.titles.text2'),
        subText: t(module + '.texts.text2')
      }
    }
  } else {
    // Quiero cerrar seleccionados
    if(outcomesStore.outcomes?.filter((outcome) => outcome.selected).map((o) => o._id).length === 1) {
      // cerrar uno
      return {
        title: t(module + '.titles.text3'),
        subText: t(module + '.texts.text3')
      }
    } else {
      // cerrar varios
      return {
        title: t(module + '.titles.text4'),
        subText: t(module + '.texts.text4')
      }
    }
  }
})
</script>

<template>
  <div class="closeOpenLines">
    <div class="closeOpenLines__body">
      <img :src="img" alt="gif">
      <span class="title">{{ texts.title }}</span>
      <div class="text">
        <span class="u u-danger-outlined"></span>
        <span>{{ texts.subText }}</span>
      </div>
      <div class="text">
        <u-checkbox :height="16" />
        <span class="subText">{{ t(module + '.extra') }}</span>
      </div>
    </div>
    <div class="closeOpenLines__actions">
      <u-button
        text="Cancelar"
        type="outlined"
        size="s"
        @click="emit('closeModal')"
      />
      <u-button text="Cerrar" size="s" @click="close" />
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
