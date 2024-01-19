const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
const port = 3000;
let databasestatus = "In-Progress";

const client = createClient({
  url: "redis://default:marwiz@192.168.1.147:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));
client.on("connect", () => console.log("redis connected"));

client.connect();

const value = client.get("test").then((data) => {
  console.log("test", data);
});

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
    console.log("listDbs called");
    client.get("coll1").then((dataFromRedis) => {
      console.log("dataFromRedis", dataFromRedis);

      if (dataFromRedis) {
        // If data is present in Redis, return it
        res.json(JSON.parse(dataFromRedis));
      } else {
        // If data is not present in Redis, fetch from MongoDB and cache in Redis
        coll1.find().then((dataFromMongo) => {
          client.set("coll1", JSON.stringify(dataFromMongo));
          res.json(dataFromMongo);
        });
      }
    });

    // coll1.find().then((data) => {
    //   console.log(data);
    //   res.json(data);
    // });
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

// check redis append functionality
app.get("/append", (req, res) => {
  try {
    console.log(req.body);
    client.append("test", req.body.data).then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/set", (req, res) => {
  try {
    console.log(req.body);
    client.set("test", req.body.data).then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/get", (req, res) => {
  try {
    client.get("test").then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/del", (req, res) => {
  try {
    client.del("test").then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/expire", (req, res) => {
  try {
    client.expire("test", 10).then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/set", (req, res) => {
  try {
    // client.json.set("list", req.body.data).then((data) => {
    //   console.log(data);
    //   res.json(data);
    let data_1 = req.body.data;
    console.log(data_1);
    console.log(JSON.stringify(data_1[1]));

    // client.json.set(["list", "$", []]).then((data) => {
    //   console.log(data);
    //   res.json(data);
    // });
    // await client.sendCommand("JSON.SET", ["list", "$", "[]"]);
    client.sendCommand(["JSON.SET", "list", "$", "[]"], (err, data) => {
      if (err) {
        console.log("err ", err);
        // res.json(err);
      } else {
        console.log("data ", data);
        // res.json(data);
      }
    });

    console.log("data.length", data_1.length);

    for (let i = 0; i < data_1.length; i++) {
      console.log(JSON.stringify(data_1[i]));
      client.sendCommand(
        [
          `JSON.ARRINSERT`,
          "list",
          "$",
          "0",
          // `'"${JSON.stringify(data_1[i])}"'`,
          JSON.stringify(data_1[i]),
        ],
        (err, data) => {
          if (err) {
            console.log("err ", err);
            // res.json(err);
          } else {
            console.log("data ", data);
            // res.json(data);
          }
        }
      );
    }
    res.json("done");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/get", (req, res) => {
  try {
    client.json.get("list").then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/arrinsert", (req, res) => {
  try {
    console.log(req.body.data);
    client
      .sendCommand([
        "JSON.ARRINSERT",
        "list",
        "$",
        "0",
        JSON.stringify(req.body.data),
      ])
      .then((data) => {
        console.log(data);
        res.json(data);
      });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/arrindex", (req, res) => {
  try {
    console.log(req.body.data);
    client
      .sendCommand([
        "JSON.ARRINDEX",
        "list",
        "$",
        JSON.stringify(req.body.data),
      ])
      .then((data) => {
        console.log(data);
        res.json(data);
      });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/arrlen", (req, res) => {
  try {
    client.json.ARRLEN("list").then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

app.get("/json/del", (req, res) => {
  try {
    client.json.del("list").then((data) => {
      console.log(data);
      res.json(data);
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
