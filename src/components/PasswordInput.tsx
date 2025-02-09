import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
}

export default function PasswordInput({ value, onChange, name = 'password', required = true }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    number: false,
    special: false,
    capital: false,
  });

  const calculateStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      capital: /[A-Z]/.test(password),
    };

    setRequirements(checks);

    if (checks.length) score += 25;
    if (checks.number) score += 25;
    if (checks.special) score += 25;
    if (checks.capital) score += 25;

    setStrength(score);
  };

  useEffect(() => {
    calculateStrength(value);
  }, [value]);

  const getStrengthColor = () => {
    if (strength <= 25) return 'bg-red-500';
    if (strength <= 50) return 'bg-orange-500';
    if (strength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMaskedPassword = () => {
    if (!value) return '';
    if (value.length <= 6) return value;
    return value.substring(0, 6) + '*'.repeat(value.length - 6);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
          required={required}
          aria-describedby="password-requirements"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[calc(50%-8px)] text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Strength bar */}
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {/* Requirements checklist */}
      <div className="text-sm space-y-1" id="password-requirements">
        <div className="flex items-center space-x-2">
          {requirements.length ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={requirements.length ? "text-green-700" : "text-red-700"}>
            At least 8 characters
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {requirements.number ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={requirements.number ? "text-green-700" : "text-red-700"}>
            Contains a number
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {requirements.special ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={requirements.special ? "text-green-700" : "text-red-700"}>
            Contains a special character
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {requirements.capital ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={requirements.capital ? "text-green-700" : "text-red-700"}>
            Contains an uppercase letter
          </span>
        </div>
      </div>
    </div>
  );
}