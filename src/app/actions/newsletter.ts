"use server";

import { db } from "@/lib/prisma";
import { sendEmail } from "@/lib/brevo";
import { z } from "zod";

const subscriberSchema = z.string().email({ message: "Invalid email address" });

export async function subscribeToNewsletter(email: string) {
  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Validate using zod
  const validation = subscriberSchema.safeParse(trimmedEmail);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Check if already subscribed
    const existing = await db.newsletter.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return { success: false, error: "You are already subscribed!" };
    }

    // Save subscription
    await db.newsletter.create({
      data: { email: trimmedEmail },
    });

    // Send confirmation email
    await sendEmail({
      to: [{ email: trimmedEmail }],
      subject: "Welcome to the IKGPTU Alumni Connection!",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Welcome to the IKGPTU Alumni Connection!</h2>
          <p>Thank you for subscribing to our official newsletter. You are now connected to the wider IKGPTU network.</p>
          <p>We will keep you updated with news, key university milestones, career opportunities, and upcoming alumni events.</p>
          <p style="color: #718096; font-size: 0.9em; margin-top: 24px;">If you didn't sign up for this, you can ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="margin: 0; font-weight: bold; color: #2d3748;">Regards,</p>
          <p style="margin: 4px 0 0 0; color: #4a5568;">Team Alumni Connect, IKGPTU</p>
        </div>
      `,
      textContent: `Welcome to the IKGPTU Alumni Connection!

Thank you for subscribing to our official newsletter. You are now connected to the wider IKGPTU network.

We will keep you updated with news, key university milestones, career opportunities, and upcoming alumni events.

If you didn't sign up for this, you can ignore this email.

Regards,
Team Alumni Connect, IKGPTU`,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      error: "Internal server error. Please try again later.",
    };
  }
}
