'use client';

import React from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

/**
 * OtpInput Component
 *
 * Componente de entrada para códigos OTP de 6 dígitos.
 * Integra com shadcn/ui InputOTP para interface profissional.
 *
 * Props:
 * - value: valor atual do OTP (ex: "123456")
 * - onChange: callback chamado quando usuário digita
 * - disabled: desabilita entrada
 * - error: mostra estado de erro
 * - placeholder: texto de dica
 */

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  error = false,
  placeholder = '000000',
}: OtpInputProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={onChange}
        disabled={disabled}
        render={({ slots }) => (
          <InputOTPGroup className="gap-2 justify-center">
            {slots.map((slot, index) => (
              <InputOTPSlot
                key={index}
                {...slot}
                className={`
                  h-14 w-12 rounded-lg border-2 text-center text-lg font-mono
                  transition-all duration-200
                  ${
                    error
                      ? 'border-red-500/50 bg-red-950/20 text-red-400'
                      : 'border-emerald-500/30 bg-slate-900/50 text-emerald-400'
                  }
                  ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-emerald-500/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }
                `}
              />
            ))}
          </InputOTPGroup>
        )}
      />

      {/* Texto auxiliar com placeholder */}
      {placeholder && !value && (
        <p className="text-center text-xs text-slate-500 font-mono">
          {placeholder}
        </p>
      )}

      {/* Hint de contador */}
      <div className="text-center text-xs text-slate-500">
        {value.length} / 6 dígitos
      </div>
    </div>
  );
}

export default OtpInput;
