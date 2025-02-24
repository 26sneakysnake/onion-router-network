import * as crypto from 'crypto';

/**
 * Generates an RSA key pair
 * @returns An object containing public and private keys in base64 format
 */
export function generateRsaKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return {
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64')
  };
}

/**
 * Encrypts a message with an RSA public key
 * @param message Message to encrypt
 * @param publicKey Public key in base64 format
 * @returns Encrypted message in base64 format
 */
export function encryptWithPublicKey(message: string, publicKey: string) {
  const pubKey = Buffer.from(publicKey, 'base64').toString();
  const buffer = Buffer.from(message, 'utf-8');
  const encrypted = crypto.publicEncrypt(
    {
      key: pubKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    buffer
  );
  
  return encrypted.toString('base64');
}

/**
 * Decrypts a message with an RSA private key
 * @param encryptedMessage Encrypted message in base64 format
 * @param privateKey Private key in base64 format
 * @returns Decrypted message
 */
export function decryptWithPrivateKey(encryptedMessage: string, privateKey: string) {
  const privKey = Buffer.from(privateKey, 'base64').toString();
  const buffer = Buffer.from(encryptedMessage, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    buffer
  );
  
  return decrypted.toString('utf-8');
}

/**
 * Generates a random symmetric key
 * @returns Symmetric key in base64 format
 */
export function generateSymmetricKey() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypts a message with a symmetric key
 * @param message Message to encrypt
 * @param symmetricKey Symmetric key in base64 format
 * @returns Encrypted message in base64 format
 */
export function encryptWithSymmetricKey(message: string, symmetricKey: string) {
  const key = Buffer.from(symmetricKey, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(message, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  
  return iv.toString('base64') + ':' + encrypted;
}

/**
 * Decrypts a message with a symmetric key
 * @param encryptedMessage Encrypted message in base64 format (iv:encryptedData)
 * @param symmetricKey Symmetric key in base64 format
 * @returns Decrypted message
 */
export function decryptWithSymmetricKey(encryptedMessage: string, symmetricKey: string) {
  const key = Buffer.from(symmetricKey, 'base64');
  const parts = encryptedMessage.split(':');
  const iv = Buffer.from(parts[0], 'base64');
  const encryptedData = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedData, 'base64', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}