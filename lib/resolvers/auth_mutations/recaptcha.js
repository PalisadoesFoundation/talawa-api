const axios = require('axios');

module.exports = async (parent, args) => {
  const { recaptchaToken } = args.data;

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    );

    return response.data.success;
  } catch (error) {
    throw error;
  }
};
