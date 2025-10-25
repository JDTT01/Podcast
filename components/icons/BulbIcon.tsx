import React from 'react';

export const BulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a7 7 0 0 0-7 7c0 3.03 1.09 5.43 3 6.92V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.08c1.91-1.49 3-3.89 3-6.92a7 7 0 0 0-7-7z" />
    <path d="M10 22h4" />
  </svg>
);
