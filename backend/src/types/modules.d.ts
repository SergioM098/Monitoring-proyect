declare module 'qrcode-terminal' {
  export function generate(text: string, options?: { small?: boolean }): void;
}

declare module 'whatsapp-web.js' {
  import { EventEmitter } from 'events';

  interface LocalAuthOptions {
    clientId?: string;
    dataPath?: string;
  }

  interface PuppeteerOptions {
    headless?: boolean;
    args?: string[];
    executablePath?: string;
  }

  interface ClientOptions {
    authStrategy?: LocalAuth;
    puppeteer?: PuppeteerOptions;
  }

  export class LocalAuth {
    constructor(options?: LocalAuthOptions);
  }

  export class Client extends EventEmitter {
    constructor(options?: ClientOptions);
    initialize(): Promise<void>;
    sendMessage(chatId: string, content: string): Promise<unknown>;
    destroy(): Promise<void>;
    logout(): Promise<void>;
    getState(): Promise<string>;
    on(event: 'qr', listener: (qr: string) => void): this;
    on(event: 'ready', listener: () => void): this;
    on(event: 'authenticated', listener: () => void): this;
    on(event: 'auth_failure', listener: (msg: string) => void): this;
    on(event: 'disconnected', listener: (reason: string) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}
