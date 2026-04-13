<script setup>
import configTable from '@/utils/configTables/sale.json';

// TRADUCTIONS
const { t } = useI18n();
const module = "modules.sales.tabs.tab2";

// CONSTANTS
const metrics = [
    {
      mount: "$ 11.480.000",
      props: "total",
      color: "success",
      icon: "trend-up",
      traslateRute: "modules.sales.sale.tabs.tab4.metrics.totalMust",
      value: "$ NaN",
    },
    {
      mount: "$ 4.849.000",
      props: "total",
      color: "danger",
      icon: "trend-down",
      traslateRute: "modules.sales.sale.tabs.tab4.metrics.totalToHave",
      value: "$ NaN",
    },
  ];


</script>

<template>
    <div class="container_journalEntries">
        <!-- Header -->
        <div class="header_journalEntries">
            <div class="actions_left">
            <u-input placeholder="Buscar..." style="width: 400px;" />
            <u-datepicker  />
            <u-button
            text="Filtros"
            icon="filter"
            :revers="true"
            type="outlined"
            color="--neutral-surface-default"
            />
            </div>
        </div>
        <!-- Tabla -->
        <TableBasic :content="[]" :configTable="configTable.journalEntries" >
            
        </TableBasic>
        <!-- Metricas -->
        <u-indicators-lite
        :indicators="metrics || []"
        />
    </div>
</template>

<style scoped>
.container_journalEntries {
    display: grid;
    grid-template-rows: 36px 1fr 58px;
    gap: 16px;
    width: 100%;
    height: 100%;
}

.header_journalEntries  {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.actions_left {
    display: flex;
    align-items: center;
    gap: 16px;
}
.actions_right {
    display: flex;
    align-items: center;
    gap: 16px;
}
</style>