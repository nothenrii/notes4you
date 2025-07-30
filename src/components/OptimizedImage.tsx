import React, { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onClick,
  width,
  height
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, [src]);

  if (hasError) {
    return (
      <div className={`optimized-image-error ${className}`}>
        <div className="error-placeholder">
          <span>📷</span>
          <p>Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`optimized-image-container ${className}`}>
      {isLoading && (
        <div className="image-loading-placeholder">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`optimized-image ${isLoading ? 'loading' : 'loaded'}`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
        decoding="async"
        width={width}
        height={height}
        style={{
          display: isLoading ? 'none' : 'block'
        }}
      />
    </div>
  );
};

export default OptimizedImage;