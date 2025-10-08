'use client';

import { useAtomValue } from 'jotai';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type Address, isAddress } from 'viem';
import { z } from 'zod';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { ChainId } from '@/configs/chains';
import { useTokenBalance, useTokenInfo } from '@/lib/hooks/tokens/token-balance';
import { useSwapAmountsIn, useSwapAmountsOut, useSwapTokens } from '@/lib/hooks/uniswap';
import { accountAtom } from '@/lib/states/evm';
import { Button } from '@/ui/shadcn/button';
import { Input } from '@/ui/shadcn/input';

const numberInputSchema = z
  .string()
  .regex(/^[0-9]*\.?[0-9]*$/, 'Only numbers allowed')
  .refine(val => val === '' || !isNaN(parseFloat(val)), 'Invalid number');

const COMMON_TOKENS = [
  { address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', symbol: 'LINK' },
  { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC' },
  { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH' },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI' },
];

export default function Page() {
  const account = useAtomValue(accountAtom);

  const [sellTokenAddress, setSellTokenAddress] = useState<Address>(
    '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  );
  const [buyTokenAddress, setBuyTokenAddress] = useState<Address>(
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  );
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [activeInput, setActiveInput] = useState<'sell' | 'buy'>('sell');
  const [slippage, setSlippage] = useState('0.50');

  const { data: sellTokenInfo } = useTokenInfo(sellTokenAddress, ChainId.Sepolia);
  const { data: buyTokenInfo } = useTokenInfo(buyTokenAddress, ChainId.Sepolia);
  const { data: sellTokenBalance } = useTokenBalance(sellTokenAddress, ChainId.Sepolia);
  const { data: buyTokenBalance } = useTokenBalance(buyTokenAddress, ChainId.Sepolia);

  const { data: sellToOut } = useSwapAmountsOut(
    activeInput === 'sell' ? sellAmount : '',
    sellTokenAddress,
    buyTokenAddress,
    ChainId.Sepolia,
  );

  const { data: buyToIn } = useSwapAmountsIn(
    activeInput === 'buy' ? buyAmount : '',
    sellTokenAddress,
    buyTokenAddress,
    ChainId.Sepolia,
  );

  const { mutate: swap, isPending, data: swapData } = useSwapTokens();

  useEffect(() => {
    if (activeInput === 'sell' && sellToOut != null) {
      setBuyAmount(sellToOut);
    }
  }, [activeInput, sellToOut]);

  useEffect(() => {
    if (activeInput === 'buy' && buyToIn != null) {
      setSellAmount(buyToIn);
    }
  }, [activeInput, buyToIn]);

  const handleSellInputChange = (value: string) => {
    const result = numberInputSchema.safeParse(value);
    if (result.success) {
      setSellAmount(value);
      setActiveInput('sell');
    }
  };

  const handleBuyInputChange = (value: string) => {
    const result = numberInputSchema.safeParse(value);
    if (result.success) {
      setBuyAmount(value);
      setActiveInput('buy');
    }
  };

  // TODO: address validate?
  const handleSellTokenAddressChange = (value: string) => {
    if (isAddress(value)) {
      setSellTokenAddress(value);
    }
    setSellAmount('');
    setBuyAmount('');
  };

  const handleBuyTokenAddressChange = (value: string) => {
    if (isAddress(value)) {
      setBuyTokenAddress(value);
    }
    setSellAmount('');
    setBuyAmount('');
  };

  const handleSwitch = () => {
    const temp = sellTokenAddress;
    setSellTokenAddress(buyTokenAddress);
    setBuyTokenAddress(temp);
    setSellAmount('');
    setBuyAmount('');
  };

  const handleSwap = () => {
    const finalSellAmount = activeInput === 'sell' ? sellAmount : buyToIn;
    const finalBuyAmount = activeInput === 'sell' ? sellToOut : buyAmount;

    if (
      finalSellAmount != null &&
      finalBuyAmount != null &&
      finalSellAmount !== '' &&
      finalBuyAmount !== '' &&
      sellTokenAddress.length > 0 &&
      buyTokenAddress.length > 0
    ) {
      const slippageValue = parseFloat(slippage) / 100;
      const slippageTolerance = 1 - slippageValue;

      swap({
        amountIn: finalSellAmount,
        amountOutMin: finalBuyAmount,
        tokenInAddress: sellTokenAddress,
        tokenOutAddress: buyTokenAddress,
        slippage: slippageTolerance,
      });
    }
  };

  const isSwapDisabled = () => {
    if (account == null || isPending === true || sellTokenInfo == null || buyTokenInfo == null) {
      return true;
    }

    const finalSellAmount = activeInput === 'sell' ? sellAmount : buyToIn;
    const finalBuyAmount = activeInput === 'sell' ? sellToOut : buyAmount;

    if (finalSellAmount == null || finalBuyAmount == null) return true;
    if (finalSellAmount === '' || finalSellAmount === '0') return true;
    if (finalBuyAmount === '' || finalBuyAmount === '0') return true;

    const balance = parseFloat(sellTokenBalance ?? '0');
    const amount = parseFloat(finalSellAmount);
    return amount > balance;
  };

  const getButtonText = () => {
    if (account == null) return 'Connect Wallet';
    if (isPending === true) return 'Swapping...';
    if (sellTokenInfo == null || buyTokenInfo == null) return 'Invalid token address';

    const finalSellAmount = activeInput === 'sell' ? sellAmount : buyToIn;
    if (finalSellAmount != null) {
      const balance = parseFloat(sellTokenBalance ?? '0');
      const amount = parseFloat(finalSellAmount);
      if (amount > balance) return `Insufficient ${sellTokenInfo?.symbol ?? 'token'} balance`;
    }

    return 'Swap';
  };

  return (
    <div className="mx-auto flex flex-1 flex-col">
      <main className="m-auto flex w-[580px] flex-col justify-between rounded-xl border-[0.5px] p-4">
        <div className="h-[160px]">
          <header className="mb-2">出售</header>

          <div className="mb-2">
            <Input
              placeholder="代币合约地址 (0x...)"
              value={sellTokenAddress}
              onChange={e => handleSellTokenAddressChange(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
            {sellTokenInfo != null && (
              <div className="mt-1 text-sm text-gray-600">
                {sellTokenInfo.name} ({sellTokenInfo.symbol})
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-3xl">
            <Input
              placeholder="0"
              value={sellAmount}
              onChange={e => handleSellInputChange(e.target.value)}
              disabled={isPending}
            />
            <div className="min-w-[80px] text-right">{sellTokenInfo?.symbol ?? '---'}</div>
          </div>

          <span className="mt-1 text-sm text-gray-800">余额: {sellTokenBalance ?? '0'}</span>
        </div>

        <ArrowUpDown
          className="mx-auto my-2 cursor-pointer rounded-md border p-1"
          onClick={handleSwitch}
        />

        <div className="h-[160px]">
          <header className="mb-2">购买</header>

          <div className="mb-2">
            <Input
              placeholder="代币合约地址 (0x...)"
              value={buyTokenAddress}
              onChange={e => handleBuyTokenAddressChange(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
            {buyTokenInfo != null && (
              <div className="mt-1 text-sm text-gray-600">
                {buyTokenInfo.name} ({buyTokenInfo.symbol})
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-3xl">
            <Input
              placeholder="0"
              value={buyAmount}
              onChange={e => handleBuyInputChange(e.target.value)}
              disabled={isPending}
            />
            <div className="min-w-[80px] text-right">{buyTokenInfo?.symbol ?? '---'}</div>
          </div>

          <span className="mt-1 text-sm text-gray-800">余额: {buyTokenBalance ?? '0'}</span>
        </div>

        <footer className="mt-4 flex flex-col gap-4">
          <div className="flex justify-between gap-8">
            <h3 className="text-nowrap">滑点上限</h3>
            <div className="relative">
              <Input
                value={slippage}
                onChange={e => {
                  const value = e.target.value.replace('%', '');
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    setSlippage(value);
                  } else if (value === '') {
                    setSlippage('');
                  }
                }}
                className="pr-8"
              />
              <span className="absolute top-1/2 right-2 -translate-y-1/2 text-sm text-gray-500">
                %
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>最低收到</span>
            <span>
              {buyAmount !== '' &&
              slippage !== '' &&
              !isNaN(parseFloat(buyAmount)) &&
              !isNaN(parseFloat(slippage))
                ? (parseFloat(buyAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)
                : '0.000000'}{' '}
              {buyTokenInfo?.symbol ?? '---'}
            </span>
          </div>

          <Button
            onClick={handleSwap}
            disabled={isSwapDisabled()}
            className="w-full cursor-pointer"
          >
            {getButtonText()}
          </Button>
        </footer>
      </main>

      {swapData?.transactionHash != null && (
        <Link
          href={`https://sepolia.etherscan.io/tx/${swapData.transactionHash}`}
          className="m-auto mt-4 text-green-500 underline"
          target="_blank"
        >
          {swapData.transactionHash}
        </Link>
      )}

      <div className="m-auto mt-8 w-[580px] text-lg">
        <div className="flex flex-col gap-2">
          {COMMON_TOKENS.map(token => (
            <p key={token.address} className="flex justify-between gap-8">
              <span>{token.symbol}</span>
              <Link
                href={`https://sepolia.etherscan.io/address/${token.address}`}
                className="hover:underline"
                target="_blank"
              >
                {token.address.toString()}
              </Link>
              <CopyButton size={'sm'} content={token.address} />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
