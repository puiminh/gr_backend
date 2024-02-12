const config = {
  db: {
    /* don't expose password or any sensitive info, done only for demo */
    host: "localhost",
    user: "root",
    password: "11122001",
    database: "gr",
    connectTimeout: 60000,
    multipleStatements: true
  },
  listPerPage: 12
};
module.exports = config;
