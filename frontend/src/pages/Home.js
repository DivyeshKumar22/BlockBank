import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Lock, Users, TrendingUp, Layers } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-2xl">
                <Layers className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6" data-testid="hero-title">
              Welcome to <span className="gradient-text">BlockBank</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8">
              Secure, transparent, and decentralized banking powered by blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
                  data-testid="get-started-button"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg font-semibold rounded-xl"
                  data-testid="login-button"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text" data-testid="features-title">
          Why Choose BlockBank?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Secure Transactions',
              description: 'Every transaction is cryptographically signed and verified using ECDSA digital signatures.',
              color: 'from-cyan-500 to-blue-600',
            },
            {
              icon: Lock,
              title: 'Encrypted Wallets',
              description: 'Private keys are encrypted with AES-256 and never stored in plain text.',
              color: 'from-blue-500 to-purple-600',
            },
            {
              icon: Layers,
              title: 'Blockchain Ledger',
              description: 'Transparent and immutable transaction history stored on the blockchain.',
              color: 'from-purple-500 to-pink-600',
            },
            {
              icon: Zap,
              title: 'Fast Processing',
              description: 'Admin-validated blocks ensure quick transaction confirmation without heavy mining.',
              color: 'from-green-500 to-teal-600',
            },
            {
              icon: Users,
              title: 'User Management',
              description: 'Robust role-based access control with admin oversight.',
              color: 'from-orange-500 to-red-600',
            },
            {
              icon: TrendingUp,
              title: 'Real-time Stats',
              description: 'Monitor network activity, blocks, and transactions in real-time.',
              color: 'from-pink-500 to-rose-600',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-2xl hover:scale-105 transition-transform animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`feature-card-${index}`}
            >
              <div className={`bg-gradient-to-br ${feature.color} p-3 rounded-xl w-fit mb-4`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="glass-card p-12 rounded-3xl text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 gradient-text">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users experiencing the future of banking
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-6 text-lg font-semibold rounded-xl"
              data-testid="cta-register-button"
            >
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
