import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Mail, Lock, ShieldCheck, Database, Sparkles, User, Briefcase, Phone } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, setupAdmin, isSetupRequired, seedDemoData } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // First-time setup form state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTitle, setAdminTitle] = useState('Director of Placements');
  const [adminPhone, setAdminPhone] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const isCodespaces = import.meta.env.VITE_CODESPACES === 'true';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      success('Authentication Successful', `Signed in as ${email}`);
      navigate('/dashboard');
    } else {
      error('Authentication Failed', result.error || 'Invalid credentials');
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword) return;

    setIsLoading(true);
    const result = await setupAdmin({
      full_name: adminName,
      email: adminEmail,
      password: adminPassword,
      title: adminTitle,
      phone: adminPhone,
    });
    setIsLoading(false);

    if (result.success) {
      success('Administrator Initialized', `Welcome ${adminName}! Your local portal is ready.`);
      navigate('/dashboard');
    } else {
      error('Initialization Failed', result.error || 'Could not initialize administrator.');
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      success('Demo Records Seeded', 'Loaded 20 synthetic candidates, 5 companies, and jobs. You can now log in.');
    } catch (err: any) {
      error('Seeding Failed', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <img
            src="/vinfonette-logo.png"
            alt="VinfoNette"
            className="h-14 w-auto mx-auto object-contain bg-white p-2 rounded-xl border border-charcoal-200 shadow-sm"
          />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-charcoal-900">
          Placement Management Portal
        </h2>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-brand-600 font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>Private Local-First Operating Mode</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-enterprise rounded-2xl border border-charcoal-200 sm:px-10">
          {isSetupRequired ? (
            /* First-Run Administrator Setup Form */
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-left">
                <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  <span>First-Time Setup Required</span>
                </div>
                <p className="mt-1 text-xs text-brand-700 leading-relaxed">
                  No administrator exists on this computer yet. Create your private local administrator account to initialize this installation.
                </p>
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-3">
                <Input
                  label="Full Name"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  required
                  leftIcon={<User className="w-4 h-4 text-charcoal-400" />}
                />

                <Input
                  label="Administrator Email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@vinfonette.local"
                  required
                  leftIcon={<Mail className="w-4 h-4 text-charcoal-400" />}
                />

                <Input
                  label="Strong Password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  leftIcon={<Lock className="w-4 h-4 text-charcoal-400" />}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Official Title"
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    placeholder="Director"
                    leftIcon={<Briefcase className="w-4 h-4 text-charcoal-400" />}
                  />
                  <Input
                    label="Phone (Optional)"
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+91..."
                    leftIcon={<Phone className="w-4 h-4 text-charcoal-400" />}
                  />
                </div>

                <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full mt-2">
                  Initialize Local Administrator
                </Button>
              </form>

              {!isCodespaces && <div className="pt-4 border-t border-charcoal-100 text-center">
                <p className="text-xs text-charcoal-500 mb-2">Want to evaluate with sample candidates?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSeedDemo}
                  isLoading={isSeeding}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  className="w-full text-xs"
                >
                  Load Demonstration Sample Data
                </Button>
              </div>}
            </div>
          ) : (
            /* Standard Local Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Institutional Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@vinfonette.local"
                required
                leftIcon={<Mail className="w-4 h-4 text-charcoal-400" />}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-charcoal-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    Help
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full rounded-lg border border-charcoal-300 bg-white py-2 pl-9 pr-3 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full">
                Sign In to Portal
              </Button>

              <div className="pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure 127.0.0.1 Loopback</span>
                </div>
                {!isCodespaces && <button
                  type="button"
                  onClick={handleSeedDemo}
                  disabled={isSeeding}
                  className="text-brand-600 hover:underline font-medium"
                >
                  {isSeeding ? 'Seeding...' : 'Reload Demo Data'}
                </button>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
