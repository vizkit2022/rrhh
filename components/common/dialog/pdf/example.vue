<script setup>
import { generateLighterVariants } from "@/utils/helpers";
import { computed } from "vue";

import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Store
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

//Computed
const color = computed(() => {
  if (organizationStore.printPdf.solidColor) return [organizationStore.printPdf.color, organizationStore.printPdf.color, organizationStore.printPdf.color]
  return generateLighterVariants(organizationStore.printPdf.color);
})
</script>

<template>
  <div class="config__example">
    <div class="config__example-header1">
      <div class="logo">
        <img :src="organizationStore?.organization.imgUrl" alt="" />
      </div>
      <div class="snippet">
        <span>{{ organizationStore?.organization?.name || "-" }}</span>
        <span>{{ organizationStore?.organization?.idNumber || "-" }}</span>
        <span>{{
          globalStore?.lang === "es" ? "Proyecto 1" : "Project 1"
        }}</span>
        <span>{{
          organizationStore?.organization?.address?.street?.name || "-"
        }}</span>
        <span>{{
          organizationStore?.organization?.contact?.phone || "-"
        }}</span>
        <span>{{
          organizationStore?.organization?.contact?.email || "-"
        }}</span>
      </div>
      <div class="date">
        <span>Cotización N° 001</span>
        <span>07/02/2025</span>
      </div>
    </div>
    <div class="config__example-header2">
      <span class="label">Cliente:</span>
      <span class="header-client">Laila Prada</span>
      <span class="label contact">Contacto:</span>
      <span class="header-contact">Lezka</span>
    </div>
    <div class="config__example-header3">
      <h2 class="header-income">
        {{
          globalStore.lang === "es" ? "Nombre del Movimiento" : "Movement Name"
        }}
      </h2>
      <div class="order-details">
        <span class="header-income-complete">
          {{
            globalStore.lang === "es"
              ? "PROYECTO N° 1000 • PRUEBAA DE 4800 LINEAS • PROYECTO 1"
              : "PROJECT N° 1000 - 4800 LINE TEST - PROJECT 1"
          }}
        </span>
      </div>
    </div>

    <div class="title titleDescription">
      <span class="title__resumen">Descripción</span>
    </div>
    <p class="description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto sed consequuntur fugit
      recusandae cupiditate praesentium eligendi. Nihil veniam aliquid delectus et? Reprehenderit aut in vel odio quis
      sit ipsum sed.</p>
    <div class="title titleDescription">
      <span class="title__resumen">Resumen</span>
    </div>
    <table class="resumen-table">
      <colgroup>
        <col style="width: 10%" />
        <col style="width: 60%" />
        <col style="width: 10%" />
        <col style="width: 20%" />
      </colgroup>
      <thead id="resumen-head">
        <tr>
          <th></th>
          <th colspan="2" class="left">Categorías</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody id="resumen-body">
        <tr>
          <td class="right">0001</td>
          <td colspan="2" class="left">Linea fake 1</td>
          <td class="right">$ 345</td>
        </tr>
        <tr>
          <td class="right">0002</td>
          <td colspan="2" class="left">Linea fake 2</td>
          <td class="right">$ 345</td>
        </tr>
      </tbody>
      <tfoot id="resumen-footer">
        <tr class="main">
          <td></td>
          <td colspan="2" class="left">Subtotal</td>
          <td class="right">$ 699</td>
        </tr>
        <tr>
          <td></td>
          <td class="left">IVA 1</td>
          <td class="center">10%</td>
          <td class="right">$ 400</td>
        </tr>
        <tr>
          <td></td>
          <td class="left">IVA 2</td>
          <td class="center">10%</td>
          <td class="right">$ 500</td>
        </tr>
        <tr class="main">
          <td></td>
          <td colspan="2" class="left">Total</td>
          <td class="right">$ 900</td>
        </tr>
        <tr>
          <td></td>
          <td class="left">IVA</td>
          <td class="center">11%</td>
          <td class="right">$ 600</td>
        </tr>
        <tr>
          <td></td>
          <td class="left">IVA</td>
          <td class="center">10.5%</td>
          <td class="right">$ 700</td>
        </tr>
        <tr class="main">
          <td></td>
          <td colspan="2" class="left">Total Final</td>
          <td class="right">$ 1,300</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.config__example {
  grid-area: example;
  overflow: auto;
  width: 400px;
  color: var(--bg-neutral-700);
  box-shadow: var(--elevation-xs);
  border-radius: 4px;
  padding: 32px 32px;
  background-color: var(--white);
}

