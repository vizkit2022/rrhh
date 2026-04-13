<script setup>

const pos = ref(0);

function selectedOption (id) {
  pos.value = id;
}

</script>

<template>
<div class="configuration">
  <IncomesContainerConfigurationNav :posId="pos" @selectedOption="selectedOption" />
  <IncomesContainerConfigurationContent :posId="pos" />
</div>
</template>

<style scoped>
.configuration {
  display: grid;
  width: 100%;
  height: calc(100vh - 166px);
  border-radius: 24px;
  box-sizing: border-box;
  grid-template-columns: auto 1fr;
  gap: 10px;
  background-color: var(--neutral-background-default);
  padding: 24px;
  box-shadow: var(--elevation-l);
}


</style>