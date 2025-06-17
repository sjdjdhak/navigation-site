/**
 * 加密工具类 - 用于安全存储敏感数据
 */

// 生成密钥的盐值（在实际生产环境中应该使用更安全的方式）
const SALT = 'navigation-site-security-salt-2024'

/**
 * 从密码生成加密密钥
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = encoder.encode(SALT)
  
  // 导入密码作为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // 使用PBKDF2派生密钥
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const key = await deriveKey(password)
    const iv = crypto.getRandomValues(new Uint8Array(12)) // 12字节的IV用于AES-GCM
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(data)
    )
    
    // 将IV和加密数据组合并转换为base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedData), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('数据加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * 解密数据
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const key = await deriveKey(password)
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    // 提取IV和加密数据
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('数据解密失败:', error)
    throw new Error('数据解密失败或密码错误')
  }
}

/**
 * 生成设备特征字符串（用作加密密码）
 */
function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    'navigation-site-device-key'
  ]
  
  // 使用一个简单的hash函数
  let hash = 0
  const str = components.join('|')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  return 'device_' + Math.abs(hash).toString(36)
}

/**
 * 安全存储数据到localStorage
 */
export async function secureStore(key: string, data: any): Promise<void> {
  try {
    const jsonData = JSON.stringify(data)
    const deviceKey = generateDeviceFingerprint()
    const encrypted = await encryptData(jsonData, deviceKey)
    localStorage.setItem(key, encrypted)
  } catch (error) {
    console.error('安全存储失败:', error)
    throw new Error('安全存储失败')
  }
}

/**
 * 从localStorage安全检索数据
 */
export async function secureRetrieve(key: string): Promise<any> {
  try {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) {
      return null
    }
    
    const deviceKey = generateDeviceFingerprint()
    const decrypted = await decryptData(encrypted, deviceKey)
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('安全检索失败:', error)
    // 如果解密失败，清除损坏的数据
    localStorage.removeItem(key)
    return null
  }
}

/**
 * 安全删除存储的数据
 */
export function secureRemove(key: string): void {
  localStorage.removeItem(key)
}

/**
 * 检查Web Crypto API是否可用
 */
export function isCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined'
} 