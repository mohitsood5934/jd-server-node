import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import colors from "colors";

import connectDB from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import logger from "./middlewares/logger.js"; // 

const app = express();
dotenv.config();

// Database connection
connectDB();

// ✅ List of allowed frontend origins
const allowedOrigins = [
  'http://localhost:3000',
];

// ✅ CORS options with logging
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming request origin:', origin); // Debug log

    if (!origin) return callback(null, true); // Allow server-to-server, curl, etc.

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true, // If you use cookies or auth headers
  optionsSuccessStatus: 200 // For legacy browsers
};

// ✅ Enable CORS with options
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(logger);

app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () => {
  console.log(colors.yellow(`You are listening to port - ${process.env.PORT}`));
});
