var pg=require('pg');
var bunyan=require('bunyan');

// Connection strings formerly scattered in the code
// var connectionString = '//DQAdmin:lEtmEinplEasE!@dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com/DQ'
// var connectionString = 'pg://DQAdmin:lEtmEinplEasE!@localhost:5433/DQ';
// var connectionString = 'pg:dq-test.cvwdsktow3o7.us-east-1.rds.amazonaws.com:5432/DQ';
var pg_config = {
    poolSize: 20,
    connectionDef : {
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.DB_NAME || 'DQ',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432'
  }
};

// This must be set before creating any pools
// See https://github.com/brianc/node-postgres/wiki/pg
// TODO: Make this dynamic, query server for:
//   (max_connections - superuser_reserverd_connections) / [max processes using db]
//   http://www.postgresql.org/docs/9.0/static/runtime-config-connection.html
pg.defaults.poolSize = pg_config.poolSize;

// Set up logging
var logger = bunyan.createLogger({name: "DQ"});

module.exports = {
    pg: pg_config,
    logger: logger
};