.config__example::-webkit-scrollbar {
  width: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.config__example-header1 {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 10px;
}

.config__example-header1 .logo img {
  max-width: 70px;
  max-height: 50px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.config__example-header1 .snippet {
  display: flex;
  gap: 1px;
  flex-direction: column;
}

.config__example-header1 .snippet span {
  color: var(--bg-neutral-700);
  font-size: 8px;
  line-height: 8px;
}

.config__example-header1 .date {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
}

.config__example-header1 .date div {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.config__example-header1 .date span:nth-child(1) {
  font-size: 10px;
  font-weight: 600;
}

.config__example-header1 .date span:nth-child(2) {
  color: var(--bg-neutral-500);
  font-size: 8px;
}

.config__example-header2 {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 5px;
  padding: 8px 0 4px;
  align-items: center;
}

.config__example-header2 .label {
  color: var(--bg-neutral-700);
  font-weight: 600;
  font-size: 8px;
}

.config__example-header2 .label.contact {
  padding-left: 10px;
}

.config__example-header2 span:not(.label) {
  color: var(--bg-neutral-700);
  font-weight: 400;
  font-size: 8px;
}

.config__example-header3 {
  padding: 10px 0;
  border-top: solid v-bind("organizationStore.printPdf.color") 1px;
  border-bottom: solid v-bind("organizationStore.printPdf.color") 1px;
  display: flex;
  flex-direction: column;
  gap: 0px;
  margin: 4px 0px 14px;
}

.config__example-header3 .header-income {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  margin: 0;
  color: v-bind("organizationStore.printPdf.color");
}

.config__example-header3 span.header-income-complete {
  color: var(--bg-neutral-700);
  font-size: 8px;
  line-height: 8px;
  height: 10px;
}

.title {
  background-color: var(--neutral-surface-shadow-12a);
  border-radius: 3px;
  height: 20px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  margin: 8px 0;
}

.title span {
  color: var(--bg-neutral-700);
  font-size: 10px;
  line-height: 10px;
}

.title__description,
p.description {
  color: var(--bg-neutral-700);
  font-size: 8px;
  line-height: 8px;
  padding: 0 4px;
  text-align: justify;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

table th,
table td {
  height: 16px;
  height: auto;
  vertical-align: top;
  padding: 3px 10px;
}

table thead tr th {
  background-color: v-bind("color[1]");
  border-top: v-bind("organizationStore.printPdf.color") 1px solid;
  border-bottom: v-bind("organizationStore.printPdf.color") 1px solid;
  font-size: 8px;
  line-height: 8px;
  color: v-bind("organizationStore.printPdf.isHeaderTextWhite ? '#ffffff' : '#212121'");
  font-weight: 600;
}

table thead tr th:first-child {
  border-top-left-radius: 4px;
  border-left: v-bind("organizationStore.printPdf.color") 1px solid;
}

table thead tr th:last-child {
  border-top-right-radius: 4px;
  border-right: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tbody tr td {
  font-size: 8px;
  line-height: 10px;
  color: var(--bg-neutral-700);
  font-weight: 400;
}

table tbody tr td:first-child,
table tbody tr td:nth-child(2) {
  border-left: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 4px;
}

table.singleLines tbody tr:last-child td:last-child {
  border-bottom-right-radius: 4px;
}

table tbody tr td:last-child {
  border-right: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tbody tr:last-child td {
  padding-bottom: 4px;
}

table tbody tr:last-child td {
  border-bottom: v-bind("organizationStore.printPdf.color") 1px solid;
}

table thead tr th.right,
table tbody tr td.right,
table tfoot tr td.right {
  text-align: right;
}

table thead tr th.left,
table tbody tr td.left,
table tfoot tr td.left {
  text-align: left;
}

table thead tr th.center,
table tbody tr td.center,
table tfoot tr td.center {
  text-align: center;
}

table tfoot#resumen-footer tr td:not(:first-child) {
  font-size: 8px;
  line-height: 8px;
  color: var(--bg-neutral-700);
  font-weight: 400;
}

table tfoot#resumen-footer tr.main td:not(:first-child) {
  border-bottom: v-bind("organizationStore.printPdf.color") 1px solid;
  background-color: v-bind("color[2]");
  font-size: 8px;
  line-height: 8px;
  color: v-bind("organizationStore.printPdf.isHeaderTextWhite ? '#ffffff' : '#212121'");
  font-weight: 600;
}

table tfoot#resumen-footer tr.onlyEndFooter td:not(:first-child),
table tfoot#resumen-footer tr.onlyStartFooter td:not(:first-child) {
  border-top: v-bind("organizationStore.printPdf.color") 1px solid !important;
}

table tfoot#resumen-footer tr.onlyEndFooter td:nth-child(2),
table tfoot#resumen-footer tr.onlyStartFooter td:nth-child(2) {
  border-top-left-radius: 4px;
}

table tfoot#resumen-footer tr.onlyEndFooter td:last-child,
table tfoot#resumen-footer tr.onlyStartFooter td:last-child {
  border-top-right-radius: 4px;
}

table tfoot#resumen-footer tr.main td:nth-child(2) {
  font-size: 8px;
}

table tfoot#resumen-footer tr.main:not(:first-child) td:not(:first-child) {
  border-top: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tfoot#resumen-footer tr td:nth-child(2) {
  border-left: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tfoot#resumen-footer tr td:last-child {
  border-right: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tfoot#resumen-footer tr:last-child td:nth-child(2) {
  border-bottom-left-radius: 4px;
}

table tfoot#resumen-footer tr:last-child td:last-child {
  border-bottom-right-radius: 4px;
}

table tr.group td:nth-child(2) {
  background-color: v-bind("color[2]");
  border-top: v-bind("organizationStore.printPdf.color") 1px solid;
  border-bottom: v-bind("organizationStore.printPdf.color") 1px solid;
}

table tfoot.items-footer tr td:not(:first-child) {
  border-bottom: v-bind("organizationStore.printPdf.color") 1px solid;
  background-color: v-bind("color[2]");
  font-size: 10px;
  line-height: 8px;
  color: var(--bg-neutral-700);
  font-weight: 600;
}

table tfoot.items-footer tr td:nth-child(2) {
  font-size: 8px;
}

table tfoot.items-footer tr td:nth-child(2) {
  border-left: v-bind("color[2]") 1px solid;
  border-bottom-left-radius: 4px;
}

table tfoot.items-footer tr td:last-child {
  border-right: v-bind("color[2]") 1px solid;
  border-bottom-right-radius: 4px;
}
</style>
