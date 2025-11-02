<template>
    <!-- 文件传输通知 -->
    <el-dialog class="send-file" v-model="fileTransferStore.isSendFile" title="正在向对方发送文件..." width="400" center @close="fileTransferStore.cancelFile(useUserStore().user?.id || '')">
        <span v-if="isLoading" class="waiting">
            等待对方接受文件...
        </span>
        <span v-else>
            <el-tag class="el-tag" v-if="prop.file&&progress<100">正在向对方传输文件：{{ prop.file.name }} <br> {{ progress }}/{{ prop.file.size }}</el-tag>
            <el-tag class="el-tag" v-else-if="progress===100"> 传输完成！ </el-tag>
        </span>
        <template #footer>
            <div class="dialog-footer">
                <el-button
                    @click="fileTransferStore.cancelFile(useUserStore().user?.id || '')">取消传输</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFileTransferStore } from '@/stores/module/useFileTransferStore';
import { candidate, offer } from '@/api/file';
import { ElMessage } from 'element-plus';
import EventBus from '@/utils/eventBus';
import { useUserStore } from '@/stores/module/useUserStore';
import { useMessageStore } from '@/stores/module/useMessageStore';


const fileTransferStore = useFileTransferStore();
const isSendFile = ref(fileTransferStore.isSendFile);
const isLoading = ref(true);
const prop = defineProps({ file: File })
const visible = defineModel<boolean>('visible')

const pc = ref<RTCPeerConnection | null>(null)
const dataChannel = ref<RTCDataChannel | null>(null)
const isReady = ref(false)
const progress = ref(0)
// ICE候选队列：用于存储远程描述设置前到达的候选
const pendingCandidates = ref<any[]>([])

// 监听 isSendFile 状态变化
watch(
    () => fileTransferStore.isSendFile,
    (newVal) => {
        isSendFile.value = newVal;
        if (newVal) {
            isLoading.value = true;
        }
    }
);

const handleFileMsg = (msg: any) => {
    // console.log('SendFileMsg', msg);
    switch (msg.type) {
        case 'answer':
            handleFileAnswerMsg(msg);
            break;
        case 'candidate':
            console.log('📥 [UserInfo] 处理candidate消息');
            // 即使远程描述未设置，也会将候选加入队列，等待后续处理
            handleNewICECandidateMsg(msg);
            break;
        case 'accept':
            isLoading.value = false;
            onOffer();
            break;
        case 'cancel':
            fileTransferStore.isGetFile = false;
            fileTransferStore.isSendFile = false;
            isLoading.value = false;
            break;
    }
};
const initRTCPeerConnection = () => {
    // 清空候选队列，开始新的连接
    pendingCandidates.value = [];
    
    const iceServer = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            },
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            }
        ],
        googCongestionControl: 'cubic'
    }
    pc.value = new RTCPeerConnection(iceServer)
    dataChannel.value = pc.value.createDataChannel('fileTransfer')
    console.log('dataChannel:初始化数据通道', dataChannel.value);// 初始化数据通道
    setupDataChannel()
    pc.value.onicecandidate = handleICECandidateEvent
    pc.value.oniceconnectionstatechange = handleICEConnectionStateChangeEvent
}
const setupDataChannel = () => {
    if (dataChannel.value) {
        dataChannel.value.onopen = () => {
            if (prop.file) {
                sendFile(prop.file).catch((error) => {
                    console.error('文件发送出错:', error)
                    ElMessage('文件发送出错，请重试')
                })
            }
        }
        dataChannel.value.onclose = () => console.log('DataChannel closed')
    }
}
const sendFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
        const chunkSize = 16 * 1024
        const totalChunks = Math.ceil(file.size / chunkSize)
        let currentChunk = 0
        let totalSent = 0
        let lastProgressUpdate = Date.now()
        const fileReader = new FileReader()

        const sendNextChunk = () => {
            try {
                const start = currentChunk * chunkSize
                const end = Math.min(start + chunkSize, file.size)
                const chunk = file.slice(start, end)
                fileReader.readAsArrayBuffer(chunk)
            } catch (e) {
                reject(e)
            }
        }

        fileReader.onload = async () => {
            if (dataChannel.value && dataChannel.value.readyState === 'open') {
                try {
                    if (fileReader.result instanceof ArrayBuffer) {
                        dataChannel.value.send(fileReader.result)
                        totalSent += fileReader.result.byteLength
                        const now = Date.now()
                        if (now - lastProgressUpdate > 100) {
                            progress.value = Math.floor((totalSent / file.size) * 100)
                            lastProgressUpdate = now
                        }
                        currentChunk++
                        if (currentChunk < totalChunks) {
                            setTimeout(() => sendNextChunk(), 0)
                        } else {
                            progress.value = 100
                            resolve()
                        }
                    }
                } catch (e) {
                    reject(e)
                }
            }
        }

        sendNextChunk()
    })
}
// 处理 ICE 候选事件
const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
        candidate({ userId: fileTransferStore.targetId, candidate: event.candidate }).catch((error) => {
            console.error('发送 ICE 候选出错:', error)
        })
    }
}

