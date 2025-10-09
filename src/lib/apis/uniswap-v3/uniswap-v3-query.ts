import type { Address } from 'viem';
import { FeeAmount } from '@uniswap/v3-sdk';
import { simulateContract } from '@wagmi/core';
import { formatUnits, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { uniswapV3Quoter02ContractAddress } from '@/configs/core/uniswap';
import { uniswapV3Quoter } from '@/lib/abis/uniswap-v3-quoter';
import { wagmiConfig } from '@/lib/utils/wagmi';
import { fetchTokenInfo } from '../tokens/token-fetcher';

export async function quote(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountIn: bigint,
  fee: number = FeeAmount.MEDIUM,
) {
  const { result } = await simulateContract(wagmiConfig, {
    address: uniswapV3Quoter02ContractAddress,
    abi: uniswapV3Quoter,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return result;
}

export async function quoteExactOutput(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountOut: bigint,
  fee: number = FeeAmount.MEDIUM,
) {
  const { result } = await simulateContract(wagmiConfig, {
    address: uniswapV3Quoter02ContractAddress,
    abi: uniswapV3Quoter,
    functionName: 'quoteExactOutputSingle',
    args: [
      {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amount: amountOut,
        fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return result;
}

export async function getAmountsOutV3(
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

  const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);

  const fees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
  let bestOutput = 0n;

  for (const fee of fees) {
    const [amountOut] = await quote(tokenIn.address, tokenOut.address, parsedAmountIn, fee).catch(
      () => [0n],
    );

    if (amountOut > bestOutput) {
      bestOutput = amountOut;
    }
  }

  if (bestOutput === 0n) return null;

  return formatUnits(bestOutput, tokenOut.decimals);
}

export async function getAmountsInV3(
  amountOut: string,
  tokenInAddress: string,
  tokenOutAddress: string,
): Promise<string | null> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, ChainId.Sepolia),
    fetchTokenInfo(tokenOutAddress, ChainId.Sepolia),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const parsedAmountOut = parseUnits(amountOut, tokenOut.decimals);

  const fees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
  let bestInput = 0n;

  for (const fee of fees) {
    const [amountIn] = await quoteExactOutput(
      tokenIn.address,
      tokenOut.address,
      parsedAmountOut,
      fee,
    ).catch(() => [0n]);

    if (bestInput === 0n || (amountIn > 0n && amountIn < bestInput)) {
      bestInput = amountIn;
    }
  }

  if (bestInput === 0n) return null;

  return formatUnits(bestInput, tokenIn.decimals);
}

export async function getBestFee(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountIn: bigint,
): Promise<number> {
  const fees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
  let bestFee = FeeAmount.MEDIUM;
  let bestOutput = 0n;

  for (const fee of fees) {
    const [amountOut] = await quote(tokenInAddress, tokenOutAddress, amountIn, fee).catch(() => [
      0n,
    ]);

    if (amountOut > bestOutput) {
      bestOutput = amountOut;
      bestFee = fee;
    }
  }

  return bestFee;
}
