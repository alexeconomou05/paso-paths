import { Link } from 'react-router-dom';

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
    <Link to="/" className={`font-bold ${sizeClass} ${className} transition-transform hover:scale-105 no-underline`}>
      <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-text)' }}>
        GoHire
      </span>
    </Link>
  );
};

export default Logo;
