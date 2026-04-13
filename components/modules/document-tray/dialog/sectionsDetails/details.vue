<script setup>
import useDocumentTrayStore from "@/stores/documentTray";
import { formatCurrency } from "@/utils/formatAmount";

//Store
const documentTrayStore = useDocumentTrayStore();

//Contantes
const totalNumbers = documentTrayStore?.detailsDocumentTray?.numbers?.total;

//Computada
const numbersDetailsDocumentTray = computed(() => {
  const numbers = documentTrayStore?.detailsDocumentTray?.numbers;
  if (!numbers) return [];

  const filterNumbers = [];

  // Subtotal
  if (numbers?.totalNet != null) {
    filterNumbers.push({
      key: "subtotal",
      label: "Subtotal",
      value: numbers.totalNet.value,
    });
  }

  // Impuestos reales + mock - pruebas de varios impuestos
  //   const mockTaxes = [
  //     {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //     {
  //       name: 'Impuesto Ambiental',
  //       total: { number: numbers.totalNet.number, value: 2 }
  //     },
  //     {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //         {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //     {
  //       name: 'Impuesto Ambiental',
  //       total: { number: numbers.totalNet.number, value: 2 }
  //     },
  //     {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //         {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //     {
  //       name: 'Impuesto Ambiental',
  //       total: { number: numbers.totalNet.number, value: 2 }
  //     },
  //     {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //         {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //     {
  //       name: 'Impuesto Ambiental',
  //       total: { number: numbers.totalNet.number, value: 2 }
  //     },
  //     {
  //       name: 'IVA Extra',
  //       total: { number: numbers.totalNet.number, value: 5 }
  //     },
  //   ];

  //   const allTaxes = [
  //     ...(numbers.taxes ?? []),
  //     ...mockTaxes
  //   ];

  numbers.taxes.forEach((tax, index) => {
    const base = numbers.totalNet.number; // subtotal

    const taxAmount = base * (tax.total.value / 100); // Calcular los impuestos a partir del subtotal

    filterNumbers.push({
      key: `tax-${index}`,
      label: `${tax.name}`,
      value: tax.total.value,
    });
  });

  return filterNumbers;
});
</script>

<template>
  <!-- Table -->
  <div class="table">
    <!-- Wrapper -->
    <div class="table__wrapper">
      <!-- Body (scroll) -->
      <div class="table__body">
        <div
          class="table__item"
          v-for="line in numbersDetailsDocumentTray"
          :key="line.key"
        >
          <div class="cell truncateText">
            <span
              class="truncateText"
              :title="line?.label"
              v-text="line?.label"
            ></span>
          </div>
          <div class="cell truncateText">
            <span
              class="truncateText"
              :title="line?.value"
              v-text="line?.value"
            ></span>
          </div>
        </div>
      </div>

      <!-- Footer (FIJO) -->
      <div class="table__footer">
        <div class="cell"></div>
        <div class="cell truncateText">
          <span>Total</span>
          <span
            class="truncateText"
            :title="totalNumbers?.number"
            v-text="totalNumbers?.value"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table {
  max-height: calc(100vh - 581px);
  overflow: hidden;
  border-radius: 12px;
}

.table__wrapper {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100%;
}

.table__body {
  overflow-y: auto;
  flex: 0 1 auto;
  scrollbar-gutter: stable;
}

.table__body::-webkit-scrollbar {
  width: 6px;
}
.table__body::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}

.table__header,
.table__item,
.table__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* Table Header */
.table__header .cell {
  background-color: var(--neutral-surface-light);
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-top: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(1) {
  border-radius: 12px 0 0 0;
  border-left: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(2) {
  border-radius: 0 12px 0 0;
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__header .cell:nth-child(2),
.table__item .cell:nth-child(2) {
  justify-content: flex-end;
}
.table__header .cell span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: bottom;
  color: var(--neutral-text-caption);
}

/* Table Items */
.table__item .cell {
  background-color: var(--neutral-backgorund-default);
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-top: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
}
.table__item .cell span {
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.table__item:first-of-type .cell:nth-child(1) {
  border-radius: 12px 0 0 0;
}

.table__item:first-of-type .cell:nth-child(2) {
  border-radius: 0 12px 0 0;
}

.table__item:last-of-type .cell:nth-child(1) {
  border-radius: 0 0 0 12px;
}

.table__item .cell:nth-child(1) {
  border-left: 1px solid var(--neutral-border-subtle);
}

/* Table Footer  */
.table__footer {
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
  margin-right: 6px;
}

.table__footer .cell:not(:first-child) {
  background-color: var(--neutral-surface-light);
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}
.table__footer .cell span {
  font-weight: 800;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  text-align: justify;
  vertical-align: bottom;
  color: var(--neutral-text-body);
}
.table__footer .cell:nth-child(2) {
  border-left: 1px solid var(--neutral-border-subtle);
  border-bottom: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
  border-top: 1px solid var(--neutral-border-subtle);
  border-radius: 0 0 12px 12px;
  justify-content: space-between;
}
</style>
