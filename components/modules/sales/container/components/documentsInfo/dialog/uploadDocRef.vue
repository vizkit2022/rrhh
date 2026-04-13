<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

//STORES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// I18N
const { t } = useI18n();
const module = "modules.sales.sale.tabs.tab5.information.groups[1]";

// EMITS
const emit = defineEmits(["closeModal", "reloadData"]);


const createDocRef = ref(null);

//FUNCTIONS
const uploadDocRef = async () => {
  globalStore.loading = true;
  const formData = new FormData();

  const documents = salesStore.formDocInvoice.formRegister.documentReferences;

  documents.forEach((docRef, index) => {
    
    const json = {
      salesDocumentId: salesStore?.sale?.salesDoc?._id,
      SalesDocumentType: docRef.typeDocument.id || "",
      number: docRef.numberDocument || "",
      amount: docRef.amountDocument.total || {},
      date: new Date(docRef.dateDocument).toISOString().slice(0, 10)
    };

    formData.append(`documents[${index}][data]`, JSON.stringify(json));

    if (docRef.fileDocument instanceof File) {
      formData.append(`documents[${index}][file]`, docRef.fileDocument);
    }
  });

  await salesStore.createDocReferenceSalesDocument(formData);
  emit('closeModal');
  emit('reloadData');
  globalStore.loading = false;
};


</script>

<template>
  <div class="container">
      <div class="container_header">
        <u-button-icon
          icon="close"
          type="outlined"
          size="s"
          color="--neutral-text-caption"
          @action-btn="emit('closeModal')"
          style="border-radius: 50%"
        />
      </div>
      <ComponentsCreateDocReference ref="createDocRef" />
      <div class="container_actions">
        <u-button v-if="createDocRef?.docReferenceView === 'form'" :text="t(module + '.buttons.addDocument')" type="outlined" icon="file-text" :disabled="!createDocRef?.isDocReferenceFormFilled" @click="createDocRef?.addDocReference" />
        <u-button v-else :text="t(module + '.buttons.upload')" type="outlined" icon="upload" :disabled="false" @click="uploadDocRef" />
      </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.container .container_header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.container .container_actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}
</style>
