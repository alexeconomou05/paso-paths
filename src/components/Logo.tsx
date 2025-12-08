interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl'
};

export const Logo = ({ className = "", size = 'lg' }: LogoProps) => {
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`font-bold ${sizeClass} ${className} transition-transform hover:scale-105`}>
      <span className="bg-gradient-to-r from-primary via-cta to-accent bg-clip-text text-transparent">
        GoHire
      </span>
    </div>
  );
};

export default Logo;
