"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const profileRole = profile?.role?.trim().toLowerCase();
  const metadataRole = String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? "").trim().toLowerCase();
  const configuredAdmin = email.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  redirect(profileRole === "admin" || metadataRole === "admin" || configuredAdmin ? "/admin/users" : "/dashboard/gifts");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}