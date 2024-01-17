const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'users';
const tableAttributes = ['username','password','first_name','last_name','email', 'avatar']

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
    (${attributeValues})`;

  try {
    const result = await db.query(query);

    if (result.affectedRows) {
      // Trả về thông tin user mới đăng ký
      const userId = result.insertId;
      const selectQuery = `SELECT * FROM ${table} WHERE id = ${userId}`;
      const userResult = await db.query(selectQuery);

      if (userResult.length > 0) {
        const newUser = userResult[0];
        return { message: "Data created successfully", user: newUser };
      }
    }

    throw new Error("Error in creating data");
  } catch (error) {
    throw error;
  }
}

async function signin(data) {
  try {
    // Truy vấn để kiểm tra thông tin đăng nhập
    const loginQuery = `SELECT * FROM users WHERE username = '${data.username}' AND password = '${data.password}'`;
    const userResult = await db.query(loginQuery);

    if (userResult.length > 0) {
      const loggedInUser = userResult[0];
      return { message: "Login successful", user: loggedInUser };
    } else {
      throw new Error("Invalid username or password");
    }
  } catch (error) {
    throw error;
  }
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
  signin,
};
