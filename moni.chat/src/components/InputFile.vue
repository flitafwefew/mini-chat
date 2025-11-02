<template>
    <div class="input-field">
        <div class="input-field-input-container">
            <span v-if="messageStore.source !== 'group'" @click="sendVideoChat">
                <svg t="1741523276007" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="4876" width="29" height="29">
                    <path
                        d="M151.272727 279.272727A58.228364 58.228364 0 0 0 93.090909 337.454545v372.363637C93.090909 741.911273 119.179636 768 151.272727 768h512c32.093091 0 58.181818-26.088727 58.181818-58.181818v-372.363637c0-32.093091-26.088727-58.181818-58.181818-58.181818h-512zM791.272727 439.389091l106.728728-106.752a46.405818 46.405818 0 0 1 50.734545-10.100364A46.429091 46.429091 0 0 1 977.454545 365.544727v316.183273a46.429091 46.429091 0 0 1-46.592 46.568727c-12.101818 0-23.924364-4.724364-32.86109-13.661091L791.272727 607.906909V709.818182c0 70.562909-57.437091 128-128 128h-512A128.162909 128.162909 0 0 1 23.272727 709.818182v-372.363637C23.272727 266.891636 80.709818 209.454545 151.272727 209.454545h512c70.562909 0 128 57.437091 128 128v101.934546z m14.452364 84.247273l101.934545 101.911272v-203.822545L805.701818 523.636364z"
                        fill="#bfbfbf" p-id="4877"></path>
                </svg>
            </span>
            <span v-if="messageStore.source !== 'group'" @click="sendPhoneChat">
                <svg t="1741523318679" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="5995" width="29" height="29">
                    <path
                        d="M725.681633 902.791837c-38.661224 0-82.02449-7.314286-127.477551-21.420408-109.191837-33.959184-216.816327-105.012245-303.020409-200.09796C166.138776 538.644898 104.489796 396.538776 116.506122 270.106122c3.657143-31.346939 13.583673-71.053061 60.604082-102.922449 36.04898-29.257143 77.322449-45.97551 109.714286-45.453061 33.959184 0.522449 45.453061 12.538776 80.457143 63.216327 53.812245 74.187755 57.469388 110.759184 55.379591 131.657143-3.657143 34.481633-22.465306 49.632653-39.706122 63.216326-4.179592 3.134694-8.359184 6.791837-12.016326 9.926531-20.897959 26.644898-46.497959 63.738776 63.216326 177.110204 93.518367 89.861224 144.195918 100.832653 165.616327 99.265306 16.718367-1.044898 22.987755-9.926531 25.6-13.061225l0.522449-0.522448c35.004082-49.110204 46.497959-61.126531 79.934693-66.351021 32.391837-5.22449 49.110204 5.22449 118.07347 48.587755 62.171429 39.183673 90.906122 65.306122 84.636735 106.579592-2.089796 44.930612-36.571429 106.057143-75.232654 133.746939-26.644898 18.285714-63.738776 27.689796-107.624489 27.689796z"
                        fill="#bfbfbf" p-id="5996"></path>
                </svg>
            </span>
            <span v-if="messageStore.source !== 'group'" @click="handleFile">
                <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
                <svg t="1741523350582" class="icon" viewBox="0 0 1243 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="7058" width="27" height="27">
                    <path
                        d="M1109.211429 952.832c0 39.350857-34.450286 71.168-76.726858 71.168H73.142857l134.363429-587.117714c0-39.350857 34.157714-71.168 76.580571-71.168H1166.628571c42.422857 0 76.726857 31.817143 76.726858 71.168l-134.217143 515.949714zM201.142857 286.793143H1024v-72.411429c0-40.813714-32.914286-73.874286-73.142857-73.874285H512.146286v-66.779429c0-40.740571-32.694857-73.728-73.142857-73.728H73.142857C32.694857 0 0 32.987429 0 73.728V950.857143l127.926857-590.189714c0-40.740571 32.914286-73.874286 73.142857-73.874286z"
                        fill="#bfbfbf" p-id="7059"></path>
                </svg>
            </span>
        </div>
        <input class="input-field-input" type="text" v-model="message" @keyup.enter="sendMessage" @input="handleInput" @focus="handleFocus" @blur="handleBlur" />
        <button class="input-field-button" @click="sendMessage">
            <svg t="1741523161374" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                p-id="3820" width="39" height="39">
                <path
                    d="M510.3616 90.4704a420.9152 420.9152 0 1 0 420.864 420.864 421.3248 421.3248 0 0 0-420.864-420.864z m0 800.8192a379.9552 379.9552 0 1 1 379.904-379.9552 380.3136 380.3136 0 0 1-379.904 379.9552z"
                    fill="#1296db" p-id="3821"></path>
                <path
                    d="M259.4816 439.8592l422.5024-103.5776a24.9344 24.9344 0 0 1 28.4672 34.9696L522.24 766.4128a24.9856 24.9856 0 0 1-46.08-3.1232l-48.2304-149.4016a24.9856 24.9856 0 0 1 5.12-24.32l81.92-91.0336a6.6048 6.6048 0 0 0-8.192-10.24L398.1312 551.936a25.1392 25.1392 0 0 1-24.6272 0.3072l-120.1152-66.56a24.9344 24.9344 0 0 1 6.0928-45.824z"
                    fill="#1296db" p-id="3822"></path>
            </svg>
        </button>
    </div>
    <!-- 修改传递给 SendFile 组件的文件 -->
    <SendFile :file="selectedFile"></SendFile>
    <GetFile></GetFile>
    <VideoChat :isVideoChat="videoStatus"
    :is-caller="isCaller"
    :is-called="isCalled"
    :target-info="targetInfo"
    :only-audio="onlyAudio"
    @update:videoStatus="handleUpdateVideoStatus"></VideoChat>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import type { SendMessageParams } from '@/types/message'
