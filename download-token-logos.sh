#!/bin/bash

# 创建 tokens 目录
mkdir -p public/tokens

# 下载常用 token logo
echo "Downloading token logos..."

# SOL logo
curl -o public/tokens/sol.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"

# USDC logo
curl -o public/tokens/usdc.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"

# USDT logo
curl -o public/tokens/usdt.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png"

# BONK logo
curl -o public/tokens/bonk.png "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"

# JUP logo (Jupiter)
curl -o public/tokens/jup.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png"

echo "Token logos downloaded successfully!"
ls -la public/tokens/ 