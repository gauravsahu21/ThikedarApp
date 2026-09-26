import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("name, role").eq("id", user.id).maybeSingle() : { data: null };
  const profileRole = profile?.role?.trim().toLowerCase();
  const metadataRole = String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? "").trim().toLowerCase();
  const configuredAdmin = user?.email?.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!user || (profileRole !== "admin" && metadataRole !== "admin" && !configuredAdmin)) redirect("/dashboard/gifts");
  return <div className="app-shell"><header className="topbar"><Link href="/admin/users" className="brand">thikedar<span>/</span></Link><nav><Link href="/admin/users">People</Link><Link href="/admin/gifts">Gifts</Link></nav><form action={logout}><button className="logout">Sign out</button></form></header><main className="content">{children}</main></div>;
}