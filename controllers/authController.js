import User from "../models/user.js"; // Importing User model in ESM syntax
import jwt from "jsonwebtoken";

const createAccessToken = (user) => {
  const { _id = "", role = "" } = user;
  const accessToken = jwt.sign(
    { id: _id, role },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: "75m" }
  );
  return accessToken;
};

const createRefreshToken = (user) => {
  const { _id = "", role = "" } = user;
  const refreshToken = jwt.sign(
    { id: _id, role },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return refreshToken;
};

export const signup = async (req, res) => {
  const { name, employeeCode, email, password, role = "" } = req.body;

  if (!name || !email || !employeeCode || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeCode }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "Email or employeecode already exists" });
    }

    // Create a new user
    const newUser = new User({ name, email, employeeCode, password, role });
    await newUser.save();

    res.status(201).json({ msg: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error signing up user:", error, error.message, "message");
    res.status(500).json({ msg: "Server error during signup" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the password is correct
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    res
      .cookie("refreshToken", refreshToken)
      .json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ msg: "Server error during login" });
  }
};

export const refreshToken = async (req, res) => {
  const token = (req && req.cookies && req.cookies.refreshToken) || "";
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) throw new Error();

    const accessToken = createAccessToken(user);
    res.json({ accessToken });
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
};

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired access token" });
  }
};

export const requireSignIn = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          error: "error occurred while verifying token",
        });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({
      error: "error,auth header not present",
    });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    const adminUserId = req.user._id;
    const user = await User.findById(adminUserId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.role !== "hr") {
      return res.status(403).json({ error: "Admin resource, access denied" });
    }

    req.profile = user;
    next();
  } catch (err) {
    console.error("Error in adminMiddleware:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = "";
      await user.save();
    }
  }
  res.clearCookie("refreshToken", { path: "/auth/refresh_token" });
  res.json({ message: "Logged out" });
};
