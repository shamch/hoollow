"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    Bot,
    Settings,
    Users,
    Download,
    Send,
    X,
    Crown,
    ArrowRight,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import ImpactXPBadge from "@/components/ImpactXPBadge";
import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Message {
    id: string;
    type: "human" | "ai";
    author: string;
    authorXP?: number;
    content: string;
    timestamp: string;
}

const mockMessages: Message[] = [
    {
        id: "m1",
        type: "human",
        author: "Ayush Kumar",
        authorXP: 2140,
        content:
            "What are the most effective strategies for validating a B2B SaaS idea before writing a single line of code?",
        timestamp: "2 min ago",
    },
    {
        id: "m2",
        type: "ai",
        author: "Super AI",
        content:
            "Great question! Here are 5 proven pre-code validation strategies:\n\n1. **Problem Interviews** — Talk to 20+ potential users. Focus on understanding their pain, not pitching your solution.\n\n2. **Concierge MVP** — Deliver the value manually first. If people pay for a spreadsheet-based version, they'll pay for the automated one.\n\n3. **Landing Page Test** — Create a landing page with your value prop and measure email sign-ups. Aim for 10%+ conversion.\n\n4. **Competitor Analysis** — Study existing solutions. Look for complaints in their reviews — that's where your opportunity is.\n\n5. **Pre-sell** — Offer early access at a discount. If 5+ people pay before the product exists, you've validated demand.",
        timestamp: "1 min ago",
    },
    {
        id: "m3",
        type: "human",
        author: "Priya Sharma",
        authorXP: 1840,
        content:
            "I'd add: join the communities where your target users hang out. Reddit, Discord, Slack groups. Listen before you build. The best SaaS ideas come from hearing the same complaint from 10+ people.",
        timestamp: "30s ago",
    },
    {
        id: "m4",
        type: "ai",
        author: "Super AI",
        content:
            'Excellent point, Priya! Community immersion is often overlooked. To quantify this: builders who validate through community research are **3x more likely** to find product-market fit within the first year. Would you like me to create a structured validation framework combining all these approaches?',
        timestamp: "Just now",
    },
];

