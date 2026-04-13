<script setup>

const props = defineProps({
    posId: {
        type: Number,
    }
})

</script>

<template>
    <div class="configurationContent">
     <!-- vieja vista globals para cambios  -->
    <!-- <IncomesContainerConfigurationVariablesGlobals v-if="props.posId === 0" /> -->
    <!-- nueva vista globals para cambios  -->
    <IncomesContainerConfigurationVariablesGlobals v-if="props.posId === 0" />

    <IncomesContainerConfigurationVariablesUnits v-if="props.posId === 1" />
    <IncomesContainerConfigurationVariablesCoins v-if="props.posId === 2" />
    </div>
</template>

<style scoped>
.configurationContent {
    display: flex;
    padding: 0px 24px;
    width: 100%;
    overflow-x: auto;
}

</style>