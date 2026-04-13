<script setup>
import configTable from "@/utils/configTables/sales.json";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useSalesStore from "@/stores/sales";
import { formatNormalDate, transformedDate } from "@/utils/helpers";
import { formatMaskNumber } from "@/utils/formatNumbers";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales";
const { locale } = useI18n();

// state
const globalStore = useGlobalStore();
const salesStore = useSalesStore();
const organizationStore = useOrganizationStore();

//const
// const arraySales = [
//   {
//     id: 1,
//     selected: false,
//     typeDocument: "FE",
//     numberDoc: 123,
//     dateEmission: "2023-01-01",
//     reference: "Diferencia Tipo de Cambio",
//     client: "Cliente 1",
//     origin: {
//       name: "Varios Negocios",
//       name2: "Varios Proyectos",
//     },
//     status: "Emit",
//     invoiced: "$ 1,000.00",
//     charged: "$ 1,000.00",
//     balance: "$ 1,000.00",
//   },
// ];

// computed

// computada para ociultar columnas de siiStatus para países que no son Chile
const filterConfigTableSales = computed(() => {
  const config = JSON.parse(JSON.stringify(configTable.sales));
  // Ocultar columnas de Estado SII para países que no son Chile
  config.cols = !["CL"].includes(organizationStore.organization.country.code)
    ? config.cols.filter((col) => !["siiStatus"].includes(col.prop.text))
    : config.cols;

  return config;
});

const getTextOrigin = (item) => {
  const lines = item?.item?.lines ?? [];

  if (lines.length === 1) {
    return {
      textBusiness: lines[0].referenceIncome.name,
      textProject: lines[0].referenceIncome.project.name,
    };
  }

  return {
    textBusiness: t(`${module}.table.origin.textBusiness`),
    textProject: t(`${module}.table.origin.textProject`),
  };
};

// function
const getTextCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "DB",
        en: "DB",
      };
    case "debit":
      return {
        es: "ND",
        en: "DN",
      };
    case "credit":
      return {
        es: "NC",
        en: "CN",
      };
  }
};

const getColorTypeCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        background: "--info-surface-shadow-12a",
        color: "--info-text-darker",
      };
    case "debit":
      return {
        background: "--secondary-surface-shadow-12a",
        color: "--secondary-surface-darker",
      };
    case "credit":
      return {
        background: "--warning-surface-shadow-12a",
        color: "--warning-text-darker",
      };
  }
};

const getColorStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        background: "--info-surface-shadow-12a",
        color: "--info-text-darker",
      };
    case "voided":
      return {
        background: "--danger-surface-shadow-12a",
        color: "--danger-text-darker",
      };
    case "settled":
      return {
        background: "--success-surface-shadow-12a",
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
  }
};

const redirectToBusiness = (item) => {
  console.log("item", item);
  const URL_BUSINESS = `/incomesv2/project/${item?.item?.lines[0]?.referenceIncome?.project?._id}/income/${item?.item?.lines[0]?.referenceIncome?._id}`;
  navigateTo(URL_BUSINESS, { external: true, open: { target: "_blank" } });
};

const redirectToProject = (projectId) => {
  //  navigateTo(`/incomes/project/${item?.item?.lines[0]?.projectId}`, { external: true, open: { target: "_blank" } })
  const URl_PROJECT = `/incomes/project/${projectId}`;
  navigateTo(URl_PROJECT, {
    external: true,
    open: { target: "_blank" },
  });
};

const actionTable = (obj) => {
  const { emit, data, pos, event } = obj;

  const emits = {
    goToDetailsDocument: () => {
      const code = data?.salesDocumentType?.code;

      // Guardar el estado de forma dinámica
      // invoice, debit, credit
      salesStore.saleDocumentType = code;

      // Redirigir
      navigateTo(`/salesDocuments/${data._id}`);
    },
    dialogDetailsDocument: () => {
      salesStore.dialogSalesDocuments.showDetails = true;
      salesStore.detailsSaleDocument = {
        ...data,
        ...salesStore.detailsSaleDocument,
      };
    },
  };
  emits[emit]();
};
</script>

