'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: ReactNode;
}

export function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button isLoading={isLoading} {...props}>
      {children}
    </Button>
  );
}
