<template>
  <div
    class="multiCellEditor"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div class="multiCellEditor__header">
        <span>Multiedición</span>
        <u-button-icon icon="dragndrop" @mousedown="startDrag" @touchstart.prevent="startDrag" type="text" size="xs" />
    </div>
    <div class="content">
      HOLA
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const position = ref({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 100 })
let offsetX = 0
let offsetY = 0
let isDragging = false

function startDrag(event) {
  const e = event.type.startsWith('touch') ? event.touches[0] : event
  isDragging = true
  offsetX = e.clientX - position.value.left
  offsetY = e.clientY - position.value.top

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

function onDrag(event) {
  if (!isDragging) return
  const e = event.type.startsWith('touch') ? event.touches[0] : event
  position.value.left = e.clientX - offsetX
  position.value.top = e.clientY - offsetY
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

onBeforeUnmount(stopDrag)
</script>

<style scoped>
.multiCellEditor {
  position: absolute;
  width: 300px;
  height: 300px;
  background-color: var(--neutral-background-default);
  z-index: 9999;
  border-radius: 10px;
  box-shadow: var(--elevation-s);
  user-select: none;
  padding: 12px;
}
.multiCellEditor__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.multiCellEditor__header button {
    cursor: grab;
}
.multiCellEditor__header button:active {
    cursor: grabbing;

}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-weight: bold;
  color: white;
  font-size: 18px;
}
</style>
