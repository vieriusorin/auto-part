import { apiClient } from '@fd-tenant/api';
import { getErrorMessage } from '@fd-tenant/api/helpers';
import { useQuery } from '@tanstack/react-query';

import type { [RESOURCE]Response, [RESOURCE]Input } from './types';

const API_PREFIX = '/[DOMAIN]/api/[RESOURCE]';

export const useGet[RESOURCE] = (input: [RESOURCE]Input) => {
  return useQuery({
    queryKey: ['[DOMAIN]', '[RESOURCE]', input],
    queryFn: async () => {
      const response = await apiClient.get(`${API_PREFIX}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData));
      }

      return response.json() as Promise<[RESOURCE]Response>;
    },
  });
};
