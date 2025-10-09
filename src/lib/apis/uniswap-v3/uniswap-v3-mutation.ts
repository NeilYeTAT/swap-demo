import type { Address } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { erc20Abi, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { uniswapV3Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapV3Router02Abi } from '@/lib/abis/uniswap-v3-router';
import { wagmiConfig } from '@/lib/utils/wagmi';
import { fetchTokenInfo } from '../tokens/token-fetcher';
import { findBestPath, findBestPathForExactOutput } from './uniswap-v3-query';

export async function approveTokenV3(tokenAddress: Address, amount: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [uniswapV3Router02ContractAddress, amount],
    chainId: ChainId.Sepolia,
  });

  await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: ChainId.Sepolia,
  });

  return hash;
}

export async function checkAllowanceV3(tokenAddress: Address, owner: Address) {
  const allowance = await readContract(wagmiConfig, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, uniswapV3Router02ContractAddress],
    chainId: ChainId.Sepolia,
  });

  return allowance;
}

export async function swapExactInputV3(
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

  const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);
  const parsedAmountOutMin = parseUnits(amountOutMin, tokenOut.decimals);

  const allowance = await checkAllowanceV3(tokenIn.address, to);

  if (allowance < parsedAmountIn) {
    await approveTokenV3(tokenIn.address, parsedAmountIn);
  }

  const { path, fees } = await findBestPath(tokenIn.address, tokenOut.address, parsedAmountIn);

  // const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  let hash: `0x${string}`;

  if (fees.length === 1) {
    hash = await writeContract(wagmiConfig, {
      address: uniswapV3Router02ContractAddress,
      abi: uniswapV3Router02Abi,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee: fees[0],
          recipient: to,
          amountIn: parsedAmountIn,
          amountOutMinimum: parsedAmountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
      chainId,
    });
  } else {
    hash = await writeContract(wagmiConfig, {
      address: uniswapV3Router02ContractAddress,
      abi: uniswapV3Router02Abi,
      functionName: 'exactInput',
      args: [
        {
          path,
          recipient: to,
          amountIn: parsedAmountIn,
          amountOutMinimum: parsedAmountOutMin,
        },
      ],
      chainId,
    });
  }

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId,
  });

  return receipt;
}

export async function swapExactOutputV3(
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

  const parsedAmountOut = parseUnits(amountOut, tokenOut.decimals);
  const parsedAmountInMax = parseUnits(amountInMax, tokenIn.decimals);

  const allowance = await checkAllowanceV3(tokenIn.address, to);

  if (allowance < parsedAmountInMax) {
    await approveTokenV3(tokenIn.address, parsedAmountInMax);
  }

  const { path, fees } = await findBestPathForExactOutput(
    tokenIn.address,
    tokenOut.address,
    parsedAmountOut,
  );

  // const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  let hash: `0x${string}`;

  if (fees.length === 1) {
    hash = await writeContract(wagmiConfig, {
      address: uniswapV3Router02ContractAddress,
      abi: uniswapV3Router02Abi,
      functionName: 'exactOutputSingle',
      args: [
        {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee: fees[0],
          recipient: to,
          amountOut: parsedAmountOut,
          amountInMaximum: parsedAmountInMax,
          sqrtPriceLimitX96: 0n,
        },
      ],
      chainId,
    });
  } else {
    hash = await writeContract(wagmiConfig, {
      address: uniswapV3Router02ContractAddress,
      abi: uniswapV3Router02Abi,
      functionName: 'exactOutput',
      args: [
        {
          path,
          recipient: to,
          amountOut: parsedAmountOut,
          amountInMaximum: parsedAmountInMax,
        },
      ],
      chainId,
    });
  }

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId,
  });

  return receipt;
}

export async function swapTokensV3(
  amountIn: string,
  amountOutMin: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  to: Address,
  chainId: ChainId = ChainId.Sepolia,
) {
  return swapExactInputV3(amountIn, amountOutMin, tokenInAddress, tokenOutAddress, to, chainId);
}
