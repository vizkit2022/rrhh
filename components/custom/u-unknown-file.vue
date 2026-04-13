<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: "-"
  }
});
</script>

<template>
  <div class="main">
    <svg width="33" height="40" viewBox="0 0 33 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3">
          <path opacity="0.3" d="M23.0874 8.20668C22.1891 8.2058 21.3279 7.84344 20.6927 7.19913C20.0576 6.55482 19.7003 5.6812 19.6995 4.77001V0H4.56056C3.38793 0 2.26334 0.47253 1.43416 1.31363C0.604988 2.15473 0.13916 3.29551 0.13916 4.48501V31.5217C0.140902 32.7101 0.607493 33.8491 1.43648 34.6888C2.26546 35.5285 3.38907 36.0001 4.56056 36.0001H22.7342C23.9059 36.0001 25.0298 35.5282 25.8588 34.6882C26.6878 33.8482 27.1542 32.7087 27.1555 31.5201V8.20668H23.0874Z"
          fill="#20A789"
          />
      </g>
      <path
          d="M27.1555 8.20668H23.0874C22.1891 8.2058 21.3279 7.84344 20.6927 7.19913C20.0576 6.55482 19.7003 5.6812 19.6995 4.77001V0L27.1555 8.20668Z"
          fill="#20A789"
      />
      <!-- <path
          d="M30.3612 28.4333H9.81669C8.35937 28.4333 7.17798 29.6317 7.17798 31.11V37.3234C7.17798 38.8016 8.35937 40 9.81669 40H30.3612C31.8185 40 32.9999 38.8016 32.9999 37.3234V31.11C32.9999 29.6317 31.8185 28.4333 30.3612 28.4333Z"
          fill="#20A789"
      /> -->
      <path d="M9.1266 15.6997H6.86743V17.9914H9.1266V15.6997Z" fill="#20A789" />
      <path d="M13.6466 15.6997H11.3875V17.9914H13.6466V15.6997Z" fill="#20A789" />
      <path d="M18.1681 15.6997H15.9089V17.9914H18.1681V15.6997Z" fill="#20A789" />
    </svg>
    <div class="textSvg truncateText"><span v-text="'.' + props.text.slice(0, 4)" ></span></div>
  </div>
</template>

<style scoped>
.main {
  position: relative;
}
.textSvg {
  background-color: #20A789;
  width: 26px;
  height: 12px;
  border-radius: 3px;
  position: absolute;
  bottom: 4px;
  right: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 1px;
}
.textSvg span {
  color: #fff;
  font-size: 7px;
  line-height: 7px;
  font-weight: 800;
  text-transform: uppercase;
}
</style>
