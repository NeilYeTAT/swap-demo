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

  const [sellToken, setSellToken] = useState<'LINK' | 'USDC'>('LINK');
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [activeInput, setActiveInput] = useState<'sell' | 'buy'>('sell');

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
      swap({
        amountIn: finalSellAmount,
        amountOutMin: finalBuyAmount,
        fromToken: sellToken,
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
    <div className="mx-auto flex flex-1">
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

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {sellTokenBalance ?? 0}</span>
          </div>
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

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {buyTokenBalance ?? 0}</span>
          </div>
        </div>

        <Button onClick={handleSwap} disabled={isSwapDisabled()} className="w-full cursor-pointer">
          {getButtonText()}
        </Button>
      </main>
    </div>
  );
}
