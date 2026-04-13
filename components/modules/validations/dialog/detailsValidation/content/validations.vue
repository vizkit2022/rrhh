<script setup>

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
</script>

<template>
    <div class="content__validations">
        
        <div class="header">
            <span>Validador</span>
            <span>Estado</span>
        </div>

        <ValidationsComponentsValidatorHorizontal :avatars="data.validationRule?.avatars" :type="data.validationRule?.type"  />


    </div>
</template>

<style scoped>  

.content__validations {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  padding: 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 14px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: auto;
    padding: 11px 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--neutral-border-subtle);
}

.header span {
    font-size: 14px;
    font-weight: 600;
    line-height: 16px;
    color: var(--neutral-text-caption);
}


</style>