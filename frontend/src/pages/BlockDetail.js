import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Hash, Clock, Shield, CheckCircle, Layers } from 'lucide-react';

const BlockDetail = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBlockDetail();
  }, [blockId]);

  const fetchBlockDetail = async () => {
    try {
      const response = await axios.get(`${API}/block/${blockId}`);
      setBlockData(response.data);
    } catch (error) {
      toast.error('Failed to load block details');
    } finally {
      setLoading(false);
    }
  };

  const verifyBlock = async () => {
    setVerifying(true);
    try {
      const response = await axios.get(`${API}/blockchain/validate`);
      if (response.data.valid) {
        toast.success('Blockchain is valid!');
      } else {
        toast.error(`Validation failed: ${response.data.issues.length} issues found`);
      }
    } catch (error) {
      toast.error('Failed to verify blockchain');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-cyan-400">Loading block details...</div>
      </div>
    );
  }

  if (!blockData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-400">Block not found</div>
      </div>
    );
  }

  const { block, transactions } = blockData;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="block-detail-page">
      <Button
        variant="ghost"
        onClick={() => navigate('/blockchain')}
        className="mb-6 text-slate-300 hover:text-cyan-400"
        data-testid="back-button"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Blockchain
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text" data-testid="block-title">
          Block #{block.block_number}
        </h1>
        <p className="text-slate-400">{new Date(block.timestamp).toLocaleString()}</p>
      </div>

      {/* Block Header */}
      <Card className="glass-card border-slate-700 mb-6" data-testid="block-header-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            Block Header
          </CardTitle>
          <Button
            onClick={verifyBlock}
            disabled={verifying}
            className="bg-green-600 hover:bg-green-700"
            data-testid="verify-button"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {verifying ? 'Verifying...' : 'Verify Blockchain'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-400">Block Hash</span>
              </div>
              <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-3 rounded break-all" data-testid="block-hash">
                {block.block_hash}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-400">Previous Hash</span>
              </div>
              <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-3 rounded break-all" data-testid="previous-hash">
                {block.previous_hash}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-400">Merkle Root</span>
              </div>
              <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-3 rounded break-all" data-testid="merkle-root">
                {block.merkle_root}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-slate-400">Validator</span>
                </div>
                <span className="text-sm text-slate-300" data-testid="validator">{block.validator}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-slate-400">Nonce</span>
                </div>
                <span className="text-sm text-slate-300" data-testid="nonce">{block.nonce}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="glass-card border-slate-700" data-testid="transactions-card">
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No transactions in this block</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.tx_id}
                  className="border border-slate-700 rounded-lg p-4"
                  data-testid={`transaction-${tx.tx_id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-200">Transaction</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-cyan-400">{tx.amount.toFixed(2)}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">From:</span>
                      <span className="text-slate-300 font-mono text-xs">
                        {tx.sender_wallet.slice(0, 20)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">To:</span>
                      <span className="text-slate-300 font-mono text-xs">
                        {tx.receiver_wallet.slice(0, 20)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TX Hash:</span>
                      <span className="text-slate-300 font-mono text-xs">
                        {tx.tx_hash.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockDetail;
