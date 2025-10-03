import { Input } from '@/ui/shadcn/input';

export default function Page() {
  return (
    <div className="mx-auto flex flex-1">
      <main className="m-auto flex w-[480px] flex-col justify-between rounded-xl border-[0.5px] p-2">
        {/* from */}
        <div className="h-[130px] p-4">
          <header>出售</header>

          <div className="text-4xl">
            <Input placeholder="0" />

            <div className="mt-1 flex justify-between text-sm text-gray-800">
              <span className="">US</span>
              <span className="">balance 0</span>
            </div>
          </div>
        </div>

        {/* to */}
        <div className="h-[130px] p-4">
          <header>购买</header>

          <div className="text-4xl">
            <Input placeholder="0" />

            <div className="mt-1 text-sm text-gray-800">
              <span>US</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
