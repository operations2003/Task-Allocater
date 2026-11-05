import React from 'react';
import { PRIORITY_STYLES } from '../../constants/neraTheme.js';

export const PriorityIndicator = ({ priority = 'Low', className = '' }) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] ${style.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{priority}</span>
    </span>
  );
};
