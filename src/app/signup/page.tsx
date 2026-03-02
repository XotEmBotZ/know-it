"use client"

import React, { useState, useTransition } from "react"
import { 
  HeartPulse, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  Calendar,
  Droplet,
  Award
} from "lucide-react"
import { signup } from "../auth/actions"

export default function SignupPage() {
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient")
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSignup = (formData: FormData) => {
    formData.append("role", userRole)
    startTransition(async () => {
      try {
        await signup(formData)
      } catch (e: any) {
          setError(e.message || "Something went wrong")
      }
    })
  }

  return (
    <div className="signup-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .signup-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .signup-card {
          display: flex;
          width: 100%;
          max-width: 1050px;
          height: 95vh;
          max-height: 850px;
          background: white;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }

        .left-side {
          width: 50%;
          position: relative;
          color: white;
          background: #000;
        }

        .left-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.75;
        }

        .left-content {
          position: absolute;
          inset: 0;
          padding: 50px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
        }

        .right-side {
          width: 50%;
          padding: 30px 60px;
          display: flex;
          flex-direction: column;
          background: white;
          position: relative;
          overflow-y: auto;
        }

        .top-logo {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 5px;
        }

        .role-switcher {
          display: flex;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 15px;
          align-self: flex-start;
        }

        .role-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.2s;
        }

        .role-btn.active {
          background: white;
          color: #059669;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .role-btn.inactive {
          background: transparent;
          color: #9ca3af;
        }

        .title {
          font-size: 32px;
          font-weight: 800;
          color: #111;
          margin: 0 0 6px 0;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.05em;
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #d1d5db;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          color: #111;
          outline: none;
          transition: 0.2s;
        }

        .input-field:focus {
          background: white;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.05);
        }

        select.input-field {
          appearance: none;
          cursor: pointer;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          color: #d1d5db;
          cursor: pointer;
          background: none;
          border: none;
          display: flex;
          align-items: center;
        }

        .continue-btn {
          width: 100%;
          padding: 16px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 10px;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.3);
        }

        .continue-btn:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 20px;
        }

        .need-help {
          font-size: 12px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          cursor: pointer;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 15px;
          text-align: center;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 850px) {
          .signup-container { padding: 0; }
          .signup-card { flex-direction: column; height: auto; max-height: none; border-radius: 0; }
          .left-side, .right-side { width: 100%; }
          .left-side { height: 220px; }
          .left-content { padding: 30px; }
          .left-content h2 { font-size: 22px !important; margin-bottom: 10px !important; }
          .left-content p { font-size: 14px !important; }
          .right-side { padding: 30px 24px; border-radius: 32px 32px 0 0; margin-top: -32px; z-index: 10; min-height: 500px; }
          .title { font-size: 28px; }
          .subtitle { font-size: 14px; margin-bottom: 20px; }
          .top-logo { position: absolute; top: 30px; right: 24px; margin-bottom: 0; }
          .footer { padding-bottom: 20px; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
        }
      ` }} />

      <div className="signup-card">
        {/* Left Side */}
        <div className="left-side">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
            className="left-image"
            alt="Healthcare"
          />
          <div className="left-content">
            <h2 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px' }}>
              "Join Cure-It and take control of your wellness."
            </h2>
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: '16px' }}>Paityn Korsgaard</p>
              <p style={{ fontSize: '12px', opacity: 0.7, margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Healthcare Advocate</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={18} /></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={18} /></div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>LEARN MORE →</div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="right-side">
          <div className="top-logo">
            <div style={{ background: '#059669', padding: '6px', borderRadius: '8px' }}>
              <HeartPulse size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, color: '#111', fontSize: '18px', letterSpacing: '-0.02em' }}>Cure-It</span>
          </div>

          <div className="role-switcher">
            <button 
              type="button"
              className={`role-btn ${userRole === 'patient' ? 'active' : 'inactive'}`}
              onClick={() => setUserRole('patient')}
            ><User size={14} /> Patient</button>
            <button 
              type="button"
              className={`role-btn ${userRole === 'doctor' ? 'active' : 'inactive'}`}
              onClick={() => setUserRole('doctor')}
            ><Stethoscope size={14} /> Doctor</button>
          </div>

          <h1 className="title">Create Account</h1>
          <p className="subtitle">Join us to manage your health journey.</p>

          <form action={handleSignup} style={{ width: '100%' }}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <div className="label">Full Name</div>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input name="fullName" type="text" className="input-field" placeholder="John Doe" required />
              </div>
            </div>

            <div className="form-group">
              <div className="label">Work Email</div>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input name="email" type="email" className="input-field" placeholder="name@example.com" required />
              </div>
            </div>

            {userRole === 'patient' && (
              <div className="form-row">
                <div className="form-group">
                  <div className="label">Date of Birth</div>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" size={18} />
                    <input name="dob" type="date" className="input-field" required />
                  </div>
                </div>
                <div className="form-group">
                  <div className="label">Blood Group</div>
                  <div className="input-wrapper">
                    <Droplet className="input-icon" size={18} />
                    <select name="bloodGroup" className="input-field" required>
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {userRole === 'doctor' && (
              <div className="form-group">
                <div className="label">Medical License Number</div>
                <div className="input-wrapper">
                  <Award className="input-icon" size={18} />
                  <input name="license" type="text" className="input-field" placeholder="MD123456" required />
                </div>
              </div>
            )}

            <div className="form-group">
              <div className="label">Password</div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  className="input-field" 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="label">Confirm Password</div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"} 
                  className="input-field" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="continue-btn" disabled={isPending}>
              {isPending ? <div className="spinner"></div> : <>Sign Up <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="footer">
            <div className="need-help" onClick={() => window.location.href='/login'}>Already have an account? Sign in</div>
            <div style={{ textAlign: 'right', opacity: 0.4 }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>In Indians We Trust</div>
              <div style={{ height: '2px', width: '40px', background: 'linear-gradient(to right, #FF9933, #000080, #138808)', marginLeft: 'auto' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
