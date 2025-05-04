const mongoose = require("mongoose");
const { SchemaUser } = require("../model/UserDB"); 
const AdminDb = mongoose.connection.collection("admin");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SchemaUser",
      },
  type: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
  });

  const SchemaMessage = mongoose.model("message", messageSchema);
  module.exports = {SchemaMessage};