import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { erc20Abi } from 'viem';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenInAddress = searchParams.get('tokenIn');
    const tokenOutAddress = searchParams.get('tokenOut');
    const amountIn = searchParams.get('amountIn');
    const slippage = searchParams.get('slippage');
    const recipient = searchParams.get('recipient');

    if (tokenInAddress == null || tokenOutAddress == null || amountIn == null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          details: 'tokenIn, tokenOut, and amountIn are required',
        },
        { status: 400 },
      );
    }

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

    const tokenInContract = new ethers.ethers.Contract(tokenInAddress, erc20Abi, provider);
    const tokenOutContract = new ethers.ethers.Contract(tokenOutAddress, erc20Abi, provider);

    const [tokenInDecimals, tokenInSymbol, tokenInName] = await Promise.all([
      tokenInContract.decimals(),
      tokenInContract.symbol(),
      tokenInContract.name(),
    ]);

    const [tokenOutDecimals, tokenOutSymbol, tokenOutName] = await Promise.all([
      tokenOutContract.decimals(),
      tokenOutContract.symbol(),
      tokenOutContract.name(),
    ]);

    const TokenIn = new sdkCore.Token(
      11155111,
      tokenInAddress,
      tokenInDecimals,
      tokenInSymbol,
      tokenInName,
    );

    const TokenOut = new sdkCore.Token(
      11155111,
      tokenOutAddress,
      tokenOutDecimals,
      tokenOutSymbol,
      tokenOutName,
    );

    const router = new smartOrderRouter.AlphaRouter({
      chainId: 11155111,
      provider,
    });

    const slippageValue = slippage != null ? parseFloat(slippage) : 0.5;
    const slippageNumerator = Math.floor(slippageValue * 100);
    const slippageDenominator = 10_000;

    const swapOptions = {
      recipient: recipient,
      slippageTolerance: new sdkCore.Percent(slippageNumerator, slippageDenominator),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: smartOrderRouter.SwapType.SWAP_ROUTER_02,
      enableUniversalRouter: false,
    };

    const parsedAmountIn = ethers.ethers.utils.parseUnits(amountIn, tokenInDecimals);
    const currencyAmount = sdkCore.CurrencyAmount.fromRawAmount(TokenIn, parsedAmountIn.toString());

    const route = await router.route(
      currencyAmount,
      TokenOut,
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
