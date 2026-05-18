import React, { useState } from 'react';
import { Player } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import PlayerCard from '@/components/players/PlayerCard';
import PlayerForm from '@/components/players/PlayerForm';

export default function Players() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => Player.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Player.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Player.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }),
  });

  const handleSubmit = (data) => {
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditingPlayer(null);
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setIsFormOpen(true);
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">סגל שחקנים</h1>
            <p className="text-slate-500 text-xs">{players.length} שחקנים</p>
          </div>
        </div>
      </div>

      <div className="p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש שחקן..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-slate-800/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Players List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">{searchQuery ? 'לא נמצאו שחקנים' : 'הוסף שחקנים לסגל כדי להתחיל'}</p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onUpdate={handleUpdate}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Button */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Button
          onClick={() => { setEditingPlayer(null); setIsFormOpen(true); }}
          className="h-13 px-7 text-base font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-2xl shadow-emerald-900/50 rounded-full border border-emerald-500/50 transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף שחקן
        </Button>
      </motion.div>

      <PlayerForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPlayer(null); }}
        onSubmit={handleSubmit}
        player={editingPlayer}
      />
      </div>
    </div>
  );
}
