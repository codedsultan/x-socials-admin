import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="X-Socials Admin Panel" />
            <div className="min-h-screen bg-[#0d0d0f] text-[#e8e8e6] font-mono flex flex-col">

                {/* Subtle grid background */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Top bar */}
                <header className="relative z-10 border-b border-[#1e1e22] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Logo mark */}
                        <div className="flex items-center justify-center w-8 h-8 rounded border border-[#e53e2f]/40 bg-[#e53e2f]/10">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="2.5" fill="#e53e2f" />
                                <circle cx="7" cy="7" r="6" stroke="#e53e2f" strokeWidth="1" strokeDasharray="2 2" />
                            </svg>
                        </div>
                        <span className="text-[11px] tracking-[0.2em] uppercase text-[#888]">
                            x-socials / admin
                        </span>
                    </div>

                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="text-[12px] tracking-widest uppercase px-4 py-2 border border-[#e53e2f] text-[#e53e2f] hover:bg-[#e53e2f] hover:text-white transition-colors duration-150"
                            >
                                Dashboard →
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="text-[12px] tracking-widest uppercase px-4 py-2 border border-[#2e2e32] text-[#888] hover:border-[#e53e2f] hover:text-[#e53e2f] transition-colors duration-150"
                            >
                                Sign in
                            </Link>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20">
                    <div className="w-full max-w-3xl">

                        {/* Status pill */}
                        <div className="flex items-center gap-2 mb-8">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] tracking-[0.15em] uppercase text-[#555]">
                                Moderation system active
                            </span>
                        </div>

                        <h1 className="text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-white mb-6">
                            X-Socials<br />
                            <span className="text-[#e53e2f]">Admin Panel</span>
                        </h1>

                        <p className="text-[#555] text-[14px] leading-relaxed max-w-xl mb-12">
                            Human review queue, on-demand content analysis, and automated enforcement
                            for the x-socials moderation pipeline.
                            Built on Laravel 13 · Inertia.js · React 19.
                        </p>

                        {/* System diagram */}
                        <div className="border border-[#1e1e22] bg-[#111113] p-6 mb-12 rounded-sm">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-5">System architecture</p>
                            <div className="flex items-start gap-0 flex-wrap">
                                {/* Node box */}
                                <div className="flex flex-col items-center">
                                    <div className="border border-[#2e2e32] px-4 py-3 text-center min-w-[120px]">
                                        <div className="text-[10px] text-[#888] mb-1">x-socials</div>
                                        <div className="text-[11px] text-white">Node.js</div>
                                    </div>
                                    <div className="text-[10px] text-[#444] mt-2 px-2 text-center leading-tight">
                                        platform API<br />content source
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center mt-[14px] px-2 text-[#333] text-[18px]">→</div>

                                {/* Laravel box — highlighted */}
                                <div className="flex flex-col items-center">
                                    <div className="border border-[#e53e2f]/60 bg-[#e53e2f]/5 px-4 py-3 text-center min-w-[120px]">
                                        <div className="text-[10px] text-[#e53e2f]/70 mb-1">this service</div>
                                        <div className="text-[11px] text-white font-bold">Laravel 13</div>
                                    </div>
                                    <div className="text-[10px] text-[#444] mt-2 px-2 text-center leading-tight">
                                        admin panel<br />review · enforce · audit
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center mt-[14px] px-2 text-[#333] text-[18px]">→</div>

                                {/* FastAPI box */}
                                <div className="flex flex-col items-center">
                                    <div className="border border-[#2e2e32] px-4 py-3 text-center min-w-[120px]">
                                        <div className="text-[10px] text-[#888] mb-1">x-socials-moderator</div>
                                        <div className="text-[11px] text-white">FastAPI</div>
                                    </div>
                                    <div className="text-[10px] text-[#444] mt-2 px-2 text-center leading-tight">
                                        AI engine<br />analyses content
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center mt-[14px] px-2 text-[#333] text-[18px]">↓</div>

                                {/* MySQL box */}
                                <div className="flex flex-col items-center">
                                    <div className="border border-[#2e2e32] px-4 py-3 text-center min-w-[120px]">
                                        <div className="text-[10px] text-[#888] mb-1">shared</div>
                                        <div className="text-[11px] text-white">MySQL 8.0</div>
                                    </div>
                                    <div className="text-[10px] text-[#444] mt-2 px-2 text-center leading-tight">
                                        audit log · queue<br />scan runs
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Three enforcement paths */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#1e1e22] mb-12">
                            <div className="bg-[#0d0d0f] p-5">
                                <div className="text-[10px] tracking-widest uppercase text-[#e53e2f] mb-3">
                                    01 — Auto-remove
                                </div>
                                <p className="text-[12px] text-[#666] leading-relaxed">
                                    Every 5 min. Verdicts <span className="text-white">remove</span> with confidence ≥ 95% are deleted from the platform automatically. No human in the loop.
                                </p>
                            </div>
                            <div className="bg-[#0d0d0f] p-5">
                                <div className="text-[10px] tracking-widest uppercase text-[#e8a020] mb-3">
                                    02 — Human review
                                </div>
                                <p className="text-[12px] text-[#666] leading-relaxed">
                                    Admins work the <span className="text-white">queue page</span>. Keep or remove borderline content. Every action logged with actor ID and IP.
                                </p>
                            </div>
                            <div className="bg-[#0d0d0f] p-5">
                                <div className="text-[10px] tracking-widest uppercase text-[#4e8ef7] mb-3">
                                    03 — On-demand
                                </div>
                                <p className="text-[12px] text-[#666] leading-relaxed">
                                    Paste any post ID on the <span className="text-white">moderation page</span>. Escalate borderline cases to a higher-quality model via FastAPI.
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block text-[12px] tracking-widest uppercase px-6 py-3 bg-[#e53e2f] text-white hover:bg-[#c9352a] transition-colors duration-150"
                            >
                                Open dashboard →
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="inline-block text-[12px] tracking-widest uppercase px-6 py-3 bg-[#e53e2f] text-white hover:bg-[#c9352a] transition-colors duration-150"
                            >
                                Sign in to admin panel →
                            </Link>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-[#1e1e22] px-6 py-4 flex items-center justify-between">
                    <span className="text-[11px] text-[#333]">
                        MIT License — Olusegun Ibraheem
                    </span>
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/codedsultan/x-socials"
                            target="_blank"
                            className="text-[11px] text-[#444] hover:text-[#888] transition-colors"
                        >
                            x-socials
                        </a>
                        <a
                            href="https://github.com/codedsultan/x-socials-ai-moderator"
                            target="_blank"
                            className="text-[11px] text-[#444] hover:text-[#888] transition-colors"
                        >
                            moderator
                        </a>
                        <a
                            href="https://codesultan.xurl.fyi"
                            target="_blank"
                            className="text-[11px] text-[#444] hover:text-[#888] transition-colors"
                        >
                            author
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
}
