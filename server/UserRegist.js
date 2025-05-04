const express = require("express");
const router = express.Router();
const methode = require("../controle/methode");

router.post("/UserRegister", methode.create_accountUser);
module.exports=router;