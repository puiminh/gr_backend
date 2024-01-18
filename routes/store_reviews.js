const express = require("express");
const router = express.Router();
const reviews = require("../services/store_reviews");

/* GET reviews. */
router.get("/", async function (req, res, next) {
  try {
    res.json(await reviews.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting reviews `, err.message);
    next(err);
  }
});

/* POST review */
router.post("/", async function (req, res, next) {
  try {
    res.json(await reviews.create(req.body));
  } catch (err) {
    console.error(`Error while creating review`, err.message);
    next(err);
  }
});

/* PUT review */
router.put("/:id", async function (req, res, next) {
  try {
    res.json(await reviews.update(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating review`, err.message);
    next(err);
  }
});

/* DELETE review */
router.delete("/:id", async function (req, res, next) {
  try {
    res.json(await reviews.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting review`, err.message);
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    res.json(await reviews.search(req.params.id));
  } catch (err) {
    console.error(`Error while searching reviews `, err.message);
    next(err);
  }
});
module.exports = router;
