'use client';

import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { inputClass } from './Fields';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  /** Called when the user leaves the field (or presses Enter) and the text changed. */
  onCommit: (text: string) => unknown;
}

/**
 * A text/number input for settings tables: the value is saved when the user finishes editing,
 * so there is no Save button per row.
 */
export function CommitInput({ value, onCommit, className, ...rest }: Props) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      className={cn(inputClass, 'py-2', className)}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== String(value)) void onCommit(text);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setText(String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      {...rest}
    />
  );
}
