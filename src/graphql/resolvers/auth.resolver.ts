const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { GraphQLError } = require("graphql");
const { getUserFromToken } = require("../../lib/jwt");

const prisma = new PrismaClient();

// Remove TypeScript interfaces
// interface Context {
//   user?: { id: string; email: string };
// }

getUserFromToken;

interface User {
  id: string;
  email: string;
  password: string;
  otp?: string;
  isVerified?: boolean;
  role?: string;
  [key: string]: any;
}

interface AuthPayload {
  success: boolean;
  message: string;
  token?: string;
  otp?: string;
  user?: User | null;
}

interface Context {
  user?: { id: string; email: string };
}

interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  state?: string;
  about?: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "USER" | "VENDOR";
}

interface LoginUserInput {
  email: string;
  password: string;
}

interface AuthResolvers {
  Query: {
    me: (_: any, __: any, context: Context) => Promise<User>;
  };
  Mutation: {
    registerUser: (
      _: any,
      args: { input: RegisterUserInput }
    ) => Promise<AuthPayload>;
    loginUser: (
      _: any,
      args: { input: LoginUserInput }
    ) => Promise<AuthPayload>;
    forgetPassword: (
      _: any,
      args: { email: string; origin: string }
    ) => Promise<{ success: boolean; message: string; token?: string }>;
    resetPassword: (
      _: any,
      args: { token: string; newPassword: string }
    ) => Promise<{ success: boolean; message: string }>;
    verifyOtp: (
      _: any,
      args: { email: string; otp: string }
    ) => Promise<{ success: boolean; message: string; user?: User | null }>;
    resendOtp: (
      _: any,
      args: { email: string }
    ) => Promise<{ success: boolean; message: string }>;
  };
}

const authResolvers: AuthResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context): Promise<User> => {
      if (!context.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
      });
      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
    },
  },

  Mutation: {
    registerUser: async (
      _: any,
      { input }: { input: RegisterUserInput }
    ): Promise<AuthPayload> => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      const userCount = await prisma.user.count();

      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
          accessToken: null,
          refreshToken: null,
          user: null,
        };
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true,
      });

      const user = await prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
          otp,
          role: userCount === 0 ? "SUPER_ADMIN" : input.role || "USER",
        },
      });

      // JWT tokens
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Send OTP email
      const htmlFilePath = path.join(
        process.cwd(),
        "email-templates",
        "otp.html"
      );
      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
      htmlContent = htmlContent.replace(
        /<h1>[\s\d]*<\/h1>/g,
        `<h1>${otp}</h1>`
      );
      htmlContent = htmlContent.replace(
        /semiteprofessor@gmail\.com/g,
        user.email
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.RECEIVING_EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.RECEIVING_EMAIL,
        to: user.email,
        subject: "Verify your email",
        html: htmlContent,
      });

      return {
        success: true,
        message: "User created successfully",
        accessToken,
        refreshToken,
        user,
      };
    },

    loginUser: async (
      _: any,
      { input }: { input: LoginUserInput }
    ): Promise<AuthPayload> => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const isPasswordMatch = await bcrypt.compare(
        input.password,
        user.password
      );
      if (!isPasswordMatch) {
        return { success: false, message: "Incorrect password" };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return { success: true, message: "Login successful", token, user };
    },

    forgetPassword: async (
      _: any,
      { email, origin }: { email: string; origin: string }
    ): Promise<{ success: boolean; message: string; token?: string }> => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      const resetLink = `${origin}/auth/reset-password/${token}`;

      const htmlFilePath = path.join(
        process.cwd(),
        "src/email-templates",
        "forget.html"
      );
      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
      htmlContent = htmlContent.replace(
        /href="javascript:void\(0\);"/g,
        `href="${resetLink}"`
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.RECEIVING_EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.RECEIVING_EMAIL,
        to: user.email,
        subject: "Reset your password",
        html: htmlContent,
      });

      return {
        success: true,
        message: "Password reset email sent successfully",
        token,
      };
    },

    resetPassword: async (
      _: any,
      { token, newPassword }: { token: string; newPassword: string }
    ): Promise<{ success: boolean; message: string }> => {
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return { success: false, message: "Invalid or expired token" };
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return { success: false, message: "User not found" };
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return { success: false, message: "New password must be different" };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { success: true, message: "Password updated successfully" };
    },

    verifyOtp: async (
      _: any,
      { email, otp }: { email: string; otp: string }
    ): Promise<{ success: boolean; message: string; user?: User | null }> => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return { success: false, message: "OTP has already been verified" };
      }

      if (user.otp !== otp) {
        return { success: false, message: "Invalid OTP" };
      }

      await prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });

      return { success: true, message: "OTP verified successfully", user };
    },

    resendOtp: async (
      _: any,
      { email }: { email: string }
    ): Promise<{ success: boolean; message: string }> => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return { success: false, message: "OTP has already been verified" };
      }

      const newOtp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true,
      });

      await prisma.user.update({ where: { email }, data: { otp: newOtp } });

      const htmlFilePath = path.join(
        process.cwd(),
        "src/email-templates",
        "otp.html"
      );
      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
      htmlContent = htmlContent.replace(
        /<h1>[\s\d]*<\/h1>/g,
        `<h1>${newOtp}</h1>`
      );
      htmlContent = htmlContent.replace(
        /usingyourmail@gmail\.com/g,
        user.email
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.RECEIVING_EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.RECEIVING_EMAIL,
        to: user.email,
        subject: "Verify your email",
        html: htmlContent,
      });

      return { success: true, message: "OTP resent successfully" };
    },
  },
};

module.exports = { authResolvers };
