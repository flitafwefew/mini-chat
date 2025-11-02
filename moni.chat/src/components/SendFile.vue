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
    console.log('📨 [SendFile] 收到文件消息:', msg);
    console.log('📨 [SendFile] 消息类型:', msg.type);
    console.log('📨 [SendFile] 当前pc状态:', {
        pc存在: !!pc.value,
        localDescription: pc.value?.localDescription ? `${pc.value.localDescription.type}` : '未设置',
        remoteDescription: pc.value?.remoteDescription ? `${pc.value.remoteDescription.type}` : '未设置',
        iceConnectionState: pc.value?.iceConnectionState || 'N/A'
    });
    
    switch (msg.type) {
        case 'answer':
            console.log('📥 [SendFile] 处理answer消息');
            handleFileAnswerMsg(msg);
            break;
        case 'candidate':
            console.log('📥 [SendFile] 处理candidate消息');
            // 即使远程描述未设置，也会将候选加入队列，等待后续处理
            handleNewICECandidateMsg(msg);
            break;
        case 'accept':
            console.log('📥 [SendFile] 处理accept消息');
            isLoading.value = false;
            onOffer();
            break;
        case 'cancel':
            console.log('📥 [SendFile] 处理cancel消息');
            fileTransferStore.isGetFile = false;
            fileTransferStore.isSendFile = false;
            isLoading.value = false;
            break;
        default:
            console.warn('⚠️ [SendFile] 未知的文件消息类型:', msg.type);
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
        const targetId = fileTransferStore.targetId || useMessageStore().targetId;
        console.log('📤 发送 ICE candidate 到用户:', targetId);
        candidate({ userId: targetId, candidate: event.candidate }).catch((error) => {
            console.error('❌ 发送 ICE 候选出错:', error)
        })
    }
}

