declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "production" | undefined;
            PORT?: string;
            JWT_VALIDATION_KEY: string;
            JWT_SECRET_KEY: string;
            JWT_REFRESH_SECRET_KEY: string;
        }
    }
}

export {};
