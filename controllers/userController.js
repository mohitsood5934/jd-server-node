import User from "../models/user.js"; 

export const getUserProfile = (req, res) => {
  req.profile.password = undefined;
  return res.json(req.profile);
};