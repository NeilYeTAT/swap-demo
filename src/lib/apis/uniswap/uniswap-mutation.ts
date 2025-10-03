import type { Address } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { uniswapV2Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapRouterAbi } from '@/lib/abis/uniswap-router';
import { wagmiConfig } from '@/lib/utils/wagmi';

const WETH_ADDRESS = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Address;
const LINK_ADDRESS = '0x779877A7B0D9E8603169DdbD7836e478b4624789' as Address;
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;

const erc20Abi = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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
    ? [LINK_ADDRESS, WETH_ADDRESS, USDC_ADDRESS]
    : [USDC_ADDRESS, WETH_ADDRESS, LINK_ADDRESS];

  const inputDecimals = isLinkToUsdc ? 18 : 6;
  const outputDecimals = isLinkToUsdc ? 6 : 18;

  const parsedAmountIn = parseUnits(amountIn, inputDecimals);
  const parsedAmountOutMin = parseUnits(amountOutMin, outputDecimals);

  const tokenToApprove = isLinkToUsdc ? LINK_ADDRESS : USDC_ADDRESS;

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
