export type MessageType = 'connect' | 'disconnect' | 'send' | 'read' | 'send_success' | 'send_error' | 'read_result' | 'data_received' | 'status';

export interface WebSocketMessage {
  type: MessageType;
  fileName?: string;
  content?: string;
  message?: string;
  sessionId?: string;
  timestamp?: string;
  error?: string;
  data?: Array<{ name: string; content: string; sessionId: string; timestamp: string }>;
}

type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private sessionId: string;

  constructor(url: string, sessionId: string) {
    this.url = url;
    this.sessionId = sessionId;
  }

  connect(onConnected?: () => void, onError?: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.url.replace('https://', 'wss://').replace('http://', 'ws://');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          this.broadcast({
            type: 'connect',
            sessionId: this.sessionId,
          });
          onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.broadcast(message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = () => {
          const errorMsg = 'Erro de conexão WebSocket';
          console.error(errorMsg);
          onError?.(errorMsg);
          reject(new Error(errorMsg));
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.ws = null;
          this.attemptReconnect(onConnected, onError);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private attemptReconnect(onConnected?: () => void, onError?: (error: string) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Tentando reconectar em ${this.reconnectDelay}ms...`);
      setTimeout(() => {
        this.connect(onConnected, onError).catch(() => {
          // Error handled in connect
        });
      }, this.reconnectDelay);
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      message.sessionId = this.sessionId;
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendData(fileName: string, content: string): void {
    this.send({
      type: 'send',
      fileName,
      content,
    });
  }

  readData(fileName: string): void {
    this.send({
      type: 'read',
      fileName,
    });
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler);
  }

  private broadcast(message: WebSocketMessage): void {
    this.handlers.forEach(handler => handler(message));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
