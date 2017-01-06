'use strict';

const winston = require( 'winston' );
const morgan = require( 'morgan' );
const stackTrace = require( 'stack-trace' );
const Slack = require( 'winston-slack-hook' );

module.exports = config => {
    const c = config || {};
    c.slack = c.slack || {};
    let production = [];
    if ( c.slack.hookUrl || process.env.SLACK_HOOK ) {
        production = production.concat([
            new Slack({
                name: 'standardHookSlack',
                level: 'info',
                team: c.slack.team || process.env.SLACK_TEAM,
                hookUrl: c.slack.hookUrl || process.env.SLACK_HOOK,
                channel: c.slack.channel || process.env.SLACK_CHANNEL,
                username: c.slack.username || process.env.SLACK_USERNAME,
                appendMeta: false,
            }),
            new Slack({
                name: 'critHookSlack',
                level: 'crit',
                team: c.slack.team || process.env.SLACK_TEAM,
                hookUrl: c.slack.hookUrl || process.env.SLACK_HOOK,
                channel: c.slack.critChannel || process.env.SLACK_CRIT_CHANNEL,
                username: c.slack.username || process.env.SLACK_USERNAME,
                prependLevel: false,
                formatter: options => {
                    return `${options.level === 'crit' ? '@all CRITICAL ERROR: ' : ''}${options.message}`;
                },
            }),
        ]);
    }
    production.push( new winston.transports.File({
        silent: false,
        level: 'info',
        filename: c.logFile || process.env.LOG_FILE || 'logs.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
    }));
    const transports = {
        production,
        debug: [new winston.transports.Console({
            level: 'debug',
            handleExceptions: false,
            json: false,
            colorize: true,
        })],
        development: [new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
        })],
        test: [new winston.transports.Console({
            level: 'emerg',
            handleExceptions: true,
            json: false,
            colorize: true,
        })],
    };
    const transport = transports[c.transport || process.env.NODE_ENV] ? c.transport || process.env.NODE_ENV : 'production';
    const morganFormat = transport === 'development' || transport === 'debug' ? 'dev' : 'combined';
    const logger = winston.loggers.get( c.__filename, {
        transports: transports[transport],
    });

    logger.setLevels( winston.config.syslog.levels );

    if ( transport === 'debug' && logger.filters < 1 ) {
        logger.filters.push(( level, msg, meta ) => {
            if ( meta.isMiddleware ) {
                delete meta.isMiddleware;
                return msg;
            }
            const callsite = stackTrace.get()[5];
            return `"${msg}"   at ${callsite.getFunctionName() || '<anonymous>'} (${callsite.getFileName()}:${callsite.getLineNumber()}:${callsite.getColumnNumber()})`;
        });
    }

    if ( transport === 'development' && logger.rewriters < 1 ) {
        logger.rewriters.push(() => {
            return {};
        });
    }
    else if ( transport !== 'debug' && transport !== 'test' && logger.rewriters < 1 ) {
        logger.rewriters.push(( level, msg, meta ) => {
            if ( meta.isMiddleware ) delete meta.isMiddleware;
            else meta.filename = c.__filename;
            return meta;
        });
    }

    if ( transport !== 'test' ) {
        logger.middleware = morgan( morganFormat, { 'stream': {
            write: ( message ) => {
                logger.info( message, { isMiddleware: true });
            },
        } });
    }
    else {
        logger.middleware = ( req, res, next ) => next();
    }

    return logger;
};
