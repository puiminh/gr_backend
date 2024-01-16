const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'stores';
const tableAttributes = ['lat','lng','type','name','description','address','owner_id']

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

async function getStoreDetail(storeId) {
  try {
    // Truy vấn cơ bản để lấy thông tin của cửa hàng
    const storeQuery = `SELECT * FROM stores WHERE id = ${storeId}`;
    const storeResult = await db.query(storeQuery);

    if (storeResult.length === 0) {
      throw new Error('Store not found');
    }

    const store = storeResult[0];

    // Truy vấn để lấy điểm đánh giá trung bình
    const ratingQuery = `SELECT AVG(rating) AS avgRating FROM store_reviews WHERE store_id = ${storeId}`;
    const ratingResult = await db.query(ratingQuery);
    const avgRating = ratingResult[0].avgRating || 0;

    // Truy vấn để lấy thông tin về chủ sở hữu
    const ownerQuery = `SELECT * FROM users WHERE id = ${store.owner_id}`;
    const ownerResult = await db.query(ownerQuery);
    const owner = ownerResult.length > 0 ? ownerResult[0] : null;

    // Truy vấn để lấy thông tin về nguyên liệu
    const ingredientsQuery = `
      SELECT ingredients.*, store_ingredients.price, store_ingredients.price_desc, store_ingredients.description AS ingredient_description
      FROM ingredients
      INNER JOIN store_ingredients ON ingredients.id = store_ingredients.ingredient_id
      WHERE store_ingredients.store_id = ${storeId}
    `;
    const ingredientsResult = await db.query(ingredientsQuery);
    const ingredients = ingredientsResult.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      type: ingredient.type,
      image: ingredient.image,
      description: ingredient.description,
      price: ingredient.price,
      price_desc: ingredient.price_desc,
      ingredient_description: ingredient.ingredient_description
    }));

    // Truy vấn để lấy thông tin về các đánh giá
    const reviewsQuery = `
      SELECT store_reviews.*, users.first_name, users.last_name
      FROM store_reviews
      INNER JOIN users ON store_reviews.user_id = users.id
      WHERE store_reviews.store_id = ${storeId}
    `;
    const reviewsResult = await db.query(reviewsQuery);
    const reviews = reviewsResult.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      user: {
        id: review.user_id,
        first_name: review.first_name,
        last_name: review.last_name
      }
    }));

    // Tạo đối tượng kết quả
    const storeDetails = {
      store: {
        id: store.id,
        lat: store.lat,
        lng: store.lng,
        type: store.type,
        name: store.name,
        description: store.description,
        address: store.address,
        created_at: store.created_at,
        updated_at: store.updated_at,
        rating: avgRating,
        owner: owner,
        ingredients: ingredients,
        reviews: reviews
      },
    };

    return storeDetails;
  } catch (error) {
    throw error;
  }
}

async function getAllStores() {
  try {
    // Truy vấn để lấy thông tin về toàn bộ cửa hàng và điểm đánh giá trung bình
    const storesQuery = `
      SELECT stores.*, AVG(store_reviews.rating) AS avgRating
      FROM stores
      LEFT JOIN store_reviews ON stores.id = store_reviews.store_id
      GROUP BY stores.id
    `;
    const storesResult = await db.query(storesQuery);

    // Truy vấn để lấy số lượng đánh giá cho từng cửa hàng
    const reviewsCountQuery = `
      SELECT store_id, COUNT(*) AS reviewsCount
      FROM store_reviews
      GROUP BY store_id
    `;
    const reviewsCountResult = await db.query(reviewsCountQuery);

    // Tạo một đối tượng Map để lưu trữ số lượng đánh giá cho từng cửa hàng
    const reviewsCountMap = new Map();
    reviewsCountResult.forEach(row => {
      reviewsCountMap.set(row.store_id, row.reviewsCount);
    });

    // Xử lý kết quả để tạo mảng chứa thông tin cửa hàng và điểm đánh giá trung bình
    const allStores = storesResult.map(store => ({
      id: store.id,
      lat: store.lat,
      lng: store.lng,
      type: store.type,
      name: store.name,
      description: store.description,
      address: store.address,
      created_at: store.created_at,
      updated_at: store.updated_at,
      avgRating: store.avgRating || 0,
      reviewsCount: reviewsCountMap.get(store.id) || 0
    }));

    return {allStores: allStores};
  } catch (error) {
    throw error;
  }
}


module.exports = {
  getMultiple,
  get,
  create,
  update,
  remove,
  getStoreDetail,
  getAllStores,
};
