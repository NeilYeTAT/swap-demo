'use client';

import { useAtomValue } from 'jotai';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { useLinkBalance, useUSDCBalance } from '@/lib/hooks/tokens';
import { useSwapAmountsIn, useSwapAmountsOut, useSwapTokens } from '@/lib/hooks/uniswap';
import { accountAtom } from '@/lib/states/evm';
import { Button } from '@/ui/shadcn/button';
import { Input } from '@/ui/shadcn/input';

export default function Page() {
  const account = useAtomValue(accountAtom);
  const { data: linkBalance } = useLinkBalance();
  const { data: usdcBalance } = useUSDCBalance();

  const [sellToken, setSellToken] = useState<'LINK' | 'USDC'>('LINK');
  const [sellAmount, setSellAmount] = useState('0');
  const [buyAmount, setBuyAmount] = useState('0');
  const [activeInput, setActiveInput] = useState<'sell' | 'buy'>('sell');
  const [slippage, setSlippage] = useState('0.50');

  const { data: sellToOut } = useSwapAmountsOut(
    activeInput === 'sell' ? sellAmount : '',
    sellToken,
  );
  const { data: buyToIn } = useSwapAmountsIn(
    activeInput === 'buy' ? buyAmount : '',
    sellToken === 'LINK' ? 'USDC' : 'LINK',
  );

  const { mutate: swap, isPending } = useSwapTokens();

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
    setSellAmount(value);
    setActiveInput('sell');
  };

  const handleBuyInputChange = (value: string) => {
    setBuyAmount(value);
    setActiveInput('buy');
  };

  const handleSwitch = () => {
    setSellToken(sellToken === 'LINK' ? 'USDC' : 'LINK');
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
      finalBuyAmount !== ''
    ) {
      const slippageValue = parseFloat(slippage) / 100;
      const slippageTolerance = 1 - slippageValue;

      swap({
        amountIn: finalSellAmount,
        amountOutMin: finalBuyAmount,
        fromToken: sellToken,
        slippage: slippageTolerance,
      });
    }
  };

  const isSwapDisabled = () => {
    if (account == null) return true;
    if (isPending === true) return true;

    const finalSellAmount = activeInput === 'sell' ? sellAmount : buyToIn;
    const finalBuyAmount = activeInput === 'sell' ? sellToOut : buyAmount;

    if (finalSellAmount == null || finalBuyAmount == null) return true;
    if (finalSellAmount === '' || finalSellAmount === '0') return true;
    if (finalBuyAmount === '' || finalBuyAmount === '0') return true;

    const balance = parseFloat(sellToken === 'LINK' ? (linkBalance ?? '0') : (usdcBalance ?? '0'));
    const amount = parseFloat(finalSellAmount);
    return amount > balance;
  };

  const getButtonText = () => {
    if (account == null) return 'Connect Wallet';
    if (isPending === true) return 'Swapping...';

    const finalSellAmount = activeInput === 'sell' ? sellAmount : buyToIn;
    if (finalSellAmount != null) {
      const balance = parseFloat(
        sellToken === 'LINK' ? (linkBalance ?? '0') : (usdcBalance ?? '0'),
      );
      const amount = parseFloat(finalSellAmount);
      if (amount > balance) return `Insufficient ${sellToken} balance`;
    }

    return 'Swap';
  };

  const sellTokenSymbol = sellToken;
  const buyTokenSymbol = sellToken === 'LINK' ? 'USDC' : 'LINK';
  const sellTokenBalance = sellToken === 'LINK' ? linkBalance : usdcBalance;
  const buyTokenBalance = sellToken === 'LINK' ? usdcBalance : linkBalance;

  return (
    <div className="mx-auto flex flex-1 flex-col">
      <main className="m-auto flex w-[480px] flex-col justify-between rounded-xl border-[0.5px] p-4">
        <div className="h-[130px]">
          <header>出售</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={sellAmount}
              onChange={e => handleSellInputChange(e.target.value)}
              disabled={isPending}
            />

            <div>{sellTokenSymbol}</div>
          </div>

          <span className="mt-1 text-sm text-gray-800">balance {sellTokenBalance ?? 0}</span>
        </div>

        <ArrowUpDown
          className="mx-auto cursor-pointer rounded-md border p-1"
          onClick={handleSwitch}
        />

        <div className="h-[130px]">
          <header>购买</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={buyAmount}
              onChange={e => handleBuyInputChange(e.target.value)}
              disabled={isPending}
            />

            <div>{buyTokenSymbol}</div>
          </div>

          <span className="mt-1 text-sm text-gray-800">balance {buyTokenBalance ?? 0}</span>
        </div>

        <footer className="flex flex-col gap-4">
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
              {buyTokenSymbol}
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

      <footer className="m-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-8">
          <h3>USDC</h3>
          <Link
            className="cursor-pointer hover:underline"
            href={'https://sepolia.etherscan.io/address/0x779877A7B0D9E8603169DdbD7836e478b4624789'}
            target="_blank"
          >
            0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
          </Link>
          <CopyButton
            content="0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
            size={'sm'}
            className="rounded-sm p-1"
          />
        </div>
        <div className="flex items-center justify-between gap-8">
          <h3>LINK</h3>
          <Link
            className="cursor-pointer hover:underline"
            href={'https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'}
            target="_blank"
          >
            0x779877A7B0D9E8603169DdbD7836e478b4624789
          </Link>
          <CopyButton
            content="0x779877A7B0D9E8603169DdbD7836e478b4624789"
            size={'sm'}
            className="rounded-sm p-1"
          />
        </div>
      </footer>
    </div>
  );
}
