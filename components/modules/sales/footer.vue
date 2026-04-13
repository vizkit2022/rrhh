<script setup>
import useSalesStore from "@/stores/sales";

// Stores
const salesStore = useSalesStore();

</script>

<template>
    <div class="footer">
    <u-indicators-lite
      :indicators="salesStore.metrics"
      style="margin-top: auto; min-height: 60px"
    />
    </div>
</template>

<style scoped>
    .footer {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>