import type { Chain } from 'viem';
import { produce } from 'immer';
import { mainnet, sepolia } from 'viem/chains';
import { Environment, environment } from './environments';

export enum ChainId {
  Mainnet = 1,
  Sepolia = 11155111,
}

export const supportedChainIds = {
  [Environment.Production]: [ChainId.Mainnet],
  [Environment.Development]: [ChainId.Sepolia],
}[environment];

export const chains: Record<ChainId, Chain> = {
  [ChainId.Mainnet]: produce(mainnet, chain => {
    (chain.rpcUrls.default.http[0] as string) = 'https://ethereum-rpc.publicnode.com';
  }),
  [ChainId.Sepolia]: produce(sepolia, chain => {
    (chain.rpcUrls.default.http[0] as string) = 'https://ethereum-sepolia-rpc.publicnode.com';
  }),
};
