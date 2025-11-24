const Logo = ({ className = "text-4xl" }: { className?: string }) => {
  return (
    <div className={`font-bold ${className}`}>
      <span className="relative inline-block">
        <span className="relative">
          G
          <svg 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-accent" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </span>
        oHire
      </span>
    </div>
  );
};

export default Logo;
