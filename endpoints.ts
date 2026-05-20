import {Express, NextFunction, Request, Response, Router} from "express";
import statusRouter from "./routes/status.js";
import healthRouter from "./routes/healthCheck.js";
import modVersionRouter from "./routes/modVersion.js";
import {NotFoundError} from "./errors/implementations/notFoundError.js";
import {API_VERSION} from "./config.js";

export const mapEndpoints = (app: Express) => {

    const guildRouter = Router({mergeParams: true});

    app.use("/api/:version/*extra", (request: Request<{ version: string }>, response: Response, next: NextFunction) => {
        if (request.params.version !== API_VERSION) {
            response.status(301).send({error: `please use /api/${API_VERSION}`});
            return;
        }
        next();
    });

// Map all endpoints that don't require guild id
    app.use("/", statusRouter);

    app.use("/healthz", healthRouter);

    app.use(`/api/${API_VERSION}/mod`, modVersionRouter);

    app.all("*extra", (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith("/socket.io")||req.path.startsWith("/server")||req.path.startsWith("/json/list")||req.path.startsWith("/json/version")) {
            return next();
        }
        throw new NotFoundError("not found");
    });
}