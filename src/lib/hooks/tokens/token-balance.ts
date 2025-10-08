import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { ChainId } from '@/configs/chains';
import { getBalance } from '@/lib/apis/tokens';
import { fetchTokenInfo } from '@/lib/apis/tokens/token-fetcher';
import { accountAtom } from '@/lib/states/evm';

export function useTokenInfo(tokenAddress: string | null, chainId: ChainId = ChainId.Sepolia) {
  return useQuery({
    queryKey: ['token-info', tokenAddress, chainId],
    queryFn: async () => {
      if (tokenAddress == null) return null;
      return fetchTokenInfo(tokenAddress, chainId);
    },
    enabled: !(tokenAddress == null),
  });
}

export function useTokenBalance(tokenAddress: string | null, chainId: ChainId = ChainId.Sepolia) {
  const account = useAtomValue(accountAtom);
  const { data: tokenInfo } = useTokenInfo(tokenAddress, chainId);

  return useQuery({
    queryKey: [
      'token-balance',
      tokenAddress,
      account,
      chainId,
      tokenInfo,
      tokenInfo?.address,
      tokenInfo?.decimals,
    ],
    queryFn: async () => {
      if (account == null || tokenAddress == null || tokenInfo == null) return '0';

      const balance = await getBalance({
        chainId,
        address: tokenInfo.address,
        account,
        decimals: tokenInfo.decimals,
      });

      return balance;
    },
    enabled: !(account == null) && !(tokenAddress == null) && !(tokenInfo == null),
    refetchInterval: 10000,
  });
}

export function useMultipleTokenInfo(tokenAddresses: string[], chainId: ChainId = ChainId.Sepolia) {
  return useQuery({
    queryKey: ['multiple-token-info', tokenAddresses, chainId],
    queryFn: async () => {
      const results = await Promise.all(
        tokenAddresses.map(address => fetchTokenInfo(address, chainId)),
      );
      return results.filter(info => info != null);
    },
    enabled: tokenAddresses.length > 0,
    staleTime: Infinity,
  });
}
