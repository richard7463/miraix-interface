// 测试 api/chat 接口的脚本
const fetch = require('node-fetch');

async function testChatAPI() {
  console.log('开始测试 api/chat 接口...');
  
  try {
    // 准备请求数据
    const requestData = {
      prompt: 'You are a helpful financial assistant specialized in cryptocurrency trading and DeFi operations.',
      messages: [],
      input: '比特币是什么？'
    };
    
    console.log('发送请求数据:', JSON.stringify(requestData, null, 2));
    
    const API_BASE_URL = process.env.NODE_ENV === 'production'
      ? 'https://langgraph-defai-git-devworkflow-ritsuyans-projects.vercel.app'
      : 'http://localhost:3009';

    // 发送请求
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }
    
    // 处理流式响应
    console.log('接收到响应，状态码:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      result += chunk;
      console.log('接收到数据块:', chunk);
    }
    
    console.log('完整响应:', result);
    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testChatAPI(); 