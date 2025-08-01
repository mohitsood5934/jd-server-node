import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import colors from "colors";

import connectDB from "./db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
dotenv.config();

// Database connection
connectDB();

// ✅ Enable CORS
app.use(cors());

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () => {
  console.log(colors.yellow(`You are listening to port - ${process.env.PORT}`));
});
