'use strict';

const chai = require( 'chai' );
const chaiaspromised = require( 'chai-as-promised' );
chai.use( chaiaspromised );

describe( '/debug', function() {
    it( 'should info verbose message', function() {
        const logger = require( '../src' )({ __filename, transport: 'debug' });
        logger.info( 'should info verbose message' );
    });
    it( 'should debug verbose message', function() {
        const logger = require( '../src' )({ __filename, transport: 'debug' });
        logger.debug( 'should debug verbose message' );
    });
});

describe( '/development', function() {
    it( 'should info just the message', function() {
        const logger = require( '../src' )({ __filename, transport: 'development' });
        logger.info( 'a message' );
    });
});

describe( '/production', function() {
    it( 'should not info anything', function() {
        const logger = require( '../src' )({ __filename, transport: 'production' });
        logger.info( 'a message' );
    });
});

describe( '/test', function() {
    it( 'should not info anything', function() {
        const logger = require( '../src' )({ __filename, transport: 'test' });
        logger.info( 'should not info anything' );
    });

    it( 'should not error anything', function() {
        const logger = require( '../src' )({ __filename, transport: 'test' });
        logger.info( 'should not error anything' );
    });

    it( 'should crit verbose message and standard meta', function() {
        const logger = require( '../src' )({ __filename, transport: 'test' });
        logger.crit( 'should crit verbose message and standard meta' );
    });
});

describe( 'environment variables', function() {
    it( 'should not info anything', function() {
        process.env.NODE_ENV = 'test';
        const logger = require( '../src' )({ __filename });
        logger.info( 'should not info anything' );
    });

    it( 'should not error anything', function() {
        const logger = require( '../src' )({ __filename });
        logger.info( 'should not error anything' );
    });

    it( 'should crit verbose message and standard meta', function() {
        const logger = require( '../src' )({ __filename });
        logger.crit( 'should crit verbose message and standard meta' );
    });
});
