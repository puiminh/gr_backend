const express = require("express");
const router = express.Router();
const ingredients = require("../services/ingredients");

/* GET ingredients. */
router.get("/", async function (req, res, next) {
  try {
    res.json(await ingredients.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting ingredients `, err.message);
    next(err);
  }
});

/* POST ingredient */
router.post("/", async function (req, res, next) {
  try {
    res.json(await ingredients.create(req.body));
  } catch (err) {
    console.error(`Error while creating ingredient`, err.message);
    next(err);
  }
});

/* PUT ingredient */
router.put("/:id", async function (req, res, next) {
  try {
    res.json(await ingredients.update(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating ingredient`, err.message);
    next(err);
  }
});

/* DELETE ingredient */
router.delete("/:id", async function (req, res, next) {
  try {
    res.json(await ingredients.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting ingredient`, err.message);
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    res.json(await ingredients.search(req.params.id));
  } catch (err) {
    console.error(`Error while searching ingredients `, err.message);
    next(err);
  }
});
module.exports = router;
