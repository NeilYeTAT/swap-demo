import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ethers = await import('ethers');
    const smartOrderRouter = await import('@uniswap/smart-order-router');
    const sdkCore = await import('@uniswap/sdk-core');

    const provider = new ethers.ethers.providers.StaticJsonRpcProvider(
      {
        url: 'https://eth-sepolia.g.alchemy.com/v2/ni7Na_LrJ8rt-FPN5YuET',
        skipFetchSetup: true,
      },
      {
        chainId: 11155111,
        name: 'sepolia',
      },
    );

    const LINK = new sdkCore.Token(
      11155111,
      '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      18,
      'LINK',
      'Chainlink token',
    );

    const USDC = new sdkCore.Token(
      11155111,
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      6,
      'USDC',
      'USDC',
    );

    const router = new smartOrderRouter.AlphaRouter({
      chainId: 11155111,
      provider,
    });

    const swapOptions = {
      recipient: '0xeDC7B74Ccf1a1DF2A4EE00349b0Fe582ccE998d6',
      slippageTolerance: new sdkCore.Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: smartOrderRouter.SwapType.SWAP_ROUTER_02,
    };

    const amountIn = sdkCore.CurrencyAmount.fromRawAmount(LINK, '1000000000000000000');

    const route = await router.route(
      amountIn,
      USDC,
      sdkCore.TradeType.EXACT_INPUT,
      swapOptions as Parameters<typeof router.route>[3],
    );

    if (route == null) {
      return NextResponse.json(
        {
          success: false,
          error: 'No route found',
          details: 'Unable to find a swap route for the given token pair',
        },
        { status: 404 },
      );
    }

    const pathArray: string[] = [];
    route.route.forEach(r => {
      const routeData = r as unknown as { tokenPath?: Array<{ address: string }> };
      if (routeData.tokenPath != null && routeData.tokenPath.length > 0) {
        routeData.tokenPath.forEach((token, index) => {
          if (index === 0 || !pathArray.includes(token.address)) {
            pathArray.push(token.address);
          }
        });
      }
    });

    const result = {
      success: true,
      quote: route.quote.toExact(),
      quoteCurrency: route.quote.currency.symbol,
      estimatedGasUsed: route.estimatedGasUsed.toString(),
      inputAmount: route.trade.inputAmount.toExact(),
      outputAmount: route.trade.outputAmount.toExact(),
      executionPrice: route.trade.executionPrice.toSignificant(6),
      path: pathArray,
      methodParameters:
        route.methodParameters != null
          ? {
              calldata: route.methodParameters.calldata,
              value: route.methodParameters.value,
              to: route.methodParameters.to,
            }
          : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
