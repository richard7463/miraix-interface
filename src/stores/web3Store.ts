// @ts-nocheck
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
// 你可以根据 React 项目需要移除 vue/pinia 相关内容
// import { ref, computed } from 'vue'
// import { defineStore } from 'pinia'
// import { SOLANA_MAIN_PATH, SPL_TOKEN_PROGRAM_ID } from '@/config'
// import { chunkArray, delayCall, generateRandomNumber, queryTokenData, getTransactionStatus } from '@/utils/public'

// 连接到 Solana 网络（这里是主网）
export const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

export const solanaTokenAddress = 'So11111111111111111111111111111111111111112';

export async function fetchTokens(walletAddress: string) {
  const walletPublicKey = new PublicKey(walletAddress)
  // SPL_TOKEN_PROGRAM_ID 可根据需要定义
  const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, { programId: new PublicKey(SPL_TOKEN_PROGRAM_ID) })
  // 获取钱包余额
  const RTbalance = await connection.getBalance(new PublicKey(walletAddress));
  // 解析代币账户数据
  const tokens = tokenAccounts.value
    .map(accountInfo => {
      const { mint, owner, tokenAmount } = accountInfo.account.data.parsed.info
      return {
        mint, // 代币合约地址
        owner, // 所有者地址
        amount: tokenAmount.uiAmount, // 代币数量（用户可读格式）
        decimals: tokenAmount.decimals // 代币精度
      }
    })
    .filter(k => k.mint.endsWith('pump'))
  // 这里 getPumpTokenInfoByAddress 需要你自己实现或 mock
  // const res = await Promise.all(tokens.map((k: any) => getPumpTokenInfoByAddress({ mint: k.mint })))
  // const userPupmTokens = res.map((k: any, index: number) => ({ ...tokens[index], ...k }));
  // userPupmTokens.push({ mint: solanaTokenAddress, balance: RTbalance })
  // return userPupmTokens;
  return tokens;
}

export function getPublicKeyFromPrivateKey(base58PrivateKey: string) {
  if (!base58PrivateKey) return ''
  const secretKey = bs58.decode(base58PrivateKey)
  const keypair = Keypair.fromSecretKey(secretKey)
  return keypair.publicKey.toBase58()
}

export async function getBlockHash() {
  const recentBlockhash = await connection.getRecentBlockhash()
  return recentBlockhash
}

export async function getWalletInfo(base58PrivateKey: string) {
  try {
    const decoded = bs58.decode(base58PrivateKey)
    const keypair = Keypair.fromSecretKey(decoded)
    const publicKey = keypair.publicKey
    const balance = await connection.getBalance(publicKey)
    // USDC 查询逻辑可根据需要实现
    return { balance }
  } catch (error) {
    console.error('Error getting wallet info:', error)
    throw error
  }
} 