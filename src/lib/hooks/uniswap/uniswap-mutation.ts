import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { swapTokens } from '@/lib/apis/uniswap';

export function useSwapTokens() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({
      amountIn,
      amountOutMin,
      fromToken,
    }: {
      amountIn: string;
      amountOutMin: string;
      fromToken: 'LINK' | 'USDC';
    }) => {
      if (address == null) {
        throw new Error('Wallet not connected');
      }

      const slippage = 0.95;
      const adjustedAmountOutMin = (parseFloat(amountOutMin) * slippage).toString();

      return swapTokens(amountIn, adjustedAmountOutMin, fromToken, address);
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
