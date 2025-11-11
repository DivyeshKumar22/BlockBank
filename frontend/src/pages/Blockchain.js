import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Layers, ArrowRight, Hash, Clock, Shield } from 'lucide-react';

const Blockchain = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlocks();
  }, [page]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/blockchain/view?page=${page}&limit=10`);
      setBlocks(response.data);
    } catch (error) {
      toast.error('Failed to load blockchain');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-cyan-400">Loading blockchain...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="blockchain-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Blockchain Ledger</h1>
        <p className="text-slate-400">Explore the immutable transaction history</p>
      </div>

      <div className="space-y-4">
        {blocks.length === 0 ? (
          <Card className="glass-card border-slate-700">
            <CardContent className="py-12 text-center text-slate-400" data-testid="no-blocks-message">
              No blocks in the blockchain yet
            </CardContent>
          </Card>
        ) : (
          blocks.map((block, index) => (
            <Card
              key={block.block_id}
              className="glass-card border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
              onClick={() => navigate(`/block/${block.block_id}`)}
              data-testid={`block-card-${block.block_id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl">
                      <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-100" data-testid={`block-number-${block.block_id}`}>
                        Block #{block.block_number}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {new Date(block.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    data-testid={`view-block-button-${block.block_id}`}
                  >
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-slate-400">Block Hash</span>
                      </div>
                      <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-2 rounded break-all">
                        {block.block_hash}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-400">Previous Hash</span>
                      </div>
                      <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-2 rounded break-all">
                        {block.previous_hash}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-slate-400">Merkle Root</span>
                      </div>
                      <p className="font-mono text-xs text-slate-300 bg-slate-800/50 p-2 rounded break-all">
                        {block.merkle_root}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-400">Validator:</span>
                        <span className="text-sm text-slate-300">{block.validator}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-slate-400">Nonce:</span>
                        <span className="text-sm text-slate-300">{block.nonce}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {blocks.length > 0 && (
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            className="border-slate-700"
            data-testid="prev-page-button"
          >
            Previous
          </Button>
          <span className="flex items-center text-slate-400">Page {page}</span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={blocks.length < 10}
            variant="outline"
            className="border-slate-700"
            data-testid="next-page-button"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Blockchain;
