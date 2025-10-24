'use client';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import ky from 'ky';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Address, isAddress } from 'viem';
import { z } from 'zod';
import { CopyButton } from '@/components/ui/shadcn-io/copy-button';
import { ChainId } from '@/configs/chains';
import { useTokenBalance, useTokenInfo } from '@/lib/hooks/tokens/token-balance';
import { useUnifiedSwap } from '@/lib/hooks/uniswap';
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
  { address: '0x4E9Bfb0359351BDb3fdE37C3Ba88703dBE048414', symbol: 'PPT' },
  { address: '0x7aB1946ddAB214955Ae1Ff52806CedD2D0e1Dd45', symbol: 'TUSDT' },
];

interface RouteResponse {
  success: boolean;
  protocol?: 'V2' | 'V3';
  quote?: string;
  quoteCurrency?: string;
  estimatedGasUsed?: string;
  inputAmount?: string;
  outputAmount?: string;
  executionPrice?: string;
  path?: string[];
  methodParameters?: {
    calldata: string;
    value: string;
    to: string;
  };
  routePath?: string[];
  error?: string;
}

export default function Page() {
  const account = useAtomValue(accountAtom);

  const [sellTokenAddress, setSellTokenAddress] = useState<Address>(
    '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  );
  const [buyTokenAddress, setBuyTokenAddress] = useState<Address>(
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  );
  const [sellAmount, setSellAmount] = useState('1');
  const [buyAmount, setBuyAmount] = useState('0');
  const [activeInput, setActiveInput] = useState<'sell' | 'buy'>('sell');
  const [slippage, setSlippage] = useState('0.50');

  // * debounce
  const [debouncedSellAmount, setDebouncedSellAmount] = useState('1');
  const [debouncedSlippage, setDebouncedSlippage] = useState('0.50');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const { data: sellTokenInfo } = useTokenInfo(sellTokenAddress, ChainId.Sepolia);
  const { data: buyTokenInfo } = useTokenInfo(buyTokenAddress, ChainId.Sepolia);
  const { data: sellTokenBalance } = useTokenBalance(sellTokenAddress, ChainId.Sepolia);
  const { data: buyTokenBalance } = useTokenBalance(buyTokenAddress, ChainId.Sepolia);

  const debouncedUpdateValues = useCallback((amount: string, slippageVal: string) => {
    if (debounceTimeoutRef.current != null) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSellAmount(amount);
      setDebouncedSlippage(slippageVal);
    }, 500);
  }, []);

  useEffect(() => {
    if (activeInput === 'sell') {
      debouncedUpdateValues(sellAmount, slippage);
    }
  }, [sellAmount, slippage, activeInput, debouncedUpdateValues]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current != null) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const { data: routeData, isLoading: isRouteLoading } = useQuery<RouteResponse>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'uniswap-v3-route',
      sellTokenAddress,
      buyTokenAddress,
      debouncedSellAmount,
      debouncedSlippage,
      account,
    ],
    queryFn: async () => {
      if (abortControllerRef.current != null) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams({
        tokenIn: sellTokenAddress,
        tokenOut: buyTokenAddress,
        amountIn: debouncedSellAmount,
        slippage: debouncedSlippage,
        recipient: account as string,
      });

      const response = await ky
        .get(`/api/uniswap-v3?${params}`, {
          signal: abortControllerRef.current.signal,
        })
        .json<RouteResponse>();

      return response;
    },
    enabled:
      debouncedSellAmount !== '' &&
      debouncedSellAmount !== '0' &&
      debouncedSlippage !== '' &&
      activeInput === 'sell' &&
      account != null,
    refetchInterval: 10000,
    staleTime: 5000,
    retry: (failureCount, error) => {
      if (error.name === 'AbortError') {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { mutate: swap, isPending, data: swapData } = useUnifiedSwap();

  useEffect(() => {
    if (activeInput === 'sell' && routeData?.success === true && routeData.outputAmount != null) {
      setBuyAmount(routeData.outputAmount);
    }
  }, [activeInput, routeData]);

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

  const handleSellTokenAddressChange = (value: string) => {
    if (isAddress(value)) {
      setSellTokenAddress(value);
    }
    setSellAmount('1');
    setBuyAmount('0');
  };

  const handleBuyTokenAddressChange = (value: string) => {
    if (isAddress(value)) {
      setBuyTokenAddress(value);
    }
    setSellAmount('1');
    setBuyAmount('0');
  };

  const handleSwitch = () => {
    const temp = sellTokenAddress;
    setSellTokenAddress(buyTokenAddress);
    setBuyTokenAddress(temp);
    setSellAmount('1');
    setBuyAmount('0');
  };

  const handleSwap = () => {
    if (
      routeData?.success === true &&
      routeData.outputAmount != null &&
      sellAmount !== '' &&
      sellAmount !== '0'
    ) {
      const slippageValue = parseFloat(slippage) / 100;
      const slippageTolerance = 1 - slippageValue;

      const baseParams = {
        amountIn: sellAmount,
        amountOutMin: routeData.outputAmount,
        tokenInAddress: sellTokenAddress,
        tokenOutAddress: buyTokenAddress,
        slippage: slippageTolerance,
      };

      if (routeData.protocol === 'V2') {
        swap({
          protocol: 'V2',
          ...baseParams,
          path: (routeData.routePath ?? routeData.path ?? []) as Address[],
        });
      } else {
        swap({
          protocol: 'V3',
          ...baseParams,
          calldata: routeData.methodParameters!.calldata as `0x${string}`,
          value: routeData.methodParameters!.value as `0x${string}`,
          to: routeData.methodParameters!.to as Address,
        });
      }
    }
  };

  const isSwapDisabled = () => {
    if (account == null || isPending === true || sellTokenInfo == null || buyTokenInfo == null) {
      return true;
    }

    if (routeData?.success !== true || routeData.outputAmount == null) return true;
    if (sellAmount === '' || sellAmount === '0') return true;

    const balance = parseFloat(sellTokenBalance ?? '0');
    const amount = parseFloat(sellAmount);
    return amount > balance;
  };

  const getButtonText = () => {
    if (account == null) return 'Connect Wallet';
    if (isPending === true) return 'Swapping...';
    if (isRouteLoading) return 'Fetching Price...';
    if (sellTokenInfo == null || buyTokenInfo == null) return 'Invalid token address';

    if (routeData?.success === false && routeData.error != null) {
      if (routeData.error === 'Insufficient liquidity') {
        return '流动性不足';
      }
      if (routeData.error === 'No route found') {
        return '未找到交易路径';
      }
      return routeData.error;
    }

    if (routeData?.success !== true) return 'No route found';

    const balance = parseFloat(sellTokenBalance ?? '0');
    const amount = parseFloat(sellAmount);
    if (amount > balance) return `Insufficient ${sellTokenInfo?.symbol ?? 'token'} balance`;

    return 'Swap';
  };

  const estimatedGasUSD =
    routeData?.estimatedGasUsed != null
      ? (parseFloat(routeData.estimatedGasUsed) * 0.000000001 * 2500).toFixed(2)
      : '0.00';

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
              disabled={true}
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

          {routeData?.success === true && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>路由协议</span>
                <span>{routeData.protocol ?? 'V3'}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>兑换价格</span>
                <span>
                  1 {sellTokenInfo?.symbol} ≈ {routeData.executionPrice} {buyTokenInfo?.symbol}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>预估 Gas 费</span>
                <span>
                  {routeData.estimatedGasUsed} gas ≈ ${estimatedGasUSD}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>最低收到</span>
                <span>
                  {routeData.outputAmount != null && slippage !== ''
                    ? (
                        parseFloat(routeData.outputAmount) *
                        (1 - parseFloat(slippage) / 100)
                      ).toFixed(6)
                    : '0.000000'}{' '}
                  {buyTokenInfo?.symbol ?? '---'}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>路由路径</span>
                <span className="text-right">{routeData.path?.length} 个代币</span>
              </div>
            </>
          )}

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
