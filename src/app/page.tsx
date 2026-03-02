import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeartPulse, MessageSquare, Calendar, FileText, ShieldCheck, Activity, Stethoscope, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

const avatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* Decorative Background Vectors */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-emerald-50/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-emerald-50/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
      </div>

      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-slate-100/50 sticky top-0 bg-white/90 backdrop-blur-2xl z-50">
        <Link href="/" className="flex items-center justify-center gap-2 group">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200 transition-all duration-500 group-hover:scale-110">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Cure-It <span className="text-emerald-600">Health</span></span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-10 items-center">
          <Link className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors" href="#features">Features</Link>
          <Link className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors" href="/login">Login</Link>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section with Imagery */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 animate-fade-in">
                  <Sparkles className="h-4 w-4" />
                  <span>The Future of Personal Healthcare</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[1.05]">
                  Your Health, <br />
                  <span className="text-emerald-600">Perfectly Sequenced.</span>
                </h1>
                <p className="max-w-xl text-xl text-slate-500 font-medium leading-relaxed mx-auto lg:mx-0">
                  A high-fidelity platform that unifies your medical records, analyzes diagnostics with AI, and secures your journey with military-grade encryption.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-emerald-100">
                    <Link href="/signup" className="flex items-center">Start Journey <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <div className="flex items-center gap-4 px-4 py-2 text-slate-400">
                    <div className="flex -space-x-3">
                      {avatars.map((url, i) => (
                        <img key={i} src={url} className="w-10 h-10 rounded-full border-4 border-white shadow-sm object-cover" alt="User" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-600 ml-2">Join 10k+ healthy users</span>
                  </div>
                </div>
              </div>

              {/* Hero Image / Vector Composition */}
              <div className="flex-1 relative w-full max-w-[600px] lg:max-w-none animate-in fade-in zoom-in-95 duration-1000">
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200" 
                    alt="Medical Innovation" 
                    className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent"></div>
                  
                  {/* Floating App Badges */}
                  <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce-subtle">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Health Score</p>
                        <p className="text-lg font-black text-slate-900">Optimal 98%</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-800 animate-float-slow">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 p-2 rounded-lg text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-white">AI Assistant Online</p>
                    </div>
                  </div>
                </div>
                
                {/* Background Vector Shapes */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-700"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features with Icon Vectors */}
        <section id="features" className="py-32 bg-slate-50/50 relative overflow-hidden">
          <div className="container px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
              <h2 className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-xs">The Cure-It Stack</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900">Built for Clinical Precision.</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <MessageSquare />, title: "Clinical AI", desc: "Context-aware diagnostics based on your unique medical history." },
                { icon: <Calendar />, title: "Smart Timeline", desc: "A unified temporal view of every symptom, visit, and script." },
                { icon: <FileText />, title: "OCR Lab Sync", desc: "Instant extraction of structured data from physical lab reports." },
                { icon: <ShieldCheck />, title: "HIPAA Vault", desc: "Bank-grade encryption protocols for absolute data sovereignty." },
                { icon: <Stethoscope />, title: "Doctor Portal", desc: "Secure, one-click sharing of records with your care providers." }
              ].map((f, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                    <div className="text-emerald-900 transform scale-[4] rotate-[-15deg]">
                      {f.icon}
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                    {f.icon}
                  </div>
                  <h4 className="text-2xl font-bold mb-4 text-slate-900">{f.title}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Trust Section */}
        <section className="py-24">
          <div className="container px-6 mx-auto">
            <div className="bg-emerald-600 rounded-[4rem] p-12 lg:p-24 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              
              <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
                <h3 className="text-4xl md:text-6xl font-black text-white leading-tight">Master your health data today.</h3>
                <ul className="space-y-4 inline-block text-left">
                  {['Encrypted Medical History', 'AI Symptom Checker', 'PDF Report Extraction'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-white/90 font-bold text-lg">
                      <CheckCircle2 className="h-6 w-6 text-emerald-300" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 h-16 px-12 rounded-2xl text-xl font-bold shadow-2xl transition-transform hover:scale-105 active:scale-95">
                    <Link href="/signup">Join Cure-It Now</Link>
                  </Button>
                </div>
              </div>

              <div className="flex-1 w-full lg:w-1/2 relative animate-in slide-in-from-right-12 duration-1000">
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 border-8 border-white/20">
                  <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200" alt="Clinic Interface" className="w-full h-[450px] object-cover" />
                  <div className="absolute inset-0 bg-emerald-900/10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="container px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-sm text-slate-400 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2 grayscale brightness-50">
            <HeartPulse className="h-6 w-6" />
            <span className="text-xl text-slate-900 tracking-tighter">Cure-It</span>
          </div>
          <div className="flex gap-12">
            <Link className="hover:text-emerald-600 transition-colors" href="#">Security</Link>
            <Link className="hover:text-emerald-600 transition-colors" href="#">Privacy</Link>
            <Link className="hover:text-emerald-600 transition-colors" href="#">Contact</Link>
          </div>
          <p>© 2026 Cure-It</p>
        </div>
      </footer>
    </div>
  )
}
