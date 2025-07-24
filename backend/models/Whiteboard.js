const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const WhiteboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hasPassword: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    select: false,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 비밀번호 해싱
WhiteboardSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.hasPassword = true;
  }
  if (!this.password) {
    this.hasPassword = false;
  }
  next();
});

// 비밀번호 확인
WhiteboardSchema.methods.checkPassword = async function (password) {
  if (!this.hasPassword) return true;
  const whiteboard = await this.constructor
    .findById(this._id)
    .select("+password");
  return await bcrypt.compare(password, whiteboard.password);
};

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);
