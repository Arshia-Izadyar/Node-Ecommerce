const redis = require("redis");

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient({
      username: "",
      password: "a123",
      socket: {
        host: "localhost",
        port: 6379,
      },
    });
    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    console.log("redis hit");
    await redisClient.connect();
  }
  return redisClient;
}

async function setValueToRedis({ key, value, duration }) {
  const client = await getRedisClient();

  if (duration === 0) {
    let delOk = await client.del(key);
    return delOk === 1;
  }

  const options = duration ? { EX: duration * 60 } : { EX: 60 * 60 };

  let ok = await client.set(key, value, options);
  return ok === "OK";
}

async function getValueFromRedis(key) {
  const client = await getRedisClient();
  let value = await client.get(key);
  console.log(value);
  return value;
}

module.exports = { getRedisClient, setValueToRedis, getValueFromRedis };
