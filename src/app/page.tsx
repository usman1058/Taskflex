"use client";

import React, { useEffect, useState, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  BarChart3, 
  Zap, 
  Layers, 
  Share2,
  ArrowRight,
  Star,
  CheckCircle,
  FileText,
  MessageSquare,
  Settings,
  BarChart,
  Database,
  Shield,
  Users2
} from "lucide-react";

// Lazy load heavy components
const TextType = lazy(() => import("@/components/reactbits/TextType"));
const LogoLoop = lazy(() => import("@/components/reactbits/LogoLoop"));
const SplashCursor = lazy(() => import("@/components/reactbits/SplashCursor"));
const MagicBento = lazy(() => import("@/components/reactbits/MagicBento"));
const PillNav = lazy(() => import("@/components/reactbits/PillNav"));
const DarkVeil = lazy(() => import("@/components/reactbits/DarkVeil"));
const LaserFlow = lazy(() => import("@/components/reactbits/LaserFlow"));

// Blob component for decorative elements
const Blob = ({ position, size, color, opacity }) => {
  const style = {
    position: 'absolute',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    filter: 'blur(60px)',
    opacity: opacity,
    width: size,
    height: size,
    ...position
  };

  return <div style={style} />;
};

// Loading component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-indigo-500" />
  </div>
);

// Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const pricingCardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { scale: 1.03, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.3)" }
};

// Card data for Experience section
const experienceCards = [
  {
    icon: FileText,
    title: "Smart Documents",
    description: "Create, edit, and collaborate on documents in real-time with intelligent formatting.",
    color: "from-indigo-500 to-purple-600"
  },
  {
    icon: MessageSquare,
    title: "Team Chat",
    description: "Integrated messaging with threads, reactions, and file sharing.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: BarChart,
    title: "Analytics Dashboard",
    description: "Visualize team performance with customizable charts and insights.",
    color: "from-violet-500 to-fuchsia-500"
  },
  {
    icon: Database,
    title: "Cloud Storage",
    description: "Secure, scalable storage with advanced sharing permissions.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption with SOC 2 compliance and advanced threat protection.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Users2,
    title: "Team Management",
    description: "Organize teams, set permissions, and manage access controls.",
    color: "from-amber-500 to-orange-500"
  }
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (status === "loading") return;
    if (session) router.push("/dashboard");
  }, [session, status, router]);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isMounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-500" />
      </div>
    );
  }

  if (session) return null;

  // Feature data
  const features = [
    {
      icon: CheckSquare,
      title: "Task Management",
      description: "Organize tasks with priorities, tags, and automations.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Assign, comment, and share updates in real time.",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      icon: Calendar,
      title: "Time Tracking",
      description: "Built-in timers and smart reminders for deadlines.",
      gradient: "from-violet-500 to-fuchsia-500"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Visualize work with dashboards and custom reports.",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  // Detailed features
  const detailedFeatures = [
    {
      title: "Advanced Features",
      items: [
        "Custom workflows & automations",
        "Advanced filtering & sorting",
        "Custom fields & templates",
        "Priority levels & due dates"
      ]
    },
    {
      title: "Collaboration Tools",
      items: [
        "Real-time commenting & mentions",
        "Team activity feeds",
        "File sharing & attachments",
        "Role-based permissions"
      ]
    },
    {
      title: "Integrations",
      items: [
        "Slack, Microsoft Teams, Discord",
        "GitHub, GitLab, Bitbucket",
        "Google Workspace, Office 365",
        "Zapier & API access"
      ]
    }
  ];

  // Pricing tiers
  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individuals and small teams",
      features: [
        "Up to 5 projects",
        "Unlimited tasks",
        "Basic collaboration",
        "Mobile apps"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$12",
      period: "/user/month",
      description: "For growing teams that need more power",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "Time tracking",
        "Integrations",
        "Priority support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with specific needs",
      features: [
        "Everything in Pro",
        "SSO & advanced security",
        "Dedicated account manager",
        "Custom training & onboarding",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "TaskFlow transformed how our team collaborates. We've reduced project completion time by 40%.",
      author: "Sarah Johnson",
      role: "Head of Product",
      company: "TechStart Inc."
    },
    {
      quote: "The analytics dashboard alone is worth the subscription. We finally have visibility into our workflow.",
      author: "Michael Chen",
      role: "CTO",
      company: "Innovate Labs"
    },
    {
      quote: "Simple, powerful, and beautiful. TaskFlow is exactly what our team needed to stay organized.",
      author: "Emma Rodriguez",
      role: "Design Director",
      company: "Creative Studio"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-x-hidden">
      {/* Simple background pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxYTEyMjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djRoNHYtNGgtNHptMC04djRoNHYtNGgtNHptLTggMHY0aDR2LTRoLTR6bTAgOHY0aDR2LTRoNHptLTggMHY0aDR2LTRoLTR6bTAtOHY0aDR2LTRoLTR6bTAtOHY0aDR2LTRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>
      
      <Suspense fallback={<ComponentLoader />}>
        <SplashCursor />
      </Suspense>

      {/* Top navigation - transparent with gradient on scroll */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-pink-900/90 backdrop-blur-lg border-b border-gray-800/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-black font-bold">TF</div>
            <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TaskFlow</span>
          </Link>

          <nav className="hidden md:block">
            <Suspense fallback={<ComponentLoader />}>
              <div className="flex gap-2">
                {[
                  { href: "#features", label: "Features" }, 
                  { href: "#pricing", label: "Pricing" }, 
                  { href: "#testimonials", label: "Testimonials" }, 
                  { href: "#contact", label: "Contact" }
                ].map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-indigo-500/20 hover:text-indigo-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </Suspense>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-purple-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              Sign In
            </Link>
            <Button asChild size="sm" className="hidden sm:inline-flex px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with DarkVeil */}
      <main className="relative z-10">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* DarkVeil effect - covering entire hero section */}
          <Suspense fallback={<ComponentLoader />}>
            <div className="absolute inset-0 z-0">
              <DarkVeil 
                className="w-full h-full" 
                opacity={0.6}
                color="indigo"
              />
            </div>
          </Suspense>
          
          {/* Decorative blobs */}
          <Blob 
            position={{ top: '10%', left: '5%' }}
            size="300px"
            color="rgba(99, 102, 241, 0.15)"
            opacity={0.7}
          />
          <Blob 
            position={{ bottom: '20%', right: '10%' }}
            size="400px"
            color="rgba(139, 92, 246, 0.1)"
            opacity={0.5}
          />
          
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-20 relative z-10">
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.h1 
                initial={{ opacity: 0, y: 24 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.85 }} 
                className="text-4xl md:text-6xl font-extrabold leading-tight"
              >
                <Suspense fallback={<span>Organize. Collaborate. Ship faster.</span>}>
                  <TextType 
                    text="Organize. Collaborate. Ship faster." 
                    speed={55} 
                    className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                  />
                </Suspense>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2, duration: 0.85 }} 
                className="mt-6 text-gray-300 max-w-xl text-lg"
              >
                TaskFlow combines powerful task management, real-time collaboration, and deep analytics so teams deliver with clarity and speed.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.35 }} 
                className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6"
              >
                <Button asChild size="lg" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105">
                  <Link href="/auth/signup" className="flex items-center gap-2">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-3 bg-gray-50 border-gray-700 hover:border-purple-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5 }} 
                className="mt-12"
              >
                {/* <Suspense fallback={<ComponentLoader />}>
                  <LogoLoop 
                    logos={[
                      { src: "/logos/slack.svg", alt: "Slack" },
                      { src: "/logos/github.svg", alt: "GitHub" },
                      { src: "/logos/vercel.svg", alt: "Vercel" }
                    ]}
                    className="opacity-70"
                  />
                </Suspense> */}
              </motion.div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <motion.div 
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                dragElastic={0.1}
                initial={{ scale: 0.98, opacity: 0, x: 100 }} 
                animate={{ scale: 1, opacity: 1, x: 0 }} 
                transition={{ delay: 0.35, type: "spring", stiffness: 100 }} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800 shadow-2xl w-full max-w-md cursor-move"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-semibold text-xl">Project • Marketing Website</h3>
                    <p className="text-sm text-gray-400">3 active sprints • 12 tasks</p>
                  </div>
                  <div className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded-full">Due: Aug 28</div>
                </div>

                <div className="space-y-6">
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-3/4 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                    <div className="flex-1 h-8 bg-gray-800 rounded-lg"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800">
                      <div className="text-xs text-gray-400 mb-2">Design</div>
                      <div className="text-lg font-semibold">4 tasks</div>
                    </div>
                    <div className="p-4 bg-gray-950/40 rounded-xl border border-gray-800">
                      <div className="text-xs text-gray-400 mb-2">Development</div>
                      <div className="text-lg font-semibold">8 tasks</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                    <div className="text-sm text-gray-400">Progress</div>
                    <div className="text-sm font-semibold text-indigo-400">75%</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-16 md:py-24 relative">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16 relative z-10"
          >
            <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">stay productive</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for modern teams to collaborate effectively and ship faster.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                <div className={`flex items-center gap-4 mb-4`}>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-black" />
                  </div>
                  <h4 className="font-semibold text-lg">{feature.title}</h4>
                </div>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Detailed Features Section */}
        <section className="container mx-auto px-6 py-16 md:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Advanced capabilities for <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">power users</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Unlock powerful features that scale with your team's needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {detailedFeatures.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 p-6 hover:border-indigo-500/30 transition-all duration-300"
              >
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-black" />
                  </div>
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (index * 0.1) + (itemIndex * 0.05), duration: 0.3 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Experience Section with Filled Cards */}
        <section className="container mx-auto px-6 py-16 md:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience the <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">power of TaskFlow</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See how our intuitive interface helps teams stay organized and productive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
            {experienceCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                <div className={`flex items-center gap-4 mb-4`}>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-semibold text-lg">{card.title}</h3>
                </div>
                <p className="text-gray-300">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="container mx-auto px-6 py-16 md:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See what our customers have to say about their experience with TaskFlow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={`https://i.pravatar.cc/100?img=${index + 10}`} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full border-2 border-indigo-500" 
                  />
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-6 py-16 md:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">pricing</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the plan that works best for your team. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                variants={pricingCardVariants}
                initial="hidden"
                whileInView="show"
                whileHover="hover"
                viewport={{ once: true }}
                className={`bg-gray-900/50 backdrop-blur rounded-2xl border p-8 relative overflow-hidden ${
                  tier.popular 
                    ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' 
                    : 'border-gray-800'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-gray-400">{tier.period}</span>}
                  </div>
                  <p className="text-gray-400">{tier.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  asChild 
                  size="lg" 
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Link href={tier.name === "Enterprise" ? "/contact" : "/auth/signup"}>
                    {tier.cta}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section with Enhanced Blobs */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          {/* Enhanced decorative blobs */}
          <Blob 
            position={{ top: '-20%', left: '-20%' }}
            size="700px"
            color="rgba(99, 102, 241, 0.15)"
            opacity={0.8}
          />
          <Blob 
            position={{ bottom: '-25%', right: '-20%' }}
            size="800px"
            color="rgba(139, 92, 246, 0.12)"
            opacity={0.7}
          />
          <Blob 
            position={{ top: '30%', left: '60%' }}
            size="500px"
            color="rgba(236, 72, 153, 0.08)"
            opacity={0.6}
          />
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gray-900/70 to-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800 p-12 md:p-16 shadow-xl"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to transform your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">workflow?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of teams already using TaskFlow to ship faster and collaborate more effectively.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
              >
                <Link href="/auth/signup" className="flex items-center gap-2">
                  Get Started for Free <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer with LaserFlow */}
        <footer id="contact" className="py-12 border-t border-gray-800 bg-gradient-to-b from-black/40 to-transparent relative overflow-hidden">
          {/* LaserFlow in footer background */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <Suspense fallback={<ComponentLoader />}>
              <LaserFlow 
                color="#8B5CF6"
                fogIntensity={0.3}
                wispIntensity={3}
                flowSpeed={0.2}
              />
            </Suspense>
          </div>
          
          {/* Blob in footer */}
          <Blob 
            position={{ top: '-20%', left: '30%' }}
            size="400px"
            color="rgba(99, 102, 241, 0.05)"
            opacity={0.4}
          />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-black font-bold">TF</div>
                  <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TaskFlow</span>
                </div>
                <p className="text-gray-400 max-w-md">
                  The ultimate task management solution for modern teams. Organize, collaborate, and ship faster than ever.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
                  <li><Link href="/changelog" className="text-gray-400 hover:text-white transition-colors">Changelog</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-gray-500 text-sm">
                © {new Date().getFullYear()} TaskFlow. All rights reserved.
              </div>
              
              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}