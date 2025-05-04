const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const client = new Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    username: {
      type: String,
      required: true,  // يعني أن اسم المستخدم يجب أن يتم إدخاله 
    },
    email: {
      type: String,
      required: true,
    },
   password: {
      type: String,
      required: true,
    },
    rec: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reclamation",
    }

  },
  {
    timestamps: true,
  }
);


const SchemaClient = mongoose.model("client", client);
module.exports = {SchemaClient};
