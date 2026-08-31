import { AuthForm } from "../AuthForm";

export default function LoginPage() {
  return (
    <main className="app-stack-screen flex min-h-full flex-col justify-center">
      <h1 className="app-title mb-2">Timewise</h1>
      <p className="app-subtitle mb-6">Sign in to track how you spend your time.</p>
      <AuthForm mode="login" />
    </main>
  );
}
