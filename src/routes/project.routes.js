import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validators.middlewares.js";
import {
  createProjectValidator,
  addMembertoProjectValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateProjectPermission } from "../middlewares/roleBasedAccess.middleware.js";
import { AvailiableUserRole, UserRolesEnum } from "../utils/constants.js";
const router = Router();
router.use(verifyJWT); //every line executed after this line has verifyJWT running

router
  .route("/")
  .get(getProjects)
  .post(createProjectValidator(), validate, createProject);

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailiableUserRole), getProjectById)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectValidator(),
    validate,
    updateProject,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);
router
  .route("/:projectId/members")
  .get(getProjectMembers)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMembertoProjectValidator(),
    validate,
    addMembersToProject,
  );
router
  .route("/:projectId/members/:userId")
  .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);
export default router;
