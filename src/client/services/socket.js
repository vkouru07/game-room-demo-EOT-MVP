import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5050'; // Replace with your WebSocket server URL

export const socket = io(SOCKET_URL, {
    autoConnect: false,  // Prevents auto-connecting before calling `socket.connect()`
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const subscribeToEvent = (eventName, callback) => {
    socket.on(eventName, callback);
};

export const sendMessage = (eventName, data) => {
    socket.emit(eventName, data);
};