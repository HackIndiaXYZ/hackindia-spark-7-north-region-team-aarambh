import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

function Navbar() {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto backdrop-blur-md rounded-full bg-white/10 border border-black/10 px-6 py-3 flex justify-between items-center">
        <div className="font-instrument text-[28px] tracking-tight text-[#1a1a1a]">AegisID</div>
        <div className="hidden md:flex gap-10">
          {[
            { name: "Architecture", href: "#architecture" },
            { name: "Privacy", href: "#privacy" },
            { name: "Integration", href: "#integration" },
            { name: "About", href: "#about" }
          ].map((item) => (
            <a key={item.name} href={item.href} className="font-sans text-[14px] text-[#1a1a1a] hover:opacity-70 transition-opacity">
              {item.name}
            </a>
          ))}
        </div>
        <Link href="/dashboard" className="group relative bg-[#0871E7] rounded-full text-white font-sans text-[14px] px-6 py-2.5 shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline-1 outline-[#0871E7] -outline-offset-1 overflow-hidden transition-all flex items-center justify-center">
          <div className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] group-hover:scale-x-105 transition-transform duration-300"></div>
          <span className="relative z-10">Launch App</span>
        </Link>
      </nav>
    </div>
  );
}

function TypingMessages() {
  const messages = ["Identity verified.", "Zero-knowledge proof generated.", "Privacy preserved.", "Trust established."];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentMessage = messages[currentMessageIndex];

    if (isDeleting) {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentMessage.substring(0, displayedText.length - 1));
        }, 50);
      } else {
        setIsDeleting(false);
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }
    } else {
      if (displayedText.length < currentMessage.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentMessage.substring(0, displayedText.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentMessageIndex, messages]);

  return (
    <div className="absolute left-[48.5%] md:left-[47.5%] lg:left-[48.5%] -translate-x-1/2 bottom-[28%] z-30 w-[110px] sm:w-[130px] flex justify-start text-left">
      <div className="font-nokia text-[#2A3616] text-[10px] sm:text-[14px] leading-tight break-words min-h-[1.5em] flex items-center">
        {displayedText}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-1.5 h-3 bg-[#2A3616] ml-1 align-middle"
        />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <main className="min-h-screen bg-[#F3F4ED] pt-32 flex flex-col items-center relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 h-screen pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4"
        />
        <div className="absolute inset-0 bg-white/5" />
      </div>

      {/* Hero Text - Moved Upwards */}
      <div className="relative z-20 pointer-events-none text-center px-4 w-full flex flex-col items-center mt-8">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[38px] md:text-[56px] lg:text-[72px] leading-[0.85] tracking-tight text-[#1a1a1a] mb-6"
          dangerouslySetInnerHTML={{ __html: 'The Digital Passport <br /> for Web3.' }}
        />
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[16px] md:text-[18px] text-[#1a1a1a]/80 leading-relaxed font-normal max-w-2xl mx-auto"
        >
          A privacy-preserving, reusable identity layer. Verify once and prove trust everywhere across decentralized applications without exposing personal data.
        </motion.p>
      </div>

      {/* Typing Messages relative to the video height */}
      <div className="absolute inset-0 z-10 pointer-events-none h-screen">
          <TypingMessages />
      </div>
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="min-h-[60vh] py-24 px-4 max-w-5xl mx-auto flex flex-col justify-center border-t border-black/5">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-instrument text-4xl md:text-5xl text-[#1a1a1a] mb-8"
      >
        {title}
      </motion.h2>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="font-sans text-lg text-[#1a1a1a]/70 leading-relaxed space-y-6"
      >
        {children}
      </motion.div>
    </section>
  );
}

export default function App() {
  return (
    <div className="bg-[#F3F4ED] scroll-smooth">
      <Head>
        <title>AegisID | The Digital Passport for Web3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <Hero />
      
      <Section id="architecture" title="Architecture">
        <p>AegisID operates on a decentralized framework where data is stored off-chain and encrypted. We generate unique proofs stored on the blockchain, ensuring that your core identity remains in your control.</p>
        <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
            <div className="p-6 bg-white/30 rounded-2xl border border-black/5">
                <h3 className="font-semibold text-xl mb-2 text-[#1a1a1a]">Off-chain Security</h3>
                <p>Sensitive data is encrypted and stored securely, never touching the public ledger.</p>
            </div>
            <div className="p-6 bg-white/30 rounded-2xl border border-black/5">
                <h3 className="font-semibold text-xl mb-2 text-[#1a1a1a]">On-chain Proof</h3>
                <p>Small, non-reversible cryptographic hashes represent your verified status globally.</p>
            </div>
        </div>
      </Section>

      <Section id="privacy" title="Privacy-First">
        <p>Your data belongs to you. Using zero-knowledge principles, AegisID allows you to prove your age, nationality, or humanness without revealing the underlying documents.</p>
        <blockquote className="border-l-4 border-[#0871E7] pl-6 italic text-2xl font-instrument text-[#1a1a1a] mt-8">
            "Trust the proof, not the person."
        </blockquote>
      </Section>

      <Section id="integration" title="dApp Integration">
        <p>A simple middleware layer for developers. Connect your smart contracts to AegisID to gate access, prevent sybil attacks, and ensure a higher standard of user trust without the friction of traditional KYC.</p>
        <div className="mt-8">
          <Link href="/dashboard" className="inline-block bg-[#0871E7] text-white px-8 py-4 rounded-full font-medium shadow-lg hover:opacity-90 transition-opacity">
            Launch Dashboard
          </Link>
        </div>
      </Section>

      <Section id="about" title="About AegisID">
        <p>AegisID was born from the need to bridge the gap between permissionless innovation and institutional-grade trust. We believe that identity is the missing layer in the Web3 stack, and we're building it to be as open and decentralized as the protocols it serves.</p>
      </Section>

      <footer className="py-12 border-t border-black/5 text-center text-[#1a1a1a]/40 font-sans text-sm">
        &copy; 2026 AegisID. All rights reserved. Built for the privacy-centric web.
      </footer>
    </div>
  );
}
