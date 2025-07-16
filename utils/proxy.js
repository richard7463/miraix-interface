/**
 * 代理工具
 * 用于处理网络请求的代理配置
 */

/**
 * 使用代理发送fetch请求
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @returns {Promise<Response>} fetch响应
 */
async function fetchWithProxy(url, options = {}) {
  try {
    console.log(`[fetchWithProxy] 发送请求: ${url}`);
    
    // 直接使用fetch，不使用代理
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers
      }
    });
    
    console.log(`[fetchWithProxy] 请求成功: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[fetchWithProxy] 请求失败: ${url}`, error.message);
    throw error;
  }
}

module.exports = {
  fetchWithProxy
}; 