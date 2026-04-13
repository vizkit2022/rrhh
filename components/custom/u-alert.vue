<script setup>
import { defineProps, defineEmits, watch } from "vue";

// EMITS
const emit = defineEmits(["actionAlert"]);

// PROPS
const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
});

// Constants
const { t } = useI18n();

/// EXAMPLE
/*
  data = {
    msg: "Inf. General - Hay cambios sin guardar.",
    buttons: [ { type: "warning", text: "Guardar", icon: "change", action: "" }],
    type: "warning",
    close: true,
    show: true}
*/

// ACTIONS
const actionBtn = async (action) => {
  emit("actionAlert", action);
};

// Watch
watch(
  () => props.data,
  () => {
    if (props.data.show && props.data.autoClose && props.data.msg !== "") {
      const time = props.data.time  || 5000;
      setTimeout(() => {
        emit("actionAlert", "close");
      }, time);
    }
  }
);
</script>

<template>
  <div class="alertCustom">
    <span v-if="props?.data?.msg || props?.data?.translate" v-text="props?.data?.msg || t(props?.data?.translate + '.title') || 's'" class="msg"></span>
    <div class="buttons" v-if="props?.data?.buttons?.length">
      <button
        :class="`btnAlert ${btn.type}`"
        v-for="(btn, index) in props.data.buttons"
        :key="index"
        @click="actionBtn(btn.action)"
      >
        <span v-if="btn.icon" :class="`u u-${btn.icon}`"></span>
        <span v-text="btn.text || t(props?.data?.translate + '.buttons.' + btn.prop) || ''" class="text"></span>
      </button>
    </div>
    <button
      v-if="props?.data?.close"
      class="btnClose"
      @click="actionBtn('close')"
    >
      <span class="u u-close"></span>
    </button>
  </div>
</template>

<style scoped>
.alertCustom {
  display: flex;
  gap: 10px;
  height: 60px;
  align-items: center;
  padding: 0 25px;
  background-color: var(--neutral-surface-dark);
  border-radius: 30px;
  position: absolute;
  transform: scaleX(v-bind("props?.data?.show ? '1' : '0'"));
  transition: 0.3s transform, 0.5s opacity;
  opacity: v-bind("props?.data?.show ? 1 : 0");
  z-index: 10;
}

.buttons {
  display: flex;
  gap: 10px;
}

.buttons button.btnAlert {
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  display: flex;
  gap: 8px;
  align-items: center;
  transition: 1s;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.buttons button.btnAlert:before {
  position: absolute;
  content: "";
  top: -180px;
  left: 0;
  width: 30px;
  height: 100%;
  background-color: var(--white);
  animation: flash 10s ease-in-out infinite;
}

.buttons button span {
  font-family: Nunito;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  text-align: left;
  color: var(--bg-neutral-900);
}

.alertCustom span {
  color: var(--white);
  font-family: Nunito;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
  text-align: left;
}

.btnClose {
  height: 36px;
  display: flex;
  align-items: center;
  transform: scale(1);
}

.btnClose span {
  transition: 0.3s;
  color: var(--neutral-text-caption);
  font-size: 24px;
  line-height: 24px;
}

.btnClose:hover span {
  color: var(--neutral-text-caption);
}

.alertCustom button.success {
  background-color: var(--success-surface-default);
}
.alertCustom button.success:hover {
  background-color: var(--success-surface-darker);
}

.alertCustom button.info {
  background-color: var(--info-surface-subtle);
}
.alertCustom button.info:hover {
  background-color: var(--info-surface-darker);
}

.alertCustom button.danger {
  background-color: var(--danger-surface-subtle);
}
.alertCustom button.danger:hover {
  background-color: var(--danger-surface-darker);
}

.alertCustom button.warning {
  background-color: var(--warning-surface-subtle);
}
.alertCustom button.warning:hover {
  background-color: var(--warning-surface-darker);
}

.btnAlert span.text {
  font-family: Nunito;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
  text-align: left;
}
.btnAlert span.u {
  font-size: 20px;
  font-weight: 400;
  line-height: 24px;
  text-align: left;
}
</style>
