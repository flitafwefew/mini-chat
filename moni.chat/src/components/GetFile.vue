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
// ICE候选队列：用于存储远程描述设置前到达的候选
const pendingCandidates = ref<any[]>([])
// 防止并发处理offer的锁
const isProcessingOffer = ref(false)
const fileInfo = ref<{
    name: string,
    size: number,
}>();
const fromId = ref<string>('');
const acceptFile = async () => {
    console.log('📁 用户点击接受文件，fromId:', fromId.value);
    
    // 确保连接已初始化（如果未初始化则初始化）
    if (!pc.value) {
        console.log('📁 连接未初始化，正在初始化 RTCPeerConnection');
        initRTCPeerConnection();
    } else {
        console.log('📁 连接已存在，状态:', pc.value.signalingState);
    }
    
    // 等待 nextTick 确保响应式更新
    await nextTick();
    
    // 再次确认连接已初始化
    if (!pc.value) {
        console.error('❌ 连接初始化失败');
        ElMessage.error('连接初始化失败，请重试');
        return;
    }
    
    isReady.value = true;
    console.log('📁 发送接受文件请求');
    await accept({ userId: fromId.value }).catch((error) => {
        console.error('❌ 发送接受请求出错:', error)
        ElMessage('发送接受请求出错，请重试')
    })
}
// 对话框显示条件：收到文件邀请时显示，即使不在聊天中也要显示
// 但是如果已经在聊天中，优先显示（可以立即看到）
const isDialogVisible = computed(() => {
    if (!fileTransferStore.isGetFile || !fromId.value) {
        return false;
    }
    // 如果当前正在与发送方聊天，显示对话框
    // 如果不在聊天中，也显示对话框（这样用户可以看到文件传输请求）
    return true;
});
// 清理RTCPeerConnection连接
const cleanupConnection = () => {
    console.log('🧹 [GetFile] 开始清理连接');
    
    // 清理数据通道
    if (dataChannel.value) {
        try {
            dataChannel.value.close();
        } catch (e) {
            console.warn('⚠️ [GetFile] 关闭数据通道时出错:', e);
        }
        dataChannel.value = null;
    }
    
    // 清理RTCPeerConnection
    if (pc.value) {
        try {
            // 移除所有事件监听器
            pc.value.onicecandidate = null;
            pc.value.ondatachannel = null;
            pc.value.oniceconnectionstatechange = null;
            // 关闭连接
            pc.value.close();
        } catch (e) {
            console.warn('⚠️ [GetFile] 关闭连接时出错:', e);
        }
        pc.value = null;
    }
    
    // 重置状态
    isReady.value = false;
    progress.value = 0;
    receivedChunks.value = [];
    receivedSize.value = 0;
    pendingCandidates.value = [];
    isProcessingOffer.value = false;
    
    console.log('✅ [GetFile] 连接清理完成');
}

