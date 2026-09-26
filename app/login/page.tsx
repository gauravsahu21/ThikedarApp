import { login } from "@/app/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-intro"><span className="eyebrow">THIKEDAR REWARDS</span><h1>Good work deserves a little more.</h1><p>Sign in to track your points, explore gifts, and make every milestone count.</p></section>
      <form action={login} className="form-panel"><div><span className="eyebrow">WELCOME BACK</span><h2>Sign in</h2></div>
        {error && <p className="error">{error}</p>}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        <button type="submit" className="button button-primary">Continue <span>→</span></button>
      </form>
    </main>
  );
}