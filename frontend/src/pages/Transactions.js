import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth} from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Send, ArrowUpDown, CheckCircle, Clock, XCircle } from 'lucide-react';
import { API } from '../config';

const Transactions = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendForm, setSendForm] = useState({
    receiverWallet: '',
    amount: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletsRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/wallet/my-wallets`),
        axios.get(`${API}/transaction/history`),
      ]);
      setWallets(walletsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    }
  };

  const handleSendTransaction = async (e) => {
    e.preventDefault();
    
    if (!wallets.length) {
      toast.error('No wallet found');
      return;
    }

    if (!sendForm.receiverWallet || !sendForm.amount) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(sendForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      // Get balance
      const balanceRes = await axios.get(
        `${API}/wallet/balance?address=${wallets[0].wallet_address}`
      );

      if (balanceRes.data.balance < amount) {
        toast.error('Insufficient balance');
        setLoading(false);
        return;
      }

      // Prepare transaction data
      const timestamp = new Date().toISOString();
      const nonce = Date.now();
      
      // Get signature from backend (backend computes hash and signs)
      const signRes = await axios.post(`${API}/transaction/sign`, {
        sender_wallet: wallets[0].wallet_address,
        receiver_wallet: sendForm.receiverWallet,
        amount: amount,
        timestamp: timestamp,
        nonce: nonce,
      });

      // Create transaction with signature
      await axios.post(`${API}/transaction/create`, {
        sender_wallet: wallets[0].wallet_address,
        receiver_wallet: sendForm.receiverWallet,
        amount: amount,
        signature: signRes.data.signature,
        timestamp: timestamp,  // Include timestamp
        nonce: nonce,
      });

      toast.success('Transaction sent successfully! Pending admin approval.');
      setSendForm({ receiverWallet: '', amount: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="transactions-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Transactions</h1>
        <p className="text-slate-400">Send money and view your transaction history</p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="send" data-testid="send-tab">Send Money</TabsTrigger>
          <TabsTrigger value="history" data-testid="history-tab">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card className="glass-card border-slate-700 max-w-2xl" data-testid="send-transaction-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-cyan-400" />
                Send Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label>Receiver Wallet Address</Label>
                  <Input
                    placeholder="Enter receiver wallet address"
                    value={sendForm.receiverWallet}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, receiverWallet: e.target.value })
                    }
                    className="bg-slate-800/50 border-slate-700"
                    data-testid="receiver-wallet-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                    className="bg-slate-800/50 border-slate-700"
                    data-testid="amount-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  data-testid="send-transaction-button"
                >
                  {loading ? 'Sending...' : 'Send Transaction'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="glass-card border-slate-700" data-testid="transaction-history-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-cyan-400" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-center py-8" data-testid="no-transactions-message">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.tx_id}
                      className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/30 transition-colors"
                      data-testid={`transaction-item-${tx.tx_id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(tx.status)}
                          <div>
                            <p className="font-medium text-slate-200">
                              {tx.sender_wallet === wallets[0]?.wallet_address
                                ? 'Sent'
                                : 'Received'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${
                              tx.sender_wallet === wallets[0]?.wallet_address
                                ? 'text-red-400'
                                : 'text-green-400'
                            }`}
                          >
                            {tx.sender_wallet === wallets[0]?.wallet_address ? '-' : '+'}
                            {tx.amount.toFixed(2)}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              tx.status
                            )}`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">From:</span>
                          <span className="text-slate-300 font-mono text-xs">
                            {tx.sender_wallet.slice(0, 16)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">To:</span>
                          <span className="text-slate-300 font-mono text-xs">
                            {tx.receiver_wallet.slice(0, 16)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">TX Hash:</span>
                          <span className="text-slate-300 font-mono text-xs">
                            {tx.tx_hash.slice(0, 16)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transactions;
