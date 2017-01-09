# brinkbit-logger

> An opinionated winston logger.

Dynamically switch between four [winston](https://github.com/winstonjs/winston) transports within a node process.
Override on a per-instance basis.

# Install

```
npm i --save brinkbit-logger
```

# Usage

Every instance expects to be passed a filename for easy performant context.

```javascript
const logger = require( 'brinkbit-logger' )({ __filename });

logger.info( 'just logging some stuff' );
```

Morgan middleware is exposed for convenience .

```javascript
const app = require( 'express' )();
app.use( logger.middleware );
```

Logging levels are configured following RFC5424

```javascript
{ emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
```

# Options

The brinkbit-logger is intended to be configured using environment variables.
However you can override the global configuration on a per-instance basis like so:

```javascript
const logger = require( 'brinkbit-logger' )({ __filename, logFile: 'customLogFile.log' });
```

## Transport

Transports define where logs are sent, as well as several formatting rules.

By default, the transport type is configured based on the `NODE_ENV` environment variable.
Optionally override the global configuration on a per-instance basis like so:

```javascript
const logger = require( 'brinkbit-logger' )({ __filename, transport: 'debug' });
```

The following levels are accepted:

- `'production'` *(default)* - writes json to a log file without console output
- `'debug'` - extremely verbose output to the console. Negative performance impact
- `'development'` - reasonable output, designed for regular development usage. Negative performance impact
- `'test'` - only prints out emerg level so you can focus on the console output of your tests

## Log File

### Environment Variables

- LOG_FILE
- LOG_SIZE
- LOG_COUNT

### Config Object

`info` and higher levels will log to files in production.

- config.logFile
- config.logSize
- config.logCount

## Slack Integration

`crit` and higher levels can log to [slack](slack.com) in production.

### Environment Variables

- SLACK_TEAM
- SLACK_HOOK
- SLACK_CHANNEL
- SLACK_USERNAME

### Config Object

- config.slack.team
- config.slack.hookUrl
- config.slack.critChannel
- config.slack.username

## Papertrail Integration

`info` and higher levels can log to [Papertrail](papertrailapp.com) in production.

### Environment Variables

- PAPERTRAIL_HOST
- PAPERTRAIL_PORT

### Config Object

- config.paperTrail.host
- config.paperTrail.port
- config.paperTrail.program
- config.paperTrail.hostname

## Dockercloud Environment Variables

The following environment variables are pulled from Dockercloud configuration:

- DOCKERCLOUD_SERVICE_HOSTNAME
- DOCKERCLOUD_CONTAINER_HOSTNAME
- DOCKERCLOUD_NODE_HOSTNAME
- DOCKERCLOUD_STACK_NAME
