import type { Address } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { erc20Abi, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { uniswapV2Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapRouterAbi } from '@/lib/abis/uniswap-router';
import { wagmiConfig } from '@/lib/utils/wagmi';
import { fetchTokenInfo } from '../tokens/token-fetcher';
import { findBestPath } from './path-finder';

export async function approveToken(tokenAddress: Address, amount: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [uniswapV2Router02ContractAddress, amount],
    chainId: ChainId.Sepolia,
  });

  await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: ChainId.Sepolia,
  });

  return hash;
}

export async function checkAllowance(tokenAddress: Address, owner: Address) {
  const allowance = await readContract(wagmiConfig, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, uniswapV2Router02ContractAddress],
    chainId: ChainId.Sepolia,
  });

  return allowance;
}

export async function swapTokens(
  amountIn: string,
  amountOutMin: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  to: Address,
  chainId: ChainId = ChainId.Sepolia,
) {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) {
    throw new Error('Invalid token address');
  }

  const route = await findBestPath(
    tokenIn.address,
    tokenOut.address,
    amountIn,
    tokenIn.decimals,
    chainId,
  );

  if (route == null) {
    throw new Error('No available route found for swap');
  }

  const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);
  const parsedAmountOutMin = parseUnits(amountOutMin, tokenOut.decimals);

  const allowance = await checkAllowance(tokenIn.address, to);

  if (allowance < parsedAmountIn) {
    await approveToken(tokenIn.address, parsedAmountIn);
  }

  const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  const hash = await writeContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'swapExactTokensForTokens',
    args: [parsedAmountIn, parsedAmountOutMin, route.path, to, futureDeadline],
    chainId,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId,
  });

  return receipt;
}

export async function swapTokensForExactTokens(
  amountOut: string,
  amountInMax: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  to: Address,
  chainId: ChainId = ChainId.Sepolia,
) {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) {
    throw new Error('Invalid token address');
  }

  const route = await findBestPath(
    tokenIn.address,
    tokenOut.address,
    amountInMax,
    tokenIn.decimals,
    chainId,
  );

  if (route == null) {
    throw new Error('No available route found for swap');
  }

  const parsedAmountOut = parseUnits(amountOut, tokenOut.decimals);
  const parsedAmountInMax = parseUnits(amountInMax, tokenIn.decimals);

  const allowance = await checkAllowance(tokenIn.address, to);

  if (allowance < parsedAmountInMax) {
    await approveToken(tokenIn.address, parsedAmountInMax);
  }

  const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  const hash = await writeContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'swapTokensForExactTokens',
    args: [parsedAmountOut, parsedAmountInMax, route.path, to, futureDeadline],
    chainId,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId,
  });

  return receipt;
}
