import type { Address } from 'viem';
import { FeeAmount } from '@uniswap/v3-sdk';
import { simulateContract } from '@wagmi/core';
import { encodePacked, formatUnits, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { WETH_Address } from '@/configs/core/token';
import { uniswapV3Quoter02ContractAddress } from '@/configs/core/uniswap';
import { uniswapV3Quoter } from '@/lib/abis/uniswap-v3-quoter';
import { wagmiConfig } from '@/lib/utils/wagmi';
import { fetchTokenInfo } from '../tokens/token-fetcher';

export async function encodePath(tokens: Address[], fees: number[]): Promise<`0x${string}`> {
  if (tokens.length !== fees.length + 1) {
    throw new Error('Invalid path');
  }

  if (tokens.length === 2) {
    return encodePacked(['address', 'uint24', 'address'], [tokens[0], fees[0], tokens[1]]);
  }

  const types: ('address' | 'uint24')[] = [];
  const values: (Address | number)[] = [];

  for (let i = 0; i < tokens.length; i++) {
    types.push('address');
    values.push(tokens[i]);
    if (i < fees.length) {
      types.push('uint24');
      values.push(fees[i]);
    }
  }

  return encodePacked(types, values);
}

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

export async function findBestPath(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountIn: bigint,
): Promise<{ path: `0x${string}`; amountOut: bigint; fees: number[] }> {
  let bestPath: `0x${string}` | null = null;
  let bestOutput = 0n;
  let bestFees: number[] = [];

  const fees = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH];

  for (const fee of fees) {
    const [amountOut] = await quoteSingle(tokenInAddress, tokenOutAddress, amountIn, fee).catch(
      () => [0n],
    );

    if (amountOut > bestOutput) {
      bestOutput = amountOut;
      bestPath = encodePacked(
        ['address', 'uint24', 'address'],
        [tokenInAddress, fee, tokenOutAddress],
      );
      bestFees = [fee];
    }
  }

  const wethAddress = WETH_Address.toLowerCase();
  const tokenInLower = tokenInAddress.toLowerCase();
  const tokenOutLower = tokenOutAddress.toLowerCase();

  if (tokenInLower !== wethAddress && tokenOutLower !== wethAddress) {
    const bestFeePairs = [
      [FeeAmount.MEDIUM, FeeAmount.MEDIUM],
      [FeeAmount.LOW, FeeAmount.MEDIUM],
      [FeeAmount.MEDIUM, FeeAmount.LOW],
      [FeeAmount.HIGH, FeeAmount.MEDIUM],
      [FeeAmount.MEDIUM, FeeAmount.HIGH],
    ];

    for (const [fee1, fee2] of bestFeePairs) {
      const path = await encodePath(
        [tokenInAddress, WETH_Address as Address, tokenOutAddress],
        [fee1, fee2],
      );

      const [amountOut] = await quoteExactInputPath(path, amountIn).catch(() => [0n]);

      if (amountOut > bestOutput) {
        bestOutput = amountOut;
        bestPath = path;
        bestFees = [fee1, fee2];
      }
    }
  }

  if (bestPath == null || bestOutput === 0n) {
    throw new Error('No valid path found');
  }

  return { path: bestPath, amountOut: bestOutput, fees: bestFees };
}

export async function findBestPathForExactOutput(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountOut: bigint,
): Promise<{ path: `0x${string}`; amountIn: bigint; fees: number[] }> {
  let bestPath: `0x${string}` | null = null;
  let bestInput = 0n;
  let bestFees: number[] = [];

  const fees = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH];

  for (const fee of fees) {
    const [amountIn] = await quoteExactOutputSingle(
      tokenInAddress,
      tokenOutAddress,
      amountOut,
      fee,
    ).catch(() => [0n]);

    if (bestInput === 0n || (amountIn > 0n && amountIn < bestInput)) {
      bestInput = amountIn;
      bestPath = encodePacked(
        ['address', 'uint24', 'address'],
        [tokenInAddress, fee, tokenOutAddress],
      );
      bestFees = [fee];
    }
  }

  const wethAddress = WETH_Address.toLowerCase();
  const tokenInLower = tokenInAddress.toLowerCase();
  const tokenOutLower = tokenOutAddress.toLowerCase();

  if (tokenInLower !== wethAddress && tokenOutLower !== wethAddress) {
    const bestFeePairs = [
      [FeeAmount.MEDIUM, FeeAmount.MEDIUM],
      [FeeAmount.LOW, FeeAmount.MEDIUM],
      [FeeAmount.MEDIUM, FeeAmount.LOW],
      [FeeAmount.HIGH, FeeAmount.MEDIUM],
      [FeeAmount.MEDIUM, FeeAmount.HIGH],
    ];

    for (const [fee1, fee2] of bestFeePairs) {
      // TODO: path
      const reversePath = await encodePath(
        [tokenOutAddress, WETH_Address as Address, tokenInAddress],
        [fee2, fee1],
      );

      const [amountIn] = await quoteExactOutputPath(reversePath, amountOut).catch(() => [0n]);

      if (bestInput === 0n || (amountIn > 0n && amountIn < bestInput)) {
        bestInput = amountIn;
        bestPath = await encodePath(
          [tokenInAddress, WETH_Address as Address, tokenOutAddress],
          [fee1, fee2],
        );
        bestFees = [fee1, fee2];
      }
    }
  }

  if (bestPath == null || bestInput === 0n) {
    throw new Error('No valid path found');
  }

  return { path: bestPath, amountIn: bestInput, fees: bestFees };
}

export async function getAmountsOutV3(
  amountIn: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
): Promise<string | null> {
  if (amountIn === '' || amountIn === '0') return '0';

  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);

  if (parsedAmountIn === 0n) return '0';

  const { amountOut } = await findBestPath(tokenIn.address, tokenOut.address, parsedAmountIn).catch(
    () => ({ path: '0x' as `0x${string}`, amountOut: 0n, fees: [] }),
  );

  if (amountOut === 0n) return null;

  return formatUnits(amountOut, tokenOut.decimals);
}

export async function getAmountsInV3(
  amountOut: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  chainId: ChainId = ChainId.Sepolia,
): Promise<string | null> {
  if (amountOut === '' || amountOut === '0') return '0';

  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) return null;

  const parsedAmountOut = parseUnits(amountOut, tokenOut.decimals);

  if (parsedAmountOut === 0n) return '0';

  const { amountIn } = await findBestPathForExactOutput(
    tokenIn.address,
    tokenOut.address,
    parsedAmountOut,
  ).catch(() => ({ path: '0x' as `0x${string}`, amountIn: 0n, fees: [] }));

  if (amountIn === 0n) return null;

  return formatUnits(amountIn, tokenIn.decimals);
}

export async function getBestPathAndFee(
  tokenInAddress: Address,
  tokenOutAddress: Address,
  amountIn: bigint,
): Promise<{ path: `0x${string}`; fees: number[] }> {
  const { path, fees } = await findBestPath(tokenInAddress, tokenOutAddress, amountIn);
  return { path, fees };
}
