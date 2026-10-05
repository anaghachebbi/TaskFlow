import { ApiError } from "../utils/api-error.js";
import { projectMember } from "../models/projectmember.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(400, "Project ID is missing");
    }
    const project = await projectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });
    if (!project) {
      throw new ApiError(400, "Project not found");
    }

    const givenRole = project?.role;
    req.user.role = givenRole;
    if (!roles.includes(givenRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this operation",
      );
    }
    next();
  });
export { validateProjectPermission };
