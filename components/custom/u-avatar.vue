<script setup>
import { defineProps, computed } from "vue";
import defaultImg from "/img/default-user.png";
const urlImg = defaultImg;

// Define props
const props = defineProps({
  user: {
    type: Object,
    default: () => ({}),
  },
  size: {
    type: Number,
    default: 10,
  },
  hover: {
    type: Boolean,
    default: false,
  },
});

const imgAvatar = computed(() => {
  if (props.user?.src) {
    const randomSRC = `${props.user.src}?randomImg=${Math.random()}`;
    return randomSRC;
  } else {
    return urlImg;
  }
});
</script>

<template>
  <div
    class="containerAvatar"
    :class="props.hover ? 'containerAvatarHover' : ''"
    :style="`width: ${props.size}px; height: ${props.size}px`"
  >
    <img
      :src="imgAvatar"
      :alt="props.user.name"
      class="containerAvatar__img"
    />
    <div
      v-if="props.hover"
      class="containerAvatar__hover"
      :style="`width: ${props.size}px; height: ${props.size}px`"
    ></div>
  </div>
</template>

<style scoped>
.containerAvatar {
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.containerAvatar__hover {
  top: 0;
  bottom: 0;
  border-radius: 50%;
  position: absolute;
  box-shadow: inset transparent 0px 0px 0px 2px;
  transition: box-shadow 0.3s;
  cursor: pointer;
}
.containerAvatar__hover:hover {
  box-shadow: inset var(--primary-border-light) 0px 0px 0px 2px;
}
.containerAvatar__img {
  width: 102%;
  height: 102%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  transform: scale(1);
  transition: transform 0.3s;
}
.containerAvatarHover:hover .containerAvatar__img {
  transform: scale(1.2);
}
</style>