<template>
  <TableBasic
    :configTable="filterConfigTableSales"
    :content="salesStore.sales"
    @actionTable="actionTable"
    :loading="salesStore.loadings.sales"
  >
    <template v-slot:numberDoc="item">
      <u-tags
        :title="`${
          item?.item?.salesDocumentType?.tag ||
          item?.item?.salesDocumentType?.name ||
          '-'
        } - ${item?.item?.number}`"
        :text="`${
          item?.item?.salesDocumentType?.tag ||
          getTextCode(item?.item?.salesDocumentType?.code)[globalStore.lang] ||
          '-'
        } -  ${item?.item?.number ? formatMaskNumber(item.item.number) : ''}`"
        size="xs"
        :alignCenterText="true"
        :background="
          getColorTypeCode(item?.item?.salesDocumentType?.code).background
        "
        :color="getColorTypeCode(item?.item?.salesDocumentType?.code).color"
        maxWidth="90px"
        :delete="false"
      />
    </template>

    <template v-slot:dateEmission="item">
      <span class="body-m-sb" style="color: var(--neutral-text-body)">{{
        transformedDate(item?.item?.issueDate)
      }}</span>
    </template>

    <template v-slot:reference="item">
      <span
        :title="item?.item?.reference"
        class="body-m-sb truncateText"
        style="color: var(--neutral-text-body)"
        >{{ item?.item?.reference }}</span
      >
    </template>

    <template v-slot:client="item">
      <div class="truncateText clientContainer">
        <u-avatar
          :user="{
            name: item?.item?.client?.data?.legalName,
            src: item?.item?.client?.imgUrl,
          }"
          :size="32"
        />
        <div class="truncateText clientText">
          <span
            :title="item?.item?.client?.data?.legalName"
            class="truncateText body-m-sb"
            >{{ item?.item?.client?.data?.legalName }}</span
          >
        </div>
      </div>
    </template>

    <template v-slot:origin="item">
      <div class="origin">
        <!-- Si solo tiene un negocio/proyecto -->
        <template v-if="item?.item?.lines?.length === 1">
          <!-- Negocio -->
          <a
            class="origin-link body-m-sb truncateText origin__text--body"
            @click="redirectToBusiness(item)"
            target="_blank"
          >
            <span
              :title="getTextOrigin(item)?.textBusiness"
              class="truncateText"
            >
              {{ getTextOrigin(item)?.textBusiness }}
            </span>
          </a>

          <!-- Proyecto -->
          <a
            class="origin-link-project origin__project truncateText"
            @click="
              redirectToProject(
                item?.item?.lines[0]?.referenceIncome?.project?._id,
              )
            "
            target="_blank"
          >
            <span class="u u-open"></span>
            <span class="truncateText boyd-m-r">
              <span
                :title="getTextOrigin(item)?.textProject"
                class="truncateText"
              >
                {{ getTextOrigin(item)?.textProject }}
              </span>
            </span>
          </a>
        </template>

        <!-- Si son varios -->
        <template v-else>
          <span class="truncateText body-m-sb origin__text--body">
            {{ getTextOrigin(item)?.textBusiness }}
          </span>
          <div class="truncateText origin__project">
            <span class="truncateText boyd-m-r origin__text--caption">
              {{ getTextOrigin(item)?.textProject }}
            </span>
          </div>
        </template>
      </div>
    </template>

    <template v-slot:status="item">
      <!-- <span :class="`status ${item?.item?.status}`">{{ item.item.status }}</span> -->
      <u-tags
        :text="getTextStatus(item?.item?.status)[globalStore.lang]"
        :color="getColorStatus(item?.item?.status).color"
        :background="getColorStatus(item?.item?.status).background"
        size="xs"
        :delete="false"
        style="margin: 0 auto"
      />
    </template>

    <template v-slot:siiStatus="item">
      <SalesComponentsStatus
        typeStatus="sii"
        :data="item?.item?.invoicingInformationCL"
        :idSale="item?.item?._id"
      />
    </template>

    <template v-slot:invoiced="item">
      <span
        :title="item?.item?.numbers?.total?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.total?.value }}</span
      >
    </template>

    <template v-slot:invoicedCorrected="item">
      <span
        :title="item?.item?.numbers?.totalPostCreditAndDebit?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.totalPostCreditAndDebit?.value }}</span
      >
    </template>

    <template v-slot:charged="item">
      <span
        :title="item?.item?.numbers?.charged?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.charged?.value || "$ 0" }}</span
      >
    </template>

    <template v-slot:refund="item">
      <span
        :title="item?.item?.numbers?.refunded?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.refunded?.value || "$ 0" }}</span
      >
    </template>

    <template v-slot:balance="item">
      <span
        :title="item?.item?.numbers?.balance?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.balance?.value || "$ 0" }}</span
      >
    </template>

    <template v-slot:toBeCharged="item">
      <span
        :title="item?.item?.numbers?.unCharged?.value"
        class="truncateText body-m-sb textNumber"
        >{{ item?.item?.numbers?.unCharged?.value || "$ 0" }}</span
      >
    </template>
  </TableBasic>
</template>

<style scoped>
.origin {
  display: grid;
  gap: 2px;
  text-align: start;
  align-items: flex-start;
  justify-content: center;
}

.origin__text--body {
  color: var(--neutral-text-body);
}

.origin__text--caption {
  color: var(--neutral-text-caption);
}

.origin-link,
.origin-link-project {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  cursor: pointer;
  width: auto;
  max-width: max-content;
  transition: color 0.3s ease;
}

.origin-link {
  color: var(--neutral-text-body);
}

.origin-link-project {
  color: var(--neutral-text-caption);
}

.origin-link-project:hover,
.origin-link-project:hover .u-open {
  color: var(--primary-text-subtle);
}

.origin-link-project:hover ~ .origin-link,
.origin-link-project:hover ~ .origin-link span {
  color: var(--primary-text-subtle);
}

.origin-link:hover {
  color: var(--primary-text-subtle);
}
.origin-link:hover span {
  color: var(--primary-text-subtle);
}

.origin-link-project:hover span {
  color: var(--primary-text-subtle);
}

.clientContainer {
  display: grid;
  grid-template-columns: 32px auto;
  align-items: center;
  gap: 8px;
}

.clientText {
  color: var(--neutral-text-body);
  text-align: start;
}

.textNumber {
  margin: 0 0 0 auto;
  justify-content: flex-end;
  align-items: center;
  color: var(--neutral-text-body);
}
</style>