// 处理 ICE 连接状态变化事件
const handleICEConnectionStateChangeEvent = () => {
    if (pc.value) {
        const state = pc.value.iceConnectionState;
        console.log('🔌 ICE 连接状态变化:', state);
        if (state === 'connected') {
            console.log('✅ ICE 连接已建立');
        } else if (state === 'disconnected' || state === 'failed') {
            console.error('❌ ICE 连接已断开或失败:', state);
            ElMessage('文件传输连接已断开，请重试')
            visible.value = false
        }
    }
}
// 处理文件响应消息
const handleFileAnswerMsg = async (data: { desc: any }) => {
    console.log('📥 [handleFileAnswerMsg] 接收到answer消息', data);
    console.log('📥 [handleFileAnswerMsg] 当前连接状态:', {
        pc存在: !!pc.value,
        localDescription: pc.value?.localDescription ? {
            type: pc.value.localDescription.type,
            sdp长度: pc.value.localDescription.sdp?.length || 0
        } : null,
        remoteDescription: pc.value?.remoteDescription ? pc.value.remoteDescription.type : null,
        connectionState: pc.value?.connectionState || 'N/A',
        iceConnectionState: pc.value?.iceConnectionState || 'N/A'
    });
    
    try {
        // 检查数据完整性
        if (!data) {
            console.error('❌ [handleFileAnswerMsg] answer消息数据为空');
            ElMessage.error('收到无效的文件响应消息，请重试');
            return;
        }
        
        if (!data.desc) {
            console.error('❌ [handleFileAnswerMsg] answer消息缺少desc字段', data);
            ElMessage.error('文件响应消息格式错误，请重试');
            return;
        }
        
        // 验证desc格式
        if (!data.desc.type || !data.desc.sdp) {
            console.error('❌ [handleFileAnswerMsg] answer desc格式不正确', {
                desc: data.desc,
                type存在: !!data.desc.type,
                sdp存在: !!data.desc.sdp
            });
            ElMessage.error('文件响应消息格式错误，请重试');
            return;
        }
        
        if (!pc.value) {
            console.error('❌ [handleFileAnswerMsg] pc.value 为空，无法处理answer');
            ElMessage.error('连接未初始化，请重试');
            return;
        }
        
        // 检查是否已经设置了本地描述（offer）
        if (!pc.value.localDescription) {
            console.error('❌ [handleFileAnswerMsg] 本地描述未设置，无法处理answer');
            console.error('提示：这可能是因为offer尚未创建，或者连接已重置');
            ElMessage.error('连接状态异常：本地描述未设置，请重试');
            return;
        }
        
        // 检查本地描述类型是否正确（应该是offer）
        if (pc.value.localDescription.type !== 'offer') {
            console.error('❌ [handleFileAnswerMsg] 本地描述类型错误，期望offer，实际:', pc.value.localDescription.type);
            ElMessage.error('连接状态异常：本地描述类型错误，请重试');
            return;
        }
        
        // 检查是否已经设置了远程描述（避免重复设置）
        if (pc.value.remoteDescription) {
            console.warn('⚠️ [handleFileAnswerMsg] 远程描述已设置，类型:', pc.value.remoteDescription.type);
            if (pc.value.remoteDescription.type === 'answer') {
                console.log('✅ [handleFileAnswerMsg] answer已经处理过，跳过');
                return;
            }
        }
        
        console.log('📥 [handleFileAnswerMsg] 创建RTCSessionDescription，类型:', data.desc.type);
        console.log('📥 [handleFileAnswerMsg] SDP长度:', data.desc.sdp?.length || 0);
        
        const desc = new RTCSessionDescription({
            type: data.desc.type,
            sdp: data.desc.sdp
        });
        
        console.log('📥 [handleFileAnswerMsg] 设置远程描述（answer）...');
        await pc.value.setRemoteDescription(desc);
        console.log('✅ [handleFileAnswerMsg] 已成功设置远程描述（answer）');
        console.log('✅ [handleFileAnswerMsg] 当前连接状态:', {
            connectionState: pc.value.connectionState,
            iceConnectionState: pc.value.iceConnectionState
        });
        
        // 设置远程描述后，处理之前队列中的ICE候选
        console.log('📦 [handleFileAnswerMsg] 处理待处理的ICE候选队列...');
        await processPendingCandidates();
    } catch (error: any) {
        console.error('❌ [handleFileAnswerMsg] 处理文件响应消息出错:', error);
        console.error('❌ [handleFileAnswerMsg] 错误详情:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            接收到的数据: data,
            当前pc状态: {
                localDescription: pc.value?.localDescription ? pc.value.localDescription.type : null,
                remoteDescription: pc.value?.remoteDescription ? pc.value.remoteDescription.type : null,
                connectionState: pc.value?.connectionState || 'N/A',
                iceConnectionState: pc.value?.iceConnectionState || 'N/A'
            }
        });
        
        let errorMsg = '处理文件响应消息出错，请重试';
        if (error.message) {
            // 提供更具体的错误信息
            if (error.message.includes('InvalidStateError')) {
                errorMsg = '连接状态错误：可能已设置过远程描述';
            } else if (error.message.includes('InvalidSessionDescriptionError')) {
                errorMsg = '文件响应消息格式无效，请重试';
            } else {
                errorMsg = `处理文件响应消息出错: ${error.message}`;
            }
        }
        ElMessage.error(errorMsg);
        
        // 如果设置远程描述失败，可能需要重新建立连接
        if (pc.value) {
            console.log('🔄 [handleFileAnswerMsg] 尝试重新初始化连接...');
            const connectionState = pc.value.connectionState;
            const iceConnectionState = pc.value.iceConnectionState;
            pc.value.close();
            pc.value = null;
            dataChannel.value = null;
            isReady.value = false;
            progress.value = 0;
            console.log('🔄 [handleFileAnswerMsg] 连接已清理，之前的连接状态:', {
                connectionState,
                iceConnectionState
            });
        }
    }
}
// 处理新的 ICE 候选消息
const handleNewICECandidateMsg = async (data: { candidate: any }) => {
    try {
        if (!pc.value) {
            console.warn('⚠️ [handleNewICECandidateMsg] pc.value 为空，暂存候选');
            pendingCandidates.value.push(data.candidate);
            return;
        }
        
        // 检查是否已经设置了远程描述
        if (pc.value.remoteDescription) { 
            console.log('✅ [handleNewICECandidateMsg] 远程描述已设置，直接添加候选');
            const candidate = new RTCIceCandidate(data.candidate);
            await pc.value.addIceCandidate(candidate);
        } else {
            // 远程描述未设置，将候选加入队列等待处理
            console.log('📦 [handleNewICECandidateMsg] 远程描述未设置，将候选加入队列');
            pendingCandidates.value.push(data.candidate);
        }
    } catch (error: any) {
        console.error('❌ [handleNewICECandidateMsg] 处理新的 ICE 候选消息出错:', error);
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
        console.warn('⚠️ [processPendingCandidates] 远程描述未设置，无法处理待处理候选');
        return;
    }
    
    if (pendingCandidates.value.length === 0) {
        console.log('✅ [processPendingCandidates] 没有待处理的候选');
        return;
    }
    
    console.log(`📦 [processPendingCandidates] 开始处理 ${pendingCandidates.value.length} 个待处理的候选`);
    
    const candidates = [...pendingCandidates.value];
    pendingCandidates.value = []; // 清空队列
    
    for (const candidateData of candidates) {
        try {
            const candidate = new RTCIceCandidate(candidateData);
            await pc.value.addIceCandidate(candidate);
            console.log('✅ [processPendingCandidates] 候选已添加');
        } catch (error: any) {
            console.error('❌ [processPendingCandidates] 添加候选失败:', error);
            // 如果候选无效或已过期，继续处理下一个
            if (error.message && error.message.includes('already have this candidate')) {
                console.log('ℹ️ [processPendingCandidates] 候选已存在，跳过');
            }
        }
    }
    
    console.log(`✅ [processPendingCandidates] 已完成处理所有待处理的候选`);
}
const onOffer = async () => {
    isReady.value = true
    await nextTick(async () => {
        console.log('🎯 [onOffer] 开始创建offer...');
        initRTCPeerConnection()
        try {
            if (!pc.value) {
                console.error('❌ [onOffer] pc.value 为空');
                ElMessage.error('连接初始化失败，请重试');
                return;
            }
            
            console.log('📤 [onOffer] 创建offer...');
            const offerFile = await pc.value.createOffer();
            console.log('📤 [onOffer] offer创建成功，类型:', offerFile.type);
            
            console.log('📤 [onOffer] 设置本地描述（offer）...');
            await pc.value.setLocalDescription(offerFile);
            console.log('✅ [onOffer] 本地描述已设置');
            
            // 验证本地描述是否已设置
            if (!pc.value.localDescription) {
                console.error('❌ [onOffer] 本地描述设置失败');
                ElMessage.error('创建文件邀请失败，请重试');
                return;
            }
            
            // 准备发送的offer数据
            const offerDesc = {
                type: pc.value.localDescription.type,
                sdp: pc.value.localDescription.sdp
            };
            
            console.log('📤 [onOffer] offer描述类型:', offerDesc.type, 'sdp长度:', offerDesc.sdp?.length || 0);
            
            // 修复：优先使用 fileTransferStore.targetId，如果没有则使用 messageStore.targetId
            const targetUserId = fileTransferStore.targetId || useMessageStore().targetId
            console.log('📤 [onOffer] 发送 offer 到用户:', targetUserId);
            await offer({ userId: targetUserId, desc: offerDesc });
            console.log('✅ [onOffer] offer发送成功');
        } catch (error: any) {
            console.error('❌ [onOffer] 发送文件邀请出错:', error);
            console.error('错误详情:', {
                message: error.message,
                stack: error.stack
            });
            
            let errorMsg = '发送文件邀请出错，请重试';
            if (error.message) {
                errorMsg = `发送文件邀请出错: ${error.message}`;
            }
            ElMessage.error(errorMsg);
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