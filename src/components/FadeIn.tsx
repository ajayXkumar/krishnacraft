import { useEffect, useRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export default function FadeIn({ children, delay = 0, className = '', ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            window.setTimeout(() => node.classList.add('in'), delay);
            io.unobserve(node);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`fade-up ${className}`} {...rest}>
      {children}
    </div>
  );
}
