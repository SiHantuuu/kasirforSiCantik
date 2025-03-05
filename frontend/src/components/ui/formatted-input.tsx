'use client';

import type React from 'react';
import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormattedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  formatter?: (value: string) => string;
  parser?: (value: string) => string;
  onValueChange?: (value: string) => void;
}

const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  (
    { className, value, onChange, formatter, parser, onValueChange, ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('');

    // Format Rupiah
    const formatRupiah = (value: string) => {
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, '');

      // Format with thousand separators
      if (numericValue === '') return '';
      return new Intl.NumberFormat('id-ID').format(
        Number.parseInt(numericValue)
      );
    };

    // Parse Rupiah format back to number
    const parseRupiah = (value: string) => {
      return value.replace(/\D/g, '');
    };

    // Use provided formatter/parser or default Rupiah formatter/parser
    const formatValue = formatter || formatRupiah;
    const parseValue = parser || parseRupiah;

    useEffect(() => {
      // Format the initial value
      if (value) {
        const stringValue =
          typeof value === 'number' ? value.toString() : value;
        setDisplayValue(formatValue(stringValue));
      }
    }, [value, formatValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Update the display value with formatting
      setDisplayValue(formatValue(inputValue));

      // Parse the value
      const parsedValue = parseValue(inputValue);

      // Call the original onChange with both event and parsed value
      onChange(e, parsedValue);

      // Call onValueChange if provided
      if (onValueChange) {
        onValueChange(parsedValue);
      }
    };

    return (
      <Input
        ref={ref}
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        inputMode="numeric"
        {...props}
      />
    );
  }
);

FormattedInput.displayName = 'FormattedInput';

export { FormattedInput };
