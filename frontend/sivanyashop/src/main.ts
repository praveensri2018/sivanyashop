// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { AuthInterceptor } from './app/auth/auth.interceptor';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

bootstrapApplication(AppComponent, {
  // reuse providers from appConfig and append HTTP providers only
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),                 // preserve existing app providers (router, sw, etc.)
    provideHttpClient(withInterceptorsFromDi()),    // provide HttpClient and pick up DI interceptors
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // register interceptor
  ]
})
.catch((err) => console.error(err));
