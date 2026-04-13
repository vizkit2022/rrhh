<script setup>
import configTable from "@/utils/configTables/documentTray.json";
import useDocumentTrayStore from "@/stores/documentTray";
import { transformedDate } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

//  Translations I18n
const { t } = useI18n();
const module = "modules.documentsTray";

//STORE
const documentTrayStore = useDocumentTrayStore();

//CONSTANTS
const statusKeyMap = { 0: 'todos' , 1: 'coincidences', 2: 'pending', 3: 'missingInformation', 4: 'discarded' };

//COMPUTED
const filtersDocumentsTray = computed(() => {

    if (documentTrayStore.selectedIndicator === 0) {
        return documentTrayStore.documentsTray.docs;
    }

    return documentTrayStore.documentsTray.docs.filter((doc) => {
        return statusKeyMap[documentTrayStore.selectedIndicator] === doc.status;
    });
})

//FUNCTIONS
const getNameRelation = (relation) => {
    switch (relation) {
        case "pending":
            return t(`${module}.documentStatus.pending`)
        case "missingInformation":
            return t(`${module}.documentStatus.missingInformation`)
        case "discarded":
            return t(`${module}.documentStatus.discarded`)
        case "coincidences":
            return t(`${module}.documentStatus.coincidence`)
    }
}

const actionTable = (obj) => {
    const { emit, data, pos, event } = obj;

    const emits = {
        goToDetailsDocumentTray: () => {
            documentTrayStore.detailsDocumentTray = data;
            documentTrayStore.dialogs.showDetailsDocument = true;
            console.log("Mostrar detalles", documentTrayStore.detailsDocumentTray);
        }
    }

    emits[emit]();
}

//CYCLES
// onMounted(() => {
//     documentTrayStore.documentsTray = arrayDocumentTray
// })


</script>

<template>
    <TableBasic class="table" :content="filtersDocumentsTray" :configTable="configTable.documentTray" @actionTable="actionTable">

        <template #noData >
            <div class="noData">
                <span class="body-l-sb">{{ t(`${module}.table.noData`) }}</span>
                <div>
                    <img src="/img/lupa.svg" alt="lupa">
                    <u-button :text="t(`${module}.buttons.uploadDoc`)" icon="upload" type="outlined" @click="documentTrayStore.dialogs.showUploadDocument = true" />
                    <u-button :text="t(`${module}.buttons.SIIConnect`)" type="outlined" />  
                </div>
            </div>          
        </template>

        <template #date="item">
            <span class="textNeutral body-m-sb">{{ transformedDate(item.item.createdAt) }}</span>
        </template>

        <template #record="item">
            <!-- <img :src="item?.item?.creator?.user?.imgUrl" :alt="item?.item?.creator?.data?.legalName" /> -->
             <div class="record">
             <u-avatar :user="{ name: item?.item?.creator?.data?.legalName, src: item?.item?.creator?.user?.imgUrl }" :size="32" />
             </div>
        </template>

        <template #type="item">
            <u-tags size="xs" :text="item.item.documentType?.code || '-'" background="--neutral-surface-light" color="--neutral-text-caption" :delete="false" />
        </template>

        <template #number="item">
            <span class="textNeutral body-m-sb truncateText">{{ item.item.documentNumber || '-' }}</span>
        </template>

        <template #provider="item">
            <!-- <img :src="item?.item?.supplier?.src" :alt="item?.item?.supplier?.alt" /> -->
            <div class="provider truncateText">
                <u-avatar :user="{ name: item?.item?.supplier?.data?.legalName, src: item?.item?.supplier?.imgUrl }" :size="32" />
                <span class="truncateText textNeutral body-m-sb">{{ item?.item?.supplier?.data?.legalName || '-' }}</span>
            </div>
        </template>

        <template #reference="item">
            <span class="textNeutral body-m-sb">{{ item?.item?.reference }}</span>
        </template>

        <template #issueDate="item">
            <span class="textNeutral body-m-sb">{{ transformedDate(item?.item?.issueDate) || '-' }}</span>
        </template>

        <template #amount="item">
            <span class="amount textNeutral body-m-sb">{{ item?.item.numbers?.total?.value || '-' }}</span>
        </template>

        <template #relation="item">
            <div :class="`status ${item.item.status || ''}`">
                <span :class="`u u-${item.item.icon}`"></span>
                <span class="body-s-sb">{{ getNameRelation(item.item.status) }}</span>
            </div>            
        </template>

    </TableBasic>
</template>

<style scoped>

:deep(.notData) {
  height: 450px !important;
}

.noData {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  justify-content: center;
}

.noData span {
  color: var(--neutral-text-caption);
}

.noData > div:last-child {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.record {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 32px;
}

.provider {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: 8px;
    align-items: center;
}

.amount {
    display: flex;
    width: 100%;
    justify-content: flex-end;
}

.textNeutral {
  color: var(--neutral-text-body);
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: auto;
  padding: 4px 8px;
  margin: 0 auto;
  border-radius: 16px;
}

.status.pending {
    color: var(--warning-text-darker);
    background-color: var(--warning-surface-shadow-12a);
}

.status.missingInformation {
    color: var(--danger-text-darker);
    background-color: var(--danger-surface-shadow-12a);
}

.status.discarded {
    color: var(--neutral-text-caption);
    background-color: var(--neutral-surface-shadow-12a);

}

.status.coincidences {
    color: var(--info-text-darker);
    background-color: var(--info-surface-shadow-12a);
}

</style>