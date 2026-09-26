import { createClient } from "@/lib/supabase/server";

export default async function PointsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: history }] = await Promise.all([supabase.from("profiles").select("name, points").eq("id", user!.id).single(), supabase.from("point_transactions").select("id, amount, reason, created_at").eq("user_id", user!.id).order("created_at", { ascending: false })]);
  return <><div className="page-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Your point trail.</h1><p>A clear look at every moment that moved your balance.</p></div><div className="balance"><strong>{profile?.points ?? 0}</strong><span>current points</span></div></div><section className="history"><div className="section-title"><h2>History</h2><span>{history?.length ?? 0} entries</span></div>{history?.map((item) => <div className="history-row" key={item.id}><div className="history-mark">+</div><div><strong>{item.reason}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></div><strong className="history-amount">+{item.amount}</strong></div>)}</section></>;
}