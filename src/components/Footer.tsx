import { Link } from 'react-router-dom';
import { InstagramIcon, FacebookIcon, YoutubeIcon } from './Icons';

const CHANNEL_URL = 'https://www.youtube.com/@kanhacraft-c6b';

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/70 pt-20 pb-8">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
          <div>
            <Link to="/" className="font-display text-3xl text-cream block mb-1">
              Krishna <span className="text-gold italic font-medium">Craft</span>
            </Link>
            <p className="text-[11px] tracking-[0.2em] uppercase text-cream/30 mb-4">Est. 1968 · Khopda, Rajasthan</p>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              Solid wood furniture and sacred decor, hand-carved by third-generation artisans.
              Built to outlive trends and pass to the next generation.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram"
                className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:bg-gold hover:border-gold hover:text-white transition-colors">
                <InstagramIcon />
              </a>
              <a href="#" aria-label="Facebook"
                className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:bg-gold hover:border-gold hover:text-white transition-colors">
                <FacebookIcon />
              </a>
              <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="w-9 h-9 border border-cream/20 rounded-full flex items-center justify-center hover:bg-gold hover:border-gold hover:text-white transition-colors">
                <YoutubeIcon size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-cream text-[13px] tracking-[0.2em] uppercase font-semibold mb-5">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/products?cat=Ladoo+Gopal" className="hover:text-gold transition-colors">Ladoo Gopal</Link></li>
              <li><Link to="/products?cat=Beds" className="hover:text-gold transition-colors">Beds</Link></li>
              <li><Link to="/products?cat=Almirahs" className="hover:text-gold transition-colors">Almirahs</Link></li>
              <li><Link to="/products?cat=Doors" className="hover:text-gold transition-colors">Doors</Link></li>
              <li><Link to="/products?cat=Tables" className="hover:text-gold transition-colors">Tables</Link></li>
              <li><Link to="/videos" className="hover:text-gold transition-colors">Watch Videos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream text-[13px] tracking-[0.2em] uppercase font-semibold mb-5">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-gold transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Wood Care Guide</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream text-[13px] tracking-[0.2em] uppercase font-semibold mb-5">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-cream/50">Khopda, Rajasthan, India</li>
              <li>
                <a href="tel:+919876543210" className="hover:text-gold transition-colors">+91 98765 43210</a>
              </li>
              <li>
                <a href="mailto:hello@krishnacraft.in" className="hover:text-gold transition-colors">hello@krishnacraft.in</a>
              </li>
              <li className="pt-3">
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold-soft transition-colors">
                  <YoutubeIcon size={14} />
                  <span>94.6K subscribers</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust badges row */}
        <div className="flex flex-wrap gap-6 py-8 border-t border-cream/10 border-b border-cream/10 mb-8">
          {['Handmade in India', '56+ Years of Craft', '12,000+ Happy Homes', 'Lifetime Warranty', 'COD Available'].map(badge => (
            <span key={badge} className="flex items-center gap-2 text-xs text-cream/50">
              <span className="text-gold text-[8px]">✦</span>
              {badge}
            </span>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3 text-[13px]">
          <span>© {new Date().getFullYear()} Krishna Craft. Crafted with care in Rajasthan.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold transition-colors">Privacy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms</a>
            <a href="#" className="hover:text-gold transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
