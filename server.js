const express = require('express')
const mongoose = require('mongoose')
const UserModel = require('./userDetails')
require('dotenv').config()
const app = express()

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("connection successful"))
.catch(() => console.log("error connecting to mongodb"))

app.get('/', (req,res) => {
    res.send({status: "working"})
})

app.post('/login', async (req, res) => {
    try {
      const { userName, email, password } = req.body;
      const user = await UserModel.findOne({ userName, email });
  
      if (user) {
        if (user.password === password) {
          res.json("success");
        } else {
          res.json("incorrect password");
        }
      } else {
        res.json('user does not exist');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post("/signup", async (req, res) => {
    try {
      const user = await UserModel.create(req.body);
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.listen((4000), () => {
    console.log(`connected to port 4000`)
})