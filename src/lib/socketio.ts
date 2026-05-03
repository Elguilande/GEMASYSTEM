import { io, Socket } from 'socket.io-client';

export interface StorageData {
  nome: string;
  conteudo: string;
  sessionId: string;
  timestamp: string;
}

export interface SocketIOClient {
  connect: (onConnect: () => void, onError: (error: string) => void) => void;
  disconnect: () => void;
  isConnected: () => boolean;
  enviarDados: (nome: string, conteudo: string) => void;
  pedirDados: (nome: string) => void;
  onDadosEnviados: (callback: (data: { sucesso: boolean; mensagem: string }) => void) => void;
  onDadosRecebidos: (callback: (data: StorageData[]) => void) => void;
  onNovosDados: (callback: (data: StorageData) => void) => void;
  onErro: (callback: (error: string) => void) => void;
}

export function createSocketIOClient(url: string, sessionId: string): SocketIOClient {
  let socket: Socket | null = null;

  return {
    connect: (onConnect: () => void, onError: (error: string) => void) => {
      if (socket?.connected) return;

      socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket.io conectado:', socket?.id);
        socket?.emit('definirSessionId', { sessionId });
        onConnect();
      });

      socket.on('disconnect', () => {
        console.log('Socket.io desconectado');
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Erro de conexão Socket.io:', error);
        onError(error.message || 'Erro ao conectar ao servidor');
      });

      socket.on('erro', (data: { mensagem: string }) => {
        console.error('Erro do servidor:', data.mensagem);
        onError(data.mensagem);
      });
    },

    disconnect: () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    },

    isConnected: () => {
      return socket?.connected || false;
    },

    enviarDados: (nome: string, conteudo: string) => {
      if (socket?.connected) {
        socket.emit('enviarDados', { nome, conteudo });
      }
    },

    pedirDados: (nome: string) => {
      if (socket?.connected) {
        socket.emit('pedirDados', { nome });
      }
    },

    onDadosEnviados: (callback: (data: { sucesso: boolean; mensagem: string }) => void) => {
      if (socket) {
        socket.on('dadosEnviados', callback);
      }
    },

    onDadosRecebidos: (callback: (data: StorageData[]) => void) => {
      if (socket) {
        socket.on('dadosRecebidos', callback);
      }
    },

    onNovosDados: (callback: (data: StorageData) => void) => {
      if (socket) {
        socket.on('novosDados', callback);
      }
    },

    onErro: (callback: (error: string) => void) => {
      if (socket) {
        socket.on('erro', (data: { mensagem: string }) => {
          callback(data.mensagem);
        });
      }
    },
  };
}
