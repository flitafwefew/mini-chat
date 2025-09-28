<template>
    <!-- 文件传输通知 -->
    <el-dialog class="send-file" v-model="fileTransferStore.isSendFile" title="正在向对方发送文件..." width="400" center @close="fileTransferStore.cancelFile(useUserStore().user?.id.toString() as string)">
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
                    @click="fileTransferStore.cancelFile(useUserStore().user?.id.toString() as string)">取消传输</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onBeforeMount, ref, watch } from 'vue';
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
            if (pc.value?.remoteDescription) {
                handleNewICECandidateMsg(msg);
            } else {
                console.error('远程描述未设置，暂不处理 ICE 候选消息');
            }
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
            const desc = new RTCSessionDescription(data.desc)
            await pc.value.setRemoteDescription(desc)
        }
    } catch (error) {
        console.error('处理文件响应消息出错:', error)
        ElMessage('处理文件响应消息出错，请重试')
    }
}
// 处理新的 ICE 候选消息
const handleNewICECandidateMsg = async (data: { candidate: any }) => {
    try {
        if (pc.value) {
            // 检查是否已经设置了远程描述
            if (pc.value.remoteDescription) { 
                const candidate = new RTCIceCandidate(data.candidate);
                await pc.value.addIceCandidate(candidate);
            } else {
                console.error('远程描述未设置，无法添加 ICE 候选信息');
                return; // 避免继续执行
            }
        }
    } 
     catch (error) {
        console.error('处理新的 ICE 候选消息出错:', error)
        ElMessage('处理新的 ICE 候选消息出错，请重试')
    }
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
onBeforeMount(() => {
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