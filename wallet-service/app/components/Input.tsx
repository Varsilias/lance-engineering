import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-black mb-1">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-400 ${
          error ? 'border-red-600' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
