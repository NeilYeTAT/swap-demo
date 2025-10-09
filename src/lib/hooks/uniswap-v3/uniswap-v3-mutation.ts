import type { Address } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { ChainId } from '@/configs/chains';
import { swapTokensV3 } from '@/lib/apis/uniswap-v3';
import { accountAtom } from '@/lib/states/evm';

export function useSwapTokensV3() {
  const queryClient = useQueryClient();
  const account = useAtomValue(accountAtom);

  return useMutation({
    mutationFn: async ({
      amountIn,
      amountOutMin,
      tokenInAddress,
      tokenOutAddress,
      slippage = 0.95,
      chainId = ChainId.Sepolia,
    }: {
      amountIn: string;
      amountOutMin: string;
      tokenInAddress: Address;
      tokenOutAddress: Address;
      slippage?: number;
      chainId?: ChainId;
    }) => {
      if (account == null) {
        return;
      }

      const adjustedAmountOutMin = (parseFloat(amountOutMin) * slippage).toString();

      return swapTokensV3(
        amountIn,
        adjustedAmountOutMin,
        tokenInAddress,
        tokenOutAddress,
        account,
        chainId,
      );
    },
    onSuccess: () => {
      toast.success('Swap successful!');
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['token-balance'] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Swap failed');
    },
  });
}
