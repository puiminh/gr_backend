const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'recipes';
const tableAttributes = ['name','video','image']

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

  let message = "Error in creating data";

  if (result.affectedRows) {
    message = "data created successfully";
  }

  return { message };
}

async function get(id) {
  const query = `GET * FROM ${table} WHERE id=${id}`
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

  if (result.affectedRows) {
    message = "data updated successfully";
  }

  return { message };
}

async function remove(id) {
  const query = `DELETE FROM ${table} WHERE id=${id}`
  const result = await db.query(
    query
  );

  let message = "Error in deleting data";

  if (result.affectedRows) {
    message = "data deleted successfully";
  }

  return { message };
}

module.exports = {
  getMultiple,
  get,
  create,
  update,
  remove,
};
