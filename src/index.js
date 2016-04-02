'use strict';

const winston = require( 'winston' );
const stackTrace = require( 'stack-trace' );

module.exports = config => {
    const c = config || {};
    const transports = {
        production: new winston.transports.File({
            timestamp: () => {
                return Date.now();
            },
            level: 'info',
            filename: c.logFile || process.env.LOG_FILE || 'logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            colorize: false,
        }),
        debug: new winston.transports.Console({
            level: 'debug',
            handleExceptions: false,
            json: false,
            colorize: true,
        }),
        development: new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
        }),
        test: new winston.transports.Console({
            level: 'crit',
            handleExceptions: true,
            json: false,
            colorize: true,
        }),
    };

    const logger = new winston.Logger({
        transports: [
            transports[c.transport || process.env.NODE_ENV] || transports.production,
        ],
    });

    logger.setLevels( winston.c.syslog.levels );

    logger.filters.push(( level, msg ) => {
        const transport = c.transport || process.env.NODE_ENV;
        if ( transport === 'debug' || transport === 'test' ) {
            const callsite = stackTrace.get()[5];
            return `"${msg}"   at ${callsite.getFunctionName() || '<anonymous>'} (${c.__filename}:${callsite.getLineNumber()}:${callsite.getColumnNumber()})`;
        }
        return msg;
    });

    logger.rewriters.push(( level, msg, meta ) => {
        // supress meta logging in development mode
        const transport = c.transport || process.env.NODE_ENV;
        if ( transport === 'development' ) {
            return {};
        }
        if ( transport !== 'debug' && transport !== 'test' ) {
            meta.filename = c.__filename;
        }
        return meta;
    });

    return logger;
};
