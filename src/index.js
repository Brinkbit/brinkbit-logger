'use strict';

const winston = require( 'winston' );
const morgan = require( 'morgan' );
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
    const transport = transports[c.transport || process.env.NODE_ENV] ? c.transport || process.env.NODE_ENV : 'production';
    const morganFormat = transport === 'development' ? 'dev' : 'combined';
    const logger = new winston.Logger({
        transports: [
            transports[transport],
        ],
    });

    logger.setLevels( winston.config.syslog.levels );

    if ( transport === 'debug' || transport === 'test' ) {
        logger.filters.push(( level, msg ) => {
            const callsite = stackTrace.get()[5];
            return `"${msg}"   at ${callsite.getFunctionName() || '<anonymous>'} (${c.__filename}:${callsite.getLineNumber()}:${callsite.getColumnNumber()})`;
        });
    }

    if ( transport === 'development' ) {
        logger.rewriters.push(() => {
            return {};
        });
    }

    if ( transport !== 'debug' && transport !== 'test' ) {
        logger.rewriters.push(( level, msg, meta ) => {
            meta.filename = c.__filename;
            return meta;
        });
    }

    if ( transport !== 'test' ) {
        logger.middleware = morgan( morganFormat, { 'stream': {
            write: ( message ) => {
                logger.info( message );
            },
        } });
    }
    else {
        logger.middleware = ( req, res, next ) => next();
    }

    return logger;
};
