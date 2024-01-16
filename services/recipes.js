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

async function getRecipeDetail(recipeId) {
  try {
    // Truy vấn cơ bản để lấy thông tin của công thức nấu ăn
    const recipeQuery = `SELECT * FROM recipes WHERE id = ${recipeId}`;
    const recipeResult = await db.query(recipeQuery);

    if (recipeResult.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = recipeResult[0];

    // Truy vấn để lấy điểm đánh giá trung bình
    const ratingQuery = `SELECT AVG(rating) AS avgRating FROM recipe_reviews WHERE recipe_id = ${recipeId}`;
    const ratingResult = await db.query(ratingQuery);
    const avgRating = ratingResult[0].avgRating || 0;

    // Truy vấn để lấy thông tin về tác giả
    const authorQuery = `SELECT users.first_name, users.last_name FROM users INNER JOIN recipe_reviews ON users.id = recipe_reviews.user_id WHERE recipe_reviews.recipe_id = ${recipeId} LIMIT 1`;
    const authorResult = await db.query(authorQuery);
    const authorName = authorResult.length > 0 ? `${authorResult[0].first_name} ${authorResult[0].last_name}` : '';

    // Truy vấn để lấy thông tin về nguyên liệu
    const ingredientsQuery = `
      SELECT ingredients.*, recipe_ingredients.description AS ingredient_description
      FROM ingredients
      INNER JOIN recipe_ingredients ON ingredients.id = recipe_ingredients.ingredient_id
      WHERE recipe_ingredients.recipe_id = ${recipeId}
    `;
    const ingredientsResult = await db.query(ingredientsQuery);
    const ingredients = ingredientsResult.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      type: ingredient.type,
      image: ingredient.image,
      description: ingredient.description,
      ingredient_description: ingredient.ingredient_description
    }));

    // Truy vấn để lấy thông tin về các bước thực hiện
    const stepsQuery = `SELECT * FROM steps WHERE recipe_id = ${recipeId} ORDER BY \`order\``;
    const stepsResult = await db.query(stepsQuery);
    const steps = stepsResult.map(step => ({
      id: step.id,
      order: step.order,
      time: step.time,
      description: step.description
    }));

    // Truy vấn để lấy thông tin về các đánh giá
    const reviewsQuery = `
      SELECT recipe_reviews.*, users.first_name, users.last_name
      FROM recipe_reviews
      INNER JOIN users ON recipe_reviews.user_id = users.id
      WHERE recipe_reviews.recipe_id = ${recipeId}
    `;
    const reviewsResult = await db.query(reviewsQuery);
    const reviews = reviewsResult.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      image: review.image,
      user: {
        id: review.user_id,
        first_name: review.first_name,
        last_name: review.last_name
      }
    }));

    // Tạo đối tượng kết quả
    const recipeDetails = {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        video: recipe.video,
        image: recipe.image,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: recipe.author, // Thêm thông tin về tác giả
        rating: avgRating,
        author_name: authorName,
        ingredients: ingredients,
        reviews: reviews,
        steps: steps
      },
    };

    return recipeDetails;
  } catch (error) {
    throw error;
  }
}

async function filterRecipesByIngredients(ingredientIds) {
  try {
    // Truy vấn để lọc các recipe thoả mãn điều kiện
    const filterQuery = `
    SELECT 
      recipe_bookmarks.user_id, 
      recipe_bookmarks.recipe_id, 
      recipes.*, 
      AVG(recipe_reviews.rating) AS avgRating
    FROM 
      recipe_ingredients
      JOIN recipes ON recipe_ingredients.recipe_id = recipes.id
      LEFT JOIN recipe_reviews ON recipes.id = recipe_reviews.recipe_id
      JOIN recipe_bookmarks ON recipes.id = recipe_bookmarks.recipe_id
    WHERE 
      recipe_ingredients.ingredient_id IN (${ingredientIds.join(',')})
    GROUP BY 
      recipe_bookmarks.user_id, 
      recipe_bookmarks.recipe_id, 
      recipes.id, 
      recipes.name, 
      recipes.video, 
      recipes.image, 
      recipes.created_at, 
      recipes.updated_at;
    `;
    const filteredResult = await db.query(filterQuery);

    // Xử lý kết quả để tạo mảng chứa thông tin recipe và rating trung bình
    const filteredRecipes = filteredResult.map(recipe => ({
      user_id: recipe.user_id,
      recipe_id: recipe.recipe_id,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        video: recipe.video,
        image: recipe.image,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        avgRating: recipe.avgRating || 0
        // Thêm các trường khác của recipe nếu cần
      }
    }));

    return {filteredRecipes: filteredRecipes};
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
  getRecipeDetail,
  filterRecipesByIngredients,
};
