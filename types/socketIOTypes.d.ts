import { IServer2WynnMessage, IWynn2DiscordMessage } from "./messageTypes.js";

export interface ServerToClientEvents {
    wynnMessage: (message: IWynn2DiscordMessage) => void;
    serverMessage: (message: string) => void;
    annieBotMessage: (message: string) => void;
}

export interface ClientToServerEvents {
    wynnMessage: (message: string) => void;
    annieMessage: (message: string) => void;
    serverMessage: (message: string) => void;
    sync: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    messageIndex: number;
    hrMessageIndex: number;
    uuid: string;
    username?: string;
    modVersion?: string;
}