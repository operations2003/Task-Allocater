import React from 'react';

export const PageHeader = ({ eyebrow, title, subtitle, actions }) => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-[34px] leading-none text-foreground sm:text-[44px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};
