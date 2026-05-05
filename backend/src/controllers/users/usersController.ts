import { type Response } from "express";
import type { ApiResponse, AuthRequest, PublicUserDTO } from "../../types/custom.js";
import { findAllUsers } from "../../services/users/usersService.js";
import { AppError } from "../../utils/AppError.js";

export const getAllUsers = async (
  req: AuthRequest,
  res: Response<ApiResponse<PublicUserDTO[]>>
) => {

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const users = await findAllUsers(Number(userId));
    res.status(200).json({ data: users });
};
