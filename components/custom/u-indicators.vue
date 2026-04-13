<script setup>
  import { defineProps, ref, computed } from "vue";

  // Emits
  const emit = defineEmits(["selectedInd"]);

  // Define props
  const props = defineProps({
    indicators: {
      type: Array,
      default: () => [],
    },
    height: {
      type: Number,
      default: 82,
    },
    iconSize: {
      type: Number,
      default: 64,
    },
    widthGridIcon: {
      type: Number,
      default: 64,
    },
  });

  // Define variables
  const containerRef = ref(null);
  const indcatorArr = computed(() => {
    return props.indicators.map((ind, i) => {
      return {
        ...ind,
        pos: i,
        selected: ind.default || false,
      };
    });
  });
</script>

<template>
  <div class="containerIndicators" ref="containerRef">
    <template v-if="indicators.length">
      <u-indicator
        v-for="indicator in indcatorArr"
        :key="indicator.pos"
        :indicator="indicator"
        @selectedInd="(pos) => emit('selectedInd', pos)"
        :height="height"
        :iconSize="props.iconSize"
        :widthGridIcon="props.widthGridIcon"
      />
    </template>
    <div v-else class="withoutResults">
      <span>No se encontraron Métricas</span>
    </div>
  </div>
</template>

<style scoped>
  .containerIndicators {
    padding-inline: 3px;
    display: flex;
    align-items: center;
    gap: 20px;    
    width: 100%; /* Se cambio pq antes no se adaptaba al tamaño de la pantalla */
    /* width: calc(100vw - 60px - 40px); */
    overflow-x: scroll;
    transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .containerIndicators::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }

  .withoutResults {
    color: var(--bg-neutral-500);
    font-weight: 600;
    font-size: 16px;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media only screen and (max-width: 768px) {
    .containerIndicators {
      width: calc(100vw - 40px);
    }
  }
</style>
