export const AUTH_ACTIONS_WITH_EMAIL_TEMPLATE = `"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/actions/send-email";

function getStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  return value;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/error?message=Supabase+not+configured");

  const email = getStringField(formData, "email");
  const password = getStringField(formData, "password");

  if (!email || !password) {
    redirect("/auth/login?message=Email+and+password+are+required");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login error:", error.message);
    redirect("/auth/login?message=Invalid+email+or+password");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/error?message=Supabase+not+configured");

  const name = getStringField(formData, "name")?.trim() ?? "";
  const email = getStringField(formData, "email");
  const password = getStringField(formData, "password");
  const confirmPassword = getStringField(formData, "confirmPassword");

  if (!name || name.length > 100) {
    redirect("/auth/sign-up?message=Name+must+be+between+1+and+100+characters");
  }

  if (!email || !password || !confirmPassword) {
    redirect("/auth/sign-up?message=All+fields+are+required");
  }

  if (password.length < 8) {
    redirect("/auth/sign-up?message=Password+must+be+at+least+8+characters");
  }

  if (password !== confirmPassword) {
    redirect("/auth/sign-up?message=Passwords+don't+match");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
  } else {
    try {
      await sendWelcomeEmail({ name, email });
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }
  }

  // Always redirect to success to prevent email enumeration
  redirect("/auth/sign-up-success");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/error?message=Supabase+not+configured");

  const email = getStringField(formData, "email");

  if (!email) {
    redirect("/auth/forgot-password?message=Email+is+required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: \`\${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/update-password\`,
  });

  if (error) {
    console.error("Forgot password error:", error.message);
  }

  // Always show success to prevent email enumeration
  redirect("/auth/forgot-password?message=If+an+account+exists,+you'll+receive+a+reset+link");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/error?message=Supabase+not+configured");

  const password = getStringField(formData, "password");
  const confirmPassword = getStringField(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    redirect("/auth/update-password?message=All+fields+are+required");
  }

  if (password.length < 8) {
    redirect("/auth/update-password?message=Password+must+be+at+least+8+characters");
  }

  if (password !== confirmPassword) {
    redirect("/auth/update-password?message=Passwords+don't+match");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Update password error:", error.message);
    redirect("/auth/update-password?message=Unable+to+update+password.+Please+try+again.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/error?message=Supabase+not+configured");

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
`;
