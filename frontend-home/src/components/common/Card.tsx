 
import { FC, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "rounded-xl shadow-sm transition-all duration-200", 
  {
    variants: {
      variant: {
        default: "bg-white hover:shadow-md",
        featured: "bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg border border-indigo-100",
        highlight: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg",
      },
      padding: {
        none: "",
        default: "p-6",
        large: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    }
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: FC<CardProps> = ({
  children,
  variant,
  padding,
  className = "",
  onClick,
}) => {
  return (
    <div
      className={`${cardVariants({ variant, padding })} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;