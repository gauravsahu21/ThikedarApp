import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("name, role, points").eq("id", user.id).single() : { data: null };
  if (!user || profile?.role === "admin") redirect("/admin/users");
  return <div className="app-shell"><header className="topbar"><Link href="/dashboard/gifts" className="brand">thikedar<span>/</span></Link><nav><Link href="/dashboard/gifts">Rewards</Link><Link href="/dashboard/points">My points</Link></nav><div className="user-menu"><span>{profile?.name || user.email}</span><form action={logout}><button className="logout">Sign out</button></form></div></header><main className="content">{children}</main></div>;
}