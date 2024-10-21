import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ClarityIcons } from '@clr/icons';
ClarityIcons.add({ "spinner": `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><title>spinner 23</title><rect width="36" height="36" fill-opacity="0"/><circle cx="18" cy="18" r="14.85" fill="none" stroke="#000" stroke-miterlimit="10" stroke-opacity="0.15" stroke-width="2.3"/><path d="M8.24,29.2A14.86,14.86,0,0,1,18,3.15" fill="none" stroke="#007cbb" stroke-miterlimit="10" stroke-width="2.3"/></svg>` });

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
