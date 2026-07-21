import React from 'react';
import DayListView from '@/components/DayListView';

// One-off extra game day (Tuesday 21.7). Same generic view as the other days;
// safe to delete together with the rest of the one-off Tuesday feature.
export default function DayListTuesday() {
  return <DayListView day="tuesday" />;
}
