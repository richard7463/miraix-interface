// @ts-nocheck
import { local } from '@/utils/storage'
// import { useWeb3Store } from './stores/web3Store'

// 获取随机数
export const randomInt = (end: number, start?: number) => {
  if (!end) return 0
  const number = start || 0
  return number + Math.floor(Math.random() * (end - number))
}

//将私钥转换成公钥文本
export function get_publicKey(c_pri) {
  const privateKeyBytes = bs58.decode(c_pri);
  const fromKeypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
  const address = fromKeypair.publicKey.toString();
  return address;
}

export const getBigUint64 = (data, offset, littleEndian) => {
  const datauint8 = new Uint8Array(data);
  const view_x = new DataView(datauint8.buffer);
  const low = view_x.getUint32(offset, littleEndian); // 低32位
  const high = view_x.getUint32(offset + 4, littleEndian); // 高32位
  return (BigInt(high) << BigInt(32)) | BigInt(low); // 组合成64位
};

// 获取浏览器类型
export const getBrowser = () => {
  var UserAgent = navigator.userAgent.toLowerCase()
  var browserInfo = {}
  var browserArray = {
    // @ts-ignore
    IE: window.ActiveXObject || 'ActiveXObject' in window, // IE
    Chrome: UserAgent.indexOf('chrome') > -1 && UserAgent.indexOf('safari') > -1, // Chrome浏览器
    Firefox: UserAgent.indexOf('firefox') > -1, // 火狐浏览器
    Opera: UserAgent.indexOf('opera') > -1, // Opera浏览器
    Safari: UserAgent.indexOf('safari') > -1 && UserAgent.indexOf('chrome') == -1, // safari浏览器
    Edge: UserAgent.indexOf('edge') > -1, // Edge浏览器
    Quark: UserAgent.indexOf('quark') > -1, // 夸克浏览器
    Baidu: UserAgent.indexOf('baidu') > -1, // 百度浏览器
    MetaSr: UserAgent.indexOf('metasr') > -1, // 搜狗浏览器
    LBBROWSER: UserAgent.indexOf('lbbrowser') > -1, // 猎豹浏览器
    '360Browser': UserAgent.indexOf('360SE') !== -1 || UserAgent.indexOf('360EE') !== -1, // 360浏览器
    Maxthon: UserAgent.indexOf('maxthon') > -1, // 遨游浏览器
    UC: UserAgent.indexOf('ucbrowser') > -1, // UC浏览器
    TheWorld: UserAgent.indexOf('theworld') > -1, // 世界之窗浏览器
    QQBrowser: /qqbrowser/.test(UserAgent) || UserAgent.indexOf('qqbrowser') > -1, // qq浏览器
    WeixinBrowser: /MicroMessenger/i.test(UserAgent) // 微信浏览器
  }
  for (var i in browserArray) {
    // @ts-ignore
    if (browserArray[i]) {
      var versions = ''
      if (i == 'IE') {
        // @ts-ignore
        versions = UserAgent.match(/(msie\s|trident.*rv:)([\w.]+)/)[2]
      } else if (i == 'Chrome') {
        for (var mt in navigator.mimeTypes) {
          //检测是否是360浏览器(测试只有pc端的360才起作用)
          if (navigator.mimeTypes[mt]['type'] == 'application/360softmgrplugin') {
            i = '360'
          }
        } // @ts-ignore
        versions = UserAgent.match(/chrome\/([\d.]+)/)[1]
      } else if (i == 'Firefox') {
        // @ts-ignore
        versions = UserAgent.match(/firefox\/([\d.]+)/)[1]
      } else if (i == 'Opera') {
        // @ts-ignore
        versions = UserAgent.match(/opera\/([\d.]+)/)[1]
      } else if (i == 'Safari') {
        // @ts-ignore
        versions = UserAgent.match(/version\/([\d.]+)/)[1]
      } else if (i == 'Edge') {
        // @ts-ignore
        versions = UserAgent.match(/edge\/([\d.]+)/)[1]
      } else if (i == 'QQBrowser') {
        // @ts-ignore
        versions = UserAgent.match(/qqbrowser\/([\d.]+)/)[1]
      } // @ts-ignore
      browserInfo.type = i // @ts-ignore
      browserInfo.versions = parseInt(versions)
    }
  }
  return browserInfo
}

/**
 * 动态获取assets里的图片
 */
// export function getAssetsImg(url: string): string {
//   if (!url) return ''
//   if (url.indexOf('http') > -1) return url
//   return new URL(`../assets/images/${url}`, import.meta.url).href
// }

type FormatO = {
  'M+': number
  'D+': number
  'H+': number
  'm+': number
  's+': number
  [key: string]: any
}

/**
 * 格式化日期
 * @param {Date|undefined} date
 * @param {String} format
 * @param {String} fill
 * @returns {String}
 */
