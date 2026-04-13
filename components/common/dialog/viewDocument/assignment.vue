<script setup>
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";

import { capitalizeName, debounce, transformedDate } from "@/utils/helpers";

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const paymentsStore = usePaymentsStore();

// Constants
const config = {
  header: {
    height: 40,
  },
  item: {
    height: 40,
  },
  cols: [
    {
      name: { es: "Codigo", en: "Code" },
      flex: "center",
      width: "102px",
      prop: { text: "referenceLine/referenceLine/code" },
      type: "text",
    },
    {
      name: { es: "Nombre", en: "Text" },
      flex: "left",
      width: "minmax(150px, 1fr)",
      prop: { text: "name" },
      type: "text",
    },
    {
      name: { es: "Origen", en: "TextDouble" },
      flex: "left",
      width: "minmax(150px, 1fr)",
      prop: {
        text: "referenceLine/referenceLine/income/name",
        subtext: "referenceLine/referenceLine/income/project/name",
      },
      type: "custom",
      slotName: "origin",
    },
    {
      name: {
        es: "Asignado neto",
        en: "To pay before tax",
      },
      flex: "right",
      width: "minmax(100px, 1fr)",
      show: true,
      prop: {
        text: "numbers/totalNet/value",
      },
      type: "currency",
      path: {
        route: "/outcomes/[id]",
        id: "_id",
      },
    },
    {
      name: {
        es: "Asignado bruto",
        en: "To pay after tax",
      },
      flex: "right",
      width: "minmax(100px, 1fr)",
      show: true,
      prop: {
        text: "numbers/total/value",
      },
      type: "currency",
      path: {
        route: "/outcomes/[id]",
        id: "_id",
      },
    },
  ],
};
</script>

<template>
  <div class="assignment">
    <TableBasic
      :configTable="config"
      :content="outcomesStore.document_active.lines"
    >
        <template v-slot:origin="item">
          <div class="cellOrigin">
            <span class="truncateText" :title="item?.item?.referenceLine?.referenceLine?.income?.name || '-'">{{ item?.item?.referenceLine?.referenceLine?.income?.name || "-" }}</span>  
            <span class="truncateText" :title="item?.item?.referenceLine?.referenceLine?.income?.project?.name || '-'">{{ item?.item?.referenceLine?.referenceLine?.income?.project?.name || "-" }}</span>
          </div>
        </template>
    </TableBasic>
  </div>
</template>

<style scoped>
.cellOrigin {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
  flex-direction: column;
}

.cellOrigin span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  width: 118px;
}

.cellOrigin span:nth-child(1) { color: var(--neutral-text-body); }
.cellOrigin span:nth-child(2) { color: var(--neutral-text-caption); }
</style>
