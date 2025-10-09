import type { Address } from 'viem';
import { readContract } from '@wagmi/core';
import { erc20Abi, isAddress } from 'viem';
import type { ChainId } from '@/configs/chains';
import { wagmiConfig } from '@/lib/utils/wagmi';

export type TokenInfo = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
};

const tokenCache = new Map<string, TokenInfo>();

// TODO: remove chainid
export async function fetchTokenInfo(address: string, chainId: ChainId): Promise<TokenInfo | null> {
  if (!isAddress(address)) {
    return null;
  }

  const cacheKey = `${chainId}-${address.toLowerCase()}`;

  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey)!;
  }

  const [symbol, name, decimals] = await Promise.all([
    readContract(wagmiConfig, {
      address: address,
      abi: erc20Abi,
      functionName: 'symbol',
      chainId,
    }),
    readContract(wagmiConfig, {
      address: address,
      abi: erc20Abi,
      functionName: 'name',
      chainId,
    }),
    readContract(wagmiConfig, {
      address: address,
      abi: erc20Abi,
      functionName: 'decimals',
      chainId,
    }),
  ]);

  const tokenInfo: TokenInfo = {
    address: address as Address,
    symbol,
    name,
    decimals,
  };

  tokenCache.set(cacheKey, tokenInfo);
  return tokenInfo;
}

export function getTokenFromCache(address: string, chainId: ChainId): TokenInfo | undefined {
  const cacheKey = `${chainId}-${address.toLowerCase()}`;
  return tokenCache.get(cacheKey);
}

export function clearTokenCache(): void {
  tokenCache.clear();
}
