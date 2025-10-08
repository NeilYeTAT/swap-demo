import type { Address } from 'viem';

export const WETH_Address = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Address;
export const LINK_Address = '0x779877A7B0D9E8603169DdbD7836e478b4624789' as Address;
export const USDC_Address = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;
export const UNI_Address = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as Address;
export const PPT_Address = '0x4E9Bfb0359351BDb3fdE37C3Ba88703dBE048414' as Address;

export const commonIntermediateTokens = [
  USDC_Address,
  LINK_Address,
  USDC_Address,
  UNI_Address,
  PPT_Address,
];
