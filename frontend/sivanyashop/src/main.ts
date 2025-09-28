// -> Place this exact file at: src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { appConfig } from './app/app.config';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

bootstrapApplication(AppComponent, {
  // keep whatever you already had in appConfig, but merge/append providers needed for HTTP + router
  ...appConfig,
  providers: [
    // preserve existing providers from appConfig if any
    ...(appConfig.providers ?? []),

    // set up router (required if not already provided)
    provideRouter(routes),

    // provide HttpClient and tell Angular to use any DI-registered interceptors
    provideHttpClient(withInterceptorsFromDi()),

    // register your interceptor class so withInterceptorsFromDi() finds it
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
  .catch((err) => console.error(err));
