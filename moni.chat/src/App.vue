<template>
    <div class="container">
      <div class="shape-container">
        <div class="page">
          <router-view />
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  </script>
  
  <style scoped lang="scss">
  .container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #d9eaff, #b5d3f3);
    overflow: hidden;
    color: black;
  
    .shape-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
  
      background: linear-gradient(135deg, #d9eaff, #b5d3f3);
      background-size: 50px 50px;
      background-image: linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
  
      .page {
        height: calc(100vh - 100px);
        width: calc(100vw - 400px);
        min-width: 680px;
        max-width: 1180px;
        // background-color: #fff;
        border-radius: 5px;
  
        @media (max-width: 700px) {
  
          height: 100%;
          /* 高度占满 shape-container */
          width: 100%;
          /* 宽度占满 shape-container */
          min-width: 200px !important;
  
        }
      }
  
    }
  
  }
  </style>