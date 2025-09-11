'use client'

import Link from 'next/link'
import { ArrowRight, Github, Zap, Palette, SearchCode } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function HomePage() {
  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: 'easeOut'
      }
    })
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="text-center py-24 md:py-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary">
              VisuaLab
            </span>
          </h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            The open-source media platform, rebuilt for the modern web. 
            <br />
            Extensible, intelligent, and beautifully designed.
          </motion.p>
          <div className="flex items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/gallery" className="btn btn-primary text-lg px-8 py-3">
                Explore Gallery
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="https://github.com/varunaditya27/VisuaLab" target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-lg px-8 py-3">
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section id="features" className="my-24 md:my-32">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold">The Next-Generation Toolkit</h2>
            <p className="text-muted-foreground text-lg mt-2">VisuaLab is more than a gallery. It&apos;s a platform for creativity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {[
              { icon: Palette, title: 'Dynamic Theming', description: 'Customize every pixel. A powerful theme editor to make the platform truly yours.' },
              { icon: Zap, title: 'AI-Powered Generation', description: 'Create, don\u2019t just store. Integrated AI tools to generate images directly in your gallery.' },
              { icon: SearchCode, title: 'Intelligent Search', description: 'Find what you\u2019re looking for, visually. Vector search to find similar images with text or an image.' }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                className="p-8 border border-border/50 rounded-2xl bg-card/50 backdrop-blur-sm card-interactive"
                custom={i}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <div className="p-3 bg-primary/10 rounded-lg inline-block mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-2xl mb-3 font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* Open Source Callout */}
        <section className="text-center my-24 md:my-32">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
           >
            <h2 className="font-heading text-4xl font-bold">Built for the Community</h2>
            <p className="text-muted-foreground text-lg mt-3 max-w-2xl mx-auto">
              VisuaLab is open source. Star us on GitHub, report issues, or submit a pull request to help us grow.
            </p>
            <motion.div
              className="mt-8"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="https://github.com/varunaditya27/VisuaLab" target="_blank" rel="noopener noreferrer" className="btn btn-primary text-lg px-8 py-3">
                <Github className="w-5 h-5 mr-2" />
                Contribute on GitHub
              </a>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}