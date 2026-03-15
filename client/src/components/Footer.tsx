import { Link } from 'wouter';

export default function Footer() {
    return (
        <footer className="w-full bg-black/80 border-t border-white/10 py-12 pb-6 mt-auto">
            <div className="container mx-auto px-6 max-w-7xl">
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
                            <li><Link href="/auth" className="hover:text-primary transition-colors">Login</Link></li>
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
    );
}
