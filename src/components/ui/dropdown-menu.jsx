import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    className={`
      min-w-[8rem]
      overflow-hidden
      rounded-md
      border
      bg-white
      p-1
      shadow-md
      animate-in
      data-[side=bottom]:slide-in-from-top-2
      data-[side=top]:slide-in-from-bottom-2
      ${className}
    `}
    {...props}
  />
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`
      relative
      flex
      cursor-pointer
      select-none
      items-center
      rounded-sm
      px-2
      py-1.5
      text-sm
      outline-none
      transition-colors
      hover:bg-gray-100
      focus:bg-gray-100
      ${className}
    `}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}; 