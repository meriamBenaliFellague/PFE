const { Router } = require("express");
const { default: mongoose } = require("mongoose");
const { SchemaClient } = require("../model/database"); 
const { SchemaUser } = require("../model/UserDB");
const { SchemaTeam } = require("../model/TeamDB");  
const {SchemaReclamation} = require("../model/ReclamationDB"); 
const AdminDb = mongoose.connection.collection("admin");
const ReclamationDb = mongoose.connection.collection("reclamation");
const multer = require('multer');
const storage = multer.memoryStorage(); // باش نخلي الصورة في الذاكرة
const upload = multer({ storage: storage });

const crypto = require("crypto");
const bcrypt = require('bcrypt');

const SendEmailFunction = require("../utils/SendEmail");
const { Console } = require("console");


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
//forget password
async function forget_password(req, res) {
  //get user by email
  const email = req.body.email;
  console.log(email)
  const user = await SchemaClient.findOne({email});
  if(!user){
    return res.status(404).json({ message: "the account not exists"});
  }
  //if user exist generate hash reset random 6 digits and save
  const code = Math.floor(Math.random() * 100000).toString();
  const hashCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex')
  user.hashCode = hashCode;
  //add time for code (10 min)
  user.timeCode = Date.now() + 10 * 60 * 1000;
  user.verifiedCode = false;

  await user.save();

  const message = `Hi ${user.username}\n We recived a request to rest the password on your ADE (Algerian waters - Unite Ain Defla) Account.\n ${code} \n Enter this code to complete the reset.\n
  Thanks for helping us keep your account secure. \n The ADE (Algerian waters - Unite Ain Defla) Team`
  //send the rest code in email
  try {
    await SendEmailFunction({
      email: user.email,
      subject: 'Your password reset code (valide for 10 min)',
      message: message,
    })
    return res.status(200).json({ message: "code sent to email"});
  } catch (err) {
    user.hashCode = undefined;
    user.timeCode = undefined;
    user.verifiedCode = undefined;
    await user.save();
    console.log({ message: err})
    return res.status(500).json({ message: err});
  }
}

//verify reset code
async function verifyResetCode(req, res) {
  //get reset code
  const hashCode = crypto
    .createHash('sha256')
    .update(req.body.code)
    .digest('hex')

  const user = await SchemaClient.findOne({hashCode, timeCode:{$gt: Date.now()}});
  if(!user){
    return res.status(404).json({ message: "Reset code invalide or expired"});
  }
  //reset code valid
  user.verifiedCode = true;
  user.save();
  return res.status(200).json({ message: "Reset code valide"});
}

//reset password
async function reset_password(req, res) {
  //get user by email
  const user = await SchemaClient.findOne({email: req.body.email});
  if(!user){
    return res.status(404).json({ message: "the account not exists"});
  }
  if(!user.verifiedCode){
    return res.status(400).json({ message: "Reset code not verified"});
  } 
  //user valide, update user password
  user.password = req.body.newPass;
  user.hashCode = undefined;
  user.timeCode = undefined;
  user.verifiedCode = undefined;
  user.save();
  return res.status(200).json({ message: "Update password "});
}

//create count client
async function create_account(req, res){
  console.log("📥البيانات ة:", req.body);
    //const account = new SchemaClient({ id: 1, username: "meriam", email: "be2430423", password: "1234" });
    const { username, email, password } = req.body;
    console.log(req.body);
    const id = `client${Math.floor(Math.random() * 100000)}`;
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

//delet user (Admin)
async function delet_user(req, res){
  const iduser = req.params.iduser;
  SchemaTeam.findByIdAndDelete(iduser)
    .then((results) =>
      res.status(200).json(results)
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};

//update user (Admin)
async function update_user(req,res){
  const { Fullname, Email, Password, Team, Role } = req.body;
  const iduser = req.params.iduser;
  const update = SchemaTeam.findByIdAndUpdate(iduser, { Fullname, Email, Password, Team, Role}, { new: true })
  console.log(update);
 update 
    .then((results) => res.status(200).json(results)) 
    .catch((err) => res.status(500).json({ message: err.message }));
}

//create user (Admin)
async function create_user(req, res){console.log(req.body);
  const { Fullname, Email, Password, Team, Role} = req.body;
  const account = new SchemaTeam({ Fullname, Email, Password, Team, Role});
  console.log(account);
  account
    .save()
    .then((result) => res.status(201).json(result))
    .catch((err) => res.status(400).json({ message: err.message }));
};

//display users
async function display_user(req,res){
  try {
    const users = await SchemaTeam.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des réclamations" });
  }
}

//login user
async function login_accountUser(req,res){
// const username= "meriam";
//const password= "1234";
  const { fullname,password,team} = req.body;
  const {role} = "Team lead";
  const user = await SchemaUser.findOne({ fullname,team,role});
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
    res.status(500).json({ error: err.message });
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
    
    if (reclamations.length === 0) {
      return res.status(400).json({ message: "Aucune réclamation en attente." });
    }
    res.status(200).json(reclamations);
  } catch (err) {
    res.status(500).json({ error: err.message});
  }
}

//Update reclamation status
  //Admin
  async function Admin(req,res){console.log(req.body)
    const { Group} = req.body;
    const IdReclamation = req.params.IdReclamation;
    let Status; 
    try{
      if (Group != null) {
        Status = "In Progress";
      }console.log(Status)
      const update = await SchemaReclamation.findByIdAndUpdate(IdReclamation, {Status , Group}, { new: true })
      res.status(200).json(update);
    }catch(err){
      res.status(500).json({ error: err.message });
    }
  }
  //Responsable
  async function Responsable(req,res){
    const { Status, Note } = req.body;
    const id = req.params.id;
    SchemaReclamation.findByIdAndUpdate(id, { Status ,Note}, { new: true })
      .then((results) => res.status(200).json(results))
      .catch((err) => res.status(500).json({ message: err.message }));
  }

module.exports = {create_account, login_account,create_user,login_accountUser,login_accountAdmin,
  create_reclamation,update_user,delet_user,Admin, Responsable,display_reclamationClient,
  display_New_reclamation,display_user,forget_password,verifyResetCode,reset_password
};