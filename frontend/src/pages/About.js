import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Zap, Layers, CheckCircle, AlertTriangle } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8" data-testid="about-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text">About BlockBank</h1>
        <p className="text-slate-400">Secure blockchain-powered banking platform</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>
              BlockBank is a revolutionary banking platform built on blockchain technology, offering
              secure, transparent, and decentralized financial transactions.
            </p>
            <p>
              Our platform combines traditional banking features with the security and transparency
              of blockchain, ensuring every transaction is cryptographically verified and
              immutably recorded.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: Lock,
                  title: 'Encrypted Private Keys',
                  description:
                    'All private keys are encrypted using AES-256 with PBKDF2 key derivation.',
                },
                {
                  icon: Shield,
                  title: 'ECDSA Digital Signatures',
                  description:
                    'Transactions are signed using secp256k1 elliptic curve cryptography.',
                },
                {
                  icon: CheckCircle,
                  title: 'SHA-256 Hashing',
                  description:
                    'Block and transaction hashes use industry-standard SHA-256 algorithm.',
                },
                {
                  icon: Zap,
                  title: 'JWT Authentication',
                  description:
                    'Secure token-based authentication with bcrypt password hashing.',
                },
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <feature.icon className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-semibold text-slate-200">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Blockchain Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Block Structure</h3>
                <p className="text-sm text-slate-400">
                  Each block contains: index, previous hash, merkle root, timestamp, nonce, and
                  block hash. Blocks are linked through cryptographic hashes, creating an immutable
                  chain.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Consensus Mechanism</h3>
                <p className="text-sm text-slate-400">
                  Admin-validated blocks ensure fast transaction confirmation without heavy
                  computational mining, suitable for banking applications.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Transaction Validation</h3>
                <p className="text-sm text-slate-400">
                  All transactions are verified for signature authenticity, sufficient balance, and
                  proper formatting before being added to the mempool.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Merkle Trees</h3>
                <p className="text-sm text-slate-400">
                  Transaction integrity is verified using Merkle trees, allowing efficient and
                  secure verification of transaction inclusion in blocks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <span>Never share your wallet address private key with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <span>Use strong, unique passwords for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <span>Verify transaction details before confirming</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <span>Monitor your transaction history regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <span>Contact support immediately if you notice suspicious activity</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
