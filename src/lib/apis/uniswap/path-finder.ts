import type { Address } from 'viem';
import { readContract } from '@wagmi/core';
import { formatUnits, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { WETH_Address } from '@/configs/core/token';
import { uniswapV2Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapRouterAbi } from '@/lib/abis/uniswap-router';
import { wagmiConfig } from '@/lib/utils/wagmi';

export type SwapRoute = {
  path: Address[];
  expectedOutput: bigint;
  priceImpact: number;
};

async function getRouteOutput(
  path: Address[],
  amountIn: bigint,
  chainId: ChainId,
): Promise<bigint | null> {
  try {
    const amounts = await readContract(wagmiConfig, {
      address: uniswapV2Router02ContractAddress,
      abi: uniswapRouterAbi,
      functionName: 'getAmountsOut',
      args: [amountIn, path],
      chainId,
    });
    return amounts[amounts.length - 1];
  } catch {
    return null;
  }
}

async function getRouteInput(
  path: Address[],
  amountOut: bigint,
  chainId: ChainId,
): Promise<bigint | null> {
  try {
    const amounts = await readContract(wagmiConfig, {
      address: uniswapV2Router02ContractAddress,
      abi: uniswapRouterAbi,
      functionName: 'getAmountsIn',
      args: [amountOut, path],
      chainId,
    });
    return amounts[0];
  } catch {
    return null;
  }
}

export async function findBestPath(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  decimalsIn: number,
  chainId: ChainId = ChainId.Sepolia,
): Promise<SwapRoute | null> {
  const amountInBigInt = parseUnits(amountIn, decimalsIn);
  const routes: SwapRoute[] = [];

  const directPath = [tokenIn, tokenOut];
  const directOutput = await getRouteOutput(directPath, amountInBigInt, chainId);
  if (directOutput != null && directOutput > 0n) {
    routes.push({
      path: directPath,
      expectedOutput: directOutput,
      priceImpact: 0,
    });
  }

  const wethPath = [tokenIn, WETH_Address, tokenOut];
  const wethOutput = await getRouteOutput(wethPath, amountInBigInt, chainId);
  if (wethOutput != null && wethOutput > 0n) {
    routes.push({
      path: wethPath,
      expectedOutput: wethOutput,
      priceImpact: 0,
    });
  }

  const commonIntermediateTokens = [
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  ];

  for (const intermediate of commonIntermediateTokens) {
    if (intermediate !== tokenIn && intermediate !== tokenOut && intermediate !== WETH_Address) {
      const path = [tokenIn, intermediate as Address, tokenOut];
      const output = await getRouteOutput(path, amountInBigInt, chainId);
      if (output != null && output > 0n) {
        routes.push({
          path,
          expectedOutput: output,
          priceImpact: 0,
        });
      }
    }
  }

  if (routes.length === 0) return null;

  routes.sort((a, b) => {
    if (a.expectedOutput > b.expectedOutput) return -1;
    if (a.expectedOutput < b.expectedOutput) return 1;
    return 0;
  });

  return routes[0];
}

export async function findBestPathForExactOutput(
  tokenIn: Address,
  tokenOut: Address,
  amountOut: string,
  decimalsOut: number,
  decimalsIn: number,
  chainId: ChainId = ChainId.Sepolia,
): Promise<{ route: SwapRoute; requiredInput: string } | null> {
  const amountOutBigInt = parseUnits(amountOut, decimalsOut);
  const routes: { path: Address[]; requiredInput: bigint }[] = [];

  const directPath = [tokenIn, tokenOut];
  const directInput = await getRouteInput(directPath, amountOutBigInt, chainId);
  if (directInput != null && directInput > 0n) {
    routes.push({
      path: directPath,
      requiredInput: directInput,
    });
  }

  const wethPath = [tokenIn, WETH_Address, tokenOut];
  const wethInput = await getRouteInput(wethPath, amountOutBigInt, chainId);
  if (wethInput != null && wethInput > 0n) {
    routes.push({
      path: wethPath,
      requiredInput: wethInput,
    });
  }

  const commonIntermediateTokens = [
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  ];

  for (const intermediate of commonIntermediateTokens) {
    if (intermediate !== tokenIn && intermediate !== tokenOut && intermediate !== WETH_Address) {
      const path = [tokenIn, intermediate as Address, tokenOut];
      const input = await getRouteInput(path, amountOutBigInt, chainId);
      if (input != null && input > 0n) {
        routes.push({
          path,
          requiredInput: input,
        });
      }
    }
  }

  if (routes.length === 0) return null;

  routes.sort((a, b) => {
    if (a.requiredInput < b.requiredInput) return -1;
    if (a.requiredInput > b.requiredInput) return 1;
    return 0;
  });

  const bestRoute = routes[0];
  return {
    route: {
      path: bestRoute.path,
      expectedOutput: amountOutBigInt,
      priceImpact: 0,
    },
    requiredInput: formatUnits(bestRoute.requiredInput, decimalsIn),
  };
}
