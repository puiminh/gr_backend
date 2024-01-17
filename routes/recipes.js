const express = require("express");
const router = express.Router();
const recipes = require("../services/recipes");

/* GET recipes. */
router.get("/", async function (req, res, next) {
  try {
    res.json(await recipes.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting recipes `, err.message);
    next(err);
  }
});

/* GET recipes from author. */
router.get("/author/:id", async function (req, res, next) {
  try {
    res.json(await recipes.getRecipesFromAuthor(req.params.id));
  } catch (err) {
    console.error(`Error while getting recipes `, err.message);
    next(err);
  }
});

/* POST recipe */
router.post("/", async function (req, res, next) {
  try {
    res.json(await recipes.createRecipe(req.body));
  } catch (err) {
    console.error(`Error while creating recipe`, err.message);
    next(err);
  }
});

/* PUT recipe */
router.put("/:id", async function (req, res, next) {
  try {
    res.json(await recipes.updateRecipe(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating recipe`, err.message);
    next(err);
  }
});

/* DELETE recipe */
router.delete("/:id", async function (req, res, next) {
  try {
    res.json(await recipes.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting recipe`, err.message);
    next(err);
  }
});

router.get("/match", async function (req, res, next) {
  try {
    const ingredientIds = req.query.ingredientIds.split(',').map(Number);
    res.json(await recipes.getRecipesWithMissingIngredients(ingredientIds));
  } catch (err) {
    console.error(`Error while match recipes by ingredients `, err.message);
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    res.json(await recipes.get(req.params.id));
  } catch (err) {
    console.error(`Error while searching recipes `, err.message);
    next(err);
  }
});

// Detail
router.get("/detail/:id", async function (req, res, next) {
  try {
    res.json(await recipes.getRecipeDetail(req.params.id));
  } catch (err) {
    console.error(`Error while searching recipes `, err.message);
    next(err);
  }
});
module.exports = router;
