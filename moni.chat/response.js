/**
 * 统一的响应工具函数
 * 确保所有响应格式一致，避免 ERR_BAD_RESPONSE 错误
 */

/**
 * 发送成功响应
 * @param {Object} res - Express 响应对象
 * @param {*} data - 响应数据（可以是数组、对象或任何值）
 * @param {string} message - 响应消息
 * @param {number} code - 响应代码，默认 200
 */
const sendSuccess = (res, data = [], message = '操作成功', code = 200) => {
  // 防止多次发送响应
  if (res.headersSent) {
    console.warn('⚠️ 响应已发送，跳过重复发送');
    return;
  }

  // 确保 data 始终是数组（如果为空或 null）
  let responseData = data;
  if (data === null || data === undefined) {
    responseData = [];
  }

  // 确保设置正确的 Content-Type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const response = {
    code: Number(code) || 200,
    message: String(message || '操作成功'),
    data: responseData
  };

  // 验证响应格式
  try {
    const jsonString = JSON.stringify(response);
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
      throw new Error('响应序列化失败');
    }
    res.status(code).json(response);
  } catch (error) {
    console.error('发送响应失败:', error);
    // 如果序列化失败，发送最基本的响应
    if (!res.finished) {
      res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: []
      });
    }
  }
};

/**
 * 发送错误响应
 * @param {Object} res - Express 响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 错误代码，默认 500
 * @param {*} data - 响应数据，默认空数组
 * @param {string} error - 详细错误信息（仅开发环境）
 */
const sendError = (res, message = '服务器内部错误', code = 500, data = [], error = undefined) => {
  // 防止多次发送响应
  if (res.headersSent) {
    console.warn('⚠️ 响应已发送，跳过重复发送错误响应');
    return;
  }

  // 确保 data 始终是数组
  let responseData = [];
  if (Array.isArray(data)) {
    responseData = data;
  } else if (data !== null && data !== undefined) {
    responseData = [data];
  }

  // 确保设置正确的 Content-Type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const response = {
    code: Number(code) || 500,
    message: String(message || '服务器内部错误'),
    data: responseData
  };

  // 仅在开发环境添加详细错误信息
  if (error && process.env.NODE_ENV === 'development') {
    response.error = String(error);
  }

  // 验证响应格式
  try {
    const jsonString = JSON.stringify(response);
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
      throw new Error('响应序列化失败');
    }
    res.status(code).json(response);
  } catch (jsonError) {
    console.error('发送错误响应失败:', jsonError);
    // 如果序列化失败，发送最基本的响应
    if (!res.finished) {
      res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: []
      });
    }
  }
};

module.exports = {
  sendSuccess,
  sendError
};

