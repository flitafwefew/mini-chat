import EventBus from '@/utils/eventBus.ts'
import { ElMessage } from 'element-plus'

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
          EventBus.emit('on-receive-msg', wsContent.data)
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
        if (wsContent.content) {
          EventBus.emit('on-receive-file', wsContent.content)
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
      ? 'ws://10.33.9.159:3002/ws'     // 开发环境直接连接后端
      : 'ws://10.33.9.159:3002/ws'     // 生产环境直接连接后端
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