// 处理 ICE 连接状态变化事件
const handleICEConnectionStateChangeEvent = () => {
    if (pc.value?.iceConnectionState === 'disconnected') {
        console.log('ICE 连接已断开')
        ElMessage('文件传输连接已断开，请重试')
        visible.value = false
    }
}
// 处理文件响应消息
const handleFileAnswerMsg = async (data: { desc: any }) => {
    try {
        if (pc.value) {
            console.log('📥 [UserInfo] 设置远程描述（answer）...');
            const desc = new RTCSessionDescription(data.desc)
            await pc.value.setRemoteDescription(desc)
            console.log('✅ [UserInfo] 已成功设置远程描述（answer）');
            
            // 设置远程描述后，处理之前队列中的ICE候选
            console.log('📦 [UserInfo] 处理待处理的ICE候选队列...');
            await processPendingCandidates();
        }
    } catch (error: any) {
        console.error('❌ [UserInfo] 处理文件响应消息出错:', error)
        ElMessage.error('处理文件响应消息出错，请重试')
    }
}
// 处理新的 ICE 候选消息
const handleNewICECandidateMsg = async (data: { candidate: any }) => {
    try {
        if (!pc.value) {
            console.warn('⚠️ [UserInfo] pc.value 为空，暂存候选');
            pendingCandidates.value.push(data.candidate);
            return;
        }
        
        // 检查是否已经设置了远程描述
        if (pc.value.remoteDescription) { 
            console.log('✅ [UserInfo] 远程描述已设置，直接添加候选');
            const candidate = new RTCIceCandidate(data.candidate);
            await pc.value.addIceCandidate(candidate);
        } else {
            // 远程描述未设置，将候选加入队列等待处理
            console.log('📦 [UserInfo] 远程描述未设置，将候选加入队列');
            pendingCandidates.value.push(data.candidate);
        }
    } catch (error: any) {
        console.error('❌ [UserInfo] 处理新的 ICE 候选消息出错:', error);
        console.error('错误详情:', {
            message: error.message,
            candidate: data.candidate
        });
        ElMessage.error('处理新的 ICE 候选消息出错，请重试');
    }
}

// 处理待处理的ICE候选队列
const processPendingCandidates = async () => {
    if (!pc.value || !pc.value.remoteDescription) {
        console.warn('⚠️ [UserInfo] 远程描述未设置，无法处理待处理候选');
        return;
    }
    
    if (pendingCandidates.value.length === 0) {
        console.log('✅ [UserInfo] 没有待处理的候选');
        return;
    }
    
    console.log(`📦 [UserInfo] 开始处理 ${pendingCandidates.value.length} 个待处理的候选`);
    
    const candidates = [...pendingCandidates.value];
    pendingCandidates.value = []; // 清空队列
    
    for (const candidateData of candidates) {
        try {
            const candidate = new RTCIceCandidate(candidateData);
            await pc.value.addIceCandidate(candidate);
            console.log('✅ [UserInfo] 候选已添加');
        } catch (error: any) {
            console.error('❌ [UserInfo] 添加候选失败:', error);
            // 如果候选无效或已过期，继续处理下一个
            if (error.message && error.message.includes('already have this candidate')) {
                console.log('ℹ️ [UserInfo] 候选已存在，跳过');
            }
        }
    }
    
    console.log(`✅ [UserInfo] 已完成处理所有待处理的候选`);
}
const onOffer = async () => {
    isReady.value = true
    await nextTick(async () => {
        initRTCPeerConnection()
        try {
            if (pc.value) {
                const offerFile = await pc.value.createOffer()
                await pc.value.setLocalDescription(offerFile)
                await offer({ userId: useMessageStore().targetId, desc: pc.value.localDescription })
            }
        } catch (error) {
            console.error('发送文件邀请出错:', error)
            ElMessage('发送文件邀请出错，请重试')
        }
    })
}
onMounted(() => {
    console.log('SendFile组件挂载');
});
// 取消传输
onMounted(() => {
    EventBus.on("on-receive-file", handleFileMsg)
})
onUnmounted(() => {
    EventBus.off("on-receive-file", handleFileMsg)
})




</script>

<style scoped lang="scss">
.send-file{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    span{
        border: none;
        text-align: center;
        font-size: 16px;
        display: block;
        background: #ffffff;
    }
}
.waiting{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}
</style>