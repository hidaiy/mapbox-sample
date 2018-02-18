// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  mapbox: {
    token: 'pk.eyJ1IjoieWhpZGFpIiwiYSI6ImNqNXN2ZXplaDAyenYzM3F3c3VjMzh4aHAifQ.3YUbzfCUj1PoEyVTig0L1Q',
    initialLocation : [139.7369922874633, 35.679585420543944]
  }
};
