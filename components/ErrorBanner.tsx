import React from 'react';

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  return (
    <div className="bg-red-600/90 text-white rounded-lg px-4 py-2 my-2 shadow-lg text-center font-semibold">
      Error: {message}
    </div>
  );
};

export default ErrorBanner; 