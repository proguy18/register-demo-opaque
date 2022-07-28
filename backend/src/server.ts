import express from "express";
import cors from "cors";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";
// const bcrypt = require('bcrypt')

/* Set up server app */
const app = express();
// const port: number = +(process.env.PORT || 48080);
const port: number = 48080;

const users: { name: string; password: string; }[] = []

app.get('/users', (req, res) => {
  res.json(users)
})

app.post('/users', async (req, res) => {
  try {
    const user = { name: req.body.name, password: req.body.password }
    users.push(user)
    res.status(201).send()
  } catch {
    res.status(500).send()
  }
})

app.post('/users/login', async (req, res) => {
  const user = users.find(user => user.name === req.body.name)
  if (user == null) {
    return res.status(400).send('Cannot find user')
  }
  try {
    if(userAuthenticate(req, user)) {
      res.send('Success')
    } else {
      res.send('Not Allowed')
    }
  } catch {
    res.status(500).send()
  }
})

/* Listen for incoming connections */
app.listen(port, () => {
    console.log(`API listening on port ${port}.`);
});

/* Enable CORS */
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:48080"],
    credentials: true,
    optionsSuccessStatus: 200
}));

function userAuthenticate(req: Request<{}, any, any, ParsedQs, Record<string, any>>, user: { name: string; password: string; }) {
    return req.body.password == user.password;
}
