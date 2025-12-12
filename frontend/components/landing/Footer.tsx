"use client";
import React from "react";
import { motion } from "framer-motion";
import { Inter, Poppins } from "next/font/google";
import { Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700', '800', '900'] 
});

const SimpleFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Demo", href: "#demo" }
    ],
    resources: [
      { name: "Blog", href: "#blog" },
      { name: "Help", href: "#help" },
      { name: "Changelog", href: "#changelog" }
    ],
    legal: [
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" }
    ]
  };

  const socialLinks = [
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "mailto:hello@redlead.com", label: "Email" }
  ];

  return (
    <footer className="relative border-t border-white/10 overflow-hidden">
      {/* Black Background - Matching Hero Component */}
      <div className="absolute inset-0 z-10">
        {/* Primary Black Base */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/20 opacity-70"></div>
       
        {/* Minimal Radial Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.03),transparent_70%)] opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.02),transparent_70%)] opacity-40"></div>
    
        {/* Subtle Floating Orbs */}
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-1/3 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-white/5 to-white/2 rounded-full blur-3xl opacity-30"
        />
        
        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 25, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-1/3 right-1/4 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-tl from-white/3 to-white/1 rounded-full blur-3xl opacity-20"
        />
      </div>

      {/* Enhanced Spotlight Beam */}
      <div className="absolute inset-0 pointer-events-none z-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Main spotlight */}
          <div className="w-[800px] h-[800px] bg-gradient-radial from-orange-400/20 via-orange-300/10 to-transparent rounded-full blur-2xl"></div>
          {/* Inner glow */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-orange-300/30 via-orange-200/15 to-transparent rounded-full blur-xl"></div>
          {/* Core light */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-gradient-radial from-orange-200/40 to-transparent rounded-full blur-lg"></div>
        </div>
      </div>

      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Logo" className="h-10 " />
                <span className={` text-2xl font-black text-white ${poppins.className}`}>

                  red
                  <span className={` text-2xl bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent  ${poppins.className}`}>lead</span>
                </span>
 
              </div>
              <p className={`text-white/70 mb-6 max-w-sm leading-relaxed ${inter.className}`}>
                AI-powered Reddit lead generation tool.
              </p>
              
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span className={inter.className}>Made with</span>
                <Heart className="w-4 h-4 text-red-400" />
                <span className={inter.className}>by a solo founder</span>
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className={`text-white font-semibold mb-4 ${poppins.className}`}>
                Product
              </h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className={`text-white/70 hover:text-orange-400 transition-colors duration-200 text-sm ${inter.className}`}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Resources Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className={`text-white font-semibold mb-4 ${poppins.className}`}>
                Resources
              </h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className={`text-white/70 hover:text-orange-400 transition-colors duration-200 text-sm ${inter.className}`}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Legal Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className={`text-white font-semibold mb-4 ${poppins.className}`}>
                Legal
              </h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className={`text-white/70 hover:text-orange-400 transition-colors duration-200 text-sm ${inter.className}`}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between"
        >
          <p className={`text-white/60 text-sm ${inter.className}`}>
            © {currentYear} Redlead. Built by  <Link href={"https://x.com/anurag"}>@anurag</Link>
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              return (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-orange-400 hover:bg-white/20 transition-all duration-300"
                  aria-label={social.label}
                >
                  <IconComponent className="w-4 h-4" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Minimal Floating Elements - From Hero */}
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-20 right-20 size-1 bg-white/20 rounded-full z-20"
      />
      
      <motion.div
        animate={{ 
          y: [0, 20, 0],
          x: [0, 10, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          duration: 16, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 3
        }}
        className="absolute bottom-32 left-16 size-1 bg-white/15 rounded-full z-20"
      />
    </footer>
  );
};

export default SimpleFooter;
