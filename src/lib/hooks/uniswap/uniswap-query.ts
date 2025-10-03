import { useQuery } from '@tanstack/react-query';
import {
  getAmountsIn,
  getAmountsOut,
  getLinkToUsdcPrice,
  getUsdcToLinkPrice,
} from '@/lib/apis/uniswap';

export function useLinkToUsdcPrice() {
  return useQuery({
    queryKey: ['link-usdc-price'],
    queryFn: getLinkToUsdcPrice,
    refetchInterval: 10000,
  });
}

export function useUsdcToLinkPrice() {
  return useQuery({
    queryKey: ['usdc-link-price'],
    queryFn: getUsdcToLinkPrice,
    refetchInterval: 10000,
  });
}

export function useSwapAmountsOut(amountIn: string, fromToken: 'LINK' | 'USDC') {
  return useQuery({
    queryKey: ['swap-amounts-out', amountIn, fromToken],
    queryFn: async () => {
      if (amountIn === '' || amountIn === '0') {
        return '0';
      }
      return getAmountsOut(amountIn, fromToken);
    },
    enabled: amountIn !== '' && amountIn !== '0',
  });
}

export function useSwapAmountsIn(amountOut: string, toToken: 'LINK' | 'USDC') {
  return useQuery({
    queryKey: ['swap-amounts-in', amountOut, toToken],
    queryFn: async () => {
      if (amountOut === '' || amountOut === '0') {
        return '0';
      }
      return getAmountsIn(amountOut, toToken);
    },
    enabled: amountOut !== '' && amountOut !== '0',
  });
}
