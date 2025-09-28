<template>
    <div>
        <el-dialog class="get-file" v-model="isDialogVisible" :title="fileTransferTitle" width="400" center @close="cancelTransfer">
            <span  v-if="!isReady" class="waiting">
                <el-tag v-if="fileInfo">{{ fileInfo.name }}</el-tag>
                <div v-if="fileInfo">文件体积：{{ formatSize(fileInfo.size) }}</div>
            </span>
            <span v-if="isReady &&fileInfo">
                当前进度：{{ progress }}% 文件体积： {{ formatSize(fileInfo.size) }}
            </span>
            <template #footer v-if="progress < 100">
                <div class="dialog-footer">
                    <el-button @click="acceptFile">接受</el-button>
                </div>
                <div class="dialog-footer">
                    <el-button @click="cancelTransfer">拒绝</el-button>
                </div>
            </template>
            <template #footer v-if="progress === 100">
                <div class="dialog-footer">
                    传输完成！
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, ref, computed, nextTick } from 'vue';
import { useFileTransferStore } from '@/stores/module/useFileTransferStore';
import { accept, candidate, answer } from '@/api/file';
import { useMessageStore } from '@/stores/module/useMessageStore';
import { formatSize } from '@/utils/common'
import eventBus from '@/utils/eventBus';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/module/useUserStore';
const fileTransferStore = useFileTransferStore();
const messageStore = useMessageStore();


const pc = ref<RTCPeerConnection | null>(null)
const dataChannel = ref<RTCDataChannel | null>(null)
const isReady = ref(false)
const progress = ref(0)
const receivedChunks = ref<ArrayBuffer[]>([])
const receivedSize = ref(0)
const fileInfo = ref<{
    name: string,
    size: number,
}>();
const fromId = ref<string>('');
const acceptFile = async () => {
    isReady.value = true
    await nextTick(async () => {
        initRTCPeerConnection()
    })//
    await accept({ userId: fromId.value }).catch((error) => {
        console.error('发送接受请求出错:', error)
        ElMessage('发送接受请求出错，请重试')
    })
}
const isDialogVisible = computed(() => fileTransferStore.isGetFile && messageStore.targetId === fromId.value);
const cancelTransfer = () => {
    fileTransferStore.cancelFile(useUserStore().user?.id.toString() as string);
}
const fileTransferTitle = computed(() => {
    return fileInfo.value ? `来自${messageStore.chatName}的文件传输请求` : '';
});
// 初始化 RTCPeerConnection
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
        ]
    }
    pc.value = new RTCPeerConnection(iceServer)
    pc.value.ondatachannel = (event) => {
        dataChannel.value = event.channel
        setupDataChannel()
    }
    pc.value.onicecandidate = handleICECandidateEvent
    pc.value.oniceconnectionstatechange = handleICEConnectionStateChangeEvent
}
const handleICECandidateEvent = async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
        await candidate({ userId: messageStore.targetId, candidate: event.candidate }).catch((error) => {
            console.error('发送 ICE 候选出错:', error)
        })
    }
}
const handleICEConnectionStateChangeEvent = () => {
    if (pc.value?.iceConnectionState === 'disconnected') {
        console.log('ICE 连接已断开')
        ElMessage('文件传输连接已断开，请重试')
    }
}
const handleFileMsg = (msg: any) => {
    // console.log('GetFileMsg', msg);
    switch (msg.type) {
        case 'invite':
            fileTransferStore.isGetFile = true;
            fileTransferStore.targetId = msg.userId;
            fromId.value = String(msg.fromId);
            fileInfo.value = {
                name: msg.fileInfo.name,
                size: msg.fileInfo.size
            }
            console.log('fileInfo', fileInfo.value);
            console.log('fromId', fromId.value);
            break;
        case 'cancel':
            fileTransferStore.isGetFile = false
            fileTransferStore.isSendFile = false
            // if(fileTransferStore.isGetFile===false &&fileTransferStore.isSendFile===false)break;
            // cancelTransfer();
            break;

        case 'offer':
            handleFileOfferMsg(msg)
            break
        case 'candidate':
            handleNewICECandidateMsg(msg)
            break
        default:
            break;
    }
}
const handleFileOfferMsg = async (data: { desc: any }) => {
    console.log('接受到offer消息，handleFileOfferMsg', data);
    try {
        if (pc.value) {
            const desc = new RTCSessionDescription(data.desc)
            await pc.value.setRemoteDescription(desc)
            const answerFile = await pc.value.createAnswer()
            await pc.value.setLocalDescription(answerFile)
            await answer({ userId: useMessageStore().targetId, desc: pc.value.localDescription })
        }
    } catch (error) {
        console.error('处理文件邀请消息出错:', error)
        ElMessage('处理文件邀请消息出错，请重试')
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
            }
        }
    } catch (error) {
        console.error('处理新的 ICE 候选消息出错:', error)
        ElMessage('处理新的 ICE 候选消息出错，请重试')
    }
}

