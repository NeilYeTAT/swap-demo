import type { Address } from 'viem';
import { FeeAmount } from '@uniswap/v3-sdk';
import { simulateContract } from '@wagmi/core';
import { ChainId } from '@/configs/chains';
import { uniswapV3Quoter02ContractAddress } from '@/configs/core/uniswap';
import { uniswapV3Quoter } from '@/lib/abis/uniswap-v3-quoter';
import { wagmiConfig } from '@/lib/utils/wagmi';

export async function quoteExactInputPath(path: `0x${string}`, amountIn: bigint) {
  const { result } = await simulateContract(wagmiConfig, {
    chainId: ChainId.Sepolia,
    address: uniswapV3Quoter02ContractAddress,
    abi: uniswapV3Quoter,
    functionName: 'quoteExactInput',
    args: [path, amountIn],
  });

  return result;
}

export async function quoteExactOutputPath(path: `0x${string}`, amountOut: bigint) {
  const { result } = await simulateContract(wagmiConfig, {
    chainId: ChainId.Sepolia,
    address: uniswapV3Quoter02ContractAddress,
    abi: uniswapV3Quoter,
    functionName: 'quoteExactOutput',
    args: [path, amountOut],
  });

  return result;
}

export async function quoteSingle(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountIn: bigint,
  fee: number = FeeAmount.MEDIUM,
) {
  const { result } = await simulateContract(wagmiConfig, {
    chainId: ChainId.Sepolia,
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

export async function quoteExactOutputSingle(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountOut: bigint,
  fee: number = FeeAmount.MEDIUM,
) {
  const { result } = await simulateContract(wagmiConfig, {
    chainId: ChainId.Sepolia,
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
