import { type Request, type Response } from "express";
import type { ApiResponse, AuthRequest, PublicUserDTO } from "../../types/custom.js";
import { findAllUsers } from "../../services/users/usersService.js";

export const getAllUsers = async (
  req: AuthRequest,
  res: Response<ApiResponse<PublicUserDTO[]>>
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const users = await findAllUsers(Number(userId));
    res.status(200).json({ data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get the users." });
  }
};
