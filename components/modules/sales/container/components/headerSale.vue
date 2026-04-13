<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { hasProvidesNationalTaxAuthority } from "@/components/modules/sales/composables/useTaxAuthority";
import { useI18n } from "vue-i18n";

//STORES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

const { t } = useI18n();
const module = "modules.sales.sale";

//FUNTIONS

const handleVoidDocument = async () => {
  const idSaleDocumen = salesStore?.sale?.salesDoc?._id;

  const body = {
    salesId: [idSaleDocumen],
  };

  globalStore.loading = true;
  await salesStore.voidSalesDocuments(body);
  await salesStore.getSalesDocumentLinesByDocumentId(idSaleDocumen);
  globalStore.loading = false;
};

const getColorStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        background: "--info-surface-light",
        color: "--info-text-darker",
      };
    case "voided":
      return {
        background: "--danger-surface-light",
        color: "--danger-text-darker",
      };
    case "settled":
      return {
        background: "--success-surface-light",
        color: "--success-text-darker",
      };
    case "charged":
      return {
        background: "--primary-surface-shadow-12a",
        color: "--primary-text-default",
      };
  }
};

const getTextStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        es: "Emitido",
        en: "Emit",
      };
    case "voided":
      return {
        es: "Anulado",
        en: "Voided",
      };
    case "settled":
      return {
        es: "Saldada",
        en: "Settled",
      };
    case "charged":
      return {
        es: "Cobrado",
        en: "Charged",
      };
    default:
      return { es: "-", en: "-" }; // <--- valor por defecto
  }
};

