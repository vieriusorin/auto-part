import * as yup from 'yup';

export const [formName]Schema = yup.object({
  [fieldName]: yup.string().required('[formName].[fieldName].required'),
  // nullable optional field:
  [optionalField]: yup.string().nullable().optional(),
});

export type [FormName]Values = yup.InferType<typeof [formName]Schema>;
