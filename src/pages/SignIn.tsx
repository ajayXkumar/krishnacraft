import { Link } from 'react-router-dom';
import PhoneAuthFlow from '../components/PhoneAuthFlow';

export default function SignIn() {
  return (
    <section className="pt-32 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Welcome</span>
          <h1 className="text-4xl mb-3">Sign In</h1>
          <p className="text-muted text-sm">
            New here?{' '}
            <Link to="/signup" className="text-gold underline">
              Create an account
            </Link>
          </p>
        </div>

        <PhoneAuthFlow mode="signin" />

        <p className="text-center text-[11px] text-muted mt-6 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </section>
  );
}
