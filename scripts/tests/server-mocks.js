const auth = `createShopifyAuth({
  async afterAuth(ctx) {
    const { shop, accessToken } = ctx.session;
    ctx.redirect("/");
  }
})`;

const transformedAuth = `createShopifyAuth({
  async afterAuth(ctx) {
    const {
      shop,
      accessToken
    } = ctx.session;
    server.context.client = await handlers.createClient(shop, accessToken);
    await handlers.getSubscriptionUrl(ctx);
  }

});`;

const server = `import * as handlers from "./handlers/index";
const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;

dotenv.config();
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(
    createShopifyAuth({
      scopes: ["read_products", "write_products"],

      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        ctx.redirect("/");
      }
    })
  );
  router.get("*", verifyRequest(), async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
});`;

const transformedWithWebhooksandEnv = `import * as handlers from "./handlers/index";
const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY
} = process.env;
import { receiveWebhook } from '@shopify/koa-shopify-webhooks';

dotenv.config();
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  const webhook = receiveWebhook({
    secret: SHOPIFY_API_SECRET_KEY
  });

  server.use(createShopifyAuth({
    scopes: ["read_products", "write_products"],

    async afterAuth(ctx) {
      const {
        shop,
        accessToken
      } = ctx.session;
      await handlers.registerWebhooks(shop, accessToken, 'TEST_TYPE', '/webhooks/test/type');

      ctx.redirect("/");
    }

  }));
  router.post('/webhooks/test/type', webhook, ctx => {
    console.log('received webhook: ', ctx.state.webhook);
  });

  router.get("*", verifyRequest(), async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
});`;

const transformedWithMoreWebhooks = `import * as handlers from "./handlers/index";
const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY
} = process.env;
import { receiveWebhook } from '@shopify/koa-shopify-webhooks';
dotenv.config();
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  const webhook = receiveWebhook({
    secret: SHOPIFY_API_SECRET_KEY
  });
  server.use(createShopifyAuth({
    scopes: ["read_products", "write_products"],

    async afterAuth(ctx) {
      const {
        shop,
        accessToken
      } = ctx.session;
      await handlers.registerWebhooks(shop, accessToken, 'TEST_TWO', '/webhooks/test/two');

      await handlers.registerWebhooks(shop, accessToken, 'TEST_TYPE', '/webhooks/test/type');
      ctx.redirect("/");
    }

  }));
  router.post('/webhooks/test/type', webhook, ctx => {
    console.log('received webhook: ', ctx.state.webhook);
  });
  router.post('/webhooks/test/two', webhook, ctx => {
    console.log('received webhook: ', ctx.state.webhook);
  });

  router.get("*", verifyRequest(), async ctx => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
});`;

const scopes = `scopes: ["read_products", "write_products"];`;

module.exports = {
  transformedWithMoreWebhooks,
  transformedWithWebhooksandEnv,
  server,
  auth,
  transformedAuth,
  scopes
};
