import type { Address } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { erc20Abi, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { LINK_Address, USDC_Address, WETH_Address } from '@/configs/core/token';
import { uniswapV2Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapRouterAbi } from '@/lib/abis/uniswap-router';
import { wagmiConfig } from '@/lib/utils/wagmi';

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
  fromToken: 'LINK' | 'USDC',
  to: Address,
) {
  const isLinkToUsdc = fromToken === 'LINK';
  const path = isLinkToUsdc
    ? [LINK_Address, WETH_Address, USDC_Address]
    : [USDC_Address, WETH_Address, LINK_Address];

  const inputDecimals = isLinkToUsdc ? 18 : 6;
  const outputDecimals = isLinkToUsdc ? 6 : 18;

  const parsedAmountIn = parseUnits(amountIn, inputDecimals);
  const parsedAmountOutMin = parseUnits(amountOutMin, outputDecimals);

  const tokenToApprove = isLinkToUsdc ? LINK_Address : USDC_Address;

  const allowance = await checkAllowance(tokenToApprove, to);

  if (allowance < parsedAmountIn) {
    await approveToken(tokenToApprove, parsedAmountIn);
  }

  const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

  const hash = await writeContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'swapExactTokensForTokens',
    args: [parsedAmountIn, parsedAmountOutMin, path, to, futureDeadline],
    chainId: ChainId.Sepolia,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: ChainId.Sepolia,
  });

  return receipt;
}
