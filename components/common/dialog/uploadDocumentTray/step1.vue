<script setup>
import useDocumentTrayStore from "@/stores/documentTray";

// Stores
const documentTrayStore = useDocumentTrayStore();

//EMITS
const emit = defineEmits(["closeModal", "changeStep",]);

// FUNCTIONS
const saveFilesStore = (files) => {
    console.log(files);
    documentTrayStore.forms.updaloadDocument.files = files;
}

const nextStep = () => {
    emit('changeStep', true);
}

</script>

<template>
    <div class="container_step1">
        <div class="header">
            <span class="body-l-sb">Subir Documentos</span>
            <u-button-icon icon="u u-close" type="outlined" color="--neutral-text-caption" size="l" style="border-radius: 50%;" @click="emit('closeModal')"/>
        </div>

        <div class="body">
            <ComponentsFileDropZone :model-value="documentTrayStore.forms.updaloadDocument.files" @update:modelValue="saveFilesStore" />
            <span class="body-m-r">Formatos soportados: JPG, PNG, PDF (máx. 10 MB))</span>
        </div>

        <div class="actions">
            <u-button text="Subir archivo" icon="upload" @click="nextStep" :disabled="documentTrayStore.forms.updaloadDocument.files.length === 0" />
        </div>

    </div>
</template>

<style scoped>
.container_step1 {
    display: grid;
    grid-template-rows: 40px 1fr 36px;
    gap: 24px;
    height: 650px;
    width: 679px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
}

.header span {
    color: var(--neutral-text-body);
}

.body {
    display: grid;
    grid-template-rows: 400px 18px;
    gap: 24px;
    height: 100%;
    width: 100%;
}

.body > span {
    width: 100%;
    text-align: center;
    color: var(--neutral-text-caption);
}

.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 36px;
    width: 100%;
}

</style>