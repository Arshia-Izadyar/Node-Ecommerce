const redisClient = require("./redis");

async function setValueToRedis({ key, value, duration }) {
  const client = await redisClient();
  if (duration) {
    let ok = await client.set(key, value, { EX: duration * 60 });
    return ok === "OK" ? true : false;
  }
  let ok = await client.set(key, value, { EX: duration * 60 });
  return ok === "OK" ? true : false;
}

async function getValueToRedis({ key }) {
  const client = await redisClient();

  let value = await client.get(key);
  return value;
}
