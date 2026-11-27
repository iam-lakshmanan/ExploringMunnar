import { Router } from "express";
import {
  emailLoginController,
  emailSignupController,
  googleLoginController,
} from "../controllers/auth.controller";
import { sendEmailOtpController, verifyEmailOtpController } from "../controllers/email.controller";
import { forgotPasswordController, resetPasswordController, sendPasswordOtpController, changePasswordWithOtpController } from "../controllers/password.controller";

const authRouter = Router();

authRouter.post("/google", googleLoginController);
authRouter.post("/signup", emailSignupController);
authRouter.post("/login", emailLoginController);

authRouter.post("/email/send-otp", sendEmailOtpController);
authRouter.post("/email/verify", verifyEmailOtpController);

authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);


authRouter.post("/change-password/send-otp", sendPasswordOtpController);
authRouter.post("/change-password", changePasswordWithOtpController);

export default authRouter;
