import { MutateOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@fd-tenant/api';

import type { [RESOURCE]Input } from './types';

const API_PREFIX = '/[DOMAIN]/api/[RESOURCE]';

export const useCreate[RESOURCE] = (
  options?: MutateOptions<unknown, Error, [RESOURCE]Input>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: [RESOURCE]Input) => {
      await apiClient.post(API_PREFIX, input);
      return { ok: true };
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['[DOMAIN]', '[RESOURCE]'] });
    },
    ...options,
  });
};