// 下载文件
const onDownload = () => {
    if (receivedChunks.value.length > 0) {
        try {
            const blob = new Blob(receivedChunks.value);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            if (fileInfo.value) {
                a.download = fileInfo.value.name;
            } else {
                console.error('文件信息为空，无法设置下载文件名');
                return;
            }
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('下载文件时出错:', error);
        }
    } else {
        console.error('未接收到文件数据，无法下载');
    }
};

// 处理 DataChannel 消息
const handleDataChannelMessage = (e: MessageEvent) => {
    const message = e.data;
    if (typeof message === 'object') {
        if (!receivedChunks.value) {
            console.error('No active file transfer, ignoring binary message.');
            return;
        }
        if (message instanceof ArrayBuffer || message instanceof Uint8Array) {
            console.log('下载中');
            receivedChunks.value.push(message instanceof ArrayBuffer ? message : (message as Uint8Array).buffer);
            receivedSize.value += message.byteLength;
            if (fileInfo.value && typeof fileInfo.value.size === 'number') {
                progress.value = Math.floor((Number(receivedSize.value) / Number(fileInfo.value.size)) * 100);
            }
            if (fileInfo.value && Number(fileInfo.value.size) === receivedSize.value) {
                try {
                    // 下载
                    onDownload();
                    console.log('下载完成');
                } catch (error) {
                    console.error('Error finalizing file transfer', error);
                    ElMessage('文件下载出错，请重试');
                } finally {
                    console.log('下载完成1111');
                    receivedSize.value = 0;
                }
            }
        } else if (message instanceof Blob) {
            const reader = new FileReader();
            // console.log('下载中', reader);
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    receivedChunks.value.push(reader.result);
                    receivedSize.value += reader.result.byteLength;
                    if (fileInfo.value && typeof fileInfo.value.size === 'number') {
                        progress.value = Math.floor((Number(receivedSize.value) / Number(fileInfo.value.size)) * 100);
                    }
                    if (fileInfo.value && Number(fileInfo.value.size) === receivedSize.value) {
                        try {
                            // 下载
                            onDownload();
                            console.log('下载完成');
                        } catch (error) {
                            console.error('Error finalizing file transfer', error);
                            ElMessage('文件下载出错，请重试');
                        } finally {
                            console.log('下载完成1111');
                            receivedSize.value = 0;
                        }
                    }
                }
            };
            reader.readAsArrayBuffer(message);
        } else {
            console.error('Unknown binary message type', message);
        }
    }
};


// 设置数据通道
const setupDataChannel = () => {
    if (dataChannel.value) {
        dataChannel.value.onopen = () => {
            console.log('DataChannel opened')
        }
        dataChannel.value.onclose = () => console.log('DataChannel closed')
        dataChannel.value.onmessage = handleDataChannelMessage
    }
}
onMounted(() => {
    eventBus.on("on-receive-file", handleFileMsg)
})
onBeforeMount(() => {
    eventBus.off("on-receive-file", handleFileMsg)
})
</script>

<style scoped lang="scss">
.get-file{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%
}
.waiting{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    div{
        margin-top: 10px;
    }
}
</style>