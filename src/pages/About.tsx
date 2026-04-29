import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';

export default function About() {
  return (
    <>
      <section className="relative pt-32 pb-24 bg-cream-2 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <span className="section-tag">Our Story</span>
            <h1 className="mb-6" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              The art of <em className="italic text-gold">slow furniture</em>
            </h1>
            <p className="text-muted leading-relaxed mb-4">
              Founded in 1968 in a small workshop in khopda ,Krishna Craft has been carrying
              the language of wood from one generation to the next. Our master artisans work in
              the same way their grandfathers did — by hand, by eye, and by feel.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              Every piece begins with a single block of seasoned solid timber and ends, weeks later,
              as something a family will pass to their children.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
            >
              See Our Craft <ArrowRightIcon />
            </Link>
          </div>
          <div className="relative h-[400px] lg:h-[560px] rounded-xl overflow-hidden">
            <img
              src="https://i.pinimg.com/1200x/a6/d9/e0/a6d9e03b0974637aa90ea5b73735413b.jpg"
              alt="Workshop"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-[900px] mx-auto px-5 lg:px-8 text-center">
          <span className="section-tag">Our Values</span>
          <h2 className="mb-8" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
            Three things we never compromise
          </h2>
          <div className="grid md:grid-cols-3 gap-10 mt-14 text-left">
            {[
              { num: '01', title: 'The Wood', desc: 'Only seasoned, solid timber — sheesham, mango, teak, walnut. Never MDF or veneer.' },
              { num: '02', title: 'The Hand', desc: 'Every chisel, every sand, every coat — done by a master, never by a machine.' },
              { num: '03', title: 'The Time', desc: 'A piece takes 3 to 6 weeks to make. We will not hurry the wood. Neither should you.' },
            ].map(v => (
              <div key={v.num}>
                <div className="font-display text-5xl text-gold mb-4">{v.num}</div>
                <h3 className="text-xl mb-3">{v.title}</h3>
                <p className="text-muted leading-relaxed text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
