import React from 'react';
import { STATUS_STYLES } from '../../constants/neraTheme.js';

export const StatusPill = ({ status = 'Pending', className = '' }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${style} ${className}`}
    >
      {status}
    </span>
  );
};

