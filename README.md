# CityBikePortal

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.5.4.

## Getting Started

**Install `nvm`**

Download `nvm` using the [latest installer](https://github.com/coreybutler/nvm/releases).
For more information about how to install check the nvm [documentation](https://github.com/coreybutler/nvm-windows).

**Install `node`**

```cmd
nvm install 14.21.3
nvm use 14.21.3 ```

**Install npm packages using `npm install`**

```cmd
npm install
```

## Development server

Run `npx ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `npx ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npx ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `npx ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `npx ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Setup guidelines

Please refer [setup guidelines] (https://docs.google.com/document/d/1adDCMb_rMoYDlYDYAcjvzO6c8BDthgtEyb1U6eVGt_g/edit#heading=h.qxxrt2npykld) for more details.

## Bug fixes in node modules 
[mat-select] Maximum call stack size exceeded in select with 1000+ options 
https://github.com/angular/components/issues/12504

please add the following if comtdition to fix above issue in ~\node_modules\@angular\material\esm5\select.es5.js line 1176
   if (wasSelected !== option.selected) {
        option.selected ? this._selectionModel.select(option) : this._selectionModel.deselect(option);
   }
https://github.com/angular/components/pull/17062/commits/67bb6cf5e2d8be36b0876bafdbb392ba770403de