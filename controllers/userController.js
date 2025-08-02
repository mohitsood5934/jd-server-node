export const getUserProfile = (req, res) => {
  try {
    const user = req.user.toObject(); // convert Mongoose document to plain object

    // Remove sensitive fields
    delete user.password;
    delete user.refreshToken;

    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error occurred while fetching user profile - ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

