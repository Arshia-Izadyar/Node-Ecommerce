const { setValueToRedis, getValueFromRedis } = require("./redis");

function generateOtpCode() {
  var minm = 100000;
  var maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}

async function sendOtp(phone_number) {
  let oldOtp = await getValueFromRedis(`otp_${phone_number}`);
  if (oldOtp) {
    return -1;
  }

  let newOtp = generateOtpCode();

  let ok = await setValueToRedis({
    key: `otp_${phone_number}`,
    value: newOtp,
    duration: process.env.OPT_DURATION,
  });

  if (ok) {
    return newOtp;
  }
  return 0;
}

module.exports = { sendOtp, generateOtpCode };
