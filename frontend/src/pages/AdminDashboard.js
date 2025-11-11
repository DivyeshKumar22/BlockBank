import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Layers, CheckCircle, TrendingUp, Bell, Mail } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  // ✅ Auth Header Helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in as admin');
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ✅ Fetch Users + Stats
  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/stats`, { headers }),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load admin data');
    }
  };

  // ✅ Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API}/notifications`, { headers });
      setNotifications(response.data || []);
      toast.success('Notifications updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to load notifications');
    }
  };

  // ✅ Approve Transactions
  const approveTransactions = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`${API}/admin/approve-transactions`, {}, { headers });
      toast.success(res.data.message || 'Transactions approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve transactions');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Validate Blockchain
  const validateBlockchain = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/blockchain/validate`, { headers });
      if (res.data.valid) {
        toast.success(`Blockchain is valid! ${res.data.total_blocks} blocks verified.`);
      } else {
        toast.error(
          `Validation failed: ${res.data.issues.length} issues found. ${res.data.issues[0]}`
        );
      }
    } catch (error) {
      toast.error('Failed to validate blockchain');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Separate messages
  const contactMessages = notifications.filter((n) => n.user_id === null);
  const userNotifications = notifications.filter((n) => n.user_id !== null);

  // ✅ Latest contact submission (if any)
  const latestContact = contactMessages.length > 0 ? contactMessages[0] : null;
  let latestContactBox = null;
  if (latestContact) {
    const match = latestContact.message.match(/from (.+) \((.+)\): (.+)/);
    if (match) {
      const [, name, email, messageText] = match;
      latestContactBox = (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-cyan-700/30 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-xl font-semibold text-cyan-400 mb-1">{name}</h3>
          <p className="text-sm text-slate-400 mb-3">{email}</p>
          <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-slate-200">
            {messageText}
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>{new Date(latestContact.timestamp).toLocaleString()}</span>
            <span className="bg-cyan-500/10 text-cyan-300 px-3 py-0.5 rounded-full border border-cyan-700/30">
              New
            </span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-dashboard-page">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">Admin Dashboard</h1>
          <p className="text-slate-400">
            Manage users, blockchain, and contact form submissions
          </p>
        </div>
        <Button
          onClick={fetchNotifications}
          className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
        >
          <Bell className="h-4 w-4 text-cyan-400" />
          Refresh Notifications
        </Button>
      </div>

      {/* 👇 Welcome & Latest Contact Boxes */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {/* Welcome Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-cyan-700/30 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:-translate-y-1 transition-all duration-300">
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Welcome Admin!</h2>
          <p className="text-slate-300 text-base">You have successfully logged in 🎉</p>
          <p className="mt-4 text-sm text-slate-500">{new Date().toLocaleString()}</p>
        </div>

        {/* Latest Contact Submission */}
        {latestContactBox ? (
          latestContactBox
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 text-slate-400 flex flex-col justify-center items-center">
            <Mail className="h-8 w-8 text-slate-500 mb-2" />
            <p>No new contact submissions yet 📭</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Users', icon: <Users className="h-5 w-5 text-cyan-400" />, value: stats?.total_users || 0 },
          { title: 'Total Blocks', icon: <Layers className="h-5 w-5 text-blue-400" />, value: stats?.total_blocks || 0 },
          { title: 'Transactions', icon: <TrendingUp className="h-5 w-5 text-purple-400" />, value: stats?.total_transactions || 0 },
          { title: 'Registered Users', icon: <CheckCircle className="h-5 w-5 text-green-400" />, value: users.length },
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Notifications */}
      <Card className="glass-card border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-300">
            <Bell className="h-5 w-5 text-cyan-400" />
            User Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userNotifications.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No user notifications</p>
          ) : (
            <div className="space-y-3">
              {userNotifications.map((n) => (
                <div
                  key={n.notification_id}
                  className={`flex justify-between items-center p-3 rounded-lg border border-slate-700 ${
                    n.status === 'unread' ? 'bg-slate-800/50' : 'bg-slate-900/30'
                  }`}
                >
                  <p className="text-slate-300">{n.message}</p>
                  <span className="text-xs text-slate-500">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Submissions */}
      <Card className="border border-cyan-700/30 bg-slate-900/40 backdrop-blur-lg shadow-lg mb-8 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-cyan-300 text-2xl font-semibold">
            <Mail className="h-6 w-6 text-cyan-400" />
            Contact Form Submissions
          </CardTitle>
          <p className="text-slate-400 text-sm mt-1">
            Messages sent from the <span className="text-cyan-400 font-medium">Contact Us</span> page appear here.
            Each card shows who sent it, their email, and their message.
          </p>
        </CardHeader>
        <CardContent>
          {contactMessages.length === 0 ? (
            <p className="text-slate-400 text-center py-8 italic text-lg">
              No contact messages received yet 📭
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {contactMessages.map((msg) => {
                const match = msg.message.match(/from (.+) \((.+)\): (.+)/);
                if (match) {
                  const [, name, email, messageText] = match;
                  return (
                    <div
                      key={msg.notification_id}
                      className="flex flex-col justify-between p-6 rounded-2xl border border-cyan-700/40 bg-gradient-to-br from-slate-800/80 to-slate-900/60 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:-translate-y-1 transition-all duration-300"
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-cyan-400 mb-1">{name}</h3>
                        <p className="text-sm text-slate-400 mb-4">{email}</p>
                        <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-4 text-slate-200 text-base leading-relaxed min-h-[100px] overflow-y-auto">
                          {messageText}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-5 text-xs text-slate-500">
                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        <span className="bg-cyan-500/10 text-cyan-300 px-3 py-0.5 rounded-full border border-cyan-700/30">
                          New Message
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.notification_id}
                    className="p-6 rounded-2xl border border-slate-700 bg-slate-800/40 text-slate-200"
                  >
                    {msg.message}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="glass-card border-slate-700 mb-8">
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={approveTransactions}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Approve Pending Transactions'}
            </Button>
            <Button
              onClick={validateBlockchain}
              disabled={loading}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600/10"
            >
              <Layers className="mr-2 h-4 w-4" />
              Validate Blockchain
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            Use these actions to manage pending transactions and verify blockchain integrity.
          </p>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="glass-card border-slate-700">
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-200">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
