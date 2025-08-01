import User from "../models/user.js"; // Importing User model in ESM syntax

export const signup = async (req, res) => {
  const { name, email, mobile, password, role = "" } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Check if the email or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({ msg: "Email or Mobile already exists" });
    }

    // Create a new user
    const newUser = new User({ name, email, mobile, password, role });
    await newUser.save();

    res.status(201).json({ msg: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ msg: "Server error during signup" });
  }
};
