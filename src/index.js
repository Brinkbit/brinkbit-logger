const winston = require( 'winston' );
const morgan = require( 'morgan' );
const stackTrace = require( 'stack-trace' );
const Slack = require( 'winston-slack-hook' );
const Papertrail = require( 'winston-papertrail' ).Papertrail;


module.exports = {
    configure: ( config ) => {
        const c = config || {};
        c.slack = c.slack || {};
        c.paperTrail = c.paperTrail || {};

        const production = [];
        if ( c.slack.hookUrl || process.env.SLACK_HOOK ) {
            production.push( new Slack({
                name: 'critHookSlack',
                level: 'crit',
                team: c.slack.team || process.env.SLACK_TEAM,
                hookUrl: c.slack.hookUrl || process.env.SLACK_HOOK,
                channel: c.slack.critChannel || process.env.SLACK_CHANNEL,
                username: c.slack.username || process.env.SLACK_USERNAME,
                prependLevel: false,
                formatter: options => `${options.level === 'crit' ? '@all CRITICAL ERROR: ' : ''}${options.message}`,
            }));
        }
        if ( c.paperTrail.host || process.env.PAPERTRAIL_HOST ) {
            const papertrail = new Papertrail({
                level: 'info',
                levels: winston.config.syslog.levels,
                host: c.paperTrail.host || process.env.PAPERTRAIL_HOST,
                port: c.paperTrail.port || process.env.PAPERTRAIL_PORT,
                program: c.paperTrail.program || process.env.DOCKERCLOUD_SERVICE_HOSTNAME,
                hostname: c.paperTrail.hostname || process.env.DOCKERCLOUD_NODE_HOSTNAME,
                colorize: true,
            });
            production.push( papertrail );
        }
        production.push( new winston.transports.File({
            silent: false,
            level: 'info',
            filename: c.logFile || process.env.LOG_FILE || 'logs.log',
            handleExceptions: true,
            json: true,
            maxsize: c.logSize || process.env.LOG_SIZE || 5242880,
            maxFiles: c.logCount || process.env.LOG_COUNT || 5,
            colorize: false,
        }));
        const transports = {
            production,
            debug: [new winston.transports.Console({
                level: 'debug',
                handleExceptions: false,
                prettyPrint: true,
                json: false,
                colorize: true,
            })],
            development: [new winston.transports.Console({
                level: 'info',
                handleExceptions: true,
                prettyPrint: true,
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
        const morganFormat = transport === 'debug' ? 'dev' : 'short';
        winston.loggers.add( c.id || 'brinkbit', {
            transports: transports[transport],
        });
        const logger = winston.loggers.get( c.id || 'brinkbit' );
        logger.setLevels( winston.config.syslog.levels );

        if ( transport === 'debug' && logger.filters < 1 ) {
            logger.filters.push(( level, msg ) => {
                const callsite = stackTrace.get()[5];
                return `"${msg}"   at ${callsite.getFunctionName() || '<anonymous>'} (${callsite.getFileName()}:${callsite.getLineNumber()}:${callsite.getColumnNumber()})`;
            });
        }

        if ( transport === 'production' && logger.rewriters < 1 ) {
            logger.rewriters.push(( level, msg, meta ) => {
                if ( process.env.DOCKERCLOUD_CONTAINER_HOSTNAME ) {
                    meta.containerName = process.env.DOCKERCLOUD_CONTAINER_HOSTNAME;
                }
                if ( process.env.DOCKERCLOUD_SERVICE_HOSTNAME ) {
                    meta.serviceName = process.env.DOCKERCLOUD_SERVICE_HOSTNAME;
                }
                if ( process.env.DOCKERCLOUD_STACK_NAME ) {
                    meta.stackName = process.env.DOCKERCLOUD_STACK_NAME;
                }
                return meta;
            });
        }

        if ( transport !== 'test' ) {
            logger.middleware = morgan( morganFormat, { stream: {
                write: ( message ) => {
                    logger.info( message.slice( 0, -1 ), { isMiddleware: true });
                },
            } });
        }
        else {
            logger.middleware = ( req, res, next ) => next();
        }

        return logger;
    },
    get: function get( id = 'brinkbit' ) {
        return winston.loggers.get( id );
    },
};
