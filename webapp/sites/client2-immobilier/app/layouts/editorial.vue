<template>
  <main class="editorial-layout"><slot /></main>
</template>
<style>
.editorial-layout {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  color: #0f172a;
  background: #f8fafc;
  font-family: system-ui, sans-serif;
}
.editorial-layout a {
  color: #075985;
  text-underline-offset: 0.2em;
}
.editorial-layout * {
  box-sizing: border-box;
}
body {
  margin: 0;
}
</style>