const cancelTransfer = () => {
    console.log('❌ [GetFile] 用户取消文件传输');
    cleanupConnection();
    fileTransferStore.cancelFile(useUserStore().user?.id.toString() as string);
}
const fileTransferTitle = computed(() => {
    if (!fileInfo.value) return '';
    
    // 尝试从 userMap 获取发送方用户名
    const userStore = useUserStore();
    const senderName = userStore.userMap[fromId.value]?.name || 
                       (messageStore.targetId === fromId.value ? messageStore.chatName : '') ||
                       '未知用户';
    
    return `来自${senderName}的文件传输请求`;
});
// 初始化 RTCPeerConnection
const initRTCPeerConnection = () => {
    // 如果已有连接，先清理
    if (pc.value) {
        console.log('⚠️ [GetFile] 检测到已有连接，先清理旧连接');
        cleanupConnection();
    }
    
    // 清空候选队列和状态，开始新的连接
    pendingCandidates.value = [];
    isProcessingOffer.value = false;
    
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
        // 修复：应该发送给发送方（fromId），而不是当前聊天对象
        console.log('📤 发送 ICE candidate 到用户:', fromId.value);
        await candidate({ userId: fromId.value, candidate: event.candidate }).catch((error) => {
            console.error('❌ 发送 ICE 候选出错:', error)
        })
    }
}
const handleICEConnectionStateChangeEvent = () => {
    if (pc.value) {
        const state = pc.value.iceConnectionState;
        console.log('🔌 ICE 连接状态变化:', state);
        if (state === 'connected') {
            console.log('✅ ICE 连接已建立');
        } else if (state === 'disconnected' || state === 'failed') {
            console.error('❌ ICE 连接已断开或失败:', state);
            ElMessage('文件传输连接已断开，请重试')
        }
    }
}
const handleFileMsg = (msg: any) => {
    console.log('📁 收到文件传输消息 GetFileMsg:', msg);
    switch (msg.type) {
        case 'invite':
            console.log('📁 收到文件传输邀请 invite');
            console.log('📁 invite消息内容:', msg);
            fromId.value = String(msg.fromId || msg.userId); // 兼容两种格式
            fileTransferStore.isGetFile = true;
            fileTransferStore.targetId = String(msg.fromId || msg.userId); // 保存发送者ID
            
            if (msg.fileInfo) {
                fileInfo.value = {
                    name: msg.fileInfo.name,
                    size: msg.fileInfo.size
                }
            } else {
                console.warn('⚠️ invite消息缺少fileInfo字段');
                fileInfo.value = {
                    name: '未知文件',
                    size: 0
                }
            }
            
            console.log('📁 文件信息 fileInfo:', fileInfo.value);
            console.log('📁 发送者ID fromId:', fromId.value);
            console.log('📁 当前聊天对象 targetId:', messageStore.targetId);
            console.log('📁 对话框是否显示:', isDialogVisible.value);
            break;
        case 'cancel':
            console.log('❌ [GetFile] 收到取消文件传输消息');
            cleanupConnection();
            fileTransferStore.isGetFile = false
            fileTransferStore.isSendFile = false
            break;

        case 'offer':
            handleFileOfferMsg(msg)
            break
        case 'candidate':
            console.log('📥 [GetFile] 处理candidate消息');
            // 即使远程描述未设置，也会将候选加入队列，等待后续处理
            handleNewICECandidateMsg(msg)
            break
        default:
            break;
    }
}
const handleFileOfferMsg = async (data: { desc: any }) => {
    console.log('📥 接收到offer消息，handleFileOfferMsg', data);
    console.log('📥 fromId:', fromId.value);
    
    // 防止并发处理
    if (isProcessingOffer.value) {
        console.warn('⚠️ [GetFile] 已有offer正在处理中，忽略重复的offer消息');
        return;
    }
    
    try {
        if (!data || !data.desc) {
            console.error('❌ offer消息数据不完整', data);
            ElMessage.error('文件邀请消息格式错误，请重试');
            return;
        }
        
        if (!pc.value) {
            console.warn('⚠️ [GetFile] pc.value 为空，收到offer但连接未初始化，尝试自动初始化');
            // 如果连接未初始化，尝试初始化（可能用户在对话框外操作或offer提前到达）
            initRTCPeerConnection();
            
            if (!pc.value) {
                console.error('❌ [GetFile] 连接初始化失败，无法处理offer');
                ElMessage.error('连接未初始化，请重试');
                return;
            }
            console.log('✅ [GetFile] 连接已自动初始化');
        }
        
        // 检查连接状态，确保可以处理offer
        const currentState = pc.value.signalingState;
        console.log('📥 [GetFile] 当前连接状态:', currentState);
        
        // 如果已经在处理中（have-remote-offer或have-local-pranswer），说明可能重复收到offer
        if (currentState === 'have-remote-offer' || currentState === 'have-local-pranswer' || currentState === 'stable') {
            console.warn('⚠️ [GetFile] 连接状态异常，状态:', currentState, '可能已处理过此offer');
            // 如果已经有远程描述且状态正确，可能只需要发送answer，但这里我们重置状态或忽略
            if (currentState === 'stable' && pc.value.localDescription) {
                console.log('ℹ️ [GetFile] 连接已稳定且有本地描述，可能已经发送过answer');
                return;
            }
        }
        
        // 验证desc格式
        if (!data.desc.type || !data.desc.sdp) {
            console.error('❌ offer desc格式不正确', data.desc);
            ElMessage.error('文件邀请消息格式错误，请重试');
            return;
        }
        
        isProcessingOffer.value = true;
        
        console.log('📥 创建RTCSessionDescription（offer），类型:', data.desc.type);
        const desc = new RTCSessionDescription({
            type: data.desc.type,
            sdp: data.desc.sdp
        });
        
        console.log('📥 设置远程描述（offer）前的状态:', pc.value.signalingState);
        console.log('📥 设置远程描述（offer）...');
        
        try {
            await pc.value.setRemoteDescription(desc);
        } catch (setRemoteError: any) {
            console.error('❌ 设置远程描述失败:', setRemoteError);
            console.error('❌ 设置失败时的连接状态:', pc.value.signalingState);
            ElMessage.error(`设置远程描述失败: ${setRemoteError.message || '未知错误'}`);
            isProcessingOffer.value = false;
            return;
        }
        
        console.log('✅ 已设置远程描述（offer），新状态:', pc.value.signalingState);
        console.log('✅ 远程描述类型:', pc.value.remoteDescription?.type);
        
        // 验证远程描述已正确设置
        if (!pc.value.remoteDescription) {
            console.error('❌ 远程描述为null，设置失败');
            ElMessage.error('设置远程描述失败，请重试');
            isProcessingOffer.value = false;
            return;
        }
        
        if (pc.value.remoteDescription.type !== 'offer') {
            console.error('❌ 远程描述类型不正确，期望offer，实际:', pc.value.remoteDescription.type);
            ElMessage.error('远程描述类型错误，请重试');
            isProcessingOffer.value = false;
            return;
        }
        
        // 验证状态 - 设置远程offer后应该进入 have-remote-offer 状态
        const expectedState = 'have-remote-offer';
        if (pc.value.signalingState !== expectedState) {
            console.error('❌ 远程描述设置后状态不正确，期望:', expectedState, '实际:', pc.value.signalingState);
            console.error('❌ 当前连接状态详情:', {
                signalingState: pc.value.signalingState,
                connectionState: pc.value.connectionState,
                iceConnectionState: pc.value.iceConnectionState,
                remoteDescription: pc.value.remoteDescription,
                localDescription: pc.value.localDescription
            });
            
            // 如果状态是 stable，可能是因为已经有本地描述（不应该发生，说明已经处理过）
            if (pc.value.signalingState === 'stable') {
                if (pc.value.localDescription) {
                    console.warn('⚠️ 状态为stable且已有本地描述，可能已经处理过此offer');
                    ElMessage.warning('该文件邀请可能已处理，请检查');
                } else {
                    console.error('❌ 状态为stable但无本地描述，连接异常');
                    ElMessage.error('连接状态异常，请重试');
                }
                isProcessingOffer.value = false;
                return;
            } else {
                ElMessage.error(`连接状态异常 (${pc.value.signalingState})，请重试`);
                isProcessingOffer.value = false;
                return;
            }
        }
        
        // 设置远程描述后，处理之前队列中的ICE候选
        console.log('📦 [GetFile] 处理待处理的ICE候选队列...');
        await processPendingCandidates();
        
        // 再次检查状态，确保可以创建answer
        const stateBeforeAnswer = pc.value.signalingState;
        console.log('📥 [GetFile] 创建answer前状态检查:', stateBeforeAnswer);
        console.log('📥 [GetFile] 远程描述是否存在:', !!pc.value.remoteDescription);
        console.log('📥 [GetFile] 本地描述是否存在:', !!pc.value.localDescription);
        
        if (stateBeforeAnswer !== 'have-remote-offer' && stateBeforeAnswer !== 'have-local-pranswer') {
            console.error('❌ 无法创建answer，当前状态不正确:', stateBeforeAnswer);
            console.error('❌ 远程描述:', pc.value.remoteDescription);
            console.error('❌ 本地描述:', pc.value.localDescription);
            ElMessage.error(`连接状态异常 (${stateBeforeAnswer})，无法创建answer`);
            isProcessingOffer.value = false;
            return;
        }
        
        // 确保远程描述已正确设置
        if (!pc.value.remoteDescription || pc.value.remoteDescription.type !== 'offer') {
            console.error('❌ 远程描述未正确设置或类型不是offer');
            console.error('❌ 远程描述:', pc.value.remoteDescription);
            ElMessage.error('远程描述未正确设置，无法创建answer');
            isProcessingOffer.value = false;
            return;
        }
        
        console.log('📥 创建answer...');
        console.log('📥 [GetFile] 最终状态验证 - signalingState:', pc.value.signalingState);
        
        // 在调用前最后再次检查状态（防止异步竞态条件）
        if (pc.value.signalingState !== 'have-remote-offer' && pc.value.signalingState !== 'have-local-pranswer') {
            console.error('❌ 最终状态检查失败，状态已改变为:', pc.value.signalingState);
            ElMessage.error(`连接状态异常 (${pc.value.signalingState})，无法创建answer`);
            isProcessingOffer.value = false;
            return;
        }
        
        let answerFile;
        try {
            answerFile = await pc.value.createAnswer();
        } catch (createError: any) {
            console.error('❌ 创建answer失败:', createError);
            console.error('❌ 创建answer时的连接状态:', pc.value.signalingState);
            console.error('❌ 远程描述:', pc.value.remoteDescription);
            console.error('❌ 本地描述:', pc.value.localDescription);
            ElMessage.error(`创建answer失败: ${createError.message || '未知错误'}`);
            isProcessingOffer.value = false;
            return;
        }
        
        console.log('📥 answer创建成功，类型:', answerFile.type);
        
        console.log('📥 设置本地描述（answer）...');
        try {
            await pc.value.setLocalDescription(answerFile);
        } catch (setLocalError: any) {
            console.error('❌ 设置本地描述失败:', setLocalError);
            ElMessage.error(`设置本地描述失败: ${setLocalError.message || '未知错误'}`);
            isProcessingOffer.value = false;
            return;
        }
        
        console.log('✅ 已创建并设置本地answer，新状态:', pc.value.signalingState);
        
        // 验证本地描述
        if (!pc.value.localDescription) {
            console.error('❌ 本地描述设置失败');
            ElMessage.error('创建文件响应失败，请重试');
            isProcessingOffer.value = false;
            return;
        }
        
        // 准备发送的answer数据
        const answerDesc = {
            type: pc.value.localDescription.type,
            sdp: pc.value.localDescription.sdp
        };
        
        console.log('📤 发送answer到用户:', fromId.value);
        console.log('📤 answer描述类型:', answerDesc.type, 'sdp长度:', answerDesc.sdp?.length || 0);
        
        await answer({ 
            userId: fromId.value, 
            desc: answerDesc 
        });
        
        console.log('✅ answer发送成功');
    } catch (error: any) {
        console.error('❌ 处理文件邀请消息出错:', error);
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            data: data,
            connectionState: pc.value?.signalingState,
            hasRemoteDesc: !!pc.value?.remoteDescription,
            hasLocalDesc: !!pc.value?.localDescription
        });
        
        let errorMsg = '处理文件邀请消息出错，请重试';
        if (error.message) {
            errorMsg = `处理文件邀请消息出错: ${error.message}`;
        }
        ElMessage.error(errorMsg);
    } finally {
        isProcessingOffer.value = false;
    }
}

