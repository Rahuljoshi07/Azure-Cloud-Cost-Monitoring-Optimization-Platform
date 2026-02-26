const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email`);
        }
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }

      if (rules.type === 'number' && isNaN(Number(value))) {
        errors.push(`${field} must be a number`);
      }

      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 }
};

const registerSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
  full_name: { required: true, minLength: 2, maxLength: 255 }
};

const budgetSchema = {
  name: { required: true, minLength: 2, maxLength: 255 },
  amount: { required: true, type: 'number', min: 0 },
  period: { required: true, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] }
};

module.exports = { validate, loginSchema, registerSchema, budgetSchema };
