import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
