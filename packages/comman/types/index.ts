import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const ChatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const GeneratedFileSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  language: z.string().optional(),
});

export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
