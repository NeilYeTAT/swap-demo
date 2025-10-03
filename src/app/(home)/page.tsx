'use client';

import { useState } from 'react';
import { useLinkBalance, useUSDCBalance } from '@/lib/hooks/tokens';
import { useSwapAmountsOut } from '@/lib/hooks/uniswap';
import { Input } from '@/ui/shadcn/input';

export default function Page() {
  const { data: linkBalance } = useLinkBalance();
  const { data: usdcBalance } = useUSDCBalance();

  const [linkAmount, setLinkAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [activeInput, setActiveInput] = useState<'link' | 'usdc'>('link');

  const { data: linkToUsdc } = useSwapAmountsOut(activeInput === 'link' ? linkAmount : '', 'LINK');

  const { data: usdcToLink } = useSwapAmountsOut(activeInput === 'usdc' ? usdcAmount : '', 'USDC');

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

  return (
    <div className="mx-auto flex flex-1">
      <main className="m-auto flex w-[480px] flex-col justify-between rounded-xl border-[0.5px] p-2">
        <div className="h-[130px] p-4">
          <header>出售</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={linkAmount}
              onChange={e => handleLinkInputChange(e.target.value)}
            />

            <div>Link</div>
          </div>

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {linkBalance ?? 0}</span>
          </div>
        </div>

        <div className="h-[130px] p-4">
          <header>购买</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input
              placeholder="0"
              value={activeInput === 'link' ? (linkToUsdc ?? '') : usdcAmount}
              onChange={e => handleUsdcInputChange(e.target.value)}
            />

            <div>USDC</div>
          </div>

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {usdcBalance ?? 0}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
