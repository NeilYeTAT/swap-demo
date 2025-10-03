'use client';

import { useAtomValue } from 'jotai';
import { ArrowUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLinkBalance, useUSDCBalance } from '@/lib/hooks/tokens';
import { useSwapAmountsIn, useSwapAmountsOut, useSwapTokens } from '@/lib/hooks/uniswap';
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
  const { data: usdcToLink } = useSwapAmountsIn(activeInput === 'usdc' ? usdcAmount : '', 'USDC');

  const { mutate: swap, isPending } = useSwapTokens();

  useEffect(() => {
    if (activeInput === 'link' && linkToUsdc != null) {
      setUsdcAmount(linkToUsdc);
    }
  }, [activeInput, linkToUsdc]);

  useEffect(() => {
    if (activeInput === 'usdc' && usdcToLink != null) {
      setLinkAmount(usdcToLink);
    }
  }, [activeInput, usdcToLink]);

  const handleLinkInputChange = (value: string) => {
    setLinkAmount(value);
    setActiveInput('link');
  };

  const handleUsdcInputChange = (value: string) => {
    setUsdcAmount(value);
    setActiveInput('usdc');
  };

  const handleSwap = () => {
    const finalLinkAmount = activeInput === 'link' ? linkAmount : usdcToLink;
    const finalUsdcAmount = activeInput === 'link' ? linkToUsdc : usdcAmount;

    if (
      finalLinkAmount != null &&
      finalUsdcAmount != null &&
      finalLinkAmount !== '' &&
      finalUsdcAmount !== ''
    ) {
      swap({
        amountIn: finalLinkAmount,
        amountOutMin: finalUsdcAmount,
        fromToken: 'LINK',
      });
    }
  };

  const isSwapDisabled = () => {
    if (account == null) return true;
    if (isPending === true) return true;

    const finalLinkAmount = activeInput === 'link' ? linkAmount : usdcToLink;
    const finalUsdcAmount = activeInput === 'link' ? linkToUsdc : usdcAmount;

    if (finalLinkAmount == null || finalUsdcAmount == null) return true;
    if (finalLinkAmount === '' || finalLinkAmount === '0') return true;
    if (finalUsdcAmount === '' || finalUsdcAmount === '0') return true;

    const balance = parseFloat(linkBalance ?? '0');
    const amount = parseFloat(finalLinkAmount);
    return amount > balance;
  };

  const getButtonText = () => {
    if (account == null) return 'Connect Wallet';
    if (isPending === true) return 'Swapping...';

    const finalLinkAmount = activeInput === 'link' ? linkAmount : usdcToLink;
    if (finalLinkAmount != null) {
      const balance = parseFloat(linkBalance ?? '0');
      const amount = parseFloat(finalLinkAmount);
      if (amount > balance) return 'Insufficient LINK balance';
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

        <ArrowUpDown className="mx-auto cursor-pointer rounded-md border p-1" />

        <div className="h-[130px]">
          <header>购买</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={usdcAmount}
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
