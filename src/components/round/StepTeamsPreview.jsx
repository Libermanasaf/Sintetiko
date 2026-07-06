import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TEAM_COLORS = [
  { header: 'bg-yellow-500', card: 'bg-yellow-400', text: 'text-white' },
  { header: 'bg-blue-700', card: 'bg-blue-600', text: 'text-white' },
  { header: 'bg-orange-600', card: 'bg-orange-500', text: 'text-white' },
  { header: 'bg-yellow-500', card: 'bg-yellow-400', text: 'text-white' },
  { header: 'bg-blue-700', card: 'bg-blue-600', text: 'text-white' },
  { header: 'bg-orange-600', card: 'bg-orange-500', text: 'text-white' },
];

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];

export default function StepTeamsPreview({ teams, players, shuffleTick = 0, onSave, onReshuffle, onTeamsChange }) {

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceTeamIndex = parseInt(source.droppableId);
    const destTeamIndex = parseInt(destination.droppableId);

    if (sourceTeamIndex === destTeamIndex && source.index === destination.index) return;

    const newTeams = teams.map(team => [...team]);
    const [movedPlayerId] = newTeams[sourceTeamIndex].splice(source.index, 1);
    newTeams[destTeamIndex].splice(destination.index, 0, movedPlayerId);

    onTeamsChange(newTeams);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Info Card */}
      <div className="bg-slate-800/80 rounded-2xl p-3.5 sm:p-5 border border-slate-700/50 shadow-sm">
        <p className="text-slate-300 text-center text-xs sm:text-base leading-relaxed">
          הקבוצות נוצרו בהצלחה! גרור שחקנים בין קבוצות או ערבב מחדש
        </p>
      </div>

      {/* Teams Grid — always one column per team, but everything scales down on mobile */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* keyed by shuffleTick — each reshuffle re-runs the entry animation */}
        <motion.div
          key={shuffleTick}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={`grid gap-1.5 sm:gap-4 ${teams.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
        >
          {teams.map((teamPlayerIds, teamIndex) => {
            const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
            const teamRating = teamPlayerIds.reduce((sum, playerId) => {
              const player = players.find(p => p.id === playerId);
              return sum + (player?.rating || 3);
            }, 0);
            const teamAverage = teamPlayerIds.length > 0 ? teamRating / teamPlayerIds.length : 0;

            return (
              <div key={teamIndex} className="space-y-1.5 sm:space-y-3 min-w-0">
                {/* Team Header */}
                <div className={`${color.header} rounded-xl sm:rounded-2xl px-1.5 py-2 sm:p-4 shadow-lg`}>
                  <h3 className={`font-black ${color.text} text-xs sm:text-xl text-center leading-tight truncate`}>
                    {TEAM_NAMES[teamIndex]}
                    <span className="opacity-80"> ({teamAverage.toFixed(1)})</span>
                  </h3>
                </div>

                {/* Players Drop Zone */}
                <Droppable droppableId={String(teamIndex)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-1.5 sm:space-y-3 min-h-[60px] rounded-xl sm:rounded-2xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-700/60 ring-2 ring-emerald-400' : ''
                      }`}
                    >
                      {teamPlayerIds.map((playerId, playerIndex) => {
                        const player = players.find((p) => p.id === playerId);
                        if (!player) return null;

                        return (
                          <Draggable key={playerId} draggableId={playerId} index={playerIndex}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${color.card} rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center gap-1 sm:gap-3 transition-opacity ${
                                  snapshot.isDragging ? 'opacity-70 shadow-2xl scale-105' : ''
                                }`}
                              >
                                {player.image ? (
                                  <img
                                    src={player.image}
                                    alt={player.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/80 shrink-0"
                                  />
                                ) : (
                                  <div className="grid place-items-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/30 ring-2 ring-white/80 shrink-0">
                                    <span className={`${color.text} text-xs sm:text-sm font-black`}>
                                      {player.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <p className={`${color.text} text-[0.65rem] sm:text-base font-bold text-center sm:text-right leading-tight truncate w-full min-w-0`}>
                                  {player.name}
                                </p>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </motion.div>
      </DragDropContext>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onReshuffle}
          variant="outline"
          className="w-full h-14 text-lg border-2 border-blue-700 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300"
        >
          <Shuffle className="w-5 h-5 ml-2" />
          ערבב כוחות מחדש
        </Button>

        <Button
          onClick={onSave}
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl rounded-2xl"
        >
          <Save className="w-6 h-6 ml-3" />
          שמור כוחות
          <ArrowLeft className="w-6 h-6 mr-3" />
        </Button>
      </div>
    </motion.div>
  );
}