export const formatTime = (date: any, format = 'YYYY-MM-DD', fill = true): string => {
  if (!date && !fill) return ''
  const cDate = date ? new Date(date) : new Date()
  if (!cDate) return ''
  const o: FormatO = {
    'M+': cDate.getMonth() + 1, // 月份
    'D+': cDate.getDate(), // 日
    'H+': cDate.getHours(), // 小时
    'm+': cDate.getMinutes(), // 分
    's+': cDate.getSeconds() // 秒
  }
  if (/(Y+)/.test(format)) {
    format = format.replace(RegExp.$1, (cDate.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : addZero(o[k]))
    }
  }
  return format
}

/**
 * 格式化时间
 */
export function timeString(value: any, fmt = 'YYYY-mm-dd HH:MM:SS') {
  let ret
  let date = value
  if (!value) return ''
  if (typeof value === 'string') {
    if (value.includes('-')) {
      date = new Date(value.replace(/-/g, '/'))
    } else {
      date = new Date(value)
    }
  }
  if (typeof value === 'number') {
    date = new Date(value)
  }
  const opt = {
    'Y+': date.getFullYear().toString(),
    'm+': (date.getMonth() + 1).toString(),
    'd+': date.getDate().toString(),
    'H+': date.getHours().toString(),
    'M+': date.getMinutes().toString(),
    'S+': date.getSeconds().toString()
  } as any
  for (let k in opt) {
    ret = new RegExp('(' + k + ')').exec(fmt)
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'))
    }
  }
  return fmt
}

/**
 * Add Zero
 * @param {String} num
 * @returns {String}
 */
const addZero = (num: string): string => {
  if (parseFloat(num) < 10) {
    return '0' + num
  }
  return num
}

/**
 * 生成指定范围内的随机数，并限制小数位数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @param {number} decimalPlaces 小数位数
 * @returns {number} 随机数
 */
export const generateRandomNumber = (min: number, max: number, decimalPlaces: number) => {
  if (min > max) {
    return min
  }
  if (decimalPlaces < 0) {
    return min
  }

  const random = Math.random() * (max - min) + min
  return parseFloat(random.toFixed(decimalPlaces))
}

/**
 * 将一维数组按照指定长度切割为二维数组
 * @param {Array} array 一维数组
 * @param {number} size 每个子数组的长度
 * @returns {Array} 切割后的二维数组
 */
export const chunkArray = (array: Array<any>, size: number) => {
  if (!Array.isArray(array)) {
    return array
  }
  if (typeof size !== 'number' || size <= 0) {
    return array
  }

  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

/**
 * 模拟延迟的函数
 * @param {number} milliseconds 延迟的毫秒数
 * @returns {Promise<void>} 返回一个在指定时间后解决的 Promise
 */
export const delayCall = (milliseconds: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Format decimal number to maximum 4 decimal places
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatDecimal = (value: number): string => {
  if (!value && value !== 0) return '-'
  
  // Convert to string with maximum 4 decimal places
  const formatted = Number(value).toFixed(4)
  
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, '')
}

// Token types
interface TokenMetadata {
  name?: string;
  image?: string;
  symbol?: string;
}

interface TokenData {
  mintAddress: string;
  amount: number;
  name: string;
  metadata?: TokenMetadata;
  decimals: number;
}

interface MappedToken {
  mint: string;
  balance: number;
  name: string;
  image: string;
  symbol: string;
  decimals: number;
}

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number | null;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: Record<string, unknown>;
}

/**
 * Query token data from Jupiter API
 * @param address Token contract address
 * @returns Promise<TokenData | null>
 */
