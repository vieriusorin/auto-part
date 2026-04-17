// Real example from: apps/tenant-ksa/src/app/pages/withdrawals/components/filtersForm/index.tsx
// Pattern: Yup schema, InferType, yupResolver, Controller, error display
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Resolver } from 'react-hook-form';

const formSchema = yup.object({
  status: yup.mixed<WithdrawalStatus>().nullable().optional(),
  searchValue: yup.string().nullable().optional(),
  dates: yup
    .array()
    .of(yup.date().required())
    .nullable()
    .test('dates-validation', '', function (value) {
      if (!value || value.length === 0) {
        return true;
      }
      return value.length === 2
        ? true
        : this.createError({
            message: this.options.context?.t?.('form.errors.startEndDate'),
          });
    })
    .optional(),
});

export type WithdrawalSearchFilters = yup.InferType<typeof formSchema>;

const FiltersForm = ({ onApply, initialValues, onReset }: FiltersFormProps) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<WithdrawalSearchFilters>({
    resolver: yupResolver(formSchema) as Resolver<WithdrawalSearchFilters>,
    defaultValues: initialValues,
  });

  const handleReset = () => {
    reset({ dates: null, searchValue: '', status: null });
    onReset();
  };

  return (
    <form onSubmit={handleSubmit(onApply)}>
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <Select
            value={field.value ?? ''}
            onChange={value => field.onChange(value === '' ? null : value)}
          />
        )}
      />
      <Button type="submit">{t('buttonText.applyFilters')}</Button>
      <Button variant="outlined" onClick={handleReset}>
        {t('buttonText.clearFilters')}
      </Button>
    </form>
  );
};

export default FiltersForm;
