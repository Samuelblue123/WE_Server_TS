import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData} from "./types/socketIOTypes.js";

const app = express();
const server = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server);

io.engine.on("connection_error", (err) => {
    console.error("Global connection error from Engine.IO:", err);
});

console.log(io.engine.opts.pingInterval);
console.log(io.engine.opts.pingTimeout);
export {io, server };
export default app;