// import { send } from '@/api/message'
import { useMessageStore } from '@/stores/module/useMessageStore'
import { useUserStore } from '@/stores/module/useUserStore'
import { useFileTransferStore } from '@/stores/module/useFileTransferStore'
import { invite } from '@/api/file'
import { vedioInvite } from '@/api/video'
import eventBus from '@/utils/eventBus'
import ws from '@/utils/ws'
import SendFile from './SendFile.vue'

import GetFile from './GetFile.vue'
import VideoChat from './VideoChat.vue'
// import { useChatListStore } from '@/stores/module/useChatListStore'
const message = ref('')
const messageStore = useMessageStore()
// 新增一个响应式变量来存储选择的文件
const selectedFile = ref<File | undefined>();
const videoStatus = ref(false);
const isCalled = ref(false);
const isCaller = ref(false);
const targetInfo = ref({});
const onlyAudio = ref(false);

// 正在输入状态相关
let typingTimer: number | null = null;
const isTyping = ref(false);
const sendMessage = async () => {
    if (!message.value.trim()) return;
    
    // 停止正在输入状态
    stopTyping();
    
    const params: SendMessageParams = {
        msgContent: JSON.stringify([{
            type: 'text',
            content: message.value
        }]),
        targetId: messageStore.targetId,
        type: 'text',
        source: messageStore.source
    }
    try {
        await messageStore.sendMessage(params);
        message.value = ''
    } catch (error) {
        console.error('发送消息失败:', error);
        // 可以在这里添加用户友好的错误提示
        // ElMessage.error('发送消息失败，请重试');
    }
}

// 处理输入事件
const handleInput = () => {
    if (!isTyping.value) {
        startTyping();
    }
    
    // 重置定时器
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
    
    typingTimer = setTimeout(() => {
        stopTyping();
    }, 1000); // 1秒后停止正在输入状态
}

// 开始正在输入状态
const startTyping = () => {
    if (!messageStore.targetId) return;
    
    isTyping.value = true;
    ws.sendTyping(messageStore.targetId, true);
}

