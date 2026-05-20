import express from "express";
import app from "./app.js";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import registerSocketHandlers, {registerMessageIndex} from "./sockets/connection.js";

import cors from "cors";
import "./config";
import {mapEndpoints} from "./endpoints.js";

import fs from "fs";

const path = "./annie-lock.json"; // file to track lock state

const httpServer = createServer(app);

export function getAnnieLock() {
    try {
        const data = JSON.parse(fs.readFileSync(path));
        return data;
    } catch {
        return { countdownStarted: false, timestamp: 0 };
    }
}

export function setAnnieLock(data) {
    fs.writeFileSync(path, JSON.stringify(data));
}


process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Optionally, perform cleanup and try to continue running,
    // but ideally log and then restart gracefully.
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    // Handle or log the promise rejection here.
});

export const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

registerSocketHandlers(io);

httpServer.listen(process.env.PORT || 3000);

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));


mapEndpoints(app);
