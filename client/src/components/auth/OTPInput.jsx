import React, { useRef, useEffect } from 'react';

/**
 * 6-Box OTP Input Component
 * Supports:
 * - Auto-focus & auto-advance to next box
 * - Backspace navigating to previous box
 * - Arrow navigation
 * - Clipboard Paste (automatically fills all 6 digits)
 * - Numeric-only validation
 */
const OTPInput = ({ value = '', onChange, onComplete, disabled = false, autoFocus = true }) => {
  const inputsRef = useRef([]);

  // Split value into array of 6 characters
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, e) => {
    const rawVal = e.target.value;
    const char = rawVal.replace(/\D/g, '').slice(-1); // Only allow last typed single digit

    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Auto-advance to next box if character was entered
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === 6 && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current box is empty, jump to previous box and clear it
        inputsRef.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numericData = pastedData.replace(/\D/g, '').slice(0, 6);

    if (numericData.length > 0) {
      onChange(numericData);
      // Focus on the next empty index or last input
      const nextIndex = Math.min(numericData.length, 5);
      inputsRef.current[nextIndex]?.focus();

      if (numericData.length === 6 && onComplete) {
        onComplete(numericData);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border transition-all duration-150 outline-none
              ${
                isFilled
                  ? 'border-[#F4C542] bg-[#FFF8E8] text-[#252525] shadow-sm'
                  : 'border-[#E9DFC9] bg-white text-[#252525]'
              }
              focus:border-[#F4C542] focus:ring-4 focus:ring-[#F4C542]/20
              disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
};

export default OTPInput;

