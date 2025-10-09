import type { Address } from 'viem';
import { Token } from '@uniswap/sdk-core';
import { ChainId } from '../chains';

export const WETH_Address = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Address;
export const LINK_Address = '0x779877A7B0D9E8603169DdbD7836e478b4624789' as Address;
export const USDC_Address = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;
export const UNI_Address = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as Address;
export const PPT_Address = '0x4E9Bfb0359351BDb3fdE37C3Ba88703dBE048414' as Address;
export const TUSDT_Address = '0x7aB1946ddAB214955Ae1Ff52806CedD2D0e1Dd45' as Address;

export const commonIntermediateTokens = [
  USDC_Address,
  LINK_Address,
  USDC_Address,
  UNI_Address,
  PPT_Address,
];

export const WETH = new Token(ChainId.Sepolia, WETH_Address, 18, 'WETH', 'wrapped ETH');
export const LINK = new Token(ChainId.Sepolia, LINK_Address, 18, 'LINK', 'Cahinlink token');
export const USDC = new Token(ChainId.Sepolia, USDC_Address, 6, 'USDC', 'USDC');
export const UNI = new Token(ChainId.Sepolia, UNI_Address, 18, 'UNI', 'Uni');
export const PPT = new Token(ChainId.Sepolia, PPT_Address, 18, 'PPT', 'PPT');
export const TUSDT = new Token(ChainId.Sepolia, TUSDT_Address, 6, 'TUSDT', 'TUSDT');
