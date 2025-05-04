const { Router } = require("express");
const { default: mongoose } = require("mongoose");
const { SchemaClient } = require("../model/database"); 
const { SchemaUser } = require("../model/UserDB"); 
const {SchemaReclamation} = require("../model/ReclamationDB"); 
const AdminDb = mongoose.connection.collection("admin");
const ReclamationDb = mongoose.connection.collection("reclamation");
const multer = require('multer');
const storage = multer.memoryStorage(); // باش نخلي الصورة في الذاكرة
const upload = multer({ storage: storage });


const bcrypt = require('bcrypt');

async function hashPassword(password) {
  if (!password) {
      console.error("❌ خطأ: كلمة المرور غير موجودة");
      return null; // تجنب إرجاع undefined
  }

  try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds); // 🔥 إرجاع القيمة بعد التشفير
  } catch (err) {
      console.error("❌ خطأ أثناء التشفير:", err);
      return null;
  }
}

//create count client
async function create_account(req, res){
  console.log("📥البيانات ة:", req.body);
    //const account = new SchemaClient({ id: 1, username: "meriam", email: "be2430423", password: "1234" });
    const { username, email, password } = req.body;
    console.log(req.body);
    const id = `post${Math.floor(Math.random() * 100000)}`;
    /*const hashedPassword = await hashPassword(password) ;
    console.log("PASS", hashedPassword);*/
    const account = new SchemaClient({ id, username, email, password});
    account
      .save()
      .then((result) => res.status(201).json(result))
      .catch((err) => res.status(400).json({ message: err.message }));
  };
//login client
  async function login_account(req,res){
    console.log("📥البيانات ة:", req.body);
    const { username,password } = req.body;
    try{
      const user = await SchemaClient.findOne({ username});
      if (!user) {
        console.log("the account not exists");
        return res.status(401).json({ message: "the account not exists" });
      }
    if (password != user.password) {
      console.log("the account not exists");
        return res.status(401).json({ message: "the account not exists" });
    }
      console.log("the account exists");
      const userId = user._id;
      req.session.clientId = userId;
      console.log(req.session.clientId);
      return res.status(201).json({ message:"the account exists"});
    }catch (err) {
      console.log("err:", err.message);
      return res.status(500).json({ message: "حدث خطأ في السيرفر" });
  }
}

//create count user (Admin)
async function create_accountUser(req, res){
  //const account = new register({ id: 1, username: "meriam", email: "be2430423", password: "1234" });
  const { username, email, password } = req.body;
  console.log(username)
  const id = `post${Math.floor(Math.random() * 100000)}`;
  //const hashedPassword = await bcrypt.hash(password, 10); // الرقم 10 هو مستوى التشفير
  const account = new SchemaUser({ id, username, email, password});
  account
    .save()
    .then((result) => res.status(201).json(result))
    .catch((err) => res.status(400).json({ message: err.message }));
};

//delet count user (Admin)
async function delet_accountUser(req, res){
  const id = req.params.id;
  SchemaUser.findByIdAndDelete(id)
    .then((results) =>
      res.status(200).json({ message: "account deletes successfully" })
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};

//create group (Admin)
async function create_group(req, res){
  //const account = new register({ id: 1, username: "meriam", email: "be2430423", password: "1234" });
  const { nameResponsable, Members, type } = req.body;
  const id = `post${Math.floor(Math.random() * 100000)}`;
  const account = new SchemaUser({ id, nameResponsable, Members, type});
  account
    .save()
    .then((result) => res.status(201).json(result))
    .catch((err) => res.status(400).json({ message: err.message }));
};

//login user
async function login_accountUser(req,res){
// const username= "meriam";
//const password= "1234";
  const { username,password } = req.body;
  const user = await SchemaUser.findOne({ username});
if (user && await bcrypt.compare(password, user.password)) {
  //The account exists
  console.log("the account exists");
  const userId = user.id;
    req.session.responsableId = userId;
  res.json({ message: "the account exists" });
} else {
  //Account does not exist
  console.log("the account not exists");
  res.json({ message: "the account not exists" });
}
}

//login admin
async function login_accountAdmin(req,res){
  //const username= "admin";const password= "admin";
    const { username,password } = req.body;
  try{
    const user = await AdminDb.findOne({ username,password});
    if (!user) {
      console.log("the account not exists");
      return res.status(401).json({ message: "the account not exists" });
    }
  if (password != user.password) {
    console.log("the account not exists");
      return res.status(401).json({ message: "the account not exists" });
  }
    console.log("the account exists");
    return res.status(201).json({ message:"the account exists"});
  }catch (err) {
    console.log("err:", err.message);
    return res.status(500).json({ message: "حدث خطأ في السيرفر" });
}
  }

//create reclamation
async function create_reclamation(req,res){
  //const account = new SchemaReclamation({ id: 1, Name: "meriam", email: "be2430423", password: "1234" });
  const { Name, Type, Surname, Phone, Municipality, Subscriber_ID, Address, Email, Complaint} = req.body;
  const id = `post${Math.floor(Math.random() * 100000)}`;
  const clientId = req.session.clientId ;
  console.log(req.session.clientId);
  const Photos = req.files.map(file =>({
    data: file.buffer,
    contentType: file.mimetype
  }));console.log("📸 عدد الصور المستقبلة:", req.files.length);
  const account = new SchemaReclamation({ clientId, id, Type, Name, Surname, Phone, Municipality, Subscriber_ID, Address, Email, Complaint, Photos});
  account
    .save()
    .then((result) => res.status(201).json(result))
    .catch((err) => res.status(400).json({ message: err.message }));
}

//display reclamation to client
async function display_reclamationClient(req,res){
  try {
    const clientId = req.session.clientId;
    const reclamations = await SchemaReclamation.find({ clientId });
    res.status(200).json(reclamations);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des réclamations" });
  }
}

//display reclamation to responsable
async function display_reclamationResponsable(req,res){
  try {
    const responsableId = req.session.responsableId;
    const reclamations = await SchemaReclamation.findById({ responsableId });
    res.status(200).json(reclamations);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des réclamations" });
  }
}


//display New reclamation to Admin
async function display_New_reclamation(req,res){
  try {
    const reclamations = await SchemaReclamation.find();
    console.log("عدد الشكاوى:", reclamations.length);

    if (reclamations.length === 0) {
      return res.status(400).json({ message: "Aucune réclamation en attente." });
    }
    res.status(200).json(reclamations);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des réclamations" });
  }
}

//Update reclamation status
  //Admin
  async function Admin(req,res){
    const { Group, Note} = req.body;
    const IdReclamation = req.params.IdReclamation;
    const  responsableId = req.params.IdResponsable;
    if (Group != null) {
      const {Status} = "In Progress";
    } else {
      const {Status} = "Not resolved"
    }
    SchemaReclamation.findByIdAndUpdate(id, { Status , Note ,  responsableId}, { new: true })
      .then((results) => res.status(200).json(results))
      .catch((err) => res.status(500).json({ message: err.message }));
  }
  //Responsable
  async function Responsable(req,res){
    const { Status, Note } = req.body;
    const id = req.params.id;
    SchemaReclamation.findByIdAndUpdate(id, { Status ,Note}, { new: true })
      .then((results) => res.status(200).json(results))
      .catch((err) => res.status(500).json({ message: err.message }));
  }

module.exports = {create_account, login_account,create_accountUser,login_accountUser,login_accountAdmin,
  create_reclamation,delet_accountUser,Admin, Responsable,display_reclamationClient,display_New_reclamation
};