import {Router} from 'mg-bun-router';

let port = process.argv[2] || 3000;
let path = process.argv[3] || './sites';
let router = new Router();

router.static(path);

Bun.serve({
  port: port,
  async fetch(req) {
    return await router.useRoutes(req);
  }
});

console.log('Bun Web Server started, listening on port ' + port);
console.log('Files will be served from ' + path);
