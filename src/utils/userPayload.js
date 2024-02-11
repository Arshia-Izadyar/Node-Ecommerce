const { accessTokenKey, refreshTokenKey } = require("../constants/constants");

module.exports = function (user) {
  return {
    accessToken: {
      userId: user.user_uuid,
      role: user.roles,
      type: accessTokenKey,
      id: user.id,
    },
    refreshToken: {
      userId: user.user_uuid,
      role: user.roles,
      type: refreshTokenKey,
    },
  };
};
