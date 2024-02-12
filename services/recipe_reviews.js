const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'recipe_reviews';
const tableAttributes = ['recipe_id','user_id','rating', 'comment']

async function getMultiple(page = 1) {
  const offset = helper.getOffset(page, config.listPerPage);
  const query = `SELECT * FROM ${table} LIMIT ${offset},${config.listPerPage}`
  
  const rows = await db.query(
    query
  );
  
  const data = helper.emptyOrRows(rows);
  const meta = { page };

  return {
    data,
    meta
  };
}

async function create(data) {
  const attributes = tableAttributes;
  const attributeNames = attributes.join(', ');
  const attributeValues = attributes.map(attr => (typeof data[attr] === 'string' ? `'${data[attr]}'` : data[attr])).join(', ');

  const query = `INSERT INTO ${table} 
  (${attributeNames}) 
  VALUES 
  (${attributeValues})`
  const result = await db.query(
    query
  );

  console.log(query);

  let message = "Error in creating data";
  let success = false;
  if (result.affectedRows) {
    message = "data created successfully";
    success = true;
  }

  return { message, success };
}

async function get(id) {
  const query = `SELECT * FROM ${table} WHERE id=${id}`
  const result = await db.query(
    query
  );

  return { result }
}

async function update(id, data) {
  const attributes = tableAttributes;
  const attributeAssignments = attributes.map(attr => `${attr}=${typeof data[attr] === 'string' ? `'${data[attr]}'` : data[attr]}`).join(', ');


  const query = `UPDATE ${table} 
  SET ${attributeAssignments}
  WHERE id=${id}`
  const result = await db.query(
    query
  );

  let message = "Error in updating data";
  let success = false;
  if (result.affectedRows) {
    message = "data updated successfully";
    success = true;
  }

  return { message, success };
}

async function remove(id) {
  const query = `DELETE FROM ${table} WHERE id=${id}`
  const result = await db.query(
    query
  );

  let message = "Error in deleting data";
  let success = false;
  if (result.affectedRows) {
    message = "data deleted successfully";
    success = true;
  }

  return { message, success };
}

module.exports = {
  getMultiple,
  get,
  create,
  update,
  remove,
};
