import express from "express";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";

/* Set up server app */
const app = express();

// Set up CORS
var cors = require('cors')
app.use(cors())

const port: number = 48080;

const users: { name: string; password: string }[] = [];

// middleware
app.use(express.json());  

app.get("/users", (req: express.Request, res: express.Response) => {
  res.json(users);
});

app.post("/users", (req: express.Request, res: express.Response) => {
  try {
    const user = { name: req.body.name, password: req.body.password };
    users.push(user);
    res.status(201).send();
  } catch {
    res.status(500).send("An error has occured");
  }
});

app.post("/users/login", (req: express.Request, res: express.Response) => {
  const user = users.find((user) => user.name === req.body.name);
  if (user == null) {
    return res.status(400).send("Cannot find user");
  }
  try {
    if (userAuthenticate(req, user)) {
      res.send("Success");
    } else {
      res.send("Not Allowed");
    }
  } catch {
    res.status(500).send();
  }
});

/* Listen for incoming connections */
app.listen(port, () => {
  console.log(`API listening on port ${port}.`);
});

function userAuthenticate(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  user: { name: string; password: string }
) {
  return req.body.password == user.password;
}
