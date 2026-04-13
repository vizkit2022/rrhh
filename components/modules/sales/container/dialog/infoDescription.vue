<script setup>
import useGlobalStore from "@/stores/global";
import useSalesStore from "@/stores/sales";
import { useI18n } from "vue-i18n";

// PROPS
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

//STORE
const globalStore = useGlobalStore();
const salesStore = useSalesStore();

// I18N
const { t } = useI18n();
const module = "modules.sales.sale.detailsLongDescription";

// EMITS
const emit = defineEmits(["closeModal"]);

// PARAMS
const { params } = useRoute();
const idSalesDocument = params && params.id ? params.id : null;

// CONSTANTS
const temporalDescription = ref("");

// FUNTION
const save = async () => {
  const body = {
    lineId: props.data._id,
    longDescription: temporalDescription.value,
  };

  try {
    globalStore.loading = true;
    await salesStore.updatedSaleDocumentLineLongDescription(body);
    await salesStore.getSalesDocumentLinesByDocumentId(idSalesDocument);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};

onMounted(() => {
    console.log("data", props.data);
  temporalDescription.value = props.data.longDescription;
});
</script>

<template>
  <div class="container">
    <div class="container__header">
      <span class="body-l-s truncateText" style="color: var(--neutral-text-body);">{{ props.data?.referenceIncome?.name }}</span>
      <u-button-icon
        icon="close"
        type="outlined"
        size="s"
        color="--neutral-text-caption"
        @action-btn="emit('closeModal')"
        style="border-radius: 50%"
      />
    </div>
    <div class="container__body">
    <span class="body-s-sb" style="color: var(--neutral-text-body)">{{ t(`${module}.label`) }}</span>
      <u-textarea-html
        heightCustom="245px"
        v-model="temporalDescription"
        placeholder="Ingrese una descripción más detallada para incluirla en el documento"
        @change="save"
        :tooltips-config="{
          bold: true,
          italic: false,
          underline: true,
          strike: false,
          font: false,
          size: false,
          listOrdered: true,
          listBullet: true,
          align: false,
          link: false,
          image: false,
          clean: false,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 48px;
  width: 397px;
  height: 100%;
}

.container .container__header {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr 45px;
  width: 100%;
  height: 40px;
}

.container__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
}

</style>