const printPdfSII = async () => {
  try {
    globalStore.loading = true;
    const idSaleDocumen = salesStore?.sale?.salesDoc?._id;
    const resp = await salesStore.generarPDFSii(idSaleDocumen);

    if (resp?.url) {
      window.open(resp.url, "_blank");
    } else {
      console.error("No llegó una URL válida para el PDF:", resp);
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
  } finally {
    globalStore.loading = false;
  }
};

const printSalesDocuments = async () => {
  const body = {
    _id: salesStore?.sale?.salesDoc?._id,
    type: "saleDocument",
  };

  try {
    globalStore.loading = true;
    const resp = await salesStore.generarPDF(body);

    if (resp?.url) {
      window.open(resp.url, "_blank");
    } else {
      console.error("No llegó una URL válida para el PDF:", resp);
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
  } finally {
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="sales__page-header">
    <div class="sales__page-header-title">
      <div class="sales__page-header-title-text">
        <span>{{
          capitalizeName(
            salesStore?.sale?.salesDoc?.client?.data?.legalName || "",
          )
        }}</span>
        <span>•</span>
        <span>{{
          capitalizeName(salesStore?.sale?.salesDoc?.reference || "")
        }}</span>
      </div>
      <div class="sales__page-header-title-main">
        <span class="truncateText">{{
          salesStore?.sale?.salesDoc?.reference || "-"
        }}</span>
        <span>•</span>
        <span>{{ `N° ${salesStore?.sale?.salesDoc?.number || "-"}` }}</span>
        <!-- <u-button-icon icon="edit" type="text" size="s" class="editBtn" /> -->
      </div>
      <div class="sales__page-header-title-snippet">
        <div class="sales__page-header-title-snippet-client">
          <u-avatar
            :user="{
              src: salesStore?.sale?.salesDoc?.client?.imgUrl,
              name: salesStore?.sale?.salesDoc?.client?.data?.legalName,
            }"
            :size="24"
          />
          <span>{{ salesStore?.sale?.salesDoc?.client?.data?.legalName }}</span>
        </div>
        <!-- <u-tags
          size="s"
          text="prop tab"
          :delete="false"
        /> -->
        <u-tags
          :text="
            getTextStatus(salesStore?.sale?.salesDoc?.status || '')?.[
              globalStore?.lang
            ]
          "
          :color="
            getColorStatus(salesStore?.sale?.salesDoc?.status || '')?.color
          "
          :background="
            getColorStatus(salesStore?.sale?.salesDoc?.status || '')?.background
          "
          size="xs"
          :delete="false"
        />
        <SalesComponentsStatus
          v-if="['CL'].includes(organizationStore?.organization?.country?.code)"
          typeStatus="sii"
          :data="salesStore?.sale?.salesDoc?.invoicingInformationCL"
          :idSale="salesStore?.sale?.salesDoc?._id"
          :tooltipOffsetX="-23"
        />
      </div>
    </div>
    <div class="sales__page-header-actions">
      <div
        class="button-download"
        @click="printPdfSII"
        v-if="hasProvidesNationalTaxAuthority"
      >
        <span class="body-l-sb truncateText">PDF SII</span>
        <span class="u u-download"></span>
      </div>
      <div class="button-download" @click="printSalesDocuments">
        <span class="body-l-sb truncateText">PDF UNABASE</span>
        <span class="u u-download"></span>
      </div>
      <!-- <u-button-icon
        icon="download"
        type="outlined"
        size="s"
        color="--neutral-text-caption"
        @click="printSalesDocuments"
        :disabled="false"
      /> -->
      <!-- <u-button-icon
        icon="share"
        type="outlined"
        size="s"
        color="--neutral-text-caption"
        :disabled="true"
      /> -->
      <u-button
        :text="t(module + '.buttons.void')"
        icon="close"
        type="outlined"
        size="s"
        color="--neutral-surface-default"
        colorHover="--danger-surface-default"
        colorActive="--danger-surface-darker"
        :disabled="salesStore?.sale?.salesDoc?.status === 'voided'"
        @click="salesStore.dialogSalesDocuments.showVoid = true"
      />
      <u-button-icon
        icon="more"
        type="outlined"
        size="s"
        color="--neutral-text-caption"
        :disabled="true"
      />
    </div>
  </div>

  <dialog-cancel
    width="600px"
    height="auto"
    :title="t(module + '.modals.void.title')"
    :description="t(module + '.modals.void.description')"
    showInput="true"
    :confirmationText="t(module + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.void.confirmationText')"
    :actionModal="handleVoidDocument"
    :showModal="salesStore.dialogSalesDocuments.showVoid"
    @closeModal="salesStore.dialogSalesDocuments.showVoid = false"
  />
</template>

<style scoped>
.sales__page-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  width: 100%;
}

.sales__page-header-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.sales__page-header-title-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.sales__page-header-title-main button.editBtn {
  margin-left: 10px;
  transform: scale(0.8);
}

.sales__page-header-title-text span,
.sales__page-header-title-main span:nth-child(2) {
  font-weight: 400;
  font-size: 10px;
  line-height: 10px;
  letter-spacing: 10%;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}

.sales__page-header-title-text span:nth-child(2),
.sales__page-header-title-main span:nth-child(2) {
  margin: 0 8px;
  vertical-align: middle;
}

.sales__page-header-title-main span:nth-child(1) {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
  max-width: 350px;
}

.sales__page-header-title-main span:nth-child(3) {
  font-weight: 400;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--secondary-text-default);
}

.sales__page-header-title-snippet {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  height: 38px;
  gap: 12px;
}

.sales__page-header-title-snippet-client {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}

.sales__page-header-title-snippet span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.sales__page-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.sales__page-header-actions .button-download {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px 12px;
  color: var(--neutral-text-caption);
  border-radius: 6px;
  border: 1px solid var(--neutral-surface-default);
  transition: all 0.3s ease;
}

.sales__page-header-actions .button-download:hover {
  color: var(--primary-text-subtle);
  border: 1px solid var(--primary-border-subtle);
}

.btnMobile {
  display: none;
}

@media only screen and (max-width: 1200px) {
  .btnMobile {
    display: inline-flex;
  }
}
</style>
