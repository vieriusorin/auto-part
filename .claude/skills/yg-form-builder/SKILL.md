---
name: yg-form-builder
description: >
  Creating forms in Autocare mobile app.
  React Hook Form v7 + Controller. No Zod resolver, no Yup.
  mode: 'onChange'. Manual inline validation rules. i18next for error messages.
allowed-tools: [Bash, Write, Read, Glob]
---

# YG Form Builder

## Non-obvious rules

- Validation: **manual `rules={{}}` on each `Controller`** — not Zod, not Yup
- Always `mode: 'onChange'` in `useForm()` — never `'onBlur'`
- Custom inputs require `Controller` — never use `register()` directly
- Error messages via `t('key')` — never hardcoded strings
- Zod is in the project for **runtime data parsing only** (SSE schemas) — not for forms
- Form type defined inline above the component: `type MyFormData = { ... }`

## Before You Write Any Code

Read an existing similar form first:

```
1. Glob: src/components/login/LoginForm.tsx (canonical reference)
   or: src/components/forgotPassword/RequestPasswordResetForm.tsx
2. Read it — copy: how Controller wraps custom inputs, how rules are structured,
   how errors are displayed, how t() is used for error messages
```

## Form Pattern

```tsx
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Pressable, Text, View } from 'react-native';

import { PhoneInput } from '@/components/ui/phone-input';

type LoginFormData = {
  phoneNumber: string;
  password: string;
};

export const LoginForm = () => {
  const { t } = useTranslation();
  const loginMutation = useLoginUser();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    defaultValues: { phoneNumber: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (_error) {
      // show toast or error state
    }
  };

  return (
    <>
      <Controller
        name="phoneNumber"
        control={control}
        rules={{
          required: t('login.phoneRequired'),
          validate: value =>
            isValidPhoneNumber(value) || t('login.phoneInvalid'),
        }}
        render={({ field: { value, onChange } }) => (
          <View>
            <PhoneInput value={value} onChangePhone={onChange} />
            {errors.phoneNumber && (
              <Text className="text-sm text-error-500">
                {errors.phoneNumber.message}
              </Text>
            )}
          </View>
        )}
      />

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid || loginMutation.isPending}
      >
        <Text>{t('login.submit')}</Text>
      </Pressable>
    </>
  );
};
```

## Multi-step Forms

Use `FormProvider` from react-hook-form and share `useFormContext()` across steps:

```tsx
// OnboardingFormProvider.tsx — wraps the multi-step flow
const OnboardingFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const methods = useForm<OnboardingFormData>({ mode: 'onChange' });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

// In each step component:
const { control, formState } = useFormContext<OnboardingFormData>();
```

See `src/screens/Onboarding/OnboardingFormProvider.tsx` for the reference pattern.

## Validation Rules Patterns

```tsx
// Required
rules={{ required: t('field.required') }}

// Min length
rules={{
  required: t('field.required'),
  minLength: { value: 8, message: t('field.minLength', { count: 8 }) },
}}

// Custom validator
rules={{
  validate: value => isValid(value) || t('field.invalid'),
}}

// Multiple validators
rules={{
  required: t('field.required'),
  validate: {
    format: v => isValidFormat(v) || t('field.badFormat'),
    uniqueness: v => isUnique(v) || t('field.duplicate'),
  },
}}
```

## Checklist

- [ ] `mode: 'onChange'` in `useForm()`
- [ ] `Controller` wraps every custom input
- [ ] Error messages via `t()` — no hardcoded strings
- [ ] `isValid` + `isPending` used for submit button disabled state
- [ ] `handleSubmit` wraps async `onSubmit` with try/catch
- [ ] Form data type defined as `type` (not `interface`)
- [ ] New translation keys added to both `ro.json` and `en.json`
