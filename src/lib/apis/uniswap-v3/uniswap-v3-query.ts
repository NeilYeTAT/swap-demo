import type { Address } from 'viem';
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import { readContract, simulateContract } from '@wagmi/core';
import { ChainId } from '@/configs/chains';
import { PPT, WETH } from '@/configs/core/token';
import {
  uniswapV3FactoryContractAddress,
  uniswapV3Quoter02ContractAddress,
} from '@/configs/core/uniswap';
import { uniswapV3Pool } from '@/lib/abis/uniswap-v3-pool';
import { uniswapV3Quoter } from '@/lib/abis/uniswap-v3-quoter';
import { wagmiConfig } from '@/lib/utils/wagmi';

export async function quote() {
  const poolConstants = await getPoolConstants();

  const { result } = await simulateContract(wagmiConfig, {
    chainId: ChainId.Sepolia,
    address: uniswapV3Quoter02ContractAddress,
    abi: uniswapV3Quoter,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        tokenIn: poolConstants.token0 as Address,
        tokenOut: poolConstants.token1 as Address,
        // amountIn: BigInt(fromReadableAmount(1, 18).toString()),
        amountIn: 1n,
        fee: poolConstants.fee,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return result;
}

async function getPoolConstants(): Promise<{
  token0: string;
  token1: string;
  fee: number;
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: uniswapV3FactoryContractAddress,
    tokenA: WETH,
    tokenB: PPT,
    fee: FeeAmount.MEDIUM,
  }) as Address;

  const token0 = await readContract(wagmiConfig, {
    address: currentPoolAddress,
    abi: uniswapV3Pool,
    functionName: 'token0',
  });

  const token1 = await readContract(wagmiConfig, {
    address: currentPoolAddress,
    abi: uniswapV3Pool,
    functionName: 'token1',
  });

  const fee = await readContract(wagmiConfig, {
    address: currentPoolAddress,
    abi: uniswapV3Pool,
    functionName: 'fee',
  });

  return {
    token0,
    token1,
    fee,
  };
}
