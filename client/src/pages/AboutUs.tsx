import { Link } from 'wouter';
import { useEffect, useState } from 'react';

export default function AboutUs() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 w-full overflow-x-hidden">
            {/* Navigation - Same as Landing Page for consistency */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg py-4' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                            <span className="text-primary text-xl">☕</span>
                        </div>
                        <Link href="/">
                            <span className="cursor-pointer hover:text-primary transition-colors">SIMOTWET COFFEE SOCIETY</span>
                        </Link>
                    </div>
                    <div className="hidden md:flex space-x-8 font-semibold text-sm">
                        <Link href="/"><span className="cursor-pointer hover:text-primary transition-colors block">Home</span></Link>
                        <a href="#history" className="hover:text-primary transition-colors block">Our History</a>
                        <a href="#team" className="hover:text-primary transition-colors block">Team</a>
                        <a href="#contact" className="hover:text-primary transition-colors block">Contact</a>
                    </div>
                    <Link href="/auth">
                        <button className="bg-primary text-black font-bold py-2 px-6 rounded-full hover:shadow-[0_0_20px_rgba(var(--primary),0.6)] hover:brightness-110 active:scale-95 transition-all text-sm">
                            Login
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background z-10"></div>
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                        style={{ backgroundImage: "url('/images/hero_coffee.jpg')" }}
                    ></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight max-w-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">
                        About SIMOTWET
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
                        Bridging the gap between traditional agricultural practices and cutting-edge decentralized systems since our founding.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] translate-x-1/2"></div>
                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
                        <div className="md:w-1/2 w-full">
                            <div className="aspect-square rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                                <img src="/images/farm_coffee.gif" alt="Our Mission" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="md:w-1/2 w-full">
                            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase backdrop-blur-md">
                                Core Philosophy
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Traceable, Transparent, <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">Transformative</span></h2>
                            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                                The SIMOTWET COFFEE SOCIETY was formed to ensure hard-working farmers receive fair compensation by tracking production rigorously through modern protocol structures.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Our platform uses data integrity to prove grading metrics and provide accurate valuation for all our stakeholders. We do not just grow coffee; we engineer trust.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team & Governance Section */}
            <section id="team" className="py-24 bg-black/40 border-y border-white/5 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Our Platform Network</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Powered by a dedicated team of farmers, technicians, and administrators.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Member 1 */}
                        <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all text-center group">
                            <div className="w-24 h-24 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center border border-primary/50 text-3xl group-hover:scale-110 transition-transform">
                                👨‍🌾
                            </div>
                            <h3 className="text-xl font-bold mb-2">Farmers</h3>
                            <p className="text-sm text-muted-foreground">The backbone of our production, supplying premium deposits directly from the source.</p>
                        </div>
                        {/* Member 2 */}
                        <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all text-center group">
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 mx-auto mb-6 flex items-center justify-center border border-blue-500/50 text-3xl group-hover:scale-110 transition-transform">
                                👨‍🔧
                            </div>
                            <h3 className="text-xl font-bold mb-2">Technicians</h3>
                            <p className="text-sm text-muted-foreground">Ensuring operational efficiency and maintaining our network infrastructure and tasks.</p>
                        </div>
                        {/* Member 3 */}
                        <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-yellow-500/50 transition-all text-center group">
                            <div className="w-24 h-24 rounded-full bg-yellow-500/20 mx-auto mb-6 flex items-center justify-center border border-yellow-500/50 text-3xl group-hover:scale-110 transition-transform">
                                👨‍💻
                            </div>
                            <h3 className="text-xl font-bold mb-2">Administrators</h3>
                            <p className="text-sm text-muted-foreground">Governing the protocol, managing nodes, and verifying transaction integrity.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/80 border-t border-white/10 py-12 pb-6">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} SIMOTWET COFFEE SOCIETY. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <Link href="/">
                                <span className="hover:text-white transition-colors cursor-pointer">Return Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
