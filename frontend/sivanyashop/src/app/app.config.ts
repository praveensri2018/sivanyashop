import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })]
};


export const AppConfig = {
  //apiBase: 'http://localhost:3000',   // 👈 your backend API
  apiBase: 'http://api.sivanyatrendstops.com', 
  appName: 'SivanuyaShop',
  version: '1.0.0'
};