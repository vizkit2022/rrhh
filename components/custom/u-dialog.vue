<script setup>
  import { computed, defineProps, defineEmits, watch } from "vue";

  // Define props
  const props = defineProps({
    showModal: {
      type: Boolean,
      default: false,
    },
    lockModal: {
      type: Boolean,
      default: false,
    },
    position: {
      type: String,
      default: "center", // center, left, right
    },
    width: {
      type: String,
      default: "500px", // px, vw
    },
    height: {
      type: String,
      default: "500px", // px, vh
    },
    maxWidth: {
      type: String,
      default: "", // px, vw
    },
    maxHeight: {
      type: String,
      default: "", // px, vh
    },
    minWidth: {
      type: String,
      default: "", // px, vw
    },
    minHeight: {
      type: String,
      default: "", // px, vh
    },
    padding: {
      type: String,
      default: "40px",
    },
    fullScreen: {
      type: Boolean,
      default: false,
    },
    persistent: {
      type: Boolean,
      default: false,
    },
  });

  // Define variables
  const showDialog = ref(false);
  const show = ref(false);
  const emit = defineEmits(["closeModal"]);
  const isShaking = ref(false); // New: State to trigger the shake animation

  // Define watch
  watch(
    () => props.showModal,
    (newVal) => {
      if (newVal) {
        show.value = true;
        setTimeout(() => {
          showDialog.value = true;
        }, 100);
      } else {
        showDialog.value = false;
        setTimeout(() => {
          show.value = false;
        }, 300);
      }
    }
  );

  // Define computed properties
  const orientationModal = computed(() => {
    if (props.position === "center") return "justify-content: center;";
    if (props.position === "left") return "justify-content: flext-start;";
    return "justify-content: flex-end;";
  });

  const maxWidth = computed(() => {
    if(props.maxWidth === '') return props.width
    return props.maxWidth
  })

  const minWidth = computed(() => {
    if(props.minWidth === '') return props.width
    return props.minWidth
  })

  const maxHeight = computed(() => {
    if(props.maxHeight === '') return props.height
    return props.maxHeight
  })

  const minHeight = computed(() => {
    if(props.minHeight === '') return props.height
    return props.minHeight
  })

  // Define functions
  const closeModal = () => {
    if (!props.persistent) {
      showDialog.value = false;
      emit("closeModal");
    } else {
      triggerShake(); // Trigger shake animation if modal is persistent
    }
  };

  // New: Trigger shake animation
const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 500); // Shake animation lasts 500ms
};
</script>

<template>
  <div class="dialog" v-if="show" :style="orientationModal">
    <button
      class="dialog__close"
      @click="props.lockModal ? '' : closeModal()">
    </button>
    <div class="dialog__container" :class="[props.position, { shake: isShaking }]">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .dialog {
    position: absolute;
    height: 100vh;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 999;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .dialog__close {
    width: 100vw;
    height: 100vh;
    background-color: var(--neutral-background-shadow);
    position: absolute;
  }
  .dialog__container {
    min-width: 200px;
    min-height: 200px;
    position: relative;
    background-color: var(--neutral-background-default);
    box-shadow: var(--elevation-l);
    z-index: 1;
    transition: 0.3s;
    padding: v-bind("props.padding");
    box-sizing: border-box;
  }

  .center {
    width: v-bind("fullScreen ? '100vw' : props.width");
    max-width: v-bind("fullScreen ? '100vw' : maxWidth");
    min-width: v-bind("fullScreen ? '100vw' : minWidth");

    height: v-bind("fullScreen ? '100vh' : props.height");
    max-height: v-bind("fullScreen ? '100vh' : maxHeight");
    min-height: v-bind("fullScreen ? '100vh' : minHeight");

    transform: scale(v-bind("showDialog ? 1 : 0"));
    transform-origin: center;
    border-radius: v-bind("fullScreen ? '0' : '20px'");
  }
  .left {
    width: v-bind("fullScreen ? '100vw' : props.width");

    height: 100vh;
    transform-origin: left;
    border-radius: v-bind("fullScreen ? '0' : '0 20px 20px 0'");
    transform: translateX(
      v-bind("showDialog ? '0px' : fullScreen ? '-100vw' : '-'+props.width")
    );
  }

  .right {
    width: v-bind("fullScreen ? '100vw' : props.width");

    height: 100vh;
    transform-origin: right;
    border-radius: v-bind("fullScreen ? '0' : '20px 0 0 20px'");
    transform: translateX(
      v-bind(
        "showDialog ? ('100% -' + (fullScreen ? '100vw' : props.width)) : '100%'"
      )
    );
  }

  /* New: Shake animation */
.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  50% {
    transform: translateX(10px);
  }
  75% {
    transform: translateX(-10px);
  }
}

  @media only screen and (max-width: 768px) {
    .center,
    .left,
    .right {
      width: 100vw;
      height: 100vh;
      transform-origin: right;
      border-radius: 0;
      transform: translateX(v-bind("showDialog ? '100% - 100vw' : '100%'"));
    }
    .dialog__container {
      box-shadow: none;
      padding: 20px;
    }
  }
</style>
