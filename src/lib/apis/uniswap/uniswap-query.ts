import { formatUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { fetchTokenInfo } from '../tokens/token-fetcher';
import { findBestPath, findBestPathForExactOutput } from './path-finder';

export async function getAmountsOut(
  amountIn: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
): Promise<string | null> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const route = await findBestPath(
    tokenIn.address,
    tokenOut.address,
    amountIn,
    tokenIn.decimals,
    chainId,
  );

  if (route == null) return null;

  return formatUnits(route.expectedOutput, tokenOut.decimals);
}

export async function getAmountsIn(
  amountOut: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
): Promise<string | null> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const result = await findBestPathForExactOutput(
    tokenIn.address,
    tokenOut.address,
    amountOut,
    tokenOut.decimals,
    tokenIn.decimals,
    chainId,
  );

  if (result == null) return null;

  return result.requiredInput;
}

export async function getBestRoute(
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  chainId: ChainId = ChainId.Sepolia,
) {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const route = await findBestPath(
    tokenIn.address,
    tokenOut.address,
    amountIn,
    tokenIn.decimals,
    chainId,
  );

  return route;
}
