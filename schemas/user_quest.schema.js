module.exports = {
  id: { type: 'number', unique: true, index: true },
  userId: { type: 'number', index: true },
  questId: { type: 'number', index: true },
  status: { type: 'string', default: 'in_progress' }, // in_progress, completed, claimed
  progress: { type: 'number', default: 0 },
  startedAt: { type: 'date', default: Date.now },
  completedAt: { type: 'date' },
  claimedAt: { type: 'date' }
};
