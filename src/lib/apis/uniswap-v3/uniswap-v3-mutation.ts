import type { Address } from 'viem';
import {
  readContract,
  sendTransaction,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core';
import { erc20Abi, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { uniswapV3Router02ContractAddress } from '@/configs/core/uniswap';
import { wagmiConfig } from '@/lib/utils/wagmi';
import { fetchTokenInfo } from '../tokens/token-fetcher';

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
  // amountOutMin: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  userAddress: Address,
  chainId: ChainId = ChainId.Sepolia,
  calldata: `0x${string}`,
  value: `0x${string}`,
  to: Address,
) {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchTokenInfo(tokenInAddress, chainId),
    fetchTokenInfo(tokenOutAddress, chainId),
  ]);

  if (tokenIn == null || tokenOut == null) {
    throw new Error('Invalid token address');
  }

  const parsedAmountIn = parseUnits(amountIn, tokenIn.decimals);

  const allowance = await checkAllowanceV3(tokenIn.address, userAddress);

  if (allowance < parsedAmountIn) {
    await approveTokenV3(tokenIn.address, parsedAmountIn);
  }

  // *
  // const MAX_FEE_PER_GAS = 100000000000n;
  // const MAX_PRIORITY_FEE_PER_GAS = 100000000000n;

  const hash = await sendTransaction(wagmiConfig, {
    data: calldata,
    to,
    value: BigInt(value),
    gas: BigInt(8000000),
    // maxFeePerGas: MAX_FEE_PER_GAS,
    // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId,
  });

  return receipt;
}

export async function swapTokensV3(
  amountIn: string,
  // amountOutMin: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  userAddress: Address,
  chainId: ChainId = ChainId.Sepolia,
  calldata: `0x${string}`,
  value: `0x${string}`,
  to: Address,
) {
  return swapExactInputV3(
    amountIn,
    // amountOutMin,
    tokenInAddress,
    tokenOutAddress,
    userAddress,
    chainId,
    calldata,
    value,
    to,
  );
}
