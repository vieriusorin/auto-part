// Real example from: apps/tenant-ksa/src/app/api/corePlatform/vpp/queries.ts
// Pattern: useQuery with apiClient, typed response, error handling
import { apiClient } from '@fd-tenant/api';
import { getErrorMessage } from '@fd-tenant/api/helpers';
import { useQuery } from '@tanstack/react-query';

import { VppListApiResponse, VppListInput } from './types';

const API_PREFIX = '/core-platform/api/virtualpowerplants';

export const useGetVppList = (input: VppListInput) => {
  return useQuery({
    queryKey: ['vpp', 'list', input],
    queryFn: async () => {
      const response = await apiClient.post(`${API_PREFIX}/search`, input);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData));
      }

      return response.json() as Promise<VppListApiResponse>;
    },
  });
};
