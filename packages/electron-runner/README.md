#electron-runner

Simple wrapper around `electron` package. Built on `electron-quick-start` boilerplate, but it hides boilerplate code. It's meant to enable run JavaScript code in Electron without writing any electron specific code. You can run for example NodeJS application for purpose of debugging (using Chrome Dev Tools, for example).

Note: this package is running your code in *renderer* Electron process (to allow for access to DOM, dev tools etc.).

```

usage:
```
npm install --save-dev electron-runner
node_modules/.bin/electron-runner PATH_FOR_JS_FILE_YOU_WANT_TO_RUN
```
