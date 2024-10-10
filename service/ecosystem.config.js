const { PORTS, ENVS } = require('@ebazdev/core');

module.exports = {
  apps: [
    {
      name: "total-integration",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "cluster",
      env_development: {
        NODE_ENV: "development",
        PORT: PORTS.DEV.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `total-integration-service-${process.env.PM2_INSTANCE_ID}` : 'total-integration-service',
        ...ENVS.DEV,
        TOTAL_USERNAME: "bazaar",
        TOTAL_PASSWORD: "M8@46jkljkjkljlk#$2024TD",
        TOTAL_BASE_URI: "http://103.229.178.41:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST",
        TOTAL_CUSTOMER_ID: "66f12d655e36613db5743430"
      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `total-integration-service-${process.env.PM2_INSTANCE_ID}` : 'total-integration-service',
        ...ENVS.STAG,
        TOTAL_USERNAME: "bazaar",
        TOTAL_PASSWORD: "M8@46jkljkjkljlk#$2024TD",
        TOTAL_BASE_URI: "http://103.229.178.41:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST",
        TOTAL_CUSTOMER_ID: "66f12d655e36613db5743430"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `total-integration-service-${process.env.PM2_INSTANCE_ID}` : 'total-integration-service',
        ...ENVS.PROD,
        TOTAL_USERNAME: "bazaar",
        TOTAL_PASSWORD: "M8@46jkljkjkljlk#$2024TD",
        TOTAL_BASE_URI: "http://103.229.178.41:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST",
        TOTAL_CUSTOMER_ID: "66f12d655e36613db5743430"
      },
    },
  ],
};
