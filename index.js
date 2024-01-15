const express = require("express");
const app = express();
const port = 3000;
const recipesRouter = require("./routes/recipes");
const storesRouter = require("./routes/stores");
const ingredientsRouter = require("./routes/ingredients");


app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});
app.use("/recipes", recipesRouter);
app.use("/stores", storesRouter);
app.use("/ingredients", ingredientsRouter);



/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