export const queryTokenData = async (address: string): Promise<TokenData | null> => {
  if (!address) return null;
  
  try {
    const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${address}`, {
      headers: {
        'x-api-key': '9dfe02ba-941a-4c4a-952b-d0cccf5c21e7'
      }
    });
    if (!response.ok) {
      console.error('Failed to fetch token data:', response.statusText);
      return null;
    }
    
    const tokenDataArray = await response.json();
    const tokenData = Array.isArray(tokenDataArray) && tokenDataArray.length > 0 ? tokenDataArray[0] : null;
    
    if (!tokenData) {
      console.error('Token not found');
      return null;
    }
    
    // 转换 V2 格式到兼容格式
    return {
      ...tokenData,
      address: tokenData.id,
      logoURI: tokenData.icon
    } as TokenData;
    
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

/**
 * Fetches and maps token list for a given wallet address
 * @param address Wallet address to query tokens for
 * @param storeCallback Callback function to update the store with the mapped tokens
 * @returns Promise<void>
 */
export const queryTokenListByAddress = async (
  address: string,
  storeCallback: (tokens: MappedToken[]) => void
): Promise<void> => {
  console.log('Querying token list for address:', address);
  if (!address) return;

  try {
    // Fetch token list from API
    const response = await fetch(`https://sol-wallet-theta.vercel.app/api/tokens?walletAddress=${address}`);
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      storeCallback([]);
      return;
    }
    
    const rawData = await response.json();
    console.log('Raw API response for address', address, ':', rawData);

    // 处理不同的响应格式
    let tokenData: TokenData[];
    
    if (Array.isArray(rawData)) {
      // 如果直接是数组
      tokenData = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // 如果是对象，尝试提取tokens字段
      if (Array.isArray(rawData.tokens)) {
        tokenData = rawData.tokens;
      } else if (Array.isArray(rawData.data)) {
        tokenData = rawData.data;
      } else if (rawData.result && Array.isArray(rawData.result)) {
        tokenData = rawData.result;
      } else {
        console.error('Token data is not in expected format:', rawData);
        storeCallback([]);
        return;
      }
    } else {
      console.error('Token data is not an array or object:', rawData);
      storeCallback([]);
      return;
    }

    if (!Array.isArray(tokenData) || tokenData.length === 0) {
      console.log('No tokens found for address:', address);
      storeCallback([]);
      return;
    }

    // 常用 token 的本地 logo 映射
    const commonTokenLogos: { [key: string]: string } = {
      // Solana 主币
      'So11111111111111111111111111111111111111112': '/tokens/sol.png',
      // USDC
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '/tokens/usdc.png',
      // USDT
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '/tokens/usdt.png',
      // BONK
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': '/tokens/bonk.png',
      // JUP (Jupiter)
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': '/tokens/jup.png'
    };

    // 常用 token 的 symbol 映射
    const commonTokenSymbols: { [key: string]: string } = {
      // Solana 主币
      'So11111111111111111111111111111111111111112': 'SOL',
      // USDC
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      // USDT
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      // BONK
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      // JUP (Jupiter)
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP'
    };

    // Create a combined token list with all required data
    const mappedTokens: MappedToken[] = tokenData.map(token => {
      // 检查是否有本地 logo
      const localLogo = commonTokenLogos[token.mintAddress];
      // 检查是否有预定义的 symbol
      const predefinedSymbol = commonTokenSymbols[token.mintAddress];
      
      return {
        mint: token.mintAddress,
        balance: token.amount,
        name: token.metadata?.name || token.name,
        image: localLogo || token.metadata?.image || '/favicon.png',
        symbol: predefinedSymbol || token.metadata?.symbol || '',
        decimals: token.decimals,
      };
    });

    console.log('Mapped tokens:', mappedTokens);

    // Update store using the callback
    storeCallback(mappedTokens);

  } catch (error) {
    console.error('Failed to fetch token list:', error);
    // Reset store with empty array on error
    storeCallback([]);
  }
};

export const queryTokenListByAddressPromise = async (
  address: string,
  storeCallback: (tokens: MappedToken[]) => Promise<number>  // Assume the callback returns a number (tokenSellAmount)
): Promise<number | undefined> => {
  console.log('Querying token list for address:', address);
  if (!address) return;

  try {
    // Fetch token list from API
    const response = await fetch(`https://sol-wallet-theta.vercel.app/api/tokens?walletAddress=${address}`);
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return await storeCallback([]);
    }
    
    const rawData = await response.json();
    console.log('Raw API response for address', address, ':', rawData);

    // 处理不同的响应格式
    let tokenData: TokenData[];
    
    if (Array.isArray(rawData)) {
      // 如果直接是数组
      tokenData = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // 如果是对象，尝试提取tokens字段
      if (Array.isArray(rawData.tokens)) {
        tokenData = rawData.tokens;
      } else if (Array.isArray(rawData.data)) {
        tokenData = rawData.data;
      } else if (rawData.result && Array.isArray(rawData.result)) {
        tokenData = rawData.result;
      } else {
        console.error('Token data is not in expected format:', rawData);
        return await storeCallback([]);
      }
    } else {
      console.error('Token data is not an array or object:', rawData);
      return await storeCallback([]);
    }

    if (!Array.isArray(tokenData) || tokenData.length === 0) {
      console.log('No tokens found for address:', address);
      return await storeCallback([]);
    }

    // 常用 token 的本地 logo 映射
    const commonTokenLogos: { [key: string]: string } = {
      // Solana 主币
      'So11111111111111111111111111111111111111112': '/tokens/sol.png',
      // USDC
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '/tokens/usdc.png',
      // USDT
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '/tokens/usdt.png',
      // BONK
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': '/tokens/bonk.png',
      // JUP (Jupiter)
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': '/tokens/jup.png'
    };

    // 常用 token 的 symbol 映射
    const commonTokenSymbols: { [key: string]: string } = {
      // Solana 主币
      'So11111111111111111111111111111111111111112': 'SOL',
      // USDC
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      // USDT
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      // BONK
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      // JUP (Jupiter)
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP'
    };

    // Create a combined token list with all required data
    const mappedTokens: MappedToken[] = tokenData.map(token => {
      // 检查是否有本地 logo
      const localLogo = commonTokenLogos[token.mintAddress];
      
      return {
        mint: token.mintAddress,
        balance: token.amount,
        name: token.metadata?.name || token.name,
        image: localLogo || token.metadata?.image || '/favicon.png',
        symbol: token.metadata?.symbol || '',
        decimals: token.decimals,
      };
    });

    console.log('Mapped tokens:', mappedTokens);

    // Call the callback and wait for it to resolve
    return await storeCallback(mappedTokens);

  } catch (error) {
    console.error('Failed to fetch token list:', error);
    return await storeCallback([]);  // Return result of callback in case of error
  }
};


