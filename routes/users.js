const express = require("express");
const router = express.Router();
const users = require("../services/users");

/* GET users. */
router.get("/", async function (req, res, next) {
  try {
    res.json(await users.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting users `, err.message);
    next(err);
  }
});

/* signin user */
router.post("/signin", async function (req, res, next) {
  try {
    res.json(await users.signin(req.body));
  } catch (err) {
    console.error(`Error while search for user`, err.message);
    next(err);
  }
});

/* POST user */
router.post("/signup", async function (req, res, next) {
  try {
    res.json(await users.create(req.body));
  } catch (err) {
    console.error(`Error while creating user`, err.message);
    next(err);
  }
});



/* PUT user */
router.put("/:id", async function (req, res, next) {
  try {
    res.json(await users.update(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating user`, err.message);
    next(err);
  }
});

/* DELETE user */
router.delete("/:id", async function (req, res, next) {
  try {
    res.json(await users.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting user`, err.message);
    next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    res.json(await users.get(req.params.id));
  } catch (err) {
    console.error(`Error while searching users `, err.message);
    next(err);
  }
});
module.exports = router;
