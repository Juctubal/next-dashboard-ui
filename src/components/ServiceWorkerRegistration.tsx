'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/registerServiceWorker';

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // This component doesn't render anything
  return null;
};

export default ServiceWorkerRegistration;