// 停止正在输入状态
const stopTyping = () => {
    if (!messageStore.targetId || !isTyping.value) return;
    
    isTyping.value = false;
    ws.sendTyping(messageStore.targetId, false);
    
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
}

// 处理输入框获得焦点
const handleFocus = () => {
    // 可以在这里添加一些逻辑
}

// 处理输入框失去焦点
const handleBlur = () => {
    stopTyping();
}
const fileInput = ref<HTMLInputElement | null>(null);

const handleFileChange = async () => {
    if (fileInput.value?.files?.length) {
        const file = fileInput.value.files[0];
        const formData = new FormData();
        formData.append('file', file);
        try {
            const fileTransferStore = useFileTransferStore();
            // 修复：设置目标用户ID，确保后续的 offer 等操作能正确发送
            fileTransferStore.targetId = messageStore.targetId;
            await invite({
                userId: messageStore.targetId,
                fileInfo: {
                    "name": file.name,
                    "size": file.size,
                }
            })
            fileTransferStore.isSendFile = true;
            // useFileTransferStore().setFile(file);
            // 将选择的文件赋值给 selectedFile 变量
            selectedFile.value = file;
            console.log('📤 文件传输邀请成功，目标用户:', messageStore.targetId);
        } catch (error) {
            console.error('文件上传失败', error);
        }
    }
};
const sendVideoChat = async () => {
    const param = {
        "onlyAudio": false,//TODO 语音和视频切换
        "targetId": messageStore.targetId,
    }
    onlyAudio.value = false;
    await vedioInvite(param);
    isCaller.value = true;
    videoStatus.value = true;
    targetInfo.value = {
        "userId": messageStore.targetId,
        "targetName": messageStore.chatName
    }
}
const sendPhoneChat = async () => {
    const param = {
        "onlyAudio": true,//TODO 语音和视频切换
        "targetId": messageStore.targetId,
    }
    onlyAudio.value = true;
    await vedioInvite(param);
    isCaller.value = true;
    videoStatus.value = true;
    targetInfo.value = {
        "userId": messageStore.targetId,
        "targetName": messageStore.chatName
    }
}
const handleUpdateVideoStatus = () => {
  videoStatus.value = false;
  isCalled.value = false;
  isCaller.value = false;
};

const handleFile = () => {
    console.log('handleFile');
    fileInput.value?.click();
};

const handlerVideoMsg = async (msg:any) => {
    console.log(msg)
    if (msg.type === 'invite') {
        const userMap = await useUserStore().userMap;
        // 通过 msg.userId 从 userMap 中获取对应的用户信息
        const userInfo = userMap[msg.fromId];
        // 从用户信息中提取 targetName
        const targetName = userInfo ? userInfo.name : '未知用户';
        console.log(msg.fromId);
        targetInfo.value = {
            "userId": msg.fromId,
            "targetName": targetName,
        }
        videoStatus.value = true;
        isCalled.value = true;
    }
}

onMounted(async() => {
    eventBus.on('on-receive-video', handlerVideoMsg)
})
onUnmounted(async() => {
    eventBus.off('on-receive-video', handlerVideoMsg)
    
    // 清理正在输入状态
    stopTyping();
    
    // 清理定时器
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
})
</script>

<style scoped lang="scss">
.input-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;

    span {
        cursor: pointer;
        width: 30px;
        height: 30px;
        margin: 5px 5px 5px 5px;
    }

    // border-top: 1px solid #e0e0e0;
    .input-field-input {
        flex: 1;
        height: 30px;
        margin: 20px 10px 10px 10px;
        padding: 20px;
        border: none;
        border-radius: 10px;
        resize: vertical;
        min-height: 20px;
        max-height: 200px;
        overflow-y: auto;
    }
    @media (max-width: 700px){
        .input-field-input{
            bottom: 0%;
        }
        .input-field-input-container{
            
        }
    }
}
</style>