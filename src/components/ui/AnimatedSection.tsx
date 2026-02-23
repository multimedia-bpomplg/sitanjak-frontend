"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Pastikan hanya jalan di client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Observer hanya setelah mounted
  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [mounted]);

  // SSR-safe render (server & client sama)
  if (!mounted) {
    return (
      <section id={id} ref={ref}>
        {children}
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      className={`
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
      `}
    >
      {children}
    </section>
  );
}
