const mysql = require("mysql2/promise");
const config = require("../config");

async function query(sql, params) {
  const connection = await mysql.createConnection(config.db);
  const [results] = await connection.execute(sql, params);

  return results;
}

async function callSpSearch(id) {
  const connection = await mysql.createConnection(config.db);
  const [results] = await connection.query(
    "CALL sp_search_programming_languages_by_id(" + id + ")"
  );

  return results;
}
module.exports = {
  query,
  callSpSearch
};
