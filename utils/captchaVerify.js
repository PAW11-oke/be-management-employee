const { validateCaptcha } = require('../config/captcha');

const verifyCaptcha = async (req, res, next) => {
  if (req.cookies.trustedDevice) {
    return next(); 
  }

  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: 'Captcha is required' });
  }

  const isCaptchaValid = await validateCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Invalid captcha' });
  }

  next();
};

module.exports = verifyCaptcha;
