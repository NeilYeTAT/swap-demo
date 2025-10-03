import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { swapTokens } from '@/lib/apis/uniswap';
import { accountAtom } from '@/lib/states/evm';

export function useSwapTokens() {
  const queryClient = useQueryClient();
  const account = useAtomValue(accountAtom);

  return useMutation({
    mutationFn: async ({
      amountIn,
      amountOutMin,
      fromToken,
      slippage = 0.95,
    }: {
      amountIn: string;
      amountOutMin: string;
      fromToken: 'LINK' | 'USDC';
      slippage?: number;
    }) => {
      if (account == null) {
        throw new Error('Wallet not connected');
      }

      const adjustedAmountOutMin = (parseFloat(amountOutMin) * slippage).toString();

      return swapTokens(amountIn, adjustedAmountOutMin, fromToken, account);
    },
    onSuccess: () => {
      toast.success('Swap successful!');
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Swap failed');
    },
  });
}
