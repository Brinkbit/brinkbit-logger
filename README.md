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

Logging levels are configured following RFC5424

```javascript
{ emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
```

# Options

## Transport

Transports define whether to log to the console or to a file, as well as several formatting rules.

By default, the transport type is configured based on the `NODE_ENV` environment variable.
Override the global configure on a per-instance basis like so:

```javascript
const logger = require( 'brinkbit-logger' )({ __filename, transport: 'debug' });
```

The following levels are accepted:

- `'production'` *(default)* - writes json to a log file without console output
- `'debug'` - extremely verbose output to the console
- `'development'` - reasonable output, designed for regular development usage. Negative performance impact
- `'test'` - only prints out crit level or higher so you can focus on the console output of your tests

## Log File

Set the log file location using the `LOG_FILE` environment variable. Defaults to `'logs.log'`.
Override the global configure on a per-instance basis like so:

```javascript
const logger = require( 'brinkbit-logger' )({ __filename, logFile: 'customLogFile.log' });
```
