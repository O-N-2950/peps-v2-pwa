import React from 'react';
import PullToRefresh from 'react-pull-to-refresh';

/**
 * Composant PullToRefreshWrapper
 * 
 * Wrapper pour ajouter le Pull-to-refresh sur n'importe quelle page
 * 
 * Utilisation :
 * <PullToRefreshWrapper onRefresh={handleRefresh} isRefreshing={isRefreshing}>
 *   <YourPageContent />
 * </PullToRefreshWrapper>
 */

export default function PullToRefreshWrapper({ children, onRefresh, isRefreshing }) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      resistance={3}
      distanceToRefresh={80}
      refreshingContent={
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      }
      pullingContent={
        <div className="flex items-center justify-center py-4 text-purple-600">
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      }
    >
      {children}
    </PullToRefresh>
  );
}
