import { readContract } from '@wagmi/core';
import { formatUnits, parseUnits } from 'viem';
import { ChainId } from '@/configs/chains';
import { LINK_Address, USDC_Address, WETH_Address } from '@/configs/core/token';
import { uniswapV2Router02ContractAddress } from '@/configs/core/uniswap';
import { uniswapRouterAbi } from '@/lib/abis/uniswap-router';
import { wagmiConfig } from '@/lib/utils/wagmi';

export async function getLinkToUsdcPrice() {
  const amountIn = parseUnits('1', 18);
  const path = [LINK_Address, WETH_Address, USDC_Address] as const;

  const amounts = await readContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'getAmountsOut',
    args: [amountIn, path],
    chainId: ChainId.Sepolia,
  });

  const formattedUsdc = formatUnits(amounts[2], 6);

  return formattedUsdc;
}

export async function getUsdcToLinkPrice() {
  const amountIn = parseUnits('1', 6);
  const path = [USDC_Address, WETH_Address, LINK_Address] as const;

  const amounts = await readContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'getAmountsOut',
    args: [amountIn, path],
    chainId: ChainId.Sepolia,
  });

  const formattedLink = formatUnits(amounts[2], 18);

  return formattedLink;
}

export async function getAmountsOut(amountIn: string, fromToken: 'LINK' | 'USDC') {
  const isLinkToUsdc = fromToken === 'LINK';
  const path = isLinkToUsdc
    ? ([LINK_Address, WETH_Address, USDC_Address] as const)
    : ([USDC_Address, WETH_Address, LINK_Address] as const);
  const inputDecimals = isLinkToUsdc ? 18 : 6;
  const outputDecimals = isLinkToUsdc ? 6 : 18;

  const parsedAmountIn = parseUnits(amountIn, inputDecimals);

  const amounts = await readContract(wagmiConfig, {
    address: uniswapV2Router02ContractAddress,
    abi: uniswapRouterAbi,
    functionName: 'getAmountsOut',
    args: [parsedAmountIn, path],
    chainId: ChainId.Sepolia,
  });

  const formattedOutput = formatUnits(amounts[2], outputDecimals);

  return formattedOutput;
}
