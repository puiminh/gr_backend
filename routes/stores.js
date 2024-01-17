const express = require("express");
const router = express.Router();
const stores = require("../services/stores");

/* GET stores. */
router.get("/", async function (req, res, next) {
  try {
    res.json(await stores.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting stores `, err.message);
    next(err);
  }
});

/* GET stores from author */
router.get("/author/:id", async function (req, res, next) {
  try {
    res.json(await stores.getStoresFromAuthor(req.params.id));
  } catch (err) {
    console.error(`Error while searching stores `, err.message);
    next(err);
  }
});

/* POST store */
router.post("/", async function (req, res, next) {
  try {
    res.json(await stores.create(req.body));
  } catch (err) {
    console.error(`Error while creating store`, err.message);
    next(err);
  }
});

/* PUT store */
router.put("/:id", async function (req, res, next) {
  try {
    res.json(await stores.update(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating store`, err.message);
    next(err);
  }
});

/* DELETE store */
router.delete("/:id", async function (req, res, next) {
  try {
    res.json(await stores.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting store`, err.message);
    next(err);
  }
});

router.get("/all", async function (req, res, next) {
  try {
    res.json(await stores.getAllStores());
  } catch (err) {
    console.error(`Error while searching stores `, err.message);
    next(err);
  }
});

router.get("/filter", async function (req, res, next) {
  try {
    const ingredientIds = req.query.ingredientIds.split(',').map(Number);
    res.json(await stores.filterStoresByIngredients(ingredientIds));
  } catch (err) {
    console.error(`Error while filter stores by ingredients `, err.message);
    next(err);
  }
});

router.get("/detail/:id", async function (req, res, next) {
  try {
    res.json(await stores.getStoreDetail(req.params.id));
  } catch (err) {
    console.error(`Error while searching stores `, err.message);
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    res.json(await stores.get(req.params.id));
  } catch (err) {
    console.error(`Error while searching stores `, err.message);
    next(err);
  }
});






module.exports = router;
