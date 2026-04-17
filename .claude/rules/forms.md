# Forms

Stack: **React Hook Form v7 + `Controller`**. No Zod resolver, no Yup.

## Rules

- Always `mode: 'onChange'` in `useForm()` — never `'onBlur'` or `'onSubmit'`
- Always use `Controller` — never use `register()` directly on custom inputs
- Validation via `rules={{}}` on each `Controller` — keep inline, not in a separate schema file
- Form data type defined inline above the component: `type LoginFormData = { ... }`
- Error messages come from `t('...')` — never hardcoded strings

## Pattern

```tsx
type LoginFormData = {
  phoneNumber: string;
  password: string;
};

const LoginForm = () => {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    defaultValues: { phoneNumber: '' },
    mode: 'onChange',
  });

  return (
    <Controller
      name="phoneNumber"
      control={control}
      rules={{
        required: t('login.phoneRequired'),
        validate: value =>
          validatePhoneNumber(value) || t('login.phoneInvalid'),
      }}
      render={({ field: { value, onChange } }) => (
        <PhoneInput value={value} onChangePhone={onChange} />
      )}
    />
  );
};
```

## Zod — runtime only

Zod is installed but only for parsing runtime data (e.g. SSE/WebSocket payloads):

```ts
// ✅ Correct — runtime schema validation
const SSESchema = z.object({ DeviceState: z.string(), ... });
const parsed = SSESchema.parse(rawEvent);

// ❌ Wrong — do not use zodResolver in useForm
useForm({ resolver: zodResolver(schema) });  // not used here
```
