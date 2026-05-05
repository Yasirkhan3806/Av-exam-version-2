import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ timestamp, level, message, ...metadata }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...metadata
    });
});

const backendErrorTransport = new DailyRotateFile({
    filename: 'logs/backend-error-logs-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    dirname: 'logs'
});

const frontendErrorTransport = new DailyRotateFile({
    filename: 'logs/frontend-error-logs-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d',
    dirname: 'logs'
});

export const backendLogger = winston.createLogger({
    format: combine(timestamp(), logFormat),
    transports: [backendErrorTransport]
});

export const frontendLogger = winston.createLogger({
    format: combine(timestamp(), logFormat),
    transports: [frontendErrorTransport]
});