// Transaction utility functions
import { Keypair, Connection, Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

export const getPublicKey = (privateKey: string): string => {
  const privateKeyBytes = bs58.decode(privateKey);
  const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);
  return fromKeypair.publicKey.toString();
};

export const getTransactionInstructions = async (wallet: any, params: {
  mint: string,
  address: string,
  pool?: string,
  sol?: number,
  amount?: number,
  slip: number,
  origin: number,
  method: "1" | "2" | "3"  // 1: buy, 2: sell, 3: buysell
}) => {
  console.log('params', params)
  let url = ''
  let data: any = {}

  switch (params.method) {
    case "1": // buy
      url = params.pool == "Raydium" ? 'https://www.xhtool.top/api/raydium_buy' : 'https://www.xhtool.top/api/buy'
      data = {
        mint: params.mint,
        method: params.origin,
        address: params.address,
        sol: params.sol ? Math.floor(params.sol * LAMPORTS_PER_SOL) : 0,
        amount: params.sol ? Math.floor(params.sol * LAMPORTS_PER_SOL) : 0,
        slip: Math.floor(params.slip * 10)
      }
      break
    case "2": // sell
      url = params.pool == "Raydium" ? 'https://www.xhtool.top/api/raydium_sell' : 'https://www.xhtool.top/api/sell'
      data = {
        mint: params.mint,
        method: params.origin,
        address: params.address,
        amount: params.amount ? Math.floor(params.amount) : 0,
        slip: Math.floor(params.slip * 10)
      }
      break
    case "3": // buysell
      url = 'https://www.xhtool.top/api/buysell'
      data = {
        mint: params.mint,
        address: params.address,
        method: params.origin,
        sol: params.sol ? Math.floor(params.sol * LAMPORTS_PER_SOL) : 0,
        slip: Math.floor(params.slip * 10)
      }
      break
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data.instructions;
  } catch (error) {
    console.error('Error getting transaction instructions:', error)
    throw error
  }
}

