"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Inter, Poppins } from 'next/font/google';
import { useRef } from "react";
import { FaReddit } from "react-icons/fa";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { Spotlight } from "../ui/spotlight-new";

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700', '800', '900'] 
});

export const Hero = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Spotlight/>
      
      {/* Black Background with Minimal Orange */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-10"
      >
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
      </motion.div>
      
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
      
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-12">
          
          {/* Enhanced Typography */}
          <div className="space-y-2 overflow-visible">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] text-white mb-0 overflow-visible ${poppins.className}`}
              style={{ overflow: 'visible' }}
            >
              Turn{" "}
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "backOut" }}
                className="inline-block relative z-20 overflow-visible"
                style={{ overflow: 'visible', display: 'inline-block' }}
              >
                <FaReddit className="inline size-16 sm:size-20 lg:size-24 xl:size-28 text-orange-500 mx-2 relative z-20" />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent inline-block overflow-visible"
                style={{ 
                  overflow: 'visible',
                  lineHeight: '0.9',
                  display: 'inline-block'
                }}
              >
                Reddit
              </motion.span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className={`text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] text-white mt-0 overflow-visible ${poppins.className}`}
              style={{ overflow: 'visible' }}
            >
              Into Leads
            </motion.div>
          </div>

          {/* Text Content */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className={`text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed ${inter.className}`}
          >
            AI finds warm prospects on Reddit who need your product.
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="text-white/50"
            >
              No manual searching required.
            </motion.span>
          </motion.p>

          {/* Enhanced CTA Button with Proper Animation */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 1.3,
              ease: [0.42, 0, 0.58, 1]
            }}
            className="pt-8"
          >
            <motion.div 
              className="group relative inline-block"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Glowing orange border effect */}
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-orange-500/50 via-orange-400/60 to-orange-500/50 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition duration-500"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              
              <Link
                href="/signup"
                className="relative inline-flex items-center gap-3 bg-gray-900/50 backdrop-blur-xl hover:bg-gray-800/60 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-500 border-2 border-orange-500/40 hover:border-orange-400/80 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
              >
                {/* Subtle shimmer effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent rounded-xl"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                
                <span className={`relative z-10 ${poppins.className}`}>Find My First Lead</span>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight className="size-5 relative z-10" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Fixed Integration Logos with Seamless Marquee */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="pt-8"
          >
            <motion.p 
              className={`text-lg font-bold text-white/50 mb-6 ${inter.className}`}
            >
              Integrates with your favorite tools
            </motion.p>
            
            <div className="overflow-hidden whitespace-nowrap relative w-full">
              <div 
                className="flex w-max"
                style={{
                  animation: 'marquee 20s linear infinite'
                }}
              >
                {/* First set */}
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 1" src="https://cdn.builder.io/api/v1/image/assets/TEMP/628f567b2e485aad67d93fb60e74b1cdabd543e8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 2" src="https://cdn.builder.io/api/v1/image/assets/TEMP/2a800b31805310aa7e66a69e5418fa00690c8447?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 3" src="https://cdn.builder.io/api/v1/image/assets/TEMP/d63f85ba4135dced28843a0b237ce4cbe013537b?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 4" src="https://cdn.builder.io/api/v1/image/assets/TEMP/10815a12b7490498be53c31b79b84eaf776fcc3f?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 5" src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8e021d4bf486876d3ccb34b072e74f69a875dc8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 6" src="https://cdn.builder.io/api/v1/image/assets/TEMP/90d0c7fccfd7adb0c28de1420add02e558a3bab6?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 7" src="https://cdn.builder.io/api/v1/image/assets/TEMP/c7138e0e05e4a40992417363eabf2705578e66ca?placeholderIfAbsent=true" />
                
                {/* Second set - exact duplicate for seamless loop */}
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 1" src="https://cdn.builder.io/api/v1/image/assets/TEMP/628f567b2e485aad67d93fb60e74b1cdabd543e8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 2" src="https://cdn.builder.io/api/v1/image/assets/TEMP/2a800b31805310aa7e66a69e5418fa00690c8447?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 3" src="https://cdn.builder.io/api/v1/image/assets/TEMP/d63f85ba4135dced28843a0b237ce4cbe013537b?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 4" src="https://cdn.builder.io/api/v1/image/assets/TEMP/10815a12b7490498be53c31b79b84eaf776fcc3f?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 5" src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8e021d4bf486876d3ccb34b072e74f69a875dc8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 6" src="https://cdn.builder.io/api/v1/image/assets/TEMP/90d0c7fccfd7adb0c28de1420add02e558a3bab6?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 7" src="https://cdn.builder.io/api/v1/image/assets/TEMP/c7138e0e05e4a40992417363eabf2705578e66ca?placeholderIfAbsent=true" />
                
                {/* Third set - for extra coverage */}
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 1" src="https://cdn.builder.io/api/v1/image/assets/TEMP/628f567b2e485aad67d93fb60e74b1cdabd543e8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 2" src="https://cdn.builder.io/api/v1/image/assets/TEMP/2a800b31805310aa7e66a69e5418fa00690c8447?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 3" src="https://cdn.builder.io/api/v1/image/assets/TEMP/d63f85ba4135dced28843a0b237ce4cbe013537b?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 4" src="https://cdn.builder.io/api/v1/image/assets/TEMP/10815a12b7490498be53c31b79b84eaf776fcc3f?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 5" src="https://cdn.builder.io/api/v1/image/assets/TEMP/b8e021d4bf486876d3ccb34b072e74f69a875dc8?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 6" src="https://cdn.builder.io/api/v1/image/assets/TEMP/90d0c7fccfd7adb0c28de1420add02e558a3bab6?placeholderIfAbsent=true" />
                <img className="object-contain shrink-0 h-[32px] md:h-[40px] max-md:h-[24px] transition-transform hover:scale-110 mx-6" alt="Integration Logo 7" src="https://cdn.builder.io/api/v1/image/assets/TEMP/c7138e0e05e4a40992417363eabf2705578e66ca?placeholderIfAbsent=true" />
              </div>
            </div>
          </motion.div>

          {/* Trust Line */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.5 }}
            className={`text-sm text-white/40 ${inter.className}`}
          >
            <motion.span
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Join 500+ founders
            </motion.span>
            {" • "}
            <motion.span
              animate={{ opacity: [0.7, 0.4, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              No credit card required
            </motion.span>
          </motion.p>

        </div>
      </div>

      {/* Minimal Floating Elements */}
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
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}
