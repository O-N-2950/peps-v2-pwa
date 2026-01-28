import { useState, useCallback } from 'react';

/**
 * Hook usePullToRefresh
 * 
 * Gère le Pull-to-refresh (tirer pour actualiser) style iOS/Android
 * 
 * Utilisation :
 * const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
 *   await fetchData();
 * });
 * 
 * <PullToRefresh onRefresh={onRefresh} isRefreshing={isRefreshing}>
 *   <YourContent />
 * </PullToRefresh>
 */

export function usePullToRefresh(refreshFunction) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      await refreshFunction();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      // Délai minimum de 500ms pour l'animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [refreshFunction, isRefreshing]);

  return {
    isRefreshing,
    onRefresh,
  };
}

export default usePullToRefresh;