export const createAndSignTransaction = async (
  instructions: any[],
  wallet: any | any[],
  jitoFee?: number
): Promise<string> => {
  const rpc1 = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";
  const rpc2 = jitoFee && jitoFee > 0 
    ? "https://mainnet.block-engine.jito.wtf/api/v1/transactions"
    : rpc1;
  
  const connection1 = new Connection(rpc1);
  const connection2 = new Connection(rpc2);

  console.log("jitofee",  jitoFee)

  try {
    // Convert single wallet to array if needed
    const wallets = Array.isArray(wallet) ? wallet : [wallet];

    // Validate wallets and create keypairs
    if (!wallets?.length || !wallets[0]) {
      throw new Error('No valid wallet provided');
    }

    const keypairs: Keypair[] = wallets.map(w => {
      if (!w?.privateKey) {
        throw new Error('Invalid wallet: missing privateKey');
      }
      try {
        const privateKeyBytes = bs58.decode(w.privateKey);
        return Keypair.fromSecretKey(privateKeyBytes);
      } catch (error) {
        console.error('Private key decode error:', error);
        throw new Error('Invalid private key format');
      }
    });

    // Create and configure transaction
    const transaction = new Transaction();

    // Add instructions
    for (const instruction of instructions) {
      transaction.add(convertToPublicKey(instruction));
    }

    // Add Jito fee if specified
    if (jitoFee && jitoFee > 0) {
      const jitoAddresses = [
        "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
        "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
        "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
        "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
        "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
        "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
        "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
        "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
      ];
      const randomAddress = jitoAddresses[Math.floor(Math.random() * jitoAddresses.length)];
      
      try {
        const jitoInstruction = SystemProgram.transfer({
          fromPubkey: keypairs[0].publicKey,
          toPubkey: new PublicKey(randomAddress),
          lamports: Math.floor(jitoFee * LAMPORTS_PER_SOL)
        });
        transaction.add(jitoInstruction);
      } catch (error) {
        console.error('Jito fee instruction error:', error);
        throw new Error(`Failed to create Jito fee instruction: ${error.message}`);
      }
    }

    // Get recent blockhash and set fee payer
    transaction.recentBlockhash = (await connection1.getLatestBlockhash()).blockhash;
    transaction.feePayer = keypairs[0].publicKey;

    // Sign with all keypairs
    transaction.sign(...keypairs);
    const signedTransaction = transaction.serialize();
    
    // Send transaction without waiting for confirmation
    const signature = await connection2.sendRawTransaction(signedTransaction);
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Helper function to convert instruction to PublicKey
const convertToPublicKey = (instruction: any) => {
  // Convert the instruction object properties to PublicKey where needed
  if (instruction.programId) {
    instruction.programId = new PublicKey(instruction.programId);
  }
  if (instruction.keys) {
    instruction.keys = instruction.keys.map((key: any) => ({
      ...key,
      pubkey: new PublicKey(key.pubkey)
    }));
  }
  return instruction;
};

// Check transaction status from Solana
export const checkTransactionStatus = async (signature: string): Promise<{
  status: 'success' | 'fail',
  message: string,
  error?: string
}> => {
  try {
    const rpc = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";
    const connection = new Connection(rpc);
    
    const response = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!response) {
      return {
        status: 'fail',
        message: 'Transaction not found',
        error: 'Transaction not found'
      };
    }

    if (response.meta?.err) {
      const errorMessage = response.meta.logMessages?.find(log => log.includes('Error:')) || 'Transaction failed';
      return {
        status: 'fail',
        message: 'Transaction failed',
        error: errorMessage
      };
    }

    return {
      status: 'success',
      message: 'Transaction successful'
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Query failed',
      error: error.message
    };
  }
};

export const getTransactionStatus = async (transactionSignature: string) => {
  const web3Store = useWeb3Store()
  const connection = web3Store.connection
  
  try {
    // Get transaction details by signature
    const transaction = await connection.getTransaction(transactionSignature)

    if (transaction) {
      return {
        status: 'Confirmed',
        blockTime: transaction.blockTime,
        slot: transaction.slot,
      }
    } else {
      return { status: 'Pending' }
    }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return { status: 'Failed', error: error.message }
  }
}


export const updateWalletBalance = async (walletList: WalletInfo[], toTokenAddress: string) => {
  const usdcMintValue = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
  const solMintValue = 'So11111111111111111111111111111111111111112';

  const promises = walletList.map(async (wallet) => {
    return new Promise<void>((resolve) => {
      queryTokenListByAddress(wallet.address, (tokens) => {
        console.log('tokens', tokens)
        const solToken = tokens.find(token => token.mint === solMintValue);
        const usdcToken = tokens.find(token => token.mint === usdcMintValue);

        // Update balances
        wallet.solBalance = solToken ? parseFloat(solToken.balance) : 0;
        wallet.usdcBalance = usdcToken ? parseFloat(usdcToken.balance) : 0;

        // Update token balance if needed
        const targetToken = tokens.find(token => token.mint === toTokenAddress);
        if (targetToken) {
          wallet.tokenBalance = (targetToken.balance === '-') ? 0 : targetToken.balance;
        } else {
          wallet.tokenBalance = 0; 
        }

        resolve(); // Resolve the promise when done
      });
    });
  });

  // Wait for all promises to resolve
  await Promise.all(promises);

  return walletList; // Return the updated walletList
};

export const getTokenPumpData = async (mint: string) => {
  const url = 'https://www.xhtool.top/api/mint';
  const data = { mint };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.code !== 1) {
      throw new Error('Failed to fetch token pump data');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting token pump data:', error);
    throw error;
  }
};


  /**
   * Fetches the price of a given mint address from either the "pump" or "raydium" API.
   * 
   * @param {string} apiType - The type of API to use. Can be either "pump" or "raydium".
   * @param {string} mintAddress - The mint address of the token to fetch the price for.
   * 
   * @returns {Promise<{ success: boolean, price: string } | { success: boolean, error: string }>}
   *   A promise that resolves to an object with a "success" field (boolean) and either a "price" field (string) or an "error" field (string).
   *   If the "success" field is true, the "price" field will contain the price of the given mint address.
   *   If the "success" field is false, the "error" field will contain an error message.
   */
