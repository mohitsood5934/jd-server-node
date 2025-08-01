// db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CLOUD_URI, {
      useUnifiedTopology: true,
    });
    console.log(colors.green("✅ Connected to MongoDB"));
  } catch (err) {
    console.error(colors.red("❌ Failed to connect to MongoDB:"), err);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
