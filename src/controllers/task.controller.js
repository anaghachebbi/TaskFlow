import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { subTask } from "../models/subtask.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import mongoose from "mongoose";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project Not found");
  }
  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("assignedTo", "avatar username fullName");
  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks Listed successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project Not found");
  }
  const files = req.files || [];
  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  });
  const task = await Task.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    status,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task Created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskID, projectId } = req.params;
  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskID),
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);
  if (!task || task.length == 0) {
    throw new ApiError(404, "Task Not Found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task Fetched Successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, assignedTo } = req.body;
  const { projectId, taskID } = req.params;
  const task = await Task.findOne({
    _id: taskID,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  await task.save();
  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task Updated Successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskID } = req.params;
  const task = await Task.findOne({
    _id: taskID,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  await subTask.deleteMany({
    task: taskID,
  });
  await Task.findByIdAndDelete(taskID);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { projectId, taskID } = req.params;
  const task = await Task.findOne({
    _id: taskID,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  const subtask = await subTask.create({
    title,
    task: taskID,
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { title, isCompleted } = req.body;
  const { projectId, taskID, subTaskID } = req.params;
  const task = await Task.findOne({
    _id: taskID,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  const subtask = await subTask.findOne({
    _id: subTaskID,
    task: taskID,
  });
  if (!subtask) {
    throw new ApiError(404, "Subtask not found");
  }
  if (title !== undefined) {
    subtask.title = title;
  }
  if (isCompleted !== undefined) {
    subtask.isCompleted = isCompleted;
  }
  await subtask.save();
  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskID, subTaskID } = req.params;
  const task = await Task.findOne({
    _id: taskID,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  const subtask = await subTask.findOne({
    _id: subTaskID,
    task: taskID,
  });
  if (!subtask) {
    throw new ApiError(404, "Subtask not found");
  }
  await subTask.findByIdAndDelete(subTaskID);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});
export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
