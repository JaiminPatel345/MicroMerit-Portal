export const logger = {
    info: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify({ level: 'info', timestamp, message, ...meta }));
    },
    error: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        console.error(JSON.stringify({ level: 'error', timestamp, message, ...meta }));
    },
    warn: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        console.warn(JSON.stringify({ level: 'warn', timestamp, message, ...meta }));
    },
    debug: (message: string, meta?: any) => {
        const timestamp = new Date().toISOString();
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(JSON.stringify({ level: 'debug', timestamp, message, ...meta }));
        }
    },
};
