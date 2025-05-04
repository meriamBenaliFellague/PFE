const express = require("express");
const router = express.Router();
const methode = require("../controle/methode");

router.delete(
    //correct
    "/DeletUser/:usertId",
    methode.delet_accountUser
);
module.exports=router;