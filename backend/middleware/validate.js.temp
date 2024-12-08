const validateRequest = {
  register(req, res, next) {
    const { name, email, password } = req.body;
    const errors = [];

    // Name validation
    if (!name?.trim()) {
      errors.push({
        field: 'name',
        message: '이름을 입력해주세요.'
      });
    }

    // Email validation
    if (!email?.trim()) {
      errors.push({
        field: 'email',
        message: '이메일을 입력해주세요.'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        message: '올바른 이메일 형식이 아닙니다.'
      });
    }

    // Password validation
    if (!password) {
      errors.push({
        field: 'password',
        message: '비밀번호를 입력해주세요.'
      });
    } else if (password.length < 6) {
      errors.push({
        field: 'password',
        message: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  },

  login(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (!email?.trim()) {
      errors.push({
        field: 'email',
        message: '이메일을 입력해주세요.'
      });
    }

    if (!password) {
      errors.push({
        field: 'password',
        message: '비밀번호를 입력해주세요.'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  }
};

module.exports = validateRequest;
