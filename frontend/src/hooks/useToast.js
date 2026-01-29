import { toast } from 'react-hot-toast';

export const useToast = () => {
  const showToast = (message, type = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        break;
      case 'error':
        toast.error(message, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
        break;
      default:
        toast(message, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#38B2AC',
            color: '#fff',
          },
        });
    }
  };

  return { showToast };
};
