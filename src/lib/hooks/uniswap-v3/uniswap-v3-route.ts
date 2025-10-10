import { useQuery } from '@tanstack/react-query';
import ky from 'ky';

interface RouteResponse {
  success: boolean;
  quote?: string;
  quoteCurrency?: string;
  estimatedGasUsed?: string;
  inputAmount?: string;
  outputAmount?: string;
  executionPrice?: string;
  path?: string[];
  methodParameters?: {
    calldata: string;
    value: string;
    to: string;
  };
  error?: string;
}

export function useUniswapV3Route() {
  return useQuery<RouteResponse>({
    queryKey: ['uniswap-v3-route'],
    queryFn: async () => {
      const response = await ky.get('/api/uniswap-v3').json<RouteResponse>();
      return response;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
