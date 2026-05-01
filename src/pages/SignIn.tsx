import GoogleAuthButton from '../components/GoogleAuthButton';

export default function SignIn() {
  return (
    <section className="pt-32 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Welcome</span>
          <h1 className="text-4xl mb-3">Sign In</h1>
          <p className="text-muted text-sm">
            Use your Google account to sign in or create a new account.
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-line">
          <GoogleAuthButton />
        </div>

        <p className="text-center text-[11px] text-muted mt-6 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </section>
  );
}
