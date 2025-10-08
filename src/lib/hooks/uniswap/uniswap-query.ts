import { useQuery } from '@tanstack/react-query';
import { ChainId } from '@/configs/chains';
import { getAmountsIn, getAmountsOut, getBestRoute } from '@/lib/apis/uniswap';

export function useSwapAmountsOut(
  amountIn: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  return useQuery({
    queryKey: ['swap-amounts-out', amountIn, tokenInAddress, tokenOutAddress, chainId],
    queryFn: async () => {
      if (amountIn.length === 0 || amountIn === '' || amountIn === '0') {
        return '0';
      }
      if (tokenInAddress.length === 0 || tokenOutAddress.length === 0) {
        return '0';
      }
      const result = await getAmountsOut(amountIn, tokenInAddress, tokenOutAddress, chainId);
      return result ?? '0';
    },
    enabled:
      !(amountIn.length === 0) &&
      amountIn !== '0' &&
      !(tokenInAddress.length === 0) &&
      !(tokenOutAddress.length === 0),
  });
}

export function useSwapAmountsIn(
  amountOut: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  return useQuery({
    queryKey: ['swap-amounts-in', amountOut, tokenInAddress, tokenOutAddress, chainId],
    queryFn: async () => {
      if (amountOut.length === 0 || amountOut === '' || amountOut === '0') {
        return '0';
      }
      if (tokenInAddress.length === 0 || tokenOutAddress.length === 0) {
        return '0';
      }
      const result = await getAmountsIn(amountOut, tokenInAddress, tokenOutAddress, chainId);
      return result ?? '0';
    },
    enabled:
      !(amountOut.length === 0) &&
      amountOut !== '0' &&
      !(tokenInAddress.length === 0) &&
      !(tokenOutAddress.length === 0),
  });
}

export function useBestRoute(
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  return useQuery({
    queryKey: ['best-route', tokenInAddress, tokenOutAddress, amountIn, chainId],
    queryFn: async () => {
      if (
        tokenInAddress.length === 0 ||
        tokenOutAddress.length === 0 ||
        amountIn.length === 0 ||
        amountIn === '0'
      ) {
        return null;
      }
      return getBestRoute(tokenInAddress, tokenOutAddress, amountIn, chainId);
    },
    enabled:
      !(tokenInAddress.length === 0) &&
      !(tokenOutAddress.length === 0) &&
      !(amountIn.length === 0) &&
      amountIn !== '0',
  });
}
