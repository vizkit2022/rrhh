<script setup>
import { defineProps } from "vue";

const { parameter } = defineProps({
  parameter: {
    type: Object,
    defalt: () => {},
  },
});
</script>

<template>
  <div class="card">
    <div class="card__title">
      <button><span class="u u-chevron-up"></span></button>
      <span class="title">{{ parameter.title }}</span>
    </div>
    <div class="card__table">
        <div class="card__table-header">
            <div class="card__table-col first"><span>Parámetro</span></div>
            <div class="card__table-col"><span>Obligatorio</span></div>
            <div class="card__table-col"><span>Opcional</span></div>
            <div class="card__table-col last"><span>No Aplica</span></div>
        </div>
        <div class="card__table-item" :class="r === parameter.rows.length - 1 ? 'last' : ''" v-for="(row, r) in parameter.rows" :key="row">
            <div class="card__table-col first"><span>{{ row.name }}</span></div>
            <div class="card__table-col"><u-radio v-model="row.mandatory" /></div>
            <div class="card__table-col"><u-radio v-model="row.optional" /></div>
            <div class="card__table-col last"><u-radio v-model="row.noApply" /></div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--neutral-border-subtle);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-1);
    flex-shrink: 0;
    padding-right: 2px;
}
.card__title {
    height: 40px;
    background-color: var(--neutral-surface-softer);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 12px;
    border-bottom: 1px solid var(--neutral-border-subtle);
}
.card__title span.title {
    font-size: 14px;
    font-weight: 800;
    line-height: 18px;
    text-align: justified;
    color: var(--neutral-text-body);
}
.card__table {
    padding: 24px;
    box-sizing: border-box;
}
.card__table-header {
    background-color: var(--neutral-surface-softer);
    border-radius: 12px 12px  0 0;
    border: 1px solid var(--neutral-border-subtle);
}
.card__table-item {
    border-left: 1px solid var(--neutral-border-subtle);
    border-right: 1px solid var(--neutral-border-subtle);
    border-bottom: 1px solid var(--neutral-border-subtle);
}
.card__table-item.last {
    border-radius: 0 0 12px 12px;
}
.card__table-header, .card__table-item {
    width: 100%;
    height: 32px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
}
.card__table-header .card__table-col {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 12px;
    border-right: 1px solid var(--neutral-border-subtle);
}
.card__table-item .card__table-col  {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 12px;
}
.card__table-item .card__table-col.first {
    justify-content: flex-start;
}
.card__table-header  .first {
    justify-content: flex-start;
    border-right: 1px solid var(--neutral-border-subtle);
}
.card__table-header .last {
    border-right: none;
}
.card__table-col span {
font-size: 14px;
font-weight: 600;
line-height: 18px;
text-align: left;
color: var(--neutral-text-body);
}

span {
    font-family: Nunito;
}
</style>
