import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);

    const { data: user } = useQuery<any, any>({
        queryKey: ['me'],
        queryFn: async () => {
            try {
                const res = await axios.get('/auth/me');
                return res.data.user;
            } catch (err) {
                return null;
            }
        },
        retry: false
    });

    const dashboardLink = user?.role === 'admin' || user?.role === 'operator' ? '/admin' : '/dashboard';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/30">
            {/* Navigation - Sticky */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg py-4' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                            <span className="text-primary text-xl">☕</span>
                        </div>
                        SIMOTWET COFFEE SOCIETY
                    </div>
                    <div className="hidden md:flex space-x-8 font-semibold text-sm">
                        <a href="#vision" className="hover:text-primary transition-colors hover:-translate-y-0.5 transform block">Our Vision</a>
                        <a href="#services" className="hover:text-primary transition-colors hover:-translate-y-0.5 transform block">Services</a>
                        <a href="#products" className="hover:text-primary transition-colors hover:-translate-y-0.5 transform block">Products</a>
                        <Link href="/about" className="hover:text-primary transition-colors hover:-translate-y-0.5 transform block">About Us</Link>
                    </div>
                    <Link href={user ? dashboardLink : "/auth"}>
                        <button className="bg-primary text-black font-bold py-2 px-6 rounded-full hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wider">
                            {user ? "Dashboard" : "Login/register"}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background z-10"></div>
                    {/* Using a placeholder if hero_coffee does not precisely load, but pointing to the requested path */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-pan"
                        style={{ backgroundImage: "url('/images/hero_coffee.jpg')" }}
                    ></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Welcome to the Future of Farming
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight max-w-4xl animate-in font-serif fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        We are your number one <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">deposits tracking</span> system
                    </h1>
                    <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                        <Link href={user ? dashboardLink : "/auth"}>
                            <button className="bg-primary text-black font-bold py-4 px-8 rounded-full hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] hover:brightness-110 active:scale-95 transition-all w-full sm:w-auto uppercase tracking-widest">
                                {user ? "Return to Dashboard" : "Login/register to get started"}
                            </button>
                        </Link>
                        <Link href="/about">
                            <button className="glass-effect text-white font-bold py-4 px-8 rounded-full border border-white/20 hover:bg-white/10 active:scale-95 transition-all w-full sm:w-auto">
                                Learn More
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section id="vision" className="py-24 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -translate-x-1/2"></div>
                <div className="container mx-auto px-6 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Our <span className="text-primary border-b-2 border-primary/50">Vision</span></h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            To revolutionize agricultural tracking and network automation by providing an immutable, real-time data tracing framework from the farm directly to the consumer. We bridge the gap between traditional agricultural practices and cutting-edge decentralized systems.
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-black/40 border-y border-white/5 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Our Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive solutions for modern farm management and valuation.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Service 1 */}
                        <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group overflow-hidden relative">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all"></div>
                            <h3 className="text-2xl font-bold mb-4 relative z-10">Centralized Farm Management & AI Automation</h3>
                            <p className="text-muted-foreground mb-6 relative z-10">
                                Leverage our advanced artificial intelligence models to fully automate your centralized farm management operations. Enhance yield predictability and precision agriculture seamlessly.
                            </p>
                            <div className="h-[250px] w-full rounded-xl overflow-hidden relative z-10 border border-white/10 flex gap-2">
                                <img src="/images/Ai_farming.gif" alt="AI Farming Automation" className="w-1/2 h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700" />
                                <img src="/images/A-farming_automation.gif" alt="AI Farming Models" className="w-1/2 h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700" />
                            </div>
                        </div>

                        {/* Service 2 / 3 Combined */}
                        <div className="flex flex-col gap-8">
                            <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex-1">
                                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all"></div>
                                <h3 className="text-2xl font-bold mb-4 relative z-10">Coffee Grading & Valuation</h3>
                                <p className="text-muted-foreground relative z-10">
                                    Trace farm production to consumer accurately. We provide uncompromising grading metrics verifying the 'Standard' or 'Premium' tier of your deposits.
                                </p>
                            </div>

                            <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex-1">
                                <div className="absolute top-1/2 left-1/2 w-full h-full bg-green-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 group-hover:bg-green-500/20 transition-all"></div>
                                <h3 className="text-2xl font-bold mb-4 relative z-10">Real-Time Data Tracking & Consultation</h3>
                                <p className="text-muted-foreground mb-4 relative z-10">
                                    Real-time data tracking for all farm products with comprehensive analysis and reports. We offer further personal-level consultations for:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-300 mb-6 space-y-2 relative z-10">
                                    <li>Coffee Farming</li>
                                    <li>Cattle Farm Scaling</li>
                                    <li>All levels of firm produce</li>
                                </ul>
                                <a href="mailto:admin@simotwet.co.ke" className="inline-block px-6 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary hover:text-black transition-colors text-sm font-bold relative z-10">
                                    Email Admin OR Call Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="py-32 relative overflow-hidden">
                {/* Subtle background element */}
                <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] translate-x-1/4 translate-y-1/4"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2">
                            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs font-bold tracking-widest uppercase mb-4">
                                Flagship Product
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Our Product <br /><span className="text-primary">Ecosystem</span></h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                Coffee management and production tracking tracing the holistic journey from the raw farm soil straight to the market shelves. Experience robust and verifiable logs.
                            </p>

                            <Link href="/auth">
                                <button className="bg-transparent border-2 border-primary text-primary font-bold py-3 px-8 rounded-full hover:bg-primary hover:text-black transition-all flex items-center gap-3 group">
                                    Start Tracking
                                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                                </button>
                            </Link>
                        </div>

                        <div className="md:w-1/2 flex items-center justify-center">
                            <div className="relative w-full max-w-md aspect-square rounded-[40px] border-2 border-white/10 overflow-hidden shadow-[-20px_20px_60px_rgba(0,0,0,0.8)] glass-effect p-2 group">
                                {/* Internal nested layout for images */}
                                <div className="h-full w-full rounded-[30px] overflow-hidden relative">
                                    <img src="/images/farm_coffee.gif" alt="Coffee Farm Production" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-0 animate-[fade-in_2s_ease-in_forwards]" />
                                    <img src="/images/farm_coffee1.gif" alt="Coffee Farm Management" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-50 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="glass-effect rounded-xl p-4 backdrop-blur-md border border-white/20">
                                            <h4 className="font-bold text-white tracking-wide">Farm to Market</h4>
                                            <p className="text-xs text-gray-300 mt-1">Live synchronicity and status audits</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/80 border-t border-white/10 py-12 pb-6">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-12 border-b border-white/10 pb-12">
                        <div className="col-span-2">
                            <div className="text-2xl font-black tracking-tighter flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                                    <span className="text-primary text-xl">☕</span>
                                </div>
                                SIMOTWET COFFEE SOCIETY
                            </div>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                Redefining the agricultural traceability landscape with uncompromising decentralization, RBAC, and streamlined UI architectures.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-gray-400">Platform</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li><Link href="/auth" className="hover:text-primary transition-colors">Client Node Login</Link></li>
                                <li><Link href="/auth" className="hover:text-primary transition-colors">Register Profile</Link></li>
                                <li><Link href="/about" className="hover:text-primary transition-colors">About the Society</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-gray-400">Connect</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li><a href="mailto:admin@simotwet.co.ke" className="hover:text-primary transition-colors">Contact Admin</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Support Channels</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Knowledge Base</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} SIMOTWET COFFEE SOCIETY. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy Database</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
