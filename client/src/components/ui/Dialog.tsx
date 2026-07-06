import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogContent = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content
      className={cn('modal-panel modal-in', className)}
      onPointerDownOutside={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('.rdp') || 
          target.closest('[data-radix-portal]') || 
          target.closest('.absolute.z-\\[9999\\]')
        ) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="icon-btn dialog__close" aria-label="Đóng cửa sổ">
        <X size={16} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
