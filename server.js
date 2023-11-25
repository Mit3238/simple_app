const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 3000;
let databasestatus = "In-Progress";

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.DATABASE, { useNewUrlParser: true })
  .then(() => {
    databasestatus = "DB connected";
    console.log("DB connected");
  })
  .catch((err) => {
    databasestatus = err;
    console.log("DB Error => ", err);
  });

const coll1 = mongoose.model(
  "coll1",
  new mongoose.Schema({ name: String, lange: String })
);

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.get("/api", (req, res) => {
  console.log("api called");
  res.json({
    version: "v1.0",
    dbstatus: databasestatus,
  });
});

app.get("/listDbs", (req, res) => {
  try {
    coll1.find().then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/query/:name", (req, res) => {
  try {
    coll1.find({ name: req.params.name }).then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
