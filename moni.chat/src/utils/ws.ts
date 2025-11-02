import EventBus from '@/utils/eventBus.ts'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/module/useUserStore'

interface WSMessage {
  type: 'message' | 'message_sent' | 'typing' | 'pong' | 'error' | 'notify' | 'video' | 'file';
  data?: {
    id?: string;
    from_id?: string;
    to_id?: string;
    msg_content?: string;
    type?: string;
    create_time?: string;
    status?: string;
    is_typing?: boolean;
    [key: string]: any;
  };
  content?: {
    content?: string;
    [key: string]: any;
  };
  message?: string;
}

let ws: WebSocket | null = null
let heartTimer: number | null = null
let timer: number | null = null
let lockReconnect = false
let token: string | null = null
const reconnectCountMax = 200
let reconnectCount = 0
let isConnect = false

function response(event: MessageEvent) {
  if (event.type !== 'message') {
    onCloseHandler()
    return
  }
  let wsContent: WSMessage
  try {
    wsContent = JSON.parse(event.data)
  } catch {
    onCloseHandler()
    return
  }
  
  if (wsContent.type) {
    switch (wsContent.type) {
      case 'message': {
        if (wsContent.data) {
          // 转换后端的snake_case字段为前端的camelCase字段
          const userStore = useUserStore()
          const fromUser = userStore.userMap[wsContent.data.from_id || '']
          
          const transformedData = {
            id: wsContent.data.id,
            fromId: wsContent.data.from_id,
            toId: wsContent.data.to_id,
            message: wsContent.data.msg_content,
            type: wsContent.data.type,
            source: wsContent.data.source,
            createTime: wsContent.data.create_time,
            updateTime: wsContent.data.update_time || wsContent.data.create_time,
            fromInfo: wsContent.data.fromInfo || (fromUser ? {
              id: fromUser.id,
              name: fromUser.name,
              avatar: fromUser.avatar,
              type: 'user',
              badge: null
            } : {
              id: wsContent.data.from_id,
              name: wsContent.data.from_id === 'ai_assistant_001' ? 'AI助手' : '未知用户',
              avatar: null,
              type: 'user',
              badge: null
            }),
            referenceMsg: null,
            atUser: null,
            isShowTime: false
          }
          EventBus.emit('on-receive-msg', transformedData)
        }
        break
      }
      case 'message_sent': {
        if (wsContent.data) {
          EventBus.emit('on-message-sent', wsContent.data)
        }
        break
      }
      case 'typing': {
        if (wsContent.data) {
          EventBus.emit('on-typing', wsContent.data)
        }
        break
      }
      case 'pong': {
        // 心跳响应
        break
      }
      case 'error': {
        if (wsContent.message) {
          ElMessage.error(wsContent.message)
        }
        break
      }
      case 'notify': {
        if (wsContent.content?.content) {
          try {
            wsContent.content.content = JSON.parse(wsContent.content.content)
            EventBus.emit('on-receive-notify', wsContent.content)
          } catch (e) {
            console.error('Failed to parse notify content:', e)
          }
        }
        break
      }
      case 'video': {
        if (wsContent.content) {
          EventBus.emit('on-receive-video', wsContent.content)
        }
        break
      }
      case 'file': {
        console.log('📁 [WebSocket] 收到文件传输消息:', wsContent);
        console.log('📁 [WebSocket] 消息类型:', wsContent.type);
        console.log('📁 [WebSocket] content内容:', wsContent.content);
        if (wsContent.content) {
          console.log('📁 [WebSocket] content类型:', wsContent.content.type);
          if (wsContent.content.type === 'answer') {
            console.log('📁 [WebSocket] answer消息 - desc:', wsContent.content.desc ? {
              type: wsContent.content.desc.type,
              sdp长度: wsContent.content.desc.sdp?.length || 0,
              sdp前50字符: wsContent.content.desc.sdp?.substring(0, 50) || 'N/A'
            } : 'desc为空');
          }
          console.log('📁 [WebSocket] 发送 on-receive-file 事件，内容:', wsContent.content);
          EventBus.emit('on-receive-file', wsContent.content)
        } else {
          console.warn('⚠️ [WebSocket] 文件消息缺少 content 字段');
        }
        break
      }
    }
  } else {
    onCloseHandler()
  }
}

function connect(tokenStr: string) {
  if (isConnect || ws) {
    console.log('⚠️ WebSocket已连接或正在连接中，跳过重复连接')
    return
  }
  
  console.log('🔌 开始连接WebSocket...')
  
  // 重置重连状态
  lockReconnect = false
  reconnectCount = 0
  
  isConnect = true
  token = tokenStr
  try {
    // 根据环境选择WebSocket地址
    const wsIp = import.meta.env.DEV 
      ? 'ws://10.34.39.65:3002/ws'     // 开发环境直接连接后端
      : 'ws://10.34.39.65:3002/ws'     // 生产环境直接连接后端
    ws = new WebSocket(wsIp + '?token=' + token)
    ws.onopen = () => {
      console.log('✅ WebSocket连接成功')
      clearTimer()
      sendHeartPack()
    }

    ws.onmessage = response
    ws.onclose = onCloseHandler
    ws.onerror = onCloseHandler
  } catch (error) {
    console.error('❌ WebSocket连接失败:', error)
    onCloseHandler()
  }
}

function send(msg: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (typeof msg === 'string') {
      ws.send(msg)
    } else {
      ws.send(JSON.stringify(msg))
    }
  }
}

// 发送聊天消息
function sendMessage(toId: string, content: string, messageType: string = 'text') {
  send({
    type: 'chat',
    to_id: toId,
    msg_content: content,
    messageType
  })
}

// 发送正在输入状态
function sendTyping(toId: string, isTyping: boolean) {
  send({
    type: 'typing',
    to_id: toId,
    is_typing: isTyping
  })
}

const sendHeartPack = () => {
  heartTimer = setInterval(() => {
    send({ type: 'ping' })
  }, 30000)
}

const onCloseHandler = () => {
  clearHeartPackTimer()
  if (ws) {
    ws.close()
    ws = null
  }
  isConnect = false
  if (lockReconnect) return
  lockReconnect = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (reconnectCount >= reconnectCountMax) {
    reconnectCount = 0
    return
  }
  if (token) {
    timer = setTimeout(() => {
      connect(token!)
      reconnectCount++
      lockReconnect = false
    }, 5000)
  }
}

const clearHeartPackTimer = () => {
  console.log('Closing connection')
  if (heartTimer) {
    clearInterval(heartTimer)
    heartTimer = null
  }
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const disConnect = () => {
  console.log('🔌 开始断开WebSocket连接...')
  
  // 停止重连
  lockReconnect = true
  reconnectCount = 0
  
  // 清理所有定时器
  clearHeartPackTimer()
  clearTimer()
  
  // 重置状态
  token = null
  isConnect = false
  
  // 关闭连接
  if (ws) {
    ws.close()
    ws = null
  }
  
  console.log('✅ WebSocket连接已完全断开')
}

const isConnected = () => {
  return isConnect && ws && ws.readyState === WebSocket.OPEN
}

export default { 
  connect, 
  disConnect, 
  sendMessage, 
  sendTyping,
  isConnected
}