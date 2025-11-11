import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wallet, Send, TrendingUp, Clock, Copy, Check, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API } from '../config';

const Dashboard = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [walletsRes, transactionsRes, statsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/wallet/my-wallets`, { headers }),
        axios.get(`${API}/transaction/history`, { headers }),
        axios.get(`${API}/stats`, { headers }),
        axios.get(`${API}/notifications`, { headers }),
      ]);

      setWallets(walletsRes.data);
      setTransactions(transactionsRes.data.slice(0, 5));
      setStats(statsRes.data);
      setNotifications(notificationsRes.data.slice(0, 3));

      if (walletsRes.data.length > 0) {
        const balanceRes = await axios.get(
          `${API}/wallet/balance?address=${walletsRes.data[0].wallet_address}`,
          { headers }
        );
        setBalance(balanceRes.data.balance);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text" data-testid="dashboard-title">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-400">Manage your blockchain wallet and transactions</p>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 flex items-center gap-2"
          onClick={fetchData}
        >
          <Bell className="h-4 w-4 text-cyan-400" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Balance" value={`${balance.toFixed(2)}`} icon={Wallet} color="text-cyan-400" />
        <StatCard title="Total Blocks" value={stats?.total_blocks || 0} icon={TrendingUp} color="text-blue-400" />
        <StatCard title="Transactions" value={stats?.total_transactions || 0} icon={Send} color="text-purple-400" />
        <StatCard title="Users" value={stats?.total_users || 0} icon={Clock} color="text-green-400" />
      </div>

      {/* Wallet Info */}
      {wallets.length > 0 && (
        <Card className="glass-card border-slate-700 mb-8" data-testid="wallet-info-card">
          <CardHeader>
            <CardTitle>Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-400 mb-2 block">Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 bg-slate-800/50 p-3 rounded-lg font-mono text-sm text-slate-300 overflow-x-auto"
                    data-testid="wallet-address"
                  >
                    {wallets[0].wallet_address}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyAddress(wallets[0].wallet_address)}
                    className="border-slate-700"
                    data-testid="copy-address-button"
                  >
                    {copiedAddress === wallets[0].wallet_address ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Link to="/transactions">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" data-testid="send-money-button">
                  <Send className="mr-2 h-4 w-4" />
                  Send Money
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card className="glass-card border-slate-700 mb-8" data-testid="notifications-card">
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className="p-3 bg-slate-800/40 rounded-lg flex justify-between items-center hover:bg-slate-800/60 transition-colors"
                >
                  <p className="text-slate-200">{n.message}</p>
                  <span className="text-xs text-slate-500">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card border-slate-700" data-testid="recent-transactions-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link to="/transactions">
            <Button variant="outline" size="sm" className="border-slate-700" data-testid="view-all-button">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8" data-testid="no-transactions-message">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.tx_id}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                  data-testid={`transaction-${tx.tx_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.sender_wallet === wallets[0]?.wallet_address
                          ? 'bg-red-500/20'
                          : 'bg-green-500/20'
                      }`}
                    >
                      <Send
                        className={`h-5 w-5 ${
                          tx.sender_wallet === wallets[0]?.wallet_address
                            ? 'text-red-400 rotate-180'
                            : 'text-green-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">
                        {tx.sender_wallet === wallets[0]?.wallet_address ? 'Sent' : 'Received'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        tx.sender_wallet === wallets[0]?.wallet_address
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {tx.sender_wallet === wallets[0]?.wallet_address ? '-' : '+'}
                      {tx.amount.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs ${
                        tx.status === 'confirmed'
                          ? 'text-green-400'
                          : tx.status === 'pending'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {tx.status}
                    </p>
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

/* Reusable components */
const Label = ({ children, className = '' }) => (
  <label className={`text-sm font-medium ${className}`}>{children}</label>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="glass-card border-slate-700">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </CardContent>
  </Card>
);

export default Dashboard;
