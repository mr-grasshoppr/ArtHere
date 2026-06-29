'use client';

import { useState } from 'react';

interface Props {
  email: string;
  label: string;
  className?: string;
}

export function CopyEmail({ email, label, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  function handleClick(e: React.MouseEvent) {
    // Try mailto first; if it fails (no client), fall through to copy
    e.preventDefault();
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    // Also attempt mailto in case a client is configured
    window.location.href = `mailto:${email}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {copied ? `Copied! (${email})` : label}
    </button>
  );
}
