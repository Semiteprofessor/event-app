import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const userResolvers = {
  Mutation: {
    registerUser: async (_: any, { input }: any) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      const userCount = await prisma.user.count();

      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
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

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      // Load and customize OTP email template
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

      // Send OTP email
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
        otp,
        token,
        user,
      };
    },

    loginUser: async (_: any, { input }: any) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        return { success: false, message: "User not found" };
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
        process.env.JWT_SECRET!,
        {
          expiresIn: "7d",
        }
      );

      return {
        success: true,
        message: "Login successful",
        token,
        user,
      };
    },

    forgetPassword: async (_: any, { email, origin }: any) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
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

    resetPassword: async (_: any, { token, newPassword }: any) => {
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
      } catch (err) {
        return { success: false, message: "Invalid or expired token" };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

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

      return {
        success: true,
        message: "Password updated successfully",
      };
    },
    verifyOtp: async (_: any, { email, otp }: any) => {
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

      return {
        success: true,
        message: "OTP verified successfully",
        user,
      };
    },

    // ✅ Resend OTP
    resendOtp: async (_: any, { email }: any) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return {
          success: false,
          message: "OTP has already been verified",
        };
      }

      const newOtp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true,
      });

      await prisma.user.update({
        where: { email },
        data: { otp: newOtp },
      });

      // 📩 Send OTP email
      const htmlFilePath = path.join(process.cwd(), "src/email-templates", "otp.html");
      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
      htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${newOtp}</h1>`);
      htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

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
        message: "OTP resent successfully",
      };
    },
  },
};
