const axios = require('axios');

const verifyCaptcha = async (req, res, next) => {
  if (req.cookies.trustedDevice) {
    return next(); 
  }

  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: 'Captcha is required' });
  }

  try {
    const secret_key = process.env.CAPTCHA_SECRET_KEY;
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${captchaToken}`;
    
    const response = await axios.post(verificationURL);
    
    if (response.data.success) {
      return next();
    } else {
      return res.status(400).json({ success: false, message: "Captcha verification failed" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error verifying captcha", error: err.message });
  }
};

module.exports = verifyCaptcha;