import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;

export function getWhatsAppClient(): Client | null {
  return isReady ? client : null;
}

export function isWhatsAppReady(): boolean {
  return isReady;
}

export function initWhatsApp(): Client {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  });

  client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('  Escanea este QR con WhatsApp:');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\nAbre WhatsApp > Dispositivos vinculados > Vincular dispositivo\n');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('[WhatsApp] Cliente conectado y listo para enviar mensajes');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Sesión autenticada');
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('[WhatsApp] Error de autenticación:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('[WhatsApp] Desconectado:', reason);
  });

  client.initialize();

  return client;
}

/**
 * Send a WhatsApp message.
 * @param phone - Phone number with country code, e.g. "521234567890" (no + or whatsapp: prefix)
 * @param message - The message text
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  if (!client || !isReady) {
    throw new Error('WhatsApp client not ready. Scan the QR code first.');
  }

  // Normalize: remove "whatsapp:", "+", spaces, dashes
  const cleaned = phone.replace(/^whatsapp:/, '').replace(/[+\s-]/g, '');

  // whatsapp-web.js uses the format: countrycode + number + @c.us
  const chatId = `${cleaned}@c.us`;

  await client.sendMessage(chatId, message);
}
