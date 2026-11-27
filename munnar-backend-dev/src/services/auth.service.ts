
export const ADMIN_CONFIG = {
  EMAIL: "exploringmunnarr@gmail.com",
  INITIAL_PASSWORD: "Admin@2026",
};

/**
 * Seeds or synchronizes the default Admin account securely in PostgreSQL.
 * If the account does not exist, it creates it with role ADMIN and bcrypt hash of Admin@2026.
 */
export const seedInitialAdmin = async () => {
  try {
    const existing = await userRepo.findUserByEmail(ADMIN_CONFIG.EMAIL);
    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_CONFIG.INITIAL_PASSWORD, 10);
      await prisma.user.create({
        data: {
          name: "Admin",
          email: ADMIN_CONFIG.EMAIL,
          password_hash: passwordHash,
          role: UserRole.ADMIN,
          auth_provider: AuthProvider.EMAIL,
          email_verified: true,
          is_active: true,
        },
      });
      console.log("✅ Initial Admin account initialized in database: " + ADMIN_CONFIG.EMAIL);
    } else if (existing.role !== UserRole.ADMIN) {
      // Ensure admin role is granted
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN },
      });
      console.log("✅ Admin role synced for: " + ADMIN_CONFIG.EMAIL);
    }
  } catch (err: any) {
    console.error("⚠️ Failed to seed initial admin:", err.message);
  }
};

import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { user, UserRole, AuthProvider } from "@prisma/client";
import { prisma } from "../prisma-client";
import { GoogleAuthResult } from "../dto/auth.dto";
import admin from "../lib/firebaseAdmin";
import bcrypt from "bcryptjs";

const userRepo = new UserRepository();

export const googleAuthService = async (
  idToken: string,
): Promise<GoogleAuthResult> => {
  // 1. Verify Firebase token
  const decoded = await admin.auth().verifyIdToken(idToken);

  const email = decoded.email;
  const name = decoded.name || "User";
  const googleUid = decoded.uid;

  if (!email) {
    throw new Error("Email not found in Google token");
  }

  // 2. DB check
  let user: user | null = await userRepo.findUserByEmail(email);

  if (!user) {
    user = await userRepo.createUser(email, name, googleUid);
  } else if (!user.google_id) {
    // ✅ EMAIL → GOOGLE ACCOUNT LINKING
    user = await userRepo.linkGoogleAccount({
      userId: user.id,
      googleId: googleUid,
    });
  }

  // 3. Generate YOUR JWT
  const appToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return {
    token: appToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

export const emailSignupService = async (
  name: string,
  email: string,
  password: string,
  phoneNumber?: string
) => {
  const existing = await userRepo.findUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await userRepo.createEmailUser(
    name,
    email,
    passwordHash,
    phoneNumber
  );

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

export const emailLoginService = async (
  email: string,
  password: string
) => {
  // Ensure initial admin is created if logging in with default admin credentials
  if (email.toLowerCase() === ADMIN_CONFIG.EMAIL.toLowerCase()) {
    await seedInitialAdmin();
  }

  const user = await userRepo.findUserByEmail(email);
  if (!user || !user.password_hash) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
};