// 处理新的 ICE 候选消息
const handleNewICECandidateMsg = async (data: { candidate: any }) => {
    try {
        if (!pc.value) {
            console.warn('⚠️ [GetFile] pc.value 为空，暂存候选');
            pendingCandidates.value.push(data.candidate);
            return;
        }
        
        // 检查是否已经设置了远程描述
        if (pc.value.remoteDescription) { 
            console.log('✅ [GetFile] 远程描述已设置，直接添加候选');
            const candidate = new RTCIceCandidate(data.candidate);
            await pc.value.addIceCandidate(candidate);
        } else {
            // 远程描述未设置，将候选加入队列等待处理
            console.log('📦 [GetFile] 远程描述未设置，将候选加入队列');
            pendingCandidates.value.push(data.candidate);
        }
    } catch (error: any) {
        console.error('❌ [GetFile] 处理新的 ICE 候选消息出错:', error);
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
        console.warn('⚠️ [GetFile] 远程描述未设置，无法处理待处理候选');
        return;
    }
    
    if (pendingCandidates.value.length === 0) {
        console.log('✅ [GetFile] 没有待处理的候选');
        return;
    }
    
    console.log(`📦 [GetFile] 开始处理 ${pendingCandidates.value.length} 个待处理的候选`);
    
    const candidates = [...pendingCandidates.value];
    pendingCandidates.value = []; // 清空队列
    
    for (const candidateData of candidates) {
        try {
            const candidate = new RTCIceCandidate(candidateData);
            await pc.value.addIceCandidate(candidate);
            console.log('✅ [GetFile] 候选已添加');
        } catch (error: any) {
            console.error('❌ [GetFile] 添加候选失败:', error);
            // 如果候选无效或已过期，继续处理下一个
            if (error.message && error.message.includes('already have this candidate')) {
                console.log('ℹ️ [GetFile] 候选已存在，跳过');
            }
        }
    }
    
    console.log(`✅ [GetFile] 已完成处理所有待处理的候选`);
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
            const buffer = message instanceof ArrayBuffer ? message : new ArrayBuffer((message as Uint8Array).buffer.byteLength);
            if (message instanceof Uint8Array) {
                new Uint8Array(buffer).set(message);
            }
            receivedChunks.value.push(buffer);
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
    console.log('📁 GetFile 组件已挂载，开始监听文件传输事件');
    eventBus.on("on-receive-file", handleFileMsg)
})
onBeforeMount(() => {
    console.log('📁 GetFile 组件即将卸载，移除文件传输事件监听');
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