export const fetchPrice = async (apiType, mintAddress) => {
  const baseUrl = "https://www.xhtool.top/api/";

  let url;

  // Determine the appropriate URL based on the apiType
  if (apiType === "pump") {
    url = `${baseUrl}pump_price`;
  } else if (apiType === "raydium") {
    url = `https://api-v3.raydium.io/mint/price?mints=${mintAddress}`;
  } else {
    return { success: false, error: "Invalid API type specified." };
  }

  try {
    let response;

    // If the API type is "raydium", perform a GET request
    if (apiType === "raydium") {
      response = await fetch(url);  // Send GET request
    } else {
      // For the "pump" API, send a POST request with JSON payload
      const payload = { mint: mintAddress };
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    // Check if the response status is OK (200)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    // Check if the response contains a "success" field
    console.log('responseData', responseData)

    if (responseData.code === 1) {
      // Success response
      const price = responseData.data.price || "Price not found";
      return { success: true, price: price };
    } else {
      // Error response
      const errorMessage = responseData.data || "Unknown error occurred.";
      return { success: false, error: errorMessage };
    }

  } catch (error) {
    // Handle network or other errors
    return { success: false, error: `Request failed: ${error.message}` };
  }
}



export const createAndBundleSignTransaction = async (
  instructions: any[][],
  wallet: any | any[],
  jitoFee?: number
): Promise<string[]> => {
  let rpc1 = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";//Paid RPC node
  let rpc2 = "https://mainnet.block-engine.jito.wtf:443/api/v1/bundles";//Jito node for bundle transactions
  
  const connection1 = new Connection(rpc1);
  const connection2 = new Connection(rpc2);

  console.log("jitoFee",  jitoFee)

  try {
    // Convert single wallet to array if needed
    const wallets = Array.isArray(wallet) ? wallet : [wallet];

    // Validate wallets and create keypairs
    if (!wallets?.length || !wallets[0]) {
      throw new Error('No valid wallet provided');
    }

    // Array to hold signatures of sent transactions
    const signatures: string[] = [];

    // Process each group of instructions 
    // const groups of instructions
    for (let i = 0; i < instructions.length; i += 1) {
      const instructionsGroup = instructions[i];
      // Create and configure transaction for this group
      // Add instructions after converting public keys
      const keypairs: Keypair[] = wallets[i].map(w => {
        if (!w?.privateKey) {
          throw new Error('Invalid wallet: missing privateKey');
        }
        try {
          const privateKeyBytes = bs58.decode(w.privateKey);
          return Keypair.fromSecretKey(privateKeyBytes);
        } catch (error) {
          console.error('Private key decode error:', error);
          throw new Error('Invalid private key format');
        }
      });

      const transaction = new Transaction();

      for (const instructions of instructionsGroup) {

        for (const instruction of instructions) {
          const convertedInstruction = convertToPublicKey(instruction);
          transaction.add(convertedInstruction);
        }

        console.log('transaction', transaction)

        // Add Jito fee if specified
        if (jitoFee && jitoFee > 0) {
          const jitoAddresses = [
            "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
            "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
            "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
            "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
            "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
            "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
            "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
            "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
          ];
          const randomAddress = jitoAddresses[Math.floor(Math.random() * jitoAddresses.length)];
          
          try {
            const jitoInstruction = SystemProgram.transfer({
              fromPubkey: keypairs[0].publicKey,
              toPubkey: new PublicKey(randomAddress),
              lamports: Math.floor(jitoFee * LAMPORTS_PER_SOL)
            });
            transaction.add(jitoInstruction);
          } catch (error) {
            console.error('Jito fee instruction error:', error);
            throw new Error(`Failed to create Jito fee instruction: ${error.message}`);
          }
        }

        // Get recent blockhash and set fee payer
        transaction.recentBlockhash = (await connection1.getLatestBlockhash()).blockhash;
        transaction.feePayer = keypairs[0].publicKey;

        // Sign with all keypairs
        transaction.sign(...keypairs);
        const signedTransaction = transaction.serialize();
        
        // Send transaction without waiting for confirmation
        const signature = await connection2.sendRawTransaction(signedTransaction);
        signatures.push(signature);
      } 
    }

    console.log('signatures', signatures)
    return signatures;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

export const createDifferentBuySellSignTransaction = async (
  buyWallets: { privateKey: string }[],
  sellWallets: { privateKey: string }[],
  sol: number,
  mints: string,
  slip: number,
  jitogas: string
) => {
  const rpc1 = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";
  let rpc2 = "https://mainnet.block-engine.jito.wtf/api/v1/transactions";

  if (jitogas === "0") {
    rpc2 = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";
  }

  if (buyWallets.length !== sellWallets.length) {
    console.error('错误: 买入钱包数量和卖出钱包数量不匹配');
    throw new Error('买入钱包数量和卖出钱包数量必须一致');
  }

  const connection1 = new Connection(rpc1);
  const connection2 = new Connection(rpc2);

  try {
    for (let k = 0; k < buyWallets.length; k++) {
      console.log(`\n========== 处理第 ${k + 1}/${buyWallets.length} 对钱包 ==========`);
      const buyWallet = buyWallets[k];
      const sellWallet = sellWallets[k];

      console.log(`买入钱包: ${get_publicKey(buyWallet.privateKey)}`);
      console.log(`卖出钱包: ${get_publicKey(sellWallet.privateKey)}`);

      // 买入
      const urlbuy = "https://www.xhtool.top/api/buy";
      const databuy = {
        mint: mints,
        address: get_publicKey(buyWallet.privateKey),
        sol: Math.floor(sol * LAMPORTS_PER_SOL),
        slip: Math.floor(slip * 10)
      };
      console.log(`\n[买入请求] 发送买入请求...`);

      try {
        const responsebuy = await fetch(urlbuy, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(databuy)
        });

        if (!responsebuy.ok) {
          console.error(`[买入失败] HTTP错误: ${responsebuy.status}`);
          continue;
        }

        const Resultbuy = await responsebuy.json();
        if (Resultbuy.code !== 1 || !Resultbuy.data.instructions) {
          console.error(`[买入失败] API返回错误: ${JSON.stringify(Resultbuy)}`);
          continue;
        }

        console.log(`[买入成功] 获取买入指令成功`);
        let amount = 0;
        const tradearraybuy = Resultbuy.data.instructions;
        if (tradearraybuy[0].programId === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P') {
          amount = (tradearraybuy[0].data).slice(8, 16);
        } else {
          amount = (tradearraybuy[1].data).slice(8, 16);
        }
        const amountbigint = getBigUint64(amount, 0, true);
        console.log(`[买入数量] ${amountbigint.toString()}`);

        // 卖出
        console.log(`\n[卖出请求] 发送卖出请求...`);
        const urlsell = "https://www.xhtool.top/api/sell";
        const datasell = {
          mint: mints,
          address: get_publicKey(sellWallet.privateKey),
          amount: amountbigint.toString(),
          slip: Math.floor(slip * 10)
        };

        const responsesell = await fetch(urlsell, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(datasell)
        });

        if (!responsesell.ok) {
          console.error(`[卖出失败] HTTP错误: ${responsesell.status}`);
          continue;
        }

        const Resultsell = await responsesell.json();
        if (Resultsell.code !== 1 || !Resultsell.data.instructions) {
          console.error(`[卖出失败] API返回错误: ${JSON.stringify(Resultsell)}`);
          continue;
        }

        console.log(`[卖出成功] 获取卖出指令成功`);

        console.log(`\n[交易构建] 开始构建交易...`);
        const tradearraysell = Resultsell.data.instructions;
        const transaction = new Transaction();
        tradearraybuy.forEach(to => {
          transaction.add(convertToPublicKey(to));
        });
        tradearraysell.forEach(to => {
          transaction.add(convertToPublicKey(to));
        });

        if (Number(jitogas) > 0) {
          console.log(`[Jito] 添加Jito费用: ${jitogas} SOL`);
          const array_jito = [
            "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
            "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
            "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
            "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
            "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
            "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
            "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
            "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
          ];
          const randomIndex = Math.floor(Math.random() * array_jito.length);
          const randomElement = array_jito[randomIndex];
          const instruction_jito = SystemProgram.transfer({
            fromPubkey: new PublicKey(get_publicKey(sellWallet.privateKey)),
            toPubkey: new PublicKey(randomElement),
            lamports: Math.floor(Number(jitogas) * LAMPORTS_PER_SOL)
          });
          transaction.add(instruction_jito);
        }

        console.log(`[交易签名] 正在签名...`);
        const fromWalletbuy = Keypair.fromSecretKey(bs58.decode(buyWallet.privateKey));
        const fromWalletsell = Keypair.fromSecretKey(bs58.decode(sellWallet.privateKey));
        transaction.recentBlockhash = (await connection1.getLatestBlockhash()).blockhash;
        transaction.feePayer = fromWalletsell.publicKey;
        await transaction.sign(fromWalletbuy, fromWalletsell);

        console.log(`[Transaction Broadcast] Broadcasting transaction...`);
        const signature = await connection2.sendRawTransaction(transaction.serialize());
        console.log(`[Transaction Success] Transaction signature: ${signature}`);
        console.log(`[Transaction Link] https://solscan.io/tx/${signature}`);

      } catch (error) {
        console.error(`[Processing Failed] Wallet pair ${k + 1} processing error:`, error);
      }
    }
  } catch (error) {
    console.error('[Critical Error] Transaction process interrupted:', error);
    throw error;
  }
};


// 新方法，接受walletList作为参数
export const executeTransactions = async(walletList, method, amount, mints, decimals, slip, jitogas) => {
  console.log('开始执行批量交易...');
  console.log(`交易参数: 钱包数量: ${walletList}, 金额: ${amount}, 代币地址: ${mints}, 滑点: ${slip}, Jito费用: ${jitogas}`);
  
  
  const rpc1 = "https://special-yolo-tent.solana-mainnet.quiknode.pro/f6e8a1ac41cfcd90c3837b93f190923fd8b89d8f";//这里收费结点rpc
  const connection1 = new solanaWeb3.Connection(rpc1);
  const transactionDetails = []; // Store transaction details for each wallet

  // Convert private key to public key text
  function get_publicKey(c_pri) {
      const privateKeyBytes = bs58.decode(c_pri);
      const fromKeypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
      const address = fromKeypair.publicKey.toString();
      return address;
  }

  try {
      // Group transactions based on method to determine group size
      const groups = []; // Store grouping results
      const params = walletList.map(wallet => `${wallet.privateKey},${wallet.amount ? wallet.amount : amount}`).join('\n'); // Use sol value from walletList
      const paramsArray = params.split('\n').filter(line => line.trim() !== ''); // Split by line and remove empty lines

      // Each txid contains 3 transactions
      for (let i = 0; i < paramsArray.length; i += 3) {
          // Group by 18 lines
          const group = paramsArray.slice(i, i + 3).join('\n');
          groups.push(group); // Add to results
      }

      console.log(`Total ${paramsArray.length} wallet transactions to process, grouped into ${Math.ceil(paramsArray.length / 3)} groups`);
      // logOutput.textContent += `开始交易` + '\n';
      // Define a variable to store bundle transaction information data
      const tradebase64array = [];

      for (let k = 0; k < groups.length; k++) {
          let url = ''
          let data = {}
          const tradearray = []
          const paramsGroup = groups[k].split('\n').map(line => line.split(',').map(item => item.trim()));

          for (let i = 0; i < paramsGroup.length; i++) {
              if (method === "1") {
                  url = 'https://www.xhtool.top/api/buy'; // 买操作的API
                  data = {
                      mint: mints,
                      address: get_publicKey(paramsGroup[i][0]),
                      sol: Math.floor(paramsGroup[i][1] * solanaWeb3.LAMPORTS_PER_SOL),
                      slip: Math.floor(slip * 10)
                  }
              } else if (method === "2") {
                  url = 'https://www.xhtool.top/api/sell'; // 卖操作的API
                  data = {
                      mint: mints,
                      address: get_publicKey(paramsGroup[i][0]),
                      amount: Math.floor(paramsGroup[i][1] * 10 ** decimals),
                      slip: Math.floor(slip * 10)
                  }
              }

              const response = await fetch(url, {
                  method: 'POST',
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(data)
              });

              if (response.ok) {
                  const Result = await response.json();
                  if (Result.code === 1 && Result.data.instructions) {
                      tradearray.push(Result.data.instructions);
                  }
              }

              transactionDetails.push({
                wallet: get_publicKey(paramsGroup[i][0]),
                amount: paramsGroup[i][1],
                signedTx: '', // Will be filled by bundle tx
                tokenInfo: mints
              });
          }

          const transaction = new solanaWeb3.Transaction();
          const wallets = paramsGroup.map(to => {
              const priarray = bs58.decode(to[0]);
              return solanaWeb3.Keypair.fromSecretKey(priarray);
          });

          tradearray.forEach(to => {
              to.forEach(go => {
                  transaction.add(convertToPublicKey(go));
              });
          });

          // 必给小费
          const array_jito = [
              "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
              "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
              "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
              "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
              "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
              "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
              "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
              "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
          ];
          const randomIndex = Math.floor(Math.random() * array_jito.length);
          const randomElement = array_jito[randomIndex];
          const instruction_jito = new solanaWeb3.TransactionInstruction(
              solanaWeb3.SystemProgram.transfer({
                  fromPubkey: wallets[0].publicKey,
                  toPubkey: new solanaWeb3.PublicKey(randomElement),
                  lamports: Math.floor(jitogas * solanaWeb3.LAMPORTS_PER_SOL)
              })
          );
          transaction.add(instruction_jito);
          transaction.recentBlockhash = (await connection1.getLatestBlockhash()).blockhash;
          transaction.feePayer = wallets[0].publicKey;
          transaction.sign(...wallets);
          const signedTransaction = transaction.serialize();
          const signedbase64Txt = signedTransaction.toString("base64");
          tradebase64array.push(signedbase64Txt);
      }

      const bundleTx = await send_transaction(tradebase64array);
      console.log('交易已发送，交易ID:', bundleTx);
      transactionDetails.forEach(detail => {
        detail.signedTx = bundleTx.msg.result;
      });

      return {
        bundleTx: bundleTx.msg.result,
        transactionDetails
      };
  } catch (error) {
      console.error('交易执行出错:', error.message);
      throw error;
  }
}

// 检查捆绑交易状态
export const checkBundleStatus = async (bundleId: string, connection: Connection): Promise<{status: string, transactions?: string[]}> => {
  let retries = 30; // 最大重试30次
  
  while (retries > 0) {
    try {
      console.log('检查Bundle状态, 剩余重试次数:', retries, 'Bundle ID:', bundleId);
      
      const response = await fetch('https://mainnet.block-engine.jito.wtf/api/v1/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]]
        })
      });
      
      const data = await response.json();
      const transactions = data.result?.value?.[0]?.transactions;
      
      if (transactions?.length > 0) {
        console.log('Bundle包含交易, 开始检查交易状态...');
        
        // 检查每个交易的状态
        for (const tx of transactions) {
          const txStatus = await connection.getSignatureStatus(tx);
          console.log('交易状态:', txStatus, '交易ID:', tx);
          
          if (txStatus.value !== null) {
            if (txStatus.value.confirmationStatus === 'confirmed') {
              console.log('交易已确认:', tx);
              return { status: 'confirmed', transactions };
            } else if (txStatus.value.err) {
              console.log('交易出错:', txStatus.value.err, '交易ID:', tx);
              return { status: 'error', transactions };
            }
          }
        }
      }
      
      // 等待500ms后重试
      await new Promise(resolve => setTimeout(resolve, 500));
      retries--;
    } catch (error) {
      console.error('检查状态时出错:', error);
      return { status: 'error' };
    }
  }
  
  console.log('检查超时，已重试30次:', bundleId);
  return { status: 'timeout' };
}
