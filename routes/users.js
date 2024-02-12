const express = require("express");
const router = express.Router();
const users = require("../services/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


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
    // Tìm người dùng dựa trên username
    const foundQuery = await users.findUsername(req.body.username);
    
    if (!foundQuery.success) {
      // Trả về thông báo nếu không tìm thấy người dùng
      return res.status(404).send({
        message: "User not found",
      });
    }
    
    // So sánh mật khẩu
    const passwordMatch = await bcrypt.compare(req.body.password, foundQuery.user.password);
    
    if (!passwordMatch) {
      // Trả về thông báo nếu mật khẩu không khớp
      return res.status(400).send({
        message: "Password does not match",
      });
    }
    
    // Tạo token JWT
    const token = jwt.sign(
      {
        userId: foundQuery.user.id,
        username: foundQuery.user.username,
      },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );

    // Trả về thông báo đăng nhập thành công và token
    res.status(200).send({
      message: "Login successful",
      user: foundQuery.user,
      token,
    });
  } catch (err) {
    console.error(`Error while signing in user`, err.message);
    next(err);
  }
});

/* sign-up user using bcrypt*/
router.post("/signup", async function (req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const result = await users.create({ ...req.body, password: hashedPassword });
    res.json(result);
  } catch (err) {
    console.error(`Error while creating user`, err.message);
    next(err);
  }
});


// /* POST user */
// router.post("/signup", async function (req, res, next) {
//   try {
//     res.json(await users.create(req.body));
//   } catch (err) {
//     console.error(`Error while creating user`, err.message);
//     next(err);
//   }
// });



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
