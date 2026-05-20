import { io } from "../index.js";
import {Server, Socket, RemoteSocket} from "socket.io";
import "../config.js";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "../types/socketIOTypes.js";
import {IServer2WynnMessage, IWynnMessage} from "../types/messageTypes.js";
import { checkVersion } from "../utils/versionUtils.js";
//import {unwatchFile} from "node:fs";
//import {getAnnieLock, setAnnieLock} from "../index.js"

const ENCODED_DATA_PATTERN = /([\u{F0000}-\u{FFFFD}]|[\u{100000}-\u{10FFFF}])+/gu;
const wynnMessagePatterns: IWynnMessage[] = [
    { pattern: /^§#00bdbfff((󏿼󏿿󏿾)|(󏿼󐀆))§#00bdbfff The (?<worldevent>.+?)+ World Event starts $/, messageType: 1 }
];

const messageIndex: { [key: string]: number } = {};
var messageParts:string[] = [];
var worldEvent:string="";
var worldEventParts:string[] = [];
var concatMessage:string = "";


export function registerMessageIndex() {
    const allowedEvents:string[] = ["Annie","HaywireDefender", "ApproachingRaid", "SkitteringSpiders", "OvertakenFarm",
        "ArachnidAmbush", "EncroachingBlaze", "DarkDeacons", "EncroachingDestruction", "CorruptedSpring", "NecromanticSite",
        "RisenReturn", "EncroachingMisery", "TaintedShoreline", "AeonOrigin", "BowelsoftheRoots", "EncroachingReanimation",
        "ImproperBurialRites", "Blood-EncrustedMastaba", "EncroachingConflagration", "FailedHunt", "CanineAmbush", "BlazingCombustion", "LonelyIslet",
        "EncroachingAblation", "RogueWyrmling", "SlimySchism", "SwashbucklingBrawl", "DesperateAmbush", "ABurningMemory",
        "EncroachingExtinction", "PeculiarGrotto", "LightEmissaries", "UnsettlingEncounters", "VisitfromBeyond", "AbandonedSentinels",
        "RealmicAntigen", "TerritorialTrolls", "ColossiIngrain", "EnragedEagle", "Ruff&Tumble", "DespermechOccupation",
        "DecommissionedWarMachines", "BubblingTerrace", "InfernalCaldera", "MaarAshpit", "ShatteredRoots", "AhmsMonuments",
        "IncomprehensibleCynosure", "ShapesintheDark", "AllEyesonMe", "MonumenttoLoss", "PestilentialDownpour",
        "OtherworldlyExhibition", "SwamplandSquabble", "AutumnPoachers", "StackpeakPinnacle", "KaroshiUnion", "SteelSkirmish",
        "BiohazardousBloom", "Tree-TopCradle","ApiaryHive", "FossilFighters", "GlacialTraining", "PatrollingSoldiers", "MoleMeet-Up",
        "CitadelBarracks", "RoyalAlchemists", "PalaceGuards"];
    allowedEvents.forEach(event => {
        messageIndex[event] = 0;
    })
}
const processedMessages = new Set<string>();
const annieMessages = new Set<string>();


const errorHandler = (toHandle: Function) => {
    const handleError = (error: Error) => {
        console.error("socket error:", error);
    };
    return (...args: any[]) => {
        try {
            const ret = toHandle.apply(this, args);
            if (ret && typeof ret.catch === "function") {
                ret.catch(handleError);
            }
        } catch (e: any) {
            handleError(e);
        }
    };
};

export default function registerSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
    io.use((socket, next) => {
        const username = socket.handshake.query.username as string;
        const modVersion = socket.handshake.query.modVersion as string;

        socket.data.username = username || undefined;
        socket.data.modVersion = modVersion || "0.0.0";
        socket.data.messageIndex=0;

        next();
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
        console.log(socket.data.username + " connected to server with version: " + socket.data.modVersion);

        socket.on("error", (err:any)=>{
            console.error("Socket error on", socket.id, ":", err);
            }
        );

        socket.on("wynnMessage", async (message) => {
            if (!checkVersion(socket.data.modVersion)) {
                console.log(`skipping request from outdated mod version: ${socket.data.modVersion}`);
                return;
            }
            messageParts = [];
            concatMessage = "";
            worldEvent="";
            messageParts = message.split(":");
            worldEvent=messageParts[0];
            worldEventParts=worldEvent.split(" ");
            for (let i = 0; i < worldEventParts.length; i++) {
                concatMessage += worldEventParts[i];
            }
            socket.data.messageIndex=messageIndex[concatMessage];

            console.log("WynnMessage received:", message);
            console.log(
                message,
                "emitted by:",
                socket.data.username,
            );

            if(!processedMessages.has(concatMessage)) {
                processedMessages.add(concatMessage);
                notifUsers(message);
            }
        });

//        socket.on("annieMessage", async (message) => {
//            if (!checkVersion(socket.data.modVersion)) {
//                console.log(`skipping request from outdated mod version: ${socket.data.modVersion}`);
//                return;
//            }
//
//            const lock = getAnnieLock();
//            const now = Date.now();
//            const thirteenHours = 13 * 60 * 60 * 1000;
//
//            if (!lock.countdownStarted || now - lock.timestamp > thirteenHours) {
//                await notifMag(message);
//
//                lock.countdownStarted = true;
//                lock.timestamp = now;
//                setAnnieLock(lock);
//
//                setTimeout(async () => {
//                    try {
//                        await notifMag("59m");
//                        setAnnieLock({ countdownStarted: false, timestamp: Date.now() });
//                    } catch (err) {
//                        console.error("Error in delayed notifMag:", err);
//                    }
//                }, 11 * 60 * 60 * 1000);
//            }
//        });

        socket.on("sync", () => {
            socket.data.messageIndex = messageIndex[0];
        });

        socket.on("disconnect", (reason) => {
            console.log(`${socket.data.username} disconnected: ${reason}`);
        });
    });
}


export async function notifUsers(message:string){
    const allSockets = await io.fetchSockets();
    allSockets.forEach(async (s) => {
        s.emit("serverMessage", message);
    });
}

//export async function notifMag(message:string){
//    const allSockets = await io.fetchSockets();
//    allSockets.forEach(async (s) => {
//        if (s.data.username == "Magbot" && s.handshake.headers["key"]==process.env.MAGKEY){
//            const unix= await convertDurationToUnix(message) + "";
//            s.emit("annieBotMessage", unix);
//        }
//    })
//}

//export async function convertDurationToUnix(timeStr: String) {
//    const match = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/) || timeStr.match(/(?:(\d+)m)?/);
//    if (!match) {
//        throw new Error("Invalid format. Expected something like '11h 59m'");
//    }
//    const hours = parseInt(match[1] || "0", 10);
//    const minutes = parseInt(match[2] || "0", 10);
//    const now = Date.now();
//    const durationMs = (hours * 60 + minutes) * 60 * 1000;
//    const futureTime = now + durationMs;
//    return Math.floor(futureTime / 1000);
//}

setInterval(() => {
    processedMessages.clear();
}, 90 * 1000); // every 90 seconds

//setInterval(()=>{
//    annieMessages.clear()
//    }, 13 * 60 * 60 * 1000);