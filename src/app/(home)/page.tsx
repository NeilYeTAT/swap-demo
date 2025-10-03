'use client';

import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useLinkBalance, useUSDCBalance } from '@/lib/hooks/tokens';
import { useSwapAmountsOut, useSwapTokens } from '@/lib/hooks/uniswap';
import { accountAtom } from '@/lib/states/evm';
import { Button } from '@/ui/shadcn/button';
import { Input } from '@/ui/shadcn/input';

export default function Page() {
  const account = useAtomValue(accountAtom);
  const { data: linkBalance } = useLinkBalance();
  const { data: usdcBalance } = useUSDCBalance();

  const [linkAmount, setLinkAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [activeInput, setActiveInput] = useState<'link' | 'usdc'>('link');

  const { data: linkToUsdc } = useSwapAmountsOut(activeInput === 'link' ? linkAmount : '', 'LINK');
  const { data: usdcToLink } = useSwapAmountsOut(activeInput === 'usdc' ? usdcAmount : '', 'USDC');

  const { mutate: swap, isPending } = useSwapTokens();

  const handleLinkInputChange = (value: string) => {
    setLinkAmount(value);
    setActiveInput('link');
    if (linkToUsdc != null) {
      setUsdcAmount(linkToUsdc);
    }
  };

  const handleUsdcInputChange = (value: string) => {
    setUsdcAmount(value);
    setActiveInput('usdc');
    if (usdcToLink != null) {
      setLinkAmount(usdcToLink);
    }
  };

  const handleSwap = () => {
    if (activeInput === 'link' && linkAmount !== '' && linkToUsdc != null) {
      swap({
        amountIn: linkAmount,
        amountOutMin: linkToUsdc,
        fromToken: 'LINK',
      });
    } else if (activeInput === 'usdc' && usdcAmount !== '' && usdcToLink != null) {
      swap({
        amountIn: usdcAmount,
        amountOutMin: usdcToLink,
        fromToken: 'USDC',
      });
    }
  };

  const isSwapDisabled = () => {
    if (account == null) return true;
    if (isPending === true) return true;

    if (activeInput === 'link') {
      if (linkAmount === '' || linkAmount === '0' || linkToUsdc == null) return true;
      const balance = parseFloat(linkBalance ?? '0');
      const amount = parseFloat(linkAmount === '' ? '0' : linkAmount);
      return amount > balance;
    } else {
      if (usdcAmount === '' || usdcAmount === '0' || usdcToLink == null) return true;
      const balance = parseFloat(usdcBalance ?? '0');
      const amount = parseFloat(usdcAmount === '' ? '0' : usdcAmount);
      return amount > balance;
    }
  };

  const getButtonText = () => {
    if (account == null) return 'Connect Wallet';
    if (isPending === true) return 'Swapping...';

    if (activeInput === 'link') {
      const balance = parseFloat(linkBalance ?? '0');
      const amount = parseFloat(linkAmount === '' ? '0' : linkAmount);
      if (amount > balance) return 'Insufficient LINK balance';
    } else {
      const balance = parseFloat(usdcBalance ?? '0');
      const amount = parseFloat(usdcAmount === '' ? '0' : usdcAmount);
      if (amount > balance) return 'Insufficient USDC balance';
    }

    return 'Swap';
  };

  return (
    <div className="mx-auto flex flex-1">
      <main className="m-auto flex w-[480px] flex-col justify-between rounded-xl border-[0.5px] p-4">
        <div className="h-[130px]">
          <header>出售</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={linkAmount}
              onChange={e => handleLinkInputChange(e.target.value)}
              disabled={isPending}
            />

            <div>Link</div>
          </div>

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {linkBalance ?? 0}</span>
          </div>
        </div>

        <div className="h-[130px]">
          <header>购买</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={activeInput === 'link' ? (linkToUsdc ?? '') : usdcAmount}
              onChange={e => handleUsdcInputChange(e.target.value)}
              disabled={isPending}
            />

            <div>USDC</div>
          </div>

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {usdcBalance ?? 0}</span>
          </div>
        </div>

        <Button onClick={handleSwap} disabled={isSwapDisabled()} className="w-full">
          {getButtonText()}
        </Button>
      </main>
    </div>
  );
}
