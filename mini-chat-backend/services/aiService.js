const axios = require('axios');

// AI配置
const AI_CONFIG = {
  userId: process.env.AI_USER_ID || 'ai_assistant_001',
  provider: process.env.AI_MODEL_PROVIDER || 'doubao',
  apiKey: process.env.AI_API_KEY || '364982a4-c495-40b6-9bde-70672e8a5404',
  apiUrl: process.env.AI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  endpointId: process.env.AI_ENDPOINT_ID || 'ep-20251028174429-d7w5j',
  userName: process.env.AI_USER_NAME || 'AI助手',
  userAccount: process.env.AI_USER_ACCOUNT || 'ai_assistant',
  userSignature: process.env.AI_USER_SIGNATURE || '我是AI助手，随时为您服务！'
};

/**
 * 调用豆包AI模型获取回复
 * @param {string} userMessage - 用户发送的消息
 * @param {Array} conversationHistory - 对话历史（可选）
 * @returns {Promise<string>} AI的回复
 */
async function getAIResponse(userMessage, conversationHistory = []) {
  try {
    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: '你是一个友好、乐于助人的AI助手。请用简洁、友好的方式回答用户的问题。'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    // 调用豆包API
    const response = await axios.post(
      AI_CONFIG.apiUrl,
      {
        model: AI_CONFIG.endpointId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        timeout: 30000 // 30秒超时
      }
    );

    // 解析AI回复
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiReply = response.data.choices[0].message.content;
      return aiReply.trim();
    } else {
      throw new Error('AI响应格式异常');
    }
  } catch (error) {
    console.error('调用AI服务失败:', error.message);
    
    // 返回友好的错误提示
    if (error.response) {
      console.error('API错误响应:', error.response.data);
      if (error.response.status === 401) {
        return '抱歉，AI服务认证失败，请联系管理员检查API密钥配置。';
      } else if (error.response.status === 429) {
        return '抱歉，当前请求过多，请稍后再试。';
      } else if (error.response.status === 404) {
        return '抱歉，AI服务端点未找到，请联系管理员检查endpoint配置。';
      }
    } else if (error.code === 'ECONNABORTED') {
      return '抱歉，AI响应超时，请稍后再试。';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return '抱歉，无法连接到AI服务，请检查网络连接。';
    }
    
    return '抱歉，我现在遇到了一些问题，请稍后再试。如果问题持续，请联系管理员。';
  }
}

/**
 * 检查是否是发送给AI的消息
 * @param {string} toId - 接收者ID
 * @returns {boolean}
 */
function isAIMessage(toId) {
  console.log(`[isAIMessage] 比较: toId="${toId}" vs AI_CONFIG.userId="${AI_CONFIG.userId}"`);
  console.log(`[isAIMessage] toId类型: ${typeof toId}, AI_CONFIG.userId类型: ${typeof AI_CONFIG.userId}`);
  const result = toId === AI_CONFIG.userId;
  console.log(`[isAIMessage] 结果: ${result}`);
  return result;
}

/**
 * 获取AI用户ID
 * @returns {string}
 */
function getAIUserId() {
  return AI_CONFIG.userId;
}

/**
 * 获取AI用户配置
 * @returns {Object}
 */
function getAIUserConfig() {
  return {
    id: AI_CONFIG.userId,
    account: AI_CONFIG.userAccount,
    name: AI_CONFIG.userName,
    signature: AI_CONFIG.userSignature,
    role: 'ai'
  };
}

/**
 * 测试AI服务连接
 * @returns {Promise<Object>}
 */
async function testAIConnection() {
  try {
    const response = await getAIResponse('你好');
    return {
      success: true,
      message: '连接成功',
      response: response
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

module.exports = {
  getAIResponse,
  isAIMessage,
  getAIUserId,
  getAIUserConfig,
  testAIConnection,
  AI_CONFIG
};

