<template>
    <div class="chat-name">
        <div>{{ chatName }}</div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMessageStore } from '@/stores/module/useMessageStore'
// import Avatar from './Avatar.vue'
import { useUserStore } from '@/stores/module/useUserStore'
const messageStore = useMessageStore()
const name = ref('')
const chatName = ref('')
watch(() => messageStore.targetId, (newId: string) => {
    if (newId) {
        chatName.value = messageStore.getChatName(newId)
    }
})
onMounted(() => {
    name.value = useUserStore().user?.name || ''
})
</script>

<style scoped>
.chat-name {
    width: 100%;
    height: 100%;
    color: black;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}
</style>