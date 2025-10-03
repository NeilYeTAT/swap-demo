'use client';

import { useLinkBalance } from '@/lib/hooks/tokens';
import { Input } from '@/ui/shadcn/input';

export default function Page() {
  const { data: linkBalance } = useLinkBalance();

  return (
    <div className="mx-auto flex flex-1">
      <main className="m-auto flex w-[480px] flex-col justify-between rounded-xl border-[0.5px] p-2">
        {/* from */}
        <div className="h-[130px] p-4">
          <header>出售</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input placeholder="0" />

            <div>Link</div>
          </div>

          <div className="mt-1 flex justify-between text-sm text-gray-800">
            <span>US$</span>
            <span>balance {linkBalance ?? 0}</span>
          </div>
        </div>

        {/* to */}
        <div className="h-[130px] p-4">
          <header>购买</header>

          <div className="flex items-center justify-between gap-4 text-4xl">
            <Input placeholder="0" disabled />

            <div>USDC</div>
          </div>

          <div className="mt-1 text-sm text-gray-800">
            <span>US$</span>
          </div>
        </div>
      </main>
    </div>
  );
}
