import type { Address } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import type { ChainId } from '@/configs/chains';
import { accountAtom } from '@/lib/states/evm';
import { useSwapTokensV3 } from '../uniswap-v3/uniswap-v3-mutation';
import { useSwapTokens } from './uniswap-mutation';

export interface UnifiedSwapParams {
  protocol: 'V2' | 'V3';
  amountIn: string;
  amountOutMin: string;
  tokenInAddress: Address;
  tokenOutAddress: Address;
  slippage?: number;
  chainId?: ChainId;
  calldata?: `0x${string}`;
  value?: `0x${string}`;
  to?: Address;
}

export function useUnifiedSwap() {
  const queryClient = useQueryClient();
  const account = useAtomValue(accountAtom);
  const swapV2 = useSwapTokens();
  const swapV3 = useSwapTokensV3();

  return useMutation({
    mutationFn: async (params: UnifiedSwapParams) => {
      if (account == null) {
        throw new Error('Account not connected');
      }

      if (params.protocol === 'V2') {
        return swapV2.mutateAsync({
          amountIn: params.amountIn,
          amountOutMin: params.amountOutMin,
          tokenInAddress: params.tokenInAddress,
          tokenOutAddress: params.tokenOutAddress,
          slippage: params.slippage,
          chainId: params.chainId,
        });
      } else {
        return swapV3.mutateAsync({
          amountIn: params.amountIn,
          amountOutMin: params.amountOutMin,
          tokenInAddress: params.tokenInAddress,
          tokenOutAddress: params.tokenOutAddress,
          slippage: params.slippage,
          chainId: params.chainId,
          calldata: params.calldata!,
          value: params.value!,
          to: params.to!,
        });
      }
    },
    onSuccess: (data, variables) => {
      toast.success(`${variables.protocol} Swap successful!`);
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['token-balance'] });
      queryClient.invalidateQueries({ queryKey: ['uniswap-v3-route'] });
    },
    onError: (error: Error, variables) => {
      toast.error(`${variables.protocol} Swap failed: ${error.message}`);
    },
  });
}
