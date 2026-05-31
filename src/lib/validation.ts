import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(255, "Email is too long"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone is too long")
    .regex(/^[0-9+\-\s()]*$/, "Phone may contain digits, +, -, spaces only")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().min(1, "Please enter your message").max(2000, "Message is too long"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
