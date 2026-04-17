import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Resolver } from 'react-hook-form';

import { [formName]Schema, type [FormName]Values } from './validation';

type [FormName]Props = {
  onSubmit: (values: [FormName]Values) => void;
  defaultValues?: Partial<[FormName]Values>;
};

const [FormName] = ({ onSubmit, defaultValues }: [FormName]Props) => {
  const { t } = useTranslation();
  const { handleSubmit, control, formState: { errors } } = useForm<[FormName]Values>({
    resolver: yupResolver([formName]Schema) as Resolver<[FormName]Values>,
    mode: 'onBlur',
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="[fieldName]"
        render={({ field }) => (
          <TextField
            {...field}
            label={t('[domain].[fieldName].label')}
            error={!!errors.[fieldName]}
            helperText={errors.[fieldName]?.message}
          />
        )}
      />
      <Button type="submit">{t('buttonText.submit')}</Button>
    </form>
  );
};

export default [FormName];
