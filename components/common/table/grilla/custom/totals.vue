<template>
  <div class="totals">
    <span class="totals__title">Totales</span>
    <div class="totals__group">
      <span class="totals__group-label">Grupo 1</span>
      <div class="totals__group-list">
        <div class="tag incomes">
          <span>Ventas: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag budget">
          <span>Compras: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag outcome">
          <span>Presupuestado: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag projected">
          <span>Proyectado: <strong>$123.234.434,23</strong></span>
        </div>
      </div>
    </div>
    <div class="totals__group">
      <span class="totals__group-label">Grpo 2</span>
      <div class="totals__group-list">
        <div class="tag incomes">
          <span>Ventas: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag budget">
          <span>Compras: <strong>$123.123.234.434,23</strong></span>
        </div>
        <div class="tag outcome">
          <span>Presupuestado: <strong>$123.123.234.434,23</strong></span>
        </div>
        <div class="tag projected">
          <span>Proyectado: <strong>$123.234.434,23</strong></span>
        </div>
      </div>
    </div>
    <div class="totals__group">
      <span class="totals__group-label">Subgrupo 1</span>
      <div class="totals__group-list">
        <div class="tag incomes">
          <span>Ventas: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag budget">
          <span>Compras: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag outcome">
          <span>Presupuestado: <strong>$123.234.434,23</strong></span>
        </div>
        <div class="tag projected">
          <span>Proyectado: <strong>$123.234.434,23</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.totals {
  position: absolute;
  right: 0px;
  top: calc(100% + 5px);
  background-color: var(--neutral-background-default);
  z-index: 20;
  padding: 12px;
  box-sizing: border-box;
  box-shadow: var(--elevation-m);
  border-radius: 8px;
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}
.totals__title {
  color: var(--neutral-text-caption);
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
}
.totals__group {
  border-bottom: 1px solid var(--neutral-border-subtle);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding: 0 0 12px 12px;
}
.totals__group-label {
  color: var(--neutral-text-body);
  font-size: 16px;
  line-height: 16px;
  font-weight: 600;
}
.totals__group-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.tag {
  width: auto;
  display: flex;
  align-items: center;
  border-radius: 20px;
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  padding: 4px 12px;
}
.tag.incomes {
  background-color: var(--warning-focus-input);
  color: var(--warning-text-default);
}
.tag.budget {
  background-color: var(--info-focus-input);
  color: var(--info-text-default);
}
.tag.outcome {
  background-color: var(--danger-focus-input);
  color: var(--danger-text-default);
}
.tag.projected {
  background-color: var(--success-focus-input);
  color: var(--success-text-default);
}
</style>
