import { Link } from 'react-router-dom';
import PhoneAuthFlow from '../components/PhoneAuthFlow';

export default function SignUp() {
  return (
    <section className="pt-32 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-5 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-tag">Join the Heritage Circle</span>
          <h1 className="text-4xl mb-3">Create Account</h1>
          <p className="text-muted text-sm">
            Already have an account?{' '}
            <Link to="/signin" className="text-gold underline">
              Sign in
            </Link>
          </p>
        </div>

        <PhoneAuthFlow mode="signup" />

        <p className="text-center text-[11px] text-muted mt-6 leading-relaxed">
          Sign up with your mobile number — email is optional.
          <br />
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </section>
  );
}
