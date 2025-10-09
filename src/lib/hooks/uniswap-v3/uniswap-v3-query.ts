import { useQuery } from '@tanstack/react-query';
import { ChainId } from '@/configs/chains';
import { getAmountsInV3, getAmountsOutV3 } from '@/lib/apis/uniswap-v3';

export function useSwapAmountsOutV3(
  amountIn: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  return useQuery({
    queryKey: ['swap-amounts-out-v3', amountIn, tokenInAddress, tokenOutAddress, chainId],
    queryFn: async () => {
      if (amountIn.length === 0 || amountIn === '' || amountIn === '0') {
        return '0';
      }
      if (tokenInAddress.length === 0 || tokenOutAddress.length === 0) {
        return '0';
      }
      const result = await getAmountsOutV3(amountIn, tokenInAddress, tokenOutAddress, chainId);
      return result ?? '0';
    },
    enabled:
      !(amountIn.length === 0) &&
      amountIn !== '0' &&
      !(tokenInAddress.length === 0) &&
      !(tokenOutAddress.length === 0),
  });
}

export function useSwapAmountsInV3(
  amountOut: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  return useQuery({
    queryKey: ['swap-amounts-in-v3', amountOut, tokenInAddress, tokenOutAddress, chainId],
    queryFn: async () => {
      if (amountOut.length === 0 || amountOut === '' || amountOut === '0') {
        return '0';
      }
      if (tokenInAddress.length === 0 || tokenOutAddress.length === 0) {
        return '0';
      }
      const result = await getAmountsInV3(amountOut, tokenInAddress, tokenOutAddress);
      return result ?? '0';
    },
    enabled:
      !(amountOut.length === 0) &&
      amountOut !== '0' &&
      !(tokenInAddress.length === 0) &&
      !(tokenOutAddress.length === 0),
  });
}
