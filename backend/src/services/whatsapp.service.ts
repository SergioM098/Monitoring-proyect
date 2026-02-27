import { join } from 'path';
import makeWASocket, {
  DisconnectReason,
  fetchLatestWaWebVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

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
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // Fetch latest WhatsApp Web version so we don't get rejected for outdated protocol
  let waVersion: [number, number, number] | undefined;
  try {
    const { version } = await fetchLatestWaWebVersion({});
    waVersion = version as [number, number, number];
    console.log(`[WhatsApp] Usando version WA Web: ${waVersion.join('.')}`);
  } catch {
    console.log('[WhatsApp] No se pudo obtener version, usando default');
  }

  let pairingRequested = false;

  function connectToWA() {
    sock = makeWASocket({
      auth: state,
      version: waVersion,
      browser: ['WOW Monitor', 'Chrome', '131.0.0'],
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // When we get a QR, use pairing code instead (bypasses QR rate-limit)
      if (qr && !pairingRequested) {
        pairingRequested = true;
        const phone = process.env.WHATSAPP_PHONE;
        if (!phone) {
          console.error('[WhatsApp] No se encontro WHATSAPP_PHONE en .env');
          console.error('[WhatsApp] Agrega WHATSAPP_PHONE=521234567890 a tu archivo .env');
          return;
        }
        try {
          const code = await sock!.requestPairingCode(phone);
          console.log('\n========================================');
          console.log('  Codigo de vinculacion WhatsApp:');
          console.log(`  >>> ${code} <<<`);
          console.log('========================================');
          console.log('\nAbre WhatsApp > Dispositivos vinculados');
          console.log('> Vincular dispositivo > Vincular con numero de telefono');
          console.log(`> Ingresa el codigo: ${code}\n`);
        } catch (err: unknown) {
          const e = err as { message?: string };
          console.error('[WhatsApp] Error solicitando pairing code:', e.message);
        }
      }

      if (connection === 'open') {
        isReady = true;
        pairingRequested = false;
        console.log('[WhatsApp] Cliente conectado y listo para enviar mensajes');
      }

      if (connection === 'close') {
        isReady = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('[WhatsApp] Sesion cerrada. Elimina la carpeta .baileys_auth y reinicia.');
          sock = null;
          return;
        }

        pairingRequested = false;
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

  const cleaned = phone.replace(/^whatsapp:/, '').replace(/[+\s-]/g, '');
  const jid = `${cleaned}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
}
