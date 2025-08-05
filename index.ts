import express from "express";
import app, {server} from "./app.js";
import {connect} from "mongoose";
import bodyParser from "body-parser";
import {registerMessageIndex} from "./sockets/connection.js";

import cors from "cors";
import "./config";
import {errorHandler} from "./middleware/errorHandler.middleware.js";
import {mapEndpoints} from "./endpoints.js";

import fs from "fs";

const path = "./annie-lock.json"; // file to track lock state

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
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
// Connect to database
try {
    const dbUrl = process.env.DB_URL;
    connect(dbUrl, {retryWrites: true, writeConcern: {w: "majority"}}).then(() => {
    });
    console.log("Database Connected");
    registerMessageIndex()
    server.listen(port, () => {
        console.log(`Socket.io server listening on port ${port}`)
    });
} catch (error) {
    console.error("Failed to connect to database:", error);
}

mapEndpoints(app);
app.use(errorHandler);
