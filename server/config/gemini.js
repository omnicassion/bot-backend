const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyB-gl96HjvIRNiuSIe-R1gL2HxnjQgpTvo");

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

module.exports = model;