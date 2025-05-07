require("dotenv").config();
const express = require("express");
const session = require('express-session');
const mongoose = require("mongoose");
const path = require("path");
const { SchemaMessage } = require("./model/messageDB"); 
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors({
  origin: 'http://127.0.0.1:5500', // أو حسب الدومين تاع الفرونت
  credentials: true               // ⬅️ لازم هذا باش يسمح بالكوكي
}));
app.use(session({
  secret: 'secret-key',         // 🔑 مفتاح التشفير (بدلوه في مشروعك الحقيقي)
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }     // ⚠️ حطها `true` فقط إذا كنت تستعمل HTTPS
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/Home/register',express.static(path.join(__dirname, "public/loginClient")));
app.use('/Home/LoginAdmin/Admin',express.static(path.join(__dirname, "public/AdminDashboard")));
app.use('/Home',express.static(path.join(__dirname, "public/HomePage")));
app.use('/Home/LoginAdmin',express.static(path.join(__dirname, "public/loginAdmin")));
app.use('/Home/LoginAdmin/Dashboard',express.static(path.join(__dirname, "public/AdminDashboard")));
app.use('/Reclamation',express.static(path.join(__dirname, "public/client")));





const authRoutes = require("./server/ClientRegist");
app.use(authRoutes);
const adminRoutes = require("./server/AdminLogin");
app.use(adminRoutes);

const createAccount = require("./server/ClientRegist");
app.use("/api/register", createAccount);

const loginAccount = require("./server/ClientLogin");
app.use("/api/login",loginAccount);

const createReclamation = require("./server/AddReclamation");
app.use("/api/addReclamation",createReclamation);

const loginAdmin = require("./server/AdminLogin");
app.use("/api/Admin",loginAdmin);

const loginUser = require("./server/UserLogin");
app.use("/api/UserLogin",loginUser);

const createtUser = require("./server/CreateUser");
app.use("/api", createtUser);

const displayUser = require("./server/DisplayUser");
app.use("/api/displayUser", displayUser);

const deletUser = require("./server/DeletUser");
app.use("/api/DeleteUser", deletUser);   

const update_user = require("./server/UpdateUser");
app.use("/api/UpdateUser", update_user);

const display_reclamation_client = require("./server/DisplayReclamationClient");
app.use("/api/DisplayReclamationClient", display_reclamation_client);

const display_reclamation_admin = require("./server/DisplayReclamationAdmin");
app.use("/api/DisplayReclamationAdmin", display_reclamation_admin);

const update_reclamation_status_admin = require("./server/UpdateReclamationStatusAdmin");
app.use("/api/UpdateReclamationAdmin", update_reclamation_status_admin);

//.....

app.get("/Home", (req, res) => {
  res.sendFile(path.join(__dirname, "public/HomePage","index.html"));
});

app.get("/Home/LoginAdmin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/loginAdmin","login.html"));
});

app.get("/Reclamation", (req, res) => {
  res.sendFile(path.join(__dirname, "public/client","index.html"));
});

app.get("/Home/LoginAdmin/Dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/AdminDashboard","index.html"));
});



//database connection

const router = require("./server/ClientLogin");
const dbUrl = process.env.dbUrl;

mongoose
  .connect(dbUrl) 
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }); 


// Chat

const io = require('socket.io')(server);

io.on('connection', socket => {

  // Load old messages
  SchemaMessage.find().sort({ createdAt: 1 }).then(messages => {
      socket.emit('load-messages', messages);
  });

   socket.on('send-chat-message', async (message) => {
    const sentMessage = new SchemaMessage({ type: 'sent', message });
    const receivedMessage = new SchemaMessage({ type: 'received', message });
    await sentMessage.save();
    await receivedMessage.save();
  
    socket.broadcast.emit('chat-message', receivedMessage);
    socket.emit('chat-message', sentMessage);
  })
})
