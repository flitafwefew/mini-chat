<template>
    <div class="avatar" :style="avatarStyle">
        {{ avatarName }}
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    name: string,
    size: number,
}>()

// 生成名字的哈希值
const getHashCode = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }
    return hash
}

// 根据哈希值生成颜色
const getColor = (name: string): string => {
    const colors = [
        '#1E90FF', // 蓝色
        '#32CD32', // 绿色
        '#FF4500', // 橙色
        '#FF69B4', // 粉色
        '#9370DB', // 紫色
        '#20B2AA', // 青色
        '#FFD700', // 金色
        '#FF6347', // 珊瑚色
        '#4169E1', // 皇家蓝
        '#8B008B', // 深紫色
    ]
    const hash = getHashCode(name)
    const index = Math.abs(hash) % colors.length
    return colors[index]
}

// 获取名字的首字母或首字
const avatarName = computed(() => {
    if (!props.name) return ''
    // 如果是英文名，返回首字母
    if (/^[a-zA-Z\s]+$/.test(props.name)) {
        return props.name.charAt(0).toUpperCase()
    }
    // 如果是中文名，返回首字
    return props.name.charAt(0)
})

// 计算头像样式
const avatarStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundColor: getColor(props.name),
    fontSize: `${props.size * 0.4}px`,
    lineHeight: `${props.size}px`,
}))
</script>

<style scoped lang="scss">
.avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
    font-weight: 500;
    text-align: center;
    user-select: none;
}
</style>