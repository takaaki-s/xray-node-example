// Update with your config settings.

module.exports = {
  development: {
    client: 'mysql',
    connection: {
      host: 'db',
      user: 'root',
      password: 'password',
      database: 'xray_example',
    },
    migrations: {
      directory: __dirname + '/migrations',
    },
    seeds: {
      directory: __dirname + '/seeds',
    },
  },
};
