<script setup>
import  useSalesStore from "@/stores/sales";
import  useGlobalStore from "@/stores/global";

// STORE
const salesStore = useSalesStore();
const globalStore = useGlobalStore();  

// PROPS
const props = defineProps({
  idDocRef: {
    type: String,
    default: "",
  },
})

// EMIT
const emit = defineEmits(["closeModal", "reloadData"]);

const createDocRef = ref(null);

const saveEditDocRef = async () => {
  globalStore.loading = true;

  const formData = new FormData();

  const document = salesStore.formDocInvoice.formRegister.formDataDocReference;

    
    const json = {
      salesDocumentId: salesStore?.sale?.salesDoc?._id,
      SalesDocumentType: document.typeDocument.id || "",
      number: document.numberDocument || "",
      amount: document.amountDocument.total || {},
      date: new Date(document.dateDocument).toISOString().slice(0, 10)
    };

    formData.append(`documents[${0}][data]`, JSON.stringify(json));

    if (document.fileDocument instanceof File) {
      formData.append(`documents[${0}][file]`, document.fileDocument);
    }

  await salesStore.updateDocReferenceSalesDocument(props.idDocRef, formData);
  props.idDocRef = "";
  emit("reloadData");
  emit("closeModal");
  globalStore.loading = false;
}

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
      <ComponentsCreateDocReference ref="createDocRef" :edit-doc-reference="true" />
      <div class="container_actions">
        <u-button text="Editar Documento" type="outlined" icon="edit" :disabled="false" @click="saveEditDocRef" />
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
