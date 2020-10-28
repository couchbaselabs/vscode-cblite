import { window, OutputChannel } from 'vscode';
import { Constants } from '../constants/constants';

export enum Level {
    debug = "DEBUG",
    info = "INFO",
    warn = "WARN",
    error = "ERROR"
}

class Logger {
    private logLevel: string;
    private outputChannel: OutputChannel;

    constructor() {
        this.logLevel = Level.info;
        this.outputChannel = window.createOutputChannel(`${Constants.outputChannelName}`);
    }

    setLogLevel(logLevel: string) {
        this.logLevel = logLevel;
    }

    debug(msg: any) {
        this.log(`${msg.toString()}`, Level.debug);
    }

    info(msg: any) {
        this.log(`${msg.toString()}`, Level.info);
    }

    warn(msg: any) {
        this.log(`${msg.toString()}`, Level.warn);
    }

    error(msg: any) {
        this.log(`${msg.toString()}`, Level.error);
    }

    output(msg: any) {
        this.outputChannel.appendLine(msg.toString());
    }

    showOutput() {
        this.outputChannel.show();
    }

    getOutputChannel(): OutputChannel {
        return this.outputChannel;
    }

    private log(msg: string, level: Level) {
        const time = new Date().toLocaleTimeString();
        msg = `[${time}][${Constants.extensionName}][${level}] ${msg}`;
        switch(level) {
            case Level.error: console.error(msg); break;
            case Level.warn: console.warn(msg); break;
            case Level.info: console.info(msg); break;
            default: console.log(msg); break;
        }
        // log to output channel
        if (this.logLevel && logLevelGreaterThan(level, this.logLevel as Level)) {
            this.output(msg);
        }
    }
}

/**
 * Verify if log level l1 is greater than log level l2
 * DEBUG < INFO < WARN < ERROR
 */
function logLevelGreaterThan(l1: Level, l2: Level) {
    switch(l2) {
        case Level.error:
            return (l1 === Level.error);
        case Level.warn:
            return (l1 === Level.warn || l1 === Level.error);
        case Level.info:
            return (l1 === Level.info || l1 === Level.warn || l1 === Level.error);
        case Level.debug:
            return true;
        default:
            return (l1 === Level.info || l1 === Level.warn || l1 === Level.error);
    }
}

export const logger: Logger = new Logger();