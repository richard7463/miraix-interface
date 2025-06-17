// AI模型配置
export const AI_CONFIG = {
  // 通义千问API
  DASHSCOPE: {
    API_KEY: process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || 'sk-a3e1545a11d04a87a9878e86f1e44557',
    API_ENDPOINT: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    MODEL: 'qwen-plus',
    SYSTEM_PROMPT: 'You are a helpful financial assistant specialized in cryptocurrency trading and DeFi operations.'
  }
}; 