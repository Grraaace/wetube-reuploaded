import express from "express";
import { 
    logout, 
    getEdit, 
    postEdit,
    startGithubLogin, 
    finishGithubLogin,
    getChangePassword,
    postChangePassword,
    see,
} from "../controllers/userControllers";
import { protectorMiddleware, pwHoldUserMiddleware } from "../middlewares";
import { publicOnlyMiddleware, avatarUpload } from "../middlewares";

const userRouter = express.Router();

userRouter
    .get("/logout", protectorMiddleware, logout);
userRouter
    .route("/edit")
    .all(protectorMiddleware)
    .get(getEdit)
    .post(avatarUpload.single("avatar"), postEdit);
userRouter
    .route("/change-password")
    .all(protectorMiddleware, pwHoldUserMiddleware)
    .get(getChangePassword)
    .post(postChangePassword)
userRouter
    .get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter
    .get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter
    .route("/:id")
    .get(see)
export default userRouter;

