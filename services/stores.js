const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'stores';
const tableAttributes = ['lat','lng','type','name','description','address','owner']

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
    const ownerQuery = `SELECT * FROM users WHERE id = ${store.owner}`;
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
        rating: Number(avgRating).toFixed(1),
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
      avgRating: Number(store.avgRating).toFixed(1) || 0,
      reviewsCount: reviewsCountMap.get(store.id) || 0
    }));

    return {allStores: allStores};
  } catch (error) {
    throw error;
  }
}

async function filterStoresByIngredients(ingredientIds) {
  try {
    // Chuyển đổi mảng ingredientIds thành một chuỗi để sử dụng trong câu truy vấn SQL
    const ingredientIdsString = ingredientIds.join(',');

    // Câu truy vấn SQL
    const query = `
      SELECT 
        stores.*, 
        AVG(store_reviews.rating) AS avgRating
      FROM stores
      LEFT JOIN store_reviews ON stores.id = store_reviews.store_id
      WHERE stores.id IN (
        SELECT DISTINCT s.id
        FROM stores s
        JOIN store_ingredients si ON s.id = si.store_id
        WHERE si.ingredient_id IN (${ingredientIdsString})
        GROUP BY s.id
        HAVING COUNT(DISTINCT si.ingredient_id) = ${ingredientIds.length}
      )
      GROUP BY stores.id
    `;

    // Thực hiện truy vấn
    const result = await db.query(query);

    // Xử lý kết quả
    const filteredStores = await Promise.all(result.map(async store => {
      const ingredientsQuery = `
        SELECT i.id, i.name, si.*
        FROM store_ingredients si
        JOIN ingredients i ON si.ingredient_id = i.id
        WHERE si.store_id = ${store.id}
          AND si.ingredient_id IN (${ingredientIdsString})
      `;
      const ingredientsResult = await db.query(ingredientsQuery);

      return {
        id: store.id,
        name: store.name,
        avgRating: store.avgRating || 0,
        ingredients: ingredientsResult
      };
    }));

    return filteredStores;
  } catch (error) {
    throw error;
  }
}

async function getStoresFromAuthor(id) {
  const query = `SELECT * FROM ${table} WHERE owner=${id}`
  const result = await db.query(
    query
  );

  return { stores: result}
}


module.exports = {
  getMultiple,
  get,
  create,
  update,
  remove,
  getStoreDetail,
  getAllStores,
  filterStoresByIngredients,
  getStoresFromAuthor,
};
