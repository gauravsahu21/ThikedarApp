"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const configuredAdmin = user.email?.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (profile?.role !== "admin" && !configuredAdmin) throw new Error("Forbidden");
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const name = String(formData.get("name"));
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create user");
  await admin.from("profiles").insert({ id: data.user.id, name, email, role: "user", points: 0 });
  revalidatePath("/admin/users");
}

export async function addPoints(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") || "Admin award");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("points").eq("id", userId).single();
  await admin.from("profiles").update({ points: (profile?.points ?? 0) + amount }).eq("id", userId);
  await admin.from("point_transactions").insert({ user_id: userId, amount, reason });
  revalidatePath("/admin/users");
  revalidatePath("/dashboard/points");
}

export async function createGift(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("gifts").insert({ name: String(formData.get("name")), description: String(formData.get("description") || ""), points_cost: Number(formData.get("pointsCost")), image_url: String(formData.get("imageUrl") || "") });
  revalidatePath("/admin/gifts");
  revalidatePath("/dashboard/gifts");
}

export async function deleteGift(formData: FormData) {
  await requireAdmin();
  await createAdminClient().from("gifts").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/gifts");
  revalidatePath("/dashboard/gifts");
}