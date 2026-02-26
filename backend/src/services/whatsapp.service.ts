import { join } from 'path';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

type WASocket = ReturnType<typeof makeWASocket>;

const AUTH_DIR = join(process.cwd(), '.baileys_auth');

let sock: WASocket | null = null;
let isReady = false;

export function getWhatsAppClient(): WASocket | null {
  return isReady ? sock : null;
}

export function isWhatsAppReady(): boolean {
  return isReady;
}

export async function initWhatsApp(): Promise<void> {
  // Load auth state ONCE — reused across reconnections
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  function connectToWA() {
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n========================================');
        console.log('  Escanea este QR con WhatsApp:');
        console.log('========================================\n');
        qrcode.generate(qr, { small: true });
        console.log('\nAbre WhatsApp > Dispositivos vinculados > Vincular dispositivo\n');
      }

      if (connection === 'open') {
        isReady = true;
        console.log('[WhatsApp] Cliente conectado y listo para enviar mensajes');
      }

      if (connection === 'close') {
        isReady = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('[WhatsApp] Sesión cerrada. Elimina la carpeta .baileys_auth y escanea el QR de nuevo.');
          sock = null;
          return;
        }

        console.log('[WhatsApp] Desconectado, reconectando en 5s...');
        setTimeout(connectToWA, 5000);
      }
    });
  }

  connectToWA();
}

/**
 * Send a WhatsApp message.
 * @param phone - Phone number with country code, e.g. "521234567890" (no + or whatsapp: prefix)
 * @param message - The message text
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  if (!sock || !isReady) {
    throw new Error('WhatsApp client not ready. Scan the QR code first.');
  }

  // Normalize: remove "whatsapp:", "+", spaces, dashes
  const cleaned = phone.replace(/^whatsapp:/, '').replace(/[+\s-]/g, '');

  // Baileys uses the format: countrycode + number + @s.whatsapp.net
  const jid = `${cleaned}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
}
