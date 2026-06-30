import React, { useState } from 'react';
import { Player } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PlayerCard from '@/components/players/PlayerCard';
import { useMvpCounts } from '@/lib/useMvpCounts';
import PlayerForm from '@/components/players/PlayerForm';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function Players() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mvpCounts = useMvpCounts();
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
    <div className="pb-10">
      <PageHeader
        icon={Users}
        title="סגל שחקנים"
        subtitle={`${players.length} שחקנים`}
        accent="emerald"
        right={
          <button
            onClick={() => { setEditingPlayer(null); setIsFormOpen(true); }}
            aria-label="הוסף שחקן"
            className="grid place-items-center w-11 h-11 rounded-xl st-foil shadow-[0_6px_18px_-6px_rgba(212,160,40,0.6)] active:scale-95 transition-transform shrink-0"
          >
            <Plus className="w-5 h-5" strokeWidth={2.8} />
          </button>
        }
      />

      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש שחקן..."
            aria-label="חיפוש שחקן"
            className="w-full h-12 pr-10 pl-4 rounded-xl bg-slate-900/70 ring-1 ring-white/10 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-amber-400/50 transition-all"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'לא נמצאו שחקנים' : 'הסגל ריק'}
            hint={searchQuery ? 'נסה חיפוש אחר.' : 'הוסף את השחקן הראשון כדי להתחיל לבנות את הסגל.'}
          />
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  mvpCount={mvpCounts[player.id]}
                  onUpdate={handleUpdate}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onEdit={handleEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

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
