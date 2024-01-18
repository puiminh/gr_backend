const db = require("./db");
const helper = require("../helper");
const config = require("../config");

const table = 'recipes';
const tableAttributes = ['name','video','image']

async function getMultiple(page = 1) {
  const offset = helper.getOffset(page, config.listPerPage);

  // Sử dụng LEFT JOIN để kết hợp với bảng recipe_reviews để tính trung bình rating
  const query = `
    SELECT recipes.*, ROUND(AVG(recipe_reviews.rating), 1) AS rating
    FROM ${table}
    LEFT JOIN recipe_reviews ON recipes.id = recipe_reviews.recipe_id
    GROUP BY recipes.id
    LIMIT ${offset},${config.listPerPage}
  `;
  
  const rows = await db.query(query);
  
  const data = helper.emptyOrRows(rows);
  const meta = { page };

  return {
    recipes: data,
    meta: meta
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

  return { success: true, message: message };
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
    const authorQuery = `SELECT users.first_name, users.last_name, users.avatar FROM users WHERE users.id = ${recipe.author} LIMIT 1`;
    const authorResult = await db.query(authorQuery);
    const authorName = authorResult.length > 0 ? `${authorResult[0].first_name} ${authorResult[0].last_name}` : '';

    // Truy vấn để lấy thông tin về nguyên liệu
    const ingredientsQuery = `
      SELECT recipe_ingredients.*, ingredients.*
      FROM ingredients
      INNER JOIN recipe_ingredients ON ingredients.id = recipe_ingredients.ingredient_id
      WHERE recipe_ingredients.recipe_id = ${recipeId}
    `;
    const ingredients = await db.query(ingredientsQuery);

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
      SELECT recipe_reviews.*, users.first_name, users.last_name, users.avatar
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
        name: review.first_name + ' ' + review.last_name,
        avatar: review.avatar,
      }
    }));

    // Tạo đối tượng kết quả
    const recipeDetails = {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        video: recipe.video,
        image: recipe.image,
        description: recipe.description,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        author: recipe.author, // Thêm thông tin về tác giả
        rating: Number(avgRating).toFixed(1),
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

async function getRecipesWithMissingIngredients(ingredientIds) {
  try {
    // Lấy danh sách recipe với thông tin rating trung bình
    const recipesQuery = `
      SELECT recipes.*, AVG(recipe_reviews.rating) AS avgRating
      FROM recipes
      LEFT JOIN recipe_reviews ON recipes.id = recipe_reviews.recipe_id
      GROUP BY recipes.id
    `;
    const recipesResult = await db.query(recipesQuery);

    // Lấy danh sách nguyên liệu còn thiếu và số lượng còn thiếu cho từng recipe
    const missingIngredientsQuery = `
      SELECT DISTINCT recipe_id, COUNT(ingredients.id) AS missingCount, GROUP_CONCAT(ingredients.name) AS missingIngredients
      FROM recipe_ingredients
      JOIN ingredients ON recipe_ingredients.ingredient_id = ingredients.id
      WHERE ingredient_id NOT IN (${ingredientIds.join(',')})
      GROUP BY recipe_id
    `;
    const missingIngredientsResult = await db.query(missingIngredientsQuery);

    // Tạo một đối tượng Map để lưu trữ thông tin về nguyên liệu còn thiếu cho từng recipe
    const missingIngredientsMap = new Map();
    missingIngredientsResult.forEach(row => {
      missingIngredientsMap.set(row.recipe_id, {
        missingCount: row.missingCount,
        missingIngredients: row.missingIngredients.split(','),
      });
    });

    // Xử lý kết quả để tạo mảng chứa thông tin các công thức
    const recipesWithMissingIngredients = recipesResult.map(recipe => {
      const missingInfo = missingIngredientsMap.get(recipe.id) || { missingCount: 0, missingIngredients: [] };

      return {
        id: recipe.id,
        name: recipe.name,
        video: recipe.video,
        image: recipe.image,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        rating: Number(recipe.avgRating).toFixed(1) || 0,
        missingIngredients: missingInfo.missingIngredients,
        missingAmount: missingInfo.missingIngredients.length,
      };
    });

    // Sắp xếp theo thứ tự số lượng missingIngredients tăng dần
    recipesWithMissingIngredients.sort((a, b) => a.missingAmount - b.missingAmount);

    return { recipes: recipesWithMissingIngredients};
  } catch (error) {
    throw error;
  }
}

async function createRecipe(data) {
  try {
    // Tạo bản ghi Recipe
    const recipeQuery = `
      INSERT INTO recipes (name, video, description, image, author)
      VALUES (?, ?, ?, ?, ?);
    `;
    const recipeValues = [
      data.name,
      data.video,
      data.description,
      data.image,
      data.author,
    ].map(value => (value !== undefined ? value : null)); // Thay thế undefined bằng null
    const recipeResult = await db.query(recipeQuery, recipeValues);
    const recipeId = recipeResult.insertId;

    // Tạo bản ghi Steps
    if (data.steps && data.steps.length > 0) {
      const stepsQuery = `
        INSERT INTO steps (recipe_id, \`order\`, time, description)
        VALUES (?, ?, ?, ?);
      `;
      await Promise.all(data.steps.map(async (step) => {
        const stepValues = [recipeId, step.order, step.time, step.description];
        await db.query(stepsQuery, stepValues);
      }));
    }

    // Liên kết Recipe với Ingredients thông qua bảng trung gian
    if (data.ingredients && data.ingredients.length > 0) {
      const recipeIngredientsQuery = `
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
        VALUES (?, ?, ?);
      `;
      await Promise.all(data.ingredients.map(async (ingredient) => {
        const ingredientValues = [recipeId, ingredient.id, ingredient.amount];
        await db.query(recipeIngredientsQuery, ingredientValues);
      }));
    }

    return { success: true, recipeId };
  } catch (error) {
    console.error('Error while creating recipe:', error.message);
    return { success: false, error: error.message };
  }
}

async function updateRecipe(recipeId, data) {
  try {
    // Cập nhật bản ghi Recipe
    const updateRecipeQuery = `
      UPDATE recipes
      SET name = ?, video = ?, description = ?, image = ?, author = ?
      WHERE id = ?;
    `;
    const updateRecipeValues = [
      data.name,
      data.video,
      data.description,
      data.image,
      data.author,
      recipeId,
    ].map(value => (value !== undefined ? value : null)); // Thay thế undefined bằng null
    await db.query(updateRecipeQuery, updateRecipeValues);

    // Xoá bản ghi Steps và cập nhật lại
    const deleteStepsQuery = `
      DELETE FROM steps WHERE recipe_id = ?;
    `;
    await db.query(deleteStepsQuery, [recipeId]);

    if (data.steps && data.steps.length > 0) {
      const insertStepsQuery = `
        INSERT INTO steps (recipe_id, \`order\`, time, description)
        VALUES (?, ?, ?, ?);
      `;
      await Promise.all(data.steps.map(async (step) => {
        const stepValues = [recipeId, step.order, step.time, step.description];
        await db.query(insertStepsQuery, stepValues);
      }));
    }

    // Xoá bản ghi RecipeIngredients và cập nhật lại
    const deleteRecipeIngredientsQuery = `
      DELETE FROM recipe_ingredients WHERE recipe_id = ?;
    `;
    await db.query(deleteRecipeIngredientsQuery, [recipeId]);

    if (data.ingredients && data.ingredients.length > 0) {
      const insertRecipeIngredientsQuery = `
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
        VALUES (?, ?, ?);
      `;
      await Promise.all(data.ingredients.map(async (ingredient) => {
        const ingredientValues = [recipeId, ingredient.id, ingredient.amount];
        await db.query(insertRecipeIngredientsQuery, ingredientValues);
      }));
    }

    return { success: true, recipeId };
  } catch (error) {
    console.error('Error while updating recipe:', error.message);
    return { success: false, error: error.message };
  }
}

async function getRecipesFromAuthor(id) {
  const query = `SELECT * FROM ${table} WHERE author=${id}`
  const result = await db.query(
    query
  );

  return { recipes: result}
}


module.exports = {
  getMultiple,
  get,
  create,
  createRecipe,
  update,
  updateRecipe,
  remove,
  getRecipeDetail,
  getRecipesWithMissingIngredients,
  getRecipesFromAuthor,
};
