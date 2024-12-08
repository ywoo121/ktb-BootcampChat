const Queue = require('bull');
const { redisHost, redisPort } = require('../config/keys');

const messageQueue = new Queue('messageQueue', {
  redis: {
    host: redisHost,
    port: redisPort,
  },
});

module.exports = messageQueue;