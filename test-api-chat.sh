#!/bin/bash

# 测试 api/chat 接口的 curl 脚本
echo "开始测试 api/chat 接口..."

# 准备请求数据
REQUEST_DATA='{
  "prompt": "You are a helpful financial assistant specialized in cryptocurrency trading and DeFi operations.",
  "messages": [],
  "input": "比特币是什么？"
}'

echo "发送请求数据: $REQUEST_DATA"

# 发送请求并保存响应
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$REQUEST_DATA" \
  --no-buffer \
  http://localhost:3000/api/chat

echo -e "\n测试完成!" 