export default function SuperPage() {
    const { data: session } = useSession();
    const [showPaywall, setShowPaywall] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [checkingSubscription, setCheckingSubscription] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Check if user has an active subscription
    useEffect(() => {
        async function checkSubscription() {
            try {
                const res = await fetch("/api/payment/status");
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasSubscription) {
                        setShowPaywall(false);
                    }
                }
            } catch (e) {
                console.error("Failed to check subscription", e);
            } finally {
                setCheckingSubscription(false);
            }
        }
        checkSubscription();
    }, []);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubscribe = async () => {
        setProcessing(true);
        try {
            // Step 1: Create order on server
            const orderRes = await fetch("/api/payment/create-order", { method: "POST" });
            if (!orderRes.ok) {
                alert("Failed to create payment order. Please ensure Razorpay keys are configured.");
                setProcessing(false);
                return;
            }
            const orderData = await orderRes.json();

            // Step 2: Open Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Hoollow",
                description: "Super Environment — Monthly Subscription",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    // Step 3: Verify payment
                    const verifyRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    if (verifyRes.ok) {
                        setShowPaywall(false);
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: session?.user?.name || "",
                    email: session?.user?.email || "",
                },
                theme: {
                    color: "#8B5CF6",
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function () {
                alert("Payment failed. Please try again.");
                setProcessing(false);
            });
            rzp.open();
        } catch (error) {
            console.error("Payment error:", error);
            alert("Something went wrong. Please try again.");
            setProcessing(false);
        }
    };

    const RightSidebarContent = (
        <aside className="p-6 space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
                <h3 className="text-[10px] font-black text-white/40 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={14} className="text-premium" />
                    Session Config
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[9px] font-black text-white/20 block mb-1 uppercase tracking-widest">Topic</label>
                        <p className="text-xs font-bold text-white italic truncate">B2B SaaS Validation</p>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-white/20 block mb-1 uppercase tracking-widest">AI Brain</label>
                        <p className="text-xs font-bold text-premium italic">GPT-4 Turbo Pro</p>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-white/20 block mb-1 uppercase tracking-widest">Crew</label>
                        <p className="text-xs font-bold text-white italic">3 Builders + 1 AI</p>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
                <h3 className="text-[10px] font-black text-white/40 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-premium" />
                    Active Members
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 group">
                        <Avatar name={session?.user?.name || "You"} size="sm" />
                        <span className="text-xs font-bold text-white/80 flex-1 truncate group-hover:text-white transition-colors">
                            {session?.user?.name || "You"}
                        </span>
                        <ImpactXPBadge score={session?.user?.impactXP || 50} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-premium flex items-center justify-center border border-white/10 shadow-lg shadow-premium/20">
                            <Bot size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black text-premium italic">Super AI Agent</span>
                    </div>
                </div>
            </div>

            <button className="w-full flex items-center justify-center gap-3 text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest py-4 border border-white/5 rounded-[24px] transition-all hover:bg-white/5">
                <Download size={14} />
                Export Brief
            </button>
        </aside>
    );

    return (
        <AppLayout className="bg-[#0D0A14]" rightSidebar={RightSidebarContent}>
            <div className="relative min-h-screen">
                {/* ─── Header ─── */}
                <div className="border-b border-white/5 px-8 py-6 backdrop-blur-xl sticky top-0 z-10 bg-[#0D0A14]/80">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full bg-premium text-white uppercase tracking-widest shadow-lg shadow-premium/20">
                                <Sparkles size={12} />
                                Super Env
                            </span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                Premium Node
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-medium text-white/40 italic">
                                &ldquo;B2B SaaS Validation Strategies&rdquo;
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Main Content ─── */}
                <div className="px-8 py-8">
                    <div className="flex flex-col gap-6">
                        {/* Thread */}
                        <div className="space-y-6 mb-24">
                            {mockMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`rounded-[32px] p-6 ${msg.type === "ai"
                                        ? "bg-premium/5 border border-premium/20 backdrop-blur-sm"
                                        : "bg-white/5 border border-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        {msg.type === "ai" ? (
                                            <div className="w-10 h-10 rounded-full bg-premium flex items-center justify-center border border-white/10 shadow-lg shadow-premium/20">
                                                <Bot size={20} className="text-white" />
                                            </div>
                                        ) : (
                                            <Avatar name={msg.author} size="md" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-white">
                                                {msg.author}
                                            </span>
                                            {msg.type === "ai" && (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-premium/20 text-premium px-2 py-0.5 rounded-full border border-premium/30">
                                                    AI
                                                </span>
                                            )}
                                            {msg.authorXP && (
                                                <ImpactXPBadge score={msg.authorXP} size="sm" showIcon={false} />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-white/20 ml-auto uppercase tracking-widest">
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                    <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line font-medium px-2">
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Floating Input */}
                        <div className="fixed bottom-8 left-[350px] right-[450px] z-20">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-premium to-accent rounded-[28px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative flex items-center bg-[#15111D] border border-white/10 rounded-[24px] p-2 pr-4 shadow-2xl">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type a message or prompt AI..."
                                        className="w-full bg-transparent px-6 py-3 text-sm text-white placeholder-white/20 focus:outline-none font-medium"
                                    />
                                    <button className="w-10 h-10 rounded-xl bg-premium flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg shadow-premium/20">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Paywall Overlay ─── */}
                {showPaywall && !checkingSubscription && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#111114] border border-white/10 rounded-[48px] p-10 max-w-md w-full mx-6 shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-premium via-accent to-premium" />
                            <button
                                onClick={() => setShowPaywall(false)}
                                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="w-20 h-20 mx-auto mb-8 bg-premium/10 rounded-3xl flex items-center justify-center border border-premium/20">
                                <Crown size={36} className="text-premium" />
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">
                                Enter Super Space
                            </h2>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-10 leading-relaxed">
                                Unlock AI-enhanced hyper-collaboration, premium insights, and advanced node tools.
                            </p>
                            
                            <div className="bg-black/40 rounded-[32px] p-8 mb-10 border border-white/5">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <span className="text-sm font-black text-white/40 uppercase tracking-widest">Only</span>
                                    <span className="text-4xl font-black text-white italic tracking-tighter">₹299</span>
                                </div>
                                <span className="text-[10px] font-black text-premium uppercase tracking-widest">per month</span>
                            </div>

                            <div className="space-y-4 text-left mb-10 px-4">
                                {[
                                    "AI-powered logic assistant",
                                    "Unlimited hyper-sessions",
                                    "Premium builder analytics",
                                    "Priority node support",
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-premium/10 flex items-center justify-center flex-shrink-0 border border-premium/20">
                                            <Sparkles size={10} className="text-premium" />
                                        </div>
                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{item}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <Button
                                variant="premium"
                                size="lg"
                                className="w-full h-16 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-premium/20 group"
                                onClick={handleSubscribe}
                                disabled={processing}
                            >
                                {processing ? "Initiating..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        Subscribe Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                            
                            <button
                                onClick={() => setShowPaywall(false)}
                                className="mt-6 text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-all"
                            >
                                Maybe in the next phase
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
