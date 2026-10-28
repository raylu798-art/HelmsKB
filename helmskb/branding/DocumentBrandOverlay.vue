<script setup lang="ts">
defineProps<{ regions?: Array<{x:number;y:number;width:number;height:number;background:string;brightness?:number;blur?:boolean}>; logo: string }>()
</script>
<template>
  <span v-for="(region,index) in regions || []" :key="index" class="helmskb-shot-brand" aria-hidden="true"
    :style="{left:region.x+'%',top:region.y+'%',width:region.width+'%',height:region.height+'%',background:region.background}">
    <img :src="logo" alt="" :style="{filter:`brightness(${region.brightness ?? 1}) blur(${region.blur ? '2cqw' : '0px'})`}">
  </span>
</template>
<style scoped>
.helmskb-shot-brand { position:absolute; display:flex; align-items:center; justify-content:center; container-type:inline-size; overflow:hidden; pointer-events:none; }
.helmskb-shot-brand img { display:block; width:100%; height:100%; object-fit:contain; }
</style>
