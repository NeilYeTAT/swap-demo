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
      tokenInAddress,
      tokenOutAddress,
      chainId = ChainId.Sepolia,
      calldata,
      value,
      to,
    }: {
      amountIn: string;
      amountOutMin: string;
      tokenInAddress: Address;
      tokenOutAddress: Address;
      slippage?: number;
      chainId?: ChainId;
      calldata: `0x${string}`;
      value: `0x${string}`;
      to: Address;
    }) => {
      if (account == null) {
        return;
      }

      return swapTokensV3(amountIn, tokenInAddress, tokenOutAddress, chainId, calldata, value, to);
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
