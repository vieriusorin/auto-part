// Real example from: apps/tenant-ksa/src/app/api/customers/customers/mutations.ts
// Pattern: useMutation with invalidateQueries, MutateOptions spread
import {
  MutateOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../..';
import { EditCustomersPersonalDetailsInput } from './types';

const API_PREFIX = '/customers/api/customers';

export const useEditCustomersPersonalDetails = (
  options?: MutateOptions<unknown, Error, EditCustomersPersonalDetailsInput>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditCustomersPersonalDetailsInput) => {
      const { userId, ...rest } = input;
      await apiClient.put(`${API_PREFIX}/customer/personal-details`, {
        customerId: userId,
        ...rest,
      });
      return { ok: true };
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ['customers', 'personalDetails'],
      });
    },
    ...options,
